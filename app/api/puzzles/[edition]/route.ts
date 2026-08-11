import { getD1Database } from "@/db";
import { publicPuzzleByEdition } from "@/db/game";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ edition: string }> },
) {
  const edition = Number((await params).edition);
  const puzzle = await publicPuzzleByEdition(await getD1Database(), edition);
  return puzzle
    ? Response.json({ puzzle }, { headers: { "cache-control": "no-store" } })
    : Response.json({ error: "Jocul nu este disponibil." }, { status: 404 });
}
