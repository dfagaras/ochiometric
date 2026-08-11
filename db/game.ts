import { createPublicResultId } from "./attempts.ts";

export type GameDatabase = {
  prepare(sql: string): {
    bind(...values: unknown[]): ReturnType<GameDatabase["prepare"]>;
    first<T>(): Promise<T | null>;
    all<T>(): Promise<{ results: T[] }>;
    run(): Promise<{ meta?: { changes?: number } }>;
  };
};

type QuestionRow = {
  attempt_id: number;
  question_id: number;
  answer: number;
  explanation: string;
  source_label: string;
  source_url: string;
  napkin_math: string;
};

export function scoreFactor(guess: number, answer: number) {
  if (!Number.isFinite(guess) || guess <= 0) throw new Error("ESTIMARE_INVALIDA");
  return Math.max(guess / answer, answer / guess);
}

export async function publicPuzzle(db: GameDatabase, date: string) {
  const { results } = await db
    .prepare(`SELECT p.edition, p.publish_date, q.position, q.prompt, q.unit
      FROM puzzles p
      JOIN questions q ON q.puzzle_id = p.id
      WHERE p.publish_date = ? AND p.status = 'published'
      ORDER BY q.position`)
    .bind(date)
    .all<{ edition: number; publish_date: string; position: number; prompt: string; unit: string }>();
  if (!results.length) return null;
  return {
    edition: results[0].edition,
    publishDate: results[0].publish_date,
    questions: results.map(({ position, prompt, unit }) => ({ position, prompt, unit })),
  };
}

export async function publicPuzzleByEdition(db: GameDatabase, edition: number) {
  if (!Number.isInteger(edition) || edition < 1) return null;
  const { results } = await db
    .prepare(`SELECT p.edition, p.publish_date, q.position, q.prompt, q.unit
      FROM puzzles p
      JOIN questions q ON q.puzzle_id = p.id
      WHERE p.edition = ? AND p.status IN ('published', 'archived')
      ORDER BY q.position`)
    .bind(edition)
    .all<{ edition: number; publish_date: string; position: number; prompt: string; unit: string }>();
  if (!results.length) return null;
  return {
    edition: results[0].edition,
    publishDate: results[0].publish_date,
    questions: results.map(({ position, prompt, unit }) => ({ position, prompt, unit })),
  };
}

export async function lockAnswer(
  db: GameDatabase,
  playerId: string,
  date: string,
  position: number,
  guess: number,
) {
  return lockAnswerForPuzzle(db, playerId, "p.publish_date", date, position, guess);
}

export async function lockAnswerByEdition(
  db: GameDatabase,
  playerId: string,
  edition: number,
  position: number,
  guess: number,
) {
  if (!Number.isInteger(edition) || edition < 1) throw new Error("EDITIE_INVALIDA");
  return lockAnswerForPuzzle(db, playerId, "p.edition", edition, position, guess);
}

async function lockAnswerForPuzzle(
  db: GameDatabase,
  playerId: string,
  selector: "p.publish_date" | "p.edition",
  value: string | number,
  position: number,
  guess: number,
) {
  if (!Number.isInteger(position) || position < 1 || position > 3) throw new Error("POZITIE_INVALIDA");
  if (!Number.isFinite(guess) || guess <= 0 || guess > 1e15) throw new Error("ESTIMARE_INVALIDA");

  const playableStatus = selector === "p.edition"
    ? "p.status IN ('published', 'archived')"
    : "p.status = 'published'";
  const row = await db
    .prepare(`SELECT a.id AS attempt_id, q.id AS question_id, q.answer, q.explanation,
      q.source_label, q.source_url, q.napkin_math
      FROM attempts a
      JOIN puzzles p ON p.id = a.puzzle_id
      JOIN questions q ON q.puzzle_id = p.id AND q.position = ?
      WHERE a.player_id = ? AND ${selector} = ? AND ${playableStatus}
        AND a.completed_at IS NULL`)
    .bind(position, playerId, value)
    .first<QuestionRow>();
  if (!row) throw new Error("INCERCARE_INDISPONIBILA");

  const factor = scoreFactor(guess, row.answer);
  const inserted = await db
    .prepare(`INSERT INTO attempt_answers (attempt_id, question_id, guess, factor)
      SELECT ?, ?, ?, ?
      WHERE (SELECT count(*) FROM attempt_answers WHERE attempt_id = ?) = ?
      ON CONFLICT(attempt_id, question_id) DO NOTHING`)
    .bind(row.attempt_id, row.question_id, guess, factor, row.attempt_id, position - 1)
    .run();
  if (!inserted.meta?.changes) throw new Error("RASPUNS_DEJA_BLOCAT");

  const aggregate = await db
    .prepare("SELECT count(*) AS count, avg(factor) AS score FROM attempt_answers WHERE attempt_id = ?")
    .bind(row.attempt_id)
    .first<{ count: number; score: number }>();
  const completed = aggregate?.count === 3;
  const publicResultId = completed ? createPublicResultId() : null;
  if (completed) {
    await db
      .prepare("UPDATE attempts SET completed_at = CURRENT_TIMESTAMP, score = ?, public_id = ? WHERE id = ? AND completed_at IS NULL")
      .bind(aggregate.score, publicResultId, row.attempt_id)
      .run();
  }

  return {
    position,
    guess,
    answer: row.answer,
    factor,
    explanation: row.explanation,
    sourceLabel: row.source_label,
    sourceUrl: row.source_url,
    napkinMath: row.napkin_math,
    completed,
    score: completed ? aggregate!.score : null,
    publicResultId,
  };
}
