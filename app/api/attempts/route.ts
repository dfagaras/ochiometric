import { ensureAnonymousPlayer } from "@/db/anonymous-player";
import { bucharestDate, startOrResumeAttempt } from "@/db/attempts";
import { getD1Database } from "@/db";

export async function POST(request: Request) {
  const database = await getD1Database();
  const player = await ensureAnonymousPlayer(request, database);
  const attempt = await startOrResumeAttempt(
    database,
    player.id,
    bucharestDate(),
  );

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
