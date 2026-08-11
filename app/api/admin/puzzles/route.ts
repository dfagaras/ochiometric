import { AdminValidationError, createManagedPuzzle, listManagedPuzzles, type PuzzleInput } from "@/db/admin";
import { authorizedAdmin } from "../authorization";

function failure(error: unknown) {
  if (error instanceof AdminValidationError) return Response.json({ error: error.message, code: error.code }, { status: error.code === "CONFLICT" ? 409 : 400 });
  return Response.json({ error: "Puzzle-ul nu a putut fi salvat." }, { status: 500 });
}

export async function GET() {
  const auth = await authorizedAdmin();
  if ("error" in auth) return auth.error;
  return Response.json({ puzzles: await listManagedPuzzles(auth.database) }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const auth = await authorizedAdmin();
  if ("error" in auth) return auth.error;
  let input: PuzzleInput;
  try { input = await request.json() as PuzzleInput; } catch { return Response.json({ error: "Cerere invalidă." }, { status: 400 }); }
  try { return Response.json({ puzzle: await createManagedPuzzle(auth.database, auth.user.email, input) }, { status: 201 }); }
  catch (error) { return failure(error); }
}
