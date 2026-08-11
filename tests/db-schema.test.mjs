import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import {
  anonymousPlayerCookie,
  ensureAnonymousPlayer,
} from "../db/anonymous-player.ts";
import { bucharestDate, startOrResumeAttempt } from "../db/attempts.ts";
import { lockAnswer, publicPuzzle, scoreFactor } from "../db/game.ts";
import { getPuzzleStatistics, histogramIndex } from "../db/statistics.ts";
import { getPublishedPuzzleByDate } from "../db/puzzles.ts";

const migrations = [
  "../drizzle/0000_supreme_thunderball.sql",
  "../drizzle/0001_*.sql",
  "../drizzle/0002_*.sql",
  "../drizzle/0003_*.sql",
  "../drizzle/0005_*.sql",
  "../drizzle/0007_*.sql",
];

async function migrationSql(pattern) {
  if (!pattern.includes("*")) {
    return readFile(new URL(pattern, import.meta.url), "utf8");
  }

  const { readdir } = await import("node:fs/promises");
  const directory = new URL("../drizzle/", import.meta.url);
  const prefix = pattern.split("/").at(-1).replace("*.sql", "");
  const filename = (await readdir(directory)).find(
    (entry) => entry.startsWith(prefix) && entry.endsWith(".sql"),
  );
  assert.ok(filename, `Nu există migrarea ${pattern}`);
  return readFile(new URL(filename, directory), "utf8");
}

async function migratedDatabase() {
  const database = new DatabaseSync(":memory:");
  database.exec("PRAGMA foreign_keys = ON");
  for (const migration of migrations) {
    const sql = await migrationSql(migration);
    database.exec(sql.replaceAll("--> statement-breakpoint", ""));
  }
  return database;
}

function asD1(database) {
  return {
    prepare(sql) {
      const statement = database.prepare(sql);
      let values = [];
      return {
        bind(...nextValues) {
          values = nextValues;
          return this;
        },
        async all() {
          return { results: statement.all(...values) };
        },
        async first() {
          return statement.get(...values) ?? null;
        },
        async run() {
          const result = statement.run(...values);
          return { ...result, meta: { changes: Number(result.changes) } };
        },
      };
    },
  };
}

test("păstrează puzzle-uri și întrebări zilnice", async () => {
  const database = await migratedDatabase();
  const puzzle = database
    .prepare(
      "INSERT INTO puzzles (edition, publish_date, status) VALUES (?, ?, ?) RETURNING id",
    )
    .get(1, "2026-08-12", "scheduled");

  database
    .prepare(
      `INSERT INTO questions
       (puzzle_id, position, prompt, answer, unit, explanation)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(puzzle.id, 1, "Câte boabe sunt în borcan?", 240, "boabe", "Au fost numărate.");

  const stored = database
    .prepare(
      `SELECT p.edition, p.publish_date, p.status, q.position, q.prompt,
              q.answer, q.unit, q.explanation
       FROM puzzles p JOIN questions q ON q.puzzle_id = p.id`,
    )
    .get();

  assert.deepEqual({ ...stored }, {
    edition: 1,
    publish_date: "2026-08-12",
    status: "scheduled",
    position: 1,
    prompt: "Câte boabe sunt în borcan?",
    answer: 240,
    unit: "boabe",
    explanation: "Au fost numărate.",
  });
  database.close();
});

test("respinge datele invalide și întrebările duplicate", async () => {
  const database = await migratedDatabase();
  const insertPuzzle = database.prepare(
    "INSERT INTO puzzles (edition, publish_date, status) VALUES (?, ?, ?)",
  );
  insertPuzzle.run(1, "2026-08-12", "draft");

  assert.throws(() => insertPuzzle.run(2, "12-08-2026", "draft"));
  assert.throws(() => insertPuzzle.run(2, "2026-13-40", "draft"));
  assert.throws(() => insertPuzzle.run(2, "2026-08-13", "necunoscut"));
  assert.throws(() => insertPuzzle.run(2, "2026-08-12", "published"));

  const insertQuestion = database.prepare(
    `INSERT INTO questions
     (puzzle_id, position, prompt, answer, unit, explanation)
     VALUES (1, ?, ?, ?, ?, ?)`,
  );
  insertQuestion.run(1, "Întrebare", 10, "unități", "Explicație");

  assert.throws(() =>
    insertQuestion.run(1, "Altă întrebare", 20, "unități", "Explicație"),
  );
  assert.throws(() =>
    insertQuestion.run(2, "Întrebare", 0, "unități", "Explicație"),
  );
  assert.throws(() =>
    insertQuestion.run(2, " ", 20, "unități", "Explicație"),
  );
  assert.throws(() =>
    insertQuestion.run(4, "Întrebare", 20, "unități", "Explicație"),
  );
  database.close();
});

test("șterge întrebările când puzzle-ul este șters", async () => {
  const database = await migratedDatabase();
  database.exec(`
    INSERT INTO puzzles (id, edition, publish_date) VALUES (1, 1, '2026-08-12');
    INSERT INTO questions
      (puzzle_id, position, prompt, answer, unit, explanation)
    VALUES (1, 1, 'Întrebare', 10, 'unități', 'Explicație');
    DELETE FROM puzzles WHERE id = 1;
  `);

  const { count } = database
    .prepare("SELECT count(*) AS count FROM questions")
    .get();
  assert.equal(count, 0);
  database.close();
});

test("calendarul public conține 10 zile, 30 de surse și calcule ochiometrice", async () => {
  const database = await migratedDatabase();
  for (const migration of ["../drizzle/0006_*.sql", "../drizzle/0008_*.sql"]) {
    const sql = await migrationSql(migration);
    database.exec(sql.replaceAll("--> statement-breakpoint", ""));
  }

  const totals = database.prepare(`
    SELECT
      count(DISTINCT p.id) AS puzzles,
      count(q.id) AS questions,
      count(NULLIF(q.source_url, '')) AS sourced,
      count(NULLIF(q.napkin_math, '')) AS explained
    FROM puzzles p
    JOIN questions q ON q.puzzle_id = p.id
    WHERE p.edition BETWEEN 2 AND 11
  `).get();
  assert.deepEqual({ ...totals }, {
    puzzles: 10,
    questions: 30,
    sourced: 30,
    explained: 30,
  });
  assert.deepEqual(
    { ...database.prepare("SELECT min(publish_date) AS first, max(publish_date) AS last FROM puzzles WHERE edition BETWEEN 2 AND 11").get() },
    { first: "2026-08-12", last: "2026-08-21" },
  );
  database.close();
});

test("seed-ul local este idempotent și repository-ul citește doar puzzle-ul publicat", async () => {
  const database = await migratedDatabase();
  const seed = await readFile(
    new URL("../db/seed-development.sql", import.meta.url),
    "utf8",
  );

  database.exec(seed);
  database.exec(seed);

  const puzzle = await getPublishedPuzzleByDate(asD1(database), "2026-08-11");
  assert.equal(puzzle?.edition, 1);
  assert.equal(puzzle?.status, "published");
  assert.deepEqual(
    puzzle?.questions.map(({ position }) => position),
    [1, 2, 3],
  );
  assert.equal(puzzle?.questions[0].answer, 10080);

  const counts = database
    .prepare(
      `SELECT
        (SELECT count(*) FROM puzzles) AS puzzles,
        (SELECT count(*) FROM questions) AS questions`,
    )
    .get();
  assert.deepEqual({ ...counts }, { puzzles: 1, questions: 3 });

  database
    .prepare("UPDATE puzzles SET status = 'scheduled' WHERE edition = 1")
    .run();
  assert.equal(
    await getPublishedPuzzleByDate(asD1(database), "2026-08-11"),
    null,
  );
  assert.equal(
    await getPublishedPuzzleByDate(asD1(database), "2026-08-12"),
    null,
  );
  database.close();
});

test("identitatea anonimă persistă în cookie fără a salva tokenul în D1", async () => {
  const database = await migratedDatabase();
  const d1 = asD1(database);
  const first = await ensureAnonymousPlayer(new Request("https://example.test"), d1);

  assert.match(
    first.setCookie ?? "",
    new RegExp(`^${anonymousPlayerCookie}=[A-Za-z0-9_-]{43};`),
  );
  assert.match(first.setCookie ?? "", /HttpOnly/);
  assert.match(first.setCookie ?? "", /Secure/);
  assert.match(first.setCookie ?? "", /SameSite=Lax/);
  assert.equal(first.id.length, 64);

  const token = first.setCookie.match(/^[^=]+=([^;]+)/)?.[1];
  assert.ok(token);
  assert.notEqual(first.id, token);
  const second = await ensureAnonymousPlayer(
    new Request("https://example.test", {
      headers: { cookie: `${anonymousPlayerCookie}=${token}` },
    }),
    d1,
  );
  assert.equal(second.id, first.id);
  assert.equal(second.setCookie, null);

  const stored = database
    .prepare("SELECT id, count(*) AS count FROM anonymous_players")
    .get();
  assert.equal(stored.id, first.id);
  assert.equal(stored.count, 1);
  database.close();
});

test("încercarea anonimă este reluată fără duplicate", async () => {
  const database = await migratedDatabase();
  database.exec(await readFile(new URL("../db/seed-development.sql", import.meta.url), "utf8"));
  const d1 = asD1(database);
  const player = await ensureAnonymousPlayer(new Request("https://example.test"), d1);

  const first = await startOrResumeAttempt(d1, player.id, "2026-08-11");
  const resumed = await startOrResumeAttempt(d1, player.id, "2026-08-11");
  assert.deepEqual({ ...resumed }, { ...first });
  assert.equal(first?.edition, 1);
  assert.equal(first?.completedAt, null);
  assert.equal(first?.score, null);
  assert.equal(
    database.prepare("SELECT count(*) AS count FROM attempts").get().count,
    1,
  );
  assert.equal(await startOrResumeAttempt(d1, player.id, "2026-08-12"), null);
  database.close();
});

test("data jocului respectă miezul nopții din România", () => {
  assert.equal(bucharestDate(new Date("2026-01-01T21:59:59Z")), "2026-01-01");
  assert.equal(bucharestDate(new Date("2026-01-01T22:00:00Z")), "2026-01-02");
  assert.equal(bucharestDate(new Date("2026-07-01T20:59:59Z")), "2026-07-01");
  assert.equal(bucharestDate(new Date("2026-07-01T21:00:00Z")), "2026-07-02");
});

test("scorul este autoritativ, secvențial și răspunsurile viitoare rămân private", async()=>{
  const database=await migratedDatabase();database.exec(await readFile(new URL("../db/seed-development.sql",import.meta.url),"utf8"));const d1=asD1(database);const player=await ensureAnonymousPlayer(new Request("https://example.test"),d1);await startOrResumeAttempt(d1,player.id,"2026-08-11");
  const puzzle=await publicPuzzle(d1,"2026-08-11");assert.equal(JSON.stringify(puzzle).includes("answer"),false);assert.equal(scoreFactor(10,10),1);assert.throws(()=>scoreFactor(0,10));
  await assert.rejects(()=>lockAnswer(d1,player.id,"2026-08-11",2,100),/RASPUNS_DEJA_BLOCAT/);
  const one=await lockAnswer(d1,player.id,"2026-08-11",1,10080);assert.equal(one.factor,1);assert.equal(one.completed,false);
  await assert.rejects(()=>lockAnswer(d1,player.id,"2026-08-11",1,10080),/RASPUNS_DEJA_BLOCAT/);
  await lockAnswer(d1,player.id,"2026-08-11",2,40075);const done=await lockAnswer(d1,player.id,"2026-08-11",3,88);assert.equal(done.completed,true);assert.equal(done.score,1);
  database.close();
});

test("statisticile folosesc doar tentative finalizate din același puzzle",async()=>{
  const database=await migratedDatabase();database.exec(await readFile(new URL("../db/seed-development.sql",import.meta.url),"utf8"));
  database.exec(`INSERT INTO anonymous_players(id) VALUES ('a'),('b'),('c'),('d'); INSERT INTO attempts(player_id,puzzle_id,completed_at,score) VALUES ('a',1,CURRENT_TIMESTAMP,1),('b',1,CURRENT_TIMESTAMP,2),('c',1,CURRENT_TIMESTAMP,4); INSERT INTO attempts(player_id,puzzle_id) VALUES ('d',1);`);
  const statistics=await getPuzzleStatistics(asD1(database),"b","2026-08-11");assert.equal(statistics?.participantCount,3);assert.equal(statistics?.topPercent,67);assert.equal(statistics?.bins.reduce((a,b)=>a+b,0),3);assert.equal(statistics?.bins[histogramIndex(2)],1);assert.equal(await getPuzzleStatistics(asD1(database),"d","2026-08-11"),null);database.close();
});
