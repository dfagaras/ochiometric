import { ensureAnonymousPlayer } from "@/db/anonymous-player";
import { bucharestDate, startOrResumeAttempt, startOrResumeAttemptByEdition } from "@/db/attempts";
import { getD1Database } from "@/db";
import { consumeRateLimit } from "@/db/rate-limit";

export async function POST(request: Request) {
  const database = await getD1Database();
  const player = await ensureAnonymousPlayer(request, database);
  const rateLimit = await consumeRateLimit(database, `attempt:${player.id}`, 20, 60);
  if (!rateLimit.allowed) {
    const headers = new Headers({ "retry-after": String(rateLimit.retryAfter), "cache-control": "no-store" });
    if (player.setCookie) headers.set("set-cookie", player.setCookie);
    return Response.json({ error: "Prea multe încercări. Reîncearcă în câteva secunde." }, { status: 429, headers });
  }
  let edition: number | undefined;
  try {
    const body = await request.json() as { edition?: number };
    edition = body.edition;
  } catch {
    // An empty body keeps the original "today" behavior.
  }
  const attempt = edition === undefined
    ? await startOrResumeAttempt(database, player.id, bucharestDate())
    : await startOrResumeAttemptByEdition(database, player.id, edition);

  const headers = new Headers({ "cache-control": "no-store" });
  if (player.setCookie) headers.set("set-cookie", player.setCookie);

  if (!attempt) {
    return Response.json(
      { error: "Nu există un joc publicat pentru astăzi." },
      { status: 404, headers },
    );
  }

  return Response.json({ attempt }, { headers });
}
