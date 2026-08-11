import { getD1Database } from "@/db";
import { getPublicResult } from "@/db/public-results";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await getPublicResult(await getD1Database(), (await params).id);
  return result
    ? Response.json({ result }, { headers: { "cache-control": "public, max-age=60, s-maxage=300" } })
    : Response.json({ error: "Rezultatul nu există." }, { status: 404 });
}
