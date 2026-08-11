import { bucharestDate } from "@/db/attempts";
import { AdminValidationError, moderatePuzzle, updateManagedPuzzle, type ModerationAction, type PuzzleInput } from "@/db/admin";
import { authorizedAdmin } from "../../authorization";

function idFrom(value: string) { const id = Number(value); return Number.isInteger(id) && id > 0 ? id : null; }
function failure(error: unknown) {
  if (error instanceof AdminValidationError) return Response.json({ error: error.message, code: error.code }, { status: error.code === "NEGASIT" ? 404 : error.code === "CONFLICT" ? 409 : 400 });
  return Response.json({ error: "Puzzle-ul nu a putut fi actualizat." }, { status: 500 });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizedAdmin(); if ("error" in auth) return auth.error;
  const id = idFrom((await params).id); if (!id) return Response.json({ error: "ID invalid." }, { status: 400 });
  let input: PuzzleInput; try { input = await request.json() as PuzzleInput; } catch { return Response.json({ error: "Cerere invalidă." }, { status: 400 }); }
  try { return Response.json({ puzzle: await updateManagedPuzzle(auth.database, auth.user.email, id, input) }); } catch (error) { return failure(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizedAdmin(); if ("error" in auth) return auth.error;
  const id = idFrom((await params).id); if (!id) return Response.json({ error: "ID invalid." }, { status: 400 });
  let body: { status?: ModerationAction }; try { body = await request.json() as { status?: ModerationAction }; } catch { return Response.json({ error: "Cerere invalidă." }, { status: 400 }); }
  if (!body.status || !["draft", "scheduled", "published", "archived"].includes(body.status)) return Response.json({ error: "Status invalid." }, { status: 400 });
  try { await moderatePuzzle(auth.database, auth.user.email, id, body.status, bucharestDate()); return Response.json({ ok: true }); } catch (error) { return failure(error); }
}
