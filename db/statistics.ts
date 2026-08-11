export const histogramBinCount = 26;
const maximumExponent = 3;

type ScoreRow = { score: number };
type StatisticsDatabase = {
  prepare(sql: string): {
    bind(...values: unknown[]): ReturnType<StatisticsDatabase["prepare"]>;
    all<T>(): Promise<{ results: T[] }>;
    first<T>(): Promise<T | null>;
  };
};

export type PuzzleStatistics = {
  participantCount: number;
  topPercent: number;
  bins: number[];
  playerScore: number;
};

export function histogramIndex(score: number): number {
  const position = Math.log10(Math.max(1, score)) / maximumExponent;
  return Math.min(
    histogramBinCount - 1,
    Math.max(0, Math.floor(position * histogramBinCount)),
  );
}

export async function getPuzzleStatistics(
  database: StatisticsDatabase,
  playerId: string,
  publishDate: string,
): Promise<PuzzleStatistics | null> {
  return getStatisticsForPuzzle(database, playerId, "p.publish_date", publishDate);
}

export async function getPuzzleStatisticsByEdition(
  database: StatisticsDatabase,
  playerId: string,
  edition: number,
): Promise<PuzzleStatistics | null> {
  if (!Number.isInteger(edition) || edition < 1) return null;
  return getStatisticsForPuzzle(database, playerId, "p.edition", edition);
}

async function getStatisticsForPuzzle(
  database: StatisticsDatabase,
  playerId: string,
  selector: "p.publish_date" | "p.edition",
  value: string | number,
): Promise<PuzzleStatistics | null> {
  const visibleStatus = selector === "p.edition"
    ? "p.status IN ('published', 'archived')"
    : "p.status = 'published'";
  const player = await database
    .prepare(
      `SELECT a.score
       FROM attempts a JOIN puzzles p ON p.id = a.puzzle_id
       WHERE a.player_id = ? AND ${selector} = ?
         AND a.completed_at IS NOT NULL AND a.score IS NOT NULL`,
    )
    .bind(playerId, value)
    .first<ScoreRow>();
  if (!player) return null;

  const { results } = await database
    .prepare(
      `SELECT a.score
       FROM attempts a JOIN puzzles p ON p.id = a.puzzle_id
       WHERE ${selector} = ? AND ${visibleStatus}
         AND a.completed_at IS NOT NULL AND a.score IS NOT NULL`,
    )
    .bind(value)
    .all<ScoreRow>();

  const scores = results.map(({ score }) => score);
  const bins = Array.from({ length: histogramBinCount }, () => 0);
  for (const score of scores) bins[histogramIndex(score)] += 1;
  const equalOrBetter = scores.filter((score) => score <= player.score).length;

  return {
    participantCount: scores.length,
    topPercent: Math.max(1, Math.ceil((equalOrBetter / scores.length) * 100)),
    bins,
    playerScore: player.score,
  };
}
