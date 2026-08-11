export type ArchiveDatabase = {
  prepare(sql: string): {
    bind(...values: unknown[]): ReturnType<ArchiveDatabase["prepare"]>;
    all<T>(): Promise<{ results: T[] }>;
  };
};

export type ArchiveEntry = {
  edition: number;
  publishDate: string;
  completedAt: string | null;
  score: number | null;
  answerCount: number;
};

export async function getPublishedArchive(
  database: ArchiveDatabase,
  playerId: string,
  throughDate: string,
): Promise<ArchiveEntry[]> {
  const { results } = await database
    .prepare(
      `SELECT p.edition, p.publish_date, a.completed_at, a.score,
              count(aa.id) AS answer_count
       FROM puzzles p
       LEFT JOIN attempts a ON a.puzzle_id = p.id AND a.player_id = ?
       LEFT JOIN attempt_answers aa ON aa.attempt_id = a.id
       WHERE p.status IN ('published', 'archived') AND p.publish_date <= ?
       GROUP BY p.id, p.edition, p.publish_date, a.completed_at, a.score
       ORDER BY p.publish_date DESC, p.edition DESC`,
    )
    .bind(playerId, throughDate)
    .all<{ edition: number; publish_date: string; completed_at: string | null; score: number | null; answer_count: number }>();

  return results.map((row) => ({
    edition: row.edition,
    publishDate: row.publish_date,
    completedAt: row.completed_at,
    score: row.score,
    answerCount: row.answer_count,
  }));
}
