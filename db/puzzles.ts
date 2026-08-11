export type PuzzleStatus = "draft" | "scheduled" | "published" | "archived";

export type DailyQuestion = {
  id: number;
  position: number;
  prompt: string;
  answer: number;
  unit: string;
  explanation: string;
  sourceLabel: string;
  sourceUrl: string;
  napkinMath: string;
};

export type DailyPuzzle = {
  id: number;
  edition: number;
  publishDate: string;
  status: PuzzleStatus;
  questions: DailyQuestion[];
};

type PuzzleRow = {
  puzzle_id: number;
  edition: number;
  publish_date: string;
  status: PuzzleStatus;
  question_id: number;
  position: number;
  prompt: string;
  answer: number;
  unit: string;
  explanation: string;
  source_label: string;
  source_url: string;
  napkin_math: string;
};

type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  all<T>(): Promise<{ results: T[] }>;
};

export type PuzzleDatabase = {
  prepare(sql: string): D1Statement;
};

const publishedPuzzleQuery = `
  SELECT
    p.id AS puzzle_id,
    p.edition,
    p.publish_date,
    p.status,
    q.id AS question_id,
    q.position,
    q.prompt,
    q.answer,
    q.unit,
    q.explanation,
    q.source_label,
    q.source_url,
    q.napkin_math
  FROM puzzles p
  JOIN questions q ON q.puzzle_id = p.id
  WHERE p.publish_date = ? AND p.status = 'published'
  ORDER BY q.position ASC
`;

/**
 * Server-only repository function. The returned value contains correct answers
 * and must be mapped to a public DTO before any response is sent to the client.
 */
export async function getPublishedPuzzleByDate(
  database: PuzzleDatabase,
  publishDate: string,
): Promise<DailyPuzzle | null> {
  const { results } = await database
    .prepare(publishedPuzzleQuery)
    .bind(publishDate)
    .all<PuzzleRow>();

  if (results.length === 0) return null;

  const [puzzle] = results;
  return {
    id: puzzle.puzzle_id,
    edition: puzzle.edition,
    publishDate: puzzle.publish_date,
    status: puzzle.status,
    questions: results.map((row) => ({
      id: row.question_id,
      position: row.position,
      prompt: row.prompt,
      answer: row.answer,
      unit: row.unit,
      explanation: row.explanation,
      sourceLabel: row.source_label,
      sourceUrl: row.source_url,
      napkinMath: row.napkin_math,
    })),
  };
}
