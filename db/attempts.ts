type AttemptRow = {
  edition: number;
  publish_date: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
};

type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first<T>(): Promise<T | null>;
  run(): Promise<unknown>;
  all<T>(): Promise<{ results: T[] }>;
};

export type AttemptDatabase = {
  prepare(sql: string): D1Statement;
};

export type PublicAttempt = {
  edition: number;
  publishDate: string;
  startedAt: string;
  completedAt: string | null;
  score: number | null;
  answers: Array<{position:number;guess:number;answer:number;factor:number;explanation:string;sourceLabel:string;sourceUrl:string;napkinMath:string}>;
};

export function bucharestDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export async function startOrResumeAttempt(
  database: AttemptDatabase,
  playerId: string,
  publishDate: string,
): Promise<PublicAttempt | null> {
  const puzzle = await database
    .prepare(
      "SELECT id FROM puzzles WHERE publish_date = ? AND status = 'published'",
    )
    .bind(publishDate)
    .first<{ id: number }>();
  if (!puzzle) return null;

  await database
    .prepare(
      `INSERT INTO attempts (player_id, puzzle_id)
       VALUES (?, ?)
       ON CONFLICT(player_id, puzzle_id) DO NOTHING`,
    )
    .bind(playerId, puzzle.id)
    .run();

  const attempt = await database
    .prepare(
      `SELECT p.edition, p.publish_date, a.started_at, a.completed_at, a.score
       FROM attempts a
       JOIN puzzles p ON p.id = a.puzzle_id
       WHERE a.player_id = ? AND a.puzzle_id = ?`,
    )
    .bind(playerId, puzzle.id)
    .first<AttemptRow>();

  if (!attempt) return null;
  const { results: answerRows } = await database.prepare(`SELECT q.position,aa.guess,q.answer,aa.factor,q.explanation,q.source_label,q.source_url,q.napkin_math FROM attempt_answers aa JOIN questions q ON q.id=aa.question_id WHERE aa.attempt_id=(SELECT a.id FROM attempts a JOIN puzzles p ON p.id=a.puzzle_id WHERE a.player_id=? AND p.id=?) ORDER BY q.position`).bind(playerId,puzzle.id).all<{position:number;guess:number;answer:number;factor:number;explanation:string;source_label:string;source_url:string;napkin_math:string}>();
  const answers=answerRows.map(({source_label,source_url,napkin_math,...answer})=>({...answer,sourceLabel:source_label,sourceUrl:source_url,napkinMath:napkin_math}));
  return {
        edition: attempt.edition,
        publishDate: attempt.publish_date,
        startedAt: attempt.started_at,
        completedAt: attempt.completed_at,
        score: attempt.score,
        answers,
      };
}
