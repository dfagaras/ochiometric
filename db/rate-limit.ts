export type RateLimitDatabase = { prepare(sql: string): { bind(...values: unknown[]): ReturnType<RateLimitDatabase["prepare"]>; first<T>(): Promise<T | null>; run(): Promise<unknown> } };
export type RateLimitResult = { allowed: boolean; remaining: number; retryAfter: number };

export async function consumeRateLimit(
  database: RateLimitDatabase,
  key: string,
  limit: number,
  windowSeconds: number,
  now = Date.now(),
): Promise<RateLimitResult> {
  const epochSeconds = Math.floor(now / 1000);
  const windowStart = Math.floor(epochSeconds / windowSeconds) * windowSeconds;
  const row = await database.prepare(`INSERT INTO rate_limit_buckets(key,window_start,count) VALUES(?,?,1) ON CONFLICT(key,window_start) DO UPDATE SET count=count+1 RETURNING count`)
    .bind(key, windowStart).first<{ count: number }>();
  const count = row?.count ?? limit + 1;
  await database.prepare("DELETE FROM rate_limit_buckets WHERE window_start < ?").bind(windowStart - 3600).run();
  return { allowed: count <= limit, remaining: Math.max(0, limit - count), retryAfter: Math.max(1, windowStart + windowSeconds - epochSeconds) };
}
