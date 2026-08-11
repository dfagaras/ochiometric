"use client";

import { useState } from "react";
import type { ManagedPuzzle, PuzzleInput } from "@/db/admin";

type FormQuestion = { position: number; prompt: string; answer: string; unit: string; explanation: string };
type FormState = { id: number | null; edition: string; publishDate: string; status: "draft" | "scheduled"; questions: FormQuestion[] };
const emptyQuestions = (): FormQuestion[] => [1, 2, 3].map((position) => ({ position, prompt: "", answer: "", unit: "", explanation: "" }));

function formFor(puzzle?: ManagedPuzzle): FormState {
  if (!puzzle) return { id: null, edition: "", publishDate: "", status: "draft", questions: emptyQuestions() };
  return { id: puzzle.id, edition: String(puzzle.edition), publishDate: puzzle.publishDate, status: puzzle.status === "scheduled" ? "scheduled" : "draft", questions: puzzle.questions.map((question) => ({ ...question, answer: String(question.answer) })) };
}

const statusLabel = { draft: "Ciornă", scheduled: "Programat", published: "Publicat", archived: "Arhivat" };

export default function AdminClient({ initialPuzzles }: { initialPuzzles: ManagedPuzzle[] }) {
  const [puzzles, setPuzzles] = useState(initialPuzzles);
  const [form, setForm] = useState<FormState>(() => formFor());
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function updateQuestion(index: number, field: keyof FormQuestion, value: string) {
    setForm((current) => ({ ...current, questions: current.questions.map((question, questionIndex) => questionIndex === index ? { ...question, [field]: value } : question) }));
  }

  async function reload() {
    const response = await fetch("/api/admin/puzzles", { cache: "no-store" });
    if (response.ok) setPuzzles((await response.json() as { puzzles: ManagedPuzzle[] }).puzzles);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const input: PuzzleInput = { edition: Number(form.edition), publishDate: form.publishDate, status: form.status, questions: form.questions.map((question) => ({ ...question, answer: Number(question.answer) })) };
    try {
      const response = await fetch(form.id ? `/api/admin/puzzles/${form.id}` : "/api/admin/puzzles", { method: form.id ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Puzzle-ul nu a putut fi salvat.");
      await reload(); setForm(formFor()); setMessage(form.id ? "Puzzle actualizat." : "Puzzle creat.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "A apărut o eroare."); } finally { setBusy(false); }
  }

  async function moderate(puzzle: ManagedPuzzle, status: ManagedPuzzle["status"]) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/admin/puzzles/${puzzle.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Statusul nu a putut fi schimbat.");
      await reload(); setMessage(`Ediția ${puzzle.edition} a fost actualizată.`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "A apărut o eroare."); } finally { setBusy(false); }
  }

  return <div className="admin-grid">
    <section className="admin-list" aria-labelledby="puzzles-title"><div className="admin-section-title"><div><span className="eyebrow">CALENDAR EDITORIAL</span><h2 id="puzzles-title">Puzzle-uri</h2></div><button type="button" onClick={() => setForm(formFor())}>+ PUZZLE NOU</button></div>
      {puzzles.length === 0 ? <p>Nu există puzzle-uri.</p> : puzzles.map((puzzle) => <article key={puzzle.id} className={form.id === puzzle.id ? "selected" : ""}><div><b>NR. {String(puzzle.edition).padStart(3, "0")}</b><span>{puzzle.publishDate}</span></div><strong className={`status-${puzzle.status}`}>{statusLabel[puzzle.status]}</strong><span>{puzzle.questions.length}/3 întrebări</span><div className="admin-actions">{["draft", "scheduled"].includes(puzzle.status) && <button type="button" onClick={() => setForm(formFor(puzzle))}>EDITEAZĂ</button>}{puzzle.status === "draft" && <button type="button" disabled={busy} onClick={() => void moderate(puzzle, "scheduled")}>PROGRAMEAZĂ</button>}{["draft", "scheduled"].includes(puzzle.status) && <button type="button" disabled={busy} onClick={() => void moderate(puzzle, "published")}>PUBLICĂ</button>}{puzzle.status === "published" && <button type="button" disabled={busy} onClick={() => void moderate(puzzle, "archived")}>ARHIVEAZĂ</button>}</div></article>)}
    </section>

    <form className="admin-editor" onSubmit={save}><span className="eyebrow">{form.id ? "EDITEAZĂ PUZZLE" : "PUZZLE NOU"}</span><h2>{form.id ? `Ediția ${form.edition}` : "Construiește o ediție"}</h2>{error && <p className="error-message" role="alert">{error}</p>}{message && <p className="success-message" role="status">{message}</p>}<div className="admin-meta"><label>EDIȚIE<input required inputMode="numeric" value={form.edition} onChange={(event) => setForm({ ...form, edition: event.target.value })} /></label><label>DATA PUBLICĂRII<input required type="date" value={form.publishDate} onChange={(event) => setForm({ ...form, publishDate: event.target.value })} /></label><label>STARE<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as FormState["status"] })}><option value="draft">Ciornă</option><option value="scheduled">Programat</option></select></label></div>
      {form.questions.map((question, index) => <fieldset key={question.position}><legend>ÎNTREBAREA {question.position}</legend><label>TEXTUL ÎNTREBĂRII<textarea required value={question.prompt} onChange={(event) => updateQuestion(index, "prompt", event.target.value)} /></label><div className="admin-answer"><label>RĂSPUNS CORECT<input required inputMode="decimal" value={question.answer} onChange={(event) => updateQuestion(index, "answer", event.target.value)} /></label><label>UNITATE<input required value={question.unit} onChange={(event) => updateQuestion(index, "unit", event.target.value)} /></label></div><label>EXPLICAȚIE<textarea required value={question.explanation} onChange={(event) => updateQuestion(index, "explanation", event.target.value)} /></label></fieldset>)}
      <button className="primary admin-save" disabled={busy}>{busy ? "SE SALVEAZĂ…" : form.id ? "SALVEAZĂ MODIFICĂRILE" : "CREEAZĂ PUZZLE-UL"}</button>
    </form>
  </div>;
}
