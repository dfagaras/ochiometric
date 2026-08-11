import { getD1Database } from "@/db";
import { isAnalyticsEvent, recordMetric } from "@/db/analytics";
import { bucharestDate } from "@/db/attempts";

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > 1024) return Response.json({ error: "Cerere prea mare." }, { status: 413 });
  let body: { event?: unknown };
  try { body = await request.json() as { event?: unknown }; } catch { return Response.json({ error: "Cerere invalidă." }, { status: 400 }); }
  if (!isAnalyticsEvent(body.event)) return Response.json({ error: "Eveniment invalid." }, { status: 400 });
  await recordMetric(await getD1Database(), bucharestDate(), body.event);
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}
