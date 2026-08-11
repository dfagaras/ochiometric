import { ensureAnonymousPlayer } from "@/db/anonymous-player";
import { getPublishedArchive } from "@/db/archive";
import { bucharestDate } from "@/db/attempts";
import { getD1Database } from "@/db";

export async function GET(request: Request) {
  const database = await getD1Database();
  const player = await ensureAnonymousPlayer(request, database);
  const puzzles = await getPublishedArchive(database, player.id, bucharestDate());
  const headers = new Headers({ "cache-control": "no-store" });
  if (player.setCookie) headers.set("set-cookie", player.setCookie);
  return Response.json({ puzzles }, { headers });
}
