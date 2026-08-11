export type PublicResultDatabase = {
  prepare(sql: string): {
    bind(...values: unknown[]): ReturnType<PublicResultDatabase["prepare"]>;
    first<T>(): Promise<T | null>;
    all<T>(): Promise<{ results: T[] }>;
  };
};

const histogramBinCount = 26;

function histogramIndex(score: number) {
  const position = Math.log10(Math.max(1, score)) / 3;
  return Math.min(histogramBinCount - 1, Math.max(0, Math.floor(position * histogramBinCount)));
}

export type PublicResult = {
  id: string;
  edition: number;
  publishDate: string;
  score: number;
  topPercent: number;
  participantCount: number;
  bins: number[];
  questions: Array<{ position: number; prompt: string; relation: "=" | ">" | "<"; factor: number }>;
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
    `SELECT q.position, q.prompt,
            CASE WHEN aa.guess = q.answer THEN '=' WHEN aa.guess > q.answer THEN '>' ELSE '<' END AS relation,
            aa.factor
     FROM attempt_answers aa JOIN questions q ON q.id = aa.question_id
     WHERE aa.attempt_id = ? ORDER BY q.position`,
  ).bind(attempt.id).all<{position:number;prompt:string;relation:"="|">"|"<";factor:number}>();
  const { results: scoreRows } = await database.prepare(
    `SELECT score
     FROM attempts
     WHERE puzzle_id = (SELECT puzzle_id FROM attempts WHERE id = ?)
       AND completed_at IS NOT NULL AND score IS NOT NULL`,
  ).bind(attempt.id).all<{ score: number }>();
  const scores = scoreRows.map(({ score }) => score);
  const participantCount = Math.max(1, scores.length);
  const equalOrBetter = Math.max(1, scores.filter((score) => score <= attempt.score).length);
  const bins = Array.from({ length: histogramBinCount }, () => 0);
  for (const score of scores) bins[histogramIndex(score)] += 1;

  return {
    id: attempt.public_id,
    edition: attempt.edition,
    publishDate: attempt.publish_date,
    score: attempt.score,
    participantCount,
    topPercent: Math.max(1, Math.ceil((equalOrBetter / participantCount) * 100)),
    bins,
    questions,
  };
}
