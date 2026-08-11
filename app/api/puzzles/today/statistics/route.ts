import { getD1Database } from "@/db";
import { ensureAnonymousPlayer } from "@/db/anonymous-player";
import { bucharestDate } from "@/db/attempts";
import { getPuzzleStatistics } from "@/db/statistics";

export async function GET(request: Request) {
  const database = await getD1Database();
  const player = await ensureAnonymousPlayer(request, database);
  const statistics = await getPuzzleStatistics(database, player.id, bucharestDate());
  const headers = new Headers({ "cache-control": "no-store" });
  if (player.setCookie) headers.set("set-cookie", player.setCookie);
  return statistics
    ? Response.json({ statistics }, { headers })
    : Response.json(
        { error: "Finalizează jocul pentru a vedea distribuția." },
        { status: 403, headers },
      );
}
