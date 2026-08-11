export type PublicResultDatabase = {
  prepare(sql: string): {
    bind(...values: unknown[]): ReturnType<PublicResultDatabase["prepare"]>;
    first<T>(): Promise<T | null>;
    all<T>(): Promise<{ results: T[] }>;
  };
};

export type PublicResult = {
  id: string;
  edition: number;
  publishDate: string;
  score: number;
  topPercent: number;
  participantCount: number;
  questions: Array<{ position: number; prompt: string; factor: number }>;
};

const publicIdPattern = /^[A-Za-z0-9_-]{24}$/;

export async function getPublicResult(
  database: PublicResultDatabase,
  publicId: string,
): Promise<PublicResult | null> {
  if (!publicIdPattern.test(publicId)) return null;
  const attempt = await database.prepare(
    `SELECT a.id, a.public_id, a.score, p.edition, p.publish_date
     FROM attempts a JOIN puzzles p ON p.id = a.puzzle_id
     WHERE a.public_id = ? AND a.completed_at IS NOT NULL AND a.score IS NOT NULL
       AND p.status IN ('published', 'archived')`,
  ).bind(publicId).first<{id:number;public_id:string;score:number;edition:number;publish_date:string}>();
  if (!attempt) return null;

  const { results: questions } = await database.prepare(
    `SELECT q.position, q.prompt, aa.factor
     FROM attempt_answers aa JOIN questions q ON q.id = aa.question_id
     WHERE aa.attempt_id = ? ORDER BY q.position`,
  ).bind(attempt.id).all<{position:number;prompt:string;factor:number}>();
  const aggregate = await database.prepare(
    `SELECT count(*) AS participant_count,
            sum(CASE WHEN score <= ? THEN 1 ELSE 0 END) AS equal_or_better
     FROM attempts
     WHERE puzzle_id = (SELECT puzzle_id FROM attempts WHERE id = ?)
       AND completed_at IS NOT NULL AND score IS NOT NULL`,
  ).bind(attempt.score, attempt.id).first<{participant_count:number;equal_or_better:number}>();
  const participantCount = aggregate?.participant_count ?? 1;

  return {
    id: attempt.public_id,
    edition: attempt.edition,
    publishDate: attempt.publish_date,
    score: attempt.score,
    participantCount,
    topPercent: Math.max(1, Math.ceil(((aggregate?.equal_or_better ?? 1) / participantCount) * 100)),
    questions,
  };
}
