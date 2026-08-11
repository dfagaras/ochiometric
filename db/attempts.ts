type AttemptRow = {
  edition: number;
  publish_date: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  public_id: string | null;
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

export type AttemptAnswer = {
  position: number;
  guess: number;
  answer: number;
  factor: number;
  explanation: string;
  sourceLabel: string;
  sourceUrl: string;
  napkinMath: string;
};

export type PublicAttempt = {
  edition: number;
  publishDate: string;
  startedAt: string;
  completedAt: string | null;
  score: number | null;
  publicResultId: string | null;
  answers: AttemptAnswer[];
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
  return startOrResumeAttemptForPuzzle(database, playerId, "p.publish_date", publishDate);
}

export async function startOrResumeAttemptByEdition(
  database: AttemptDatabase,
  playerId: string,
  edition: number,
): Promise<PublicAttempt | null> {
  if (!Number.isInteger(edition) || edition < 1) return null;
  return startOrResumeAttemptForPuzzle(database, playerId, "p.edition", edition);
}

async function startOrResumeAttemptForPuzzle(
  database: AttemptDatabase,
  playerId: string,
  selector: "p.publish_date" | "p.edition",
  value: string | number,
): Promise<PublicAttempt | null> {
  const playableStatus = selector === "p.edition"
    ? "p.status IN ('published', 'archived')"
    : "p.status = 'published'";
  const puzzle = await database
    .prepare(`SELECT p.id FROM puzzles p WHERE ${selector} = ? AND ${playableStatus}`)
    .bind(value)
    .first<{ id: number }>();
  if (!puzzle) return null;

  await database
    .prepare(`INSERT INTO attempts (player_id, puzzle_id)
      VALUES (?, ?)
      ON CONFLICT(player_id, puzzle_id) DO NOTHING`)
    .bind(playerId, puzzle.id)
    .run();

  const attempt = await database
    .prepare(`SELECT p.edition, p.publish_date, a.started_at, a.completed_at, a.score, a.public_id
      FROM attempts a
      JOIN puzzles p ON p.id = a.puzzle_id
      WHERE a.player_id = ? AND a.puzzle_id = ?`)
    .bind(playerId, puzzle.id)
    .first<AttemptRow>();
  if (!attempt) return null;

  if (attempt.completed_at && !attempt.public_id) {
    attempt.public_id = createPublicResultId();
    await database
      .prepare("UPDATE attempts SET public_id = ? WHERE player_id = ? AND puzzle_id = ? AND public_id IS NULL")
      .bind(attempt.public_id, playerId, puzzle.id)
      .run();
  }

  const { results: answerRows } = await database
    .prepare(`SELECT q.position, aa.guess, q.answer, aa.factor, q.explanation,
      q.source_label, q.source_url, q.napkin_math
      FROM attempt_answers aa
      JOIN questions q ON q.id = aa.question_id
      WHERE aa.attempt_id = (
        SELECT a.id FROM attempts a
        WHERE a.player_id = ? AND a.puzzle_id = ?
      )
      ORDER BY q.position`)
    .bind(playerId, puzzle.id)
    .all<{
      position: number;
      guess: number;
      answer: number;
      factor: number;
      explanation: string;
      source_label: string;
      source_url: string;
      napkin_math: string;
    }>();

  return {
    edition: attempt.edition,
    publishDate: attempt.publish_date,
    startedAt: attempt.started_at,
    completedAt: attempt.completed_at,
    score: attempt.score,
    publicResultId: attempt.public_id,
    answers: answerRows.map(({ source_label, source_url, napkin_math, ...answer }) => ({
      ...answer,
      sourceLabel: source_label,
      sourceUrl: source_url,
      napkinMath: napkin_math,
    })),
  };
}

export function createPublicResultId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}
