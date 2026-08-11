import { getD1Database } from "@/db";
import { ensureAnonymousPlayer } from "@/db/anonymous-player";
import { getPuzzleStatisticsByEdition } from "@/db/statistics";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ edition: string }> },
) {
  const database = await getD1Database();
  const player = await ensureAnonymousPlayer(request, database);
  const statistics = await getPuzzleStatisticsByEdition(
    database,
    player.id,
    Number((await params).edition),
  );
  const headers = new Headers({ "cache-control": "no-store" });
  if (player.setCookie) headers.set("set-cookie", player.setCookie);
  return statistics
    ? Response.json({ statistics }, { headers })
    : Response.json({ error: "Finalizează jocul pentru a vedea statisticile." }, { status: 404, headers });
}
