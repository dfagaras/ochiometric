import { getD1Database } from "@/db";
import { bucharestDate } from "@/db/attempts";
import { publicPuzzle } from "@/db/game";
export async function GET(){const puzzle=await publicPuzzle(await getD1Database(),bucharestDate());return puzzle?Response.json({puzzle},{headers:{"cache-control":"no-store"}}):Response.json({error:"Nu există un joc publicat pentru astăzi."},{status:404});}
