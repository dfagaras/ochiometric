export type AdminDatabase = {
  prepare(sql: string): {
    bind(...values: unknown[]): ReturnType<AdminDatabase["prepare"]>;
    first<T>(): Promise<T | null>;
    all<T>(): Promise<{ results: T[] }>;
    run(): Promise<{ meta?: { changes?: number } }>;
  };
};

export type ManagedQuestion = { position: number; prompt: string; answer: number; unit: string; explanation: string };
export type ManagedPuzzle = { id: number; edition: number; publishDate: string; status: "draft" | "scheduled" | "published" | "archived"; questions: ManagedQuestion[] };
export type PuzzleInput = { edition: number; publishDate: string; status?: "draft" | "scheduled"; questions: ManagedQuestion[] };
export type ModerationAction = "draft" | "scheduled" | "published" | "archived";

export class AdminValidationError extends Error {
  code: string;
  constructor(code: string, message: string) { super(message); this.code = code; }
}

export async function isPuzzleAdmin(database: AdminDatabase, email: string): Promise<boolean> {
  const row = await database.prepare("SELECT 1 AS allowed FROM admin_users WHERE email = ?")
    .bind(email.trim().toLowerCase()).first<{ allowed: number }>();
  return row?.allowed === 1;
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

export function validatePuzzleInput(value: PuzzleInput): PuzzleInput {
  if (!Number.isInteger(value.edition) || value.edition < 1) throw new AdminValidationError("EDITIE_INVALIDA", "Ediția trebuie să fie un număr întreg pozitiv.");
  if (!validDate(value.publishDate)) throw new AdminValidationError("DATA_INVALIDA", "Data publicării trebuie să fie o dată validă în format AAAA-LL-ZZ.");
  if (value.status && !["draft", "scheduled"].includes(value.status)) throw new AdminValidationError("STATUS_INVALID", "Un puzzle nou poate fi doar ciornă sau programat.");
  if (!Array.isArray(value.questions) || value.questions.length !== 3) throw new AdminValidationError("INTREBARI_INCOMPLETE", "Puzzle-ul trebuie să aibă exact trei întrebări.");
  const positions = new Set<number>();
  for (const question of value.questions) {
    if (!Number.isInteger(question.position) || question.position < 1 || question.position > 3 || positions.has(question.position)) throw new AdminValidationError("POZITIE_INVALIDA", "Pozițiile întrebărilor trebuie să fie 1, 2 și 3, fără duplicate.");
    positions.add(question.position);
    if (!question.prompt?.trim()) throw new AdminValidationError("PROMPT_GOL", "Textul întrebării este obligatoriu.");
    if (!Number.isFinite(question.answer) || question.answer <= 0 || question.answer > 1e15) throw new AdminValidationError("RASPUNS_INVALID", "Răspunsul trebuie să fie pozitiv și mai mic sau egal cu 10¹⁵.");
    if (!question.unit?.trim()) throw new AdminValidationError("UNITATE_GOALA", "Unitatea este obligatorie.");
    if (!question.explanation?.trim()) throw new AdminValidationError("EXPLICATIE_GOALA", "Explicația este obligatorie.");
  }
  return { ...value, status: value.status ?? "draft", questions: [...value.questions].sort((a, b) => a.position - b.position).map((question) => ({ ...question, prompt: question.prompt.trim(), unit: question.unit.trim(), explanation: question.explanation.trim() })) };
}

export async function listManagedPuzzles(database: AdminDatabase): Promise<ManagedPuzzle[]> {
  const { results } = await database.prepare(`SELECT p.id,p.edition,p.publish_date,p.status,q.position,q.prompt,q.answer,q.unit,q.explanation FROM puzzles p LEFT JOIN questions q ON q.puzzle_id=p.id ORDER BY p.publish_date DESC,p.edition DESC,q.position`).all<{id:number;edition:number;publish_date:string;status:ManagedPuzzle["status"];position:number|null;prompt:string|null;answer:number|null;unit:string|null;explanation:string|null}>();
  const puzzles = new Map<number, ManagedPuzzle>();
  for (const row of results) {
    const puzzle = puzzles.get(row.id) ?? { id: row.id, edition: row.edition, publishDate: row.publish_date, status: row.status, questions: [] };
    if (row.position !== null) puzzle.questions.push({ position: row.position, prompt: row.prompt!, answer: row.answer!, unit: row.unit!, explanation: row.explanation! });
    puzzles.set(row.id, puzzle);
  }
  return [...puzzles.values()];
}

export async function createManagedPuzzle(database: AdminDatabase, adminEmail: string, input: PuzzleInput): Promise<ManagedPuzzle> {
  const value = validatePuzzleInput(input);
  try {
    await database.prepare("INSERT INTO puzzles(edition,publish_date,status) VALUES(?,?,?)").bind(value.edition, value.publishDate, value.status).run();
    const puzzle = await database.prepare("SELECT id FROM puzzles WHERE edition=?").bind(value.edition).first<{id:number}>();
    if (!puzzle) throw new Error("PUZZLE_INDISPONIBIL");
    for (const question of value.questions) await database.prepare("INSERT INTO questions(puzzle_id,position,prompt,answer,unit,explanation) VALUES(?,?,?,?,?,?)").bind(puzzle.id, question.position, question.prompt, question.answer, question.unit, question.explanation).run();
    await audit(database, puzzle.id, adminEmail, "created", { edition: value.edition, publishDate: value.publishDate, status: value.status });
    return (await listManagedPuzzles(database)).find(({ id }) => id === puzzle.id)!;
  } catch (error) {
    if (error instanceof AdminValidationError) throw error;
    throw new AdminValidationError("CONFLICT", "Ediția sau data publicării există deja.");
  }
}

export async function updateManagedPuzzle(database: AdminDatabase, adminEmail: string, id: number, input: PuzzleInput): Promise<ManagedPuzzle> {
  const value = validatePuzzleInput(input);
  const current = await database.prepare("SELECT status FROM puzzles WHERE id=?").bind(id).first<{status:string}>();
  if (!current) throw new AdminValidationError("NEGASIT", "Puzzle-ul nu există.");
  if (!['draft', 'scheduled'].includes(current.status)) throw new AdminValidationError("BLOCAT", "Conținutul publicat sau arhivat nu mai poate fi modificat.");
  try {
    await database.prepare("UPDATE puzzles SET edition=?,publish_date=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(value.edition, value.publishDate, value.status, id).run();
    await database.prepare("DELETE FROM questions WHERE puzzle_id=?").bind(id).run();
    for (const question of value.questions) await database.prepare("INSERT INTO questions(puzzle_id,position,prompt,answer,unit,explanation) VALUES(?,?,?,?,?,?)").bind(id, question.position, question.prompt, question.answer, question.unit, question.explanation).run();
    await audit(database, id, adminEmail, "updated", { edition: value.edition, publishDate: value.publishDate, status: value.status });
    return (await listManagedPuzzles(database)).find((puzzle) => puzzle.id === id)!;
  } catch (error) {
    if (error instanceof AdminValidationError) throw error;
    throw new AdminValidationError("CONFLICT", "Ediția sau data publicării există deja.");
  }
}

export async function moderatePuzzle(database: AdminDatabase, adminEmail: string, id: number, nextStatus: ModerationAction, today: string): Promise<void> {
  const puzzle = await database.prepare("SELECT status,publish_date FROM puzzles WHERE id=?").bind(id).first<{status:ModerationAction;publish_date:string}>();
  if (!puzzle) throw new AdminValidationError("NEGASIT", "Puzzle-ul nu există.");
  const transitions: Record<ModerationAction, ModerationAction[]> = { draft: ["scheduled", "published"], scheduled: ["draft", "published"], published: ["archived"], archived: [] };
  if (!transitions[puzzle.status].includes(nextStatus)) throw new AdminValidationError("TRANZITIE_INVALIDA", `Tranziția ${puzzle.status} → ${nextStatus} nu este permisă.`);
  if (nextStatus === "published" && puzzle.publish_date > today) throw new AdminValidationError("PUBLICARE_PREMATURA", "Un puzzle cu dată viitoare trebuie programat, nu publicat.");
  const count = await database.prepare("SELECT count(*) AS count FROM questions WHERE puzzle_id=?").bind(id).first<{count:number}>();
  if (count?.count !== 3) throw new AdminValidationError("INTREBARI_INCOMPLETE", "Publicarea necesită exact trei întrebări.");
  await database.prepare("UPDATE puzzles SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(nextStatus, id).run();
  await audit(database, id, adminEmail, nextStatus === "draft" ? "updated" : nextStatus, { from: puzzle.status, to: nextStatus });
}

async function audit(database: AdminDatabase, puzzleId: number, email: string, action: "created" | "updated" | "scheduled" | "published" | "archived", details: Record<string, unknown>) {
  await database.prepare("INSERT INTO puzzle_audit_log(puzzle_id,admin_email,action,details) VALUES(?,?,?,?)")
    .bind(puzzleId, email.trim().toLowerCase(), action, JSON.stringify(details)).run();
}
