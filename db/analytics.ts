export const analyticsEvents = ["app_open", "game_started", "game_completed", "share_opened", "archive_opened", "public_result_viewed"] as const;
export type AnalyticsEvent = typeof analyticsEvents[number];

export type AnalyticsDatabase = { prepare(sql: string): { bind(...values: unknown[]): ReturnType<AnalyticsDatabase["prepare"]>; run(): Promise<unknown> } };

export function isAnalyticsEvent(value: unknown): value is AnalyticsEvent {
  return typeof value === "string" && analyticsEvents.includes(value as AnalyticsEvent);
}

export async function recordMetric(database: AnalyticsDatabase, day: string, event: AnalyticsEvent): Promise<void> {
  await database.prepare(`INSERT INTO daily_metrics(day,event,count) VALUES(?,?,1) ON CONFLICT(day,event) DO UPDATE SET count=count+1`)
    .bind(day, event).run();
}
