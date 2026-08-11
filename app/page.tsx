"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import Image from "next/image";
import { sendMetric } from "./analytics-event";
import { formatDisplayNumber, formatGroupedInteger, guessSizeClass, parseGroupedInteger } from "./number-format";

type Question = { position: number; prompt: string; unit: string };
type Puzzle = { edition: number; publishDate: string; questions: Question[] };
type Reveal = { position: number; guess: number; answer: number; factor: number; explanation: string; sourceLabel: string; sourceUrl: string; napkinMath: string; completed: boolean; score: number | null; publicResultId: string | null };
type ArchiveEntry = { edition: number; publishDate: string; completedAt: string | null; score: number | null; answerCount: number };
type View = "home" | "play" | "result" | "archive" | "about";
type Statistics = { participantCount: number; topPercent: number; bins: number[]; playerScore: number };
type ArchiveFilter = "all" | "completed" | "available";

function fmt(n: number) { return formatDisplayNumber(n); }
function scoreFmt(n: number) { return `${n < 10 ? n.toFixed(2) : n.toFixed(1)}×`; }
function editionFmt(edition: number) { return String(edition).padStart(3, "0"); }
function dateFmt(date: string, long = false) {
  return new Intl.DateTimeFormat("ro-RO", { ...(long ? { day: "numeric", month: "long", year: "numeric" } : { day: "numeric", month: "short", weekday: "short" }), timeZone: "Europe/Bucharest" }).format(new Date(`${date}T12:00:00Z`));
}

function CalculationGuide({ value, sourceLabel, sourceUrl }: { value: string; sourceLabel: string; sourceUrl: string }) {
  const steps = value.split("||").filter(Boolean);
  const intro = steps[0];
  const formula = steps.at(-1) ?? "";
  const clues = steps.slice(1, -1);
  const [operation, result] = formula.split("≈").map((part) => part.trim());
  return <details className="napkin">
    <summary>CALCUL OCHIOMETRIC <span aria-hidden="true">⌄</span></summary>
    <div className="napkin-sheet">
      <p className="napkin-intro">{intro}</p>
      {clues.map((step) => <div className="napkin-row" key={step}><span>{step}</span></div>)}
      <div className="napkin-row napkin-total"><strong>{operation}</strong>{result && <strong>≈ {result}</strong>}</div>
      {sourceUrl && <a href={sourceUrl} target="_blank" rel="noreferrer">SURSĂ: {sourceLabel} ↗</a>}
    </div>
  </details>;
}

function Distribution({ score, bins }: { score: number; bins: number[] }) {
  const maximum = Math.max(1, ...bins);
  const heights = bins.map((count) => Math.max(count ? 4 : 1, count / maximum * 100));
  const pos = Math.min(98, Math.max(2, Math.log10(Math.max(1, score)) / 3 * 100));
  return <div className="distribution" aria-label={`Poziția ta în distribuție: ${scoreFmt(score)}`}>
    <div className="you-marker" style={{ left: `${pos}%` }}><span>TU</span></div>
    <div className="bars">{heights.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>
    <div className="axis"><span>1×</span><span>10×</span><span>100×</span><span>1.000×</span></div>
  </div>;
}

function Header({ onMenu, onBack, back = false }: { onMenu: () => void; onBack: () => void; back?: boolean }) {
  return <header className={`topbar ${back ? "has-back" : ""}`}><button className="round coral" onClick={onMenu} aria-label="Deschide meniul">☰</button>{back && <button className="round" onClick={onBack} aria-label="Înapoi">‹</button>}<div className="brand"><Image className="brand-logo" src="/ochiometric-logo.png" width={869} height={209} alt="Ochiometric" priority /></div><span className="round-slot" aria-hidden="true" /></header>;
}

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState(0);
  const [input, setInput] = useState("");
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [todayPuzzle, setTodayPuzzle] = useState<Puzzle | null>(null);
  const [reveals, setReveals] = useState<Reveal[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [archive, setArchive] = useState<ArchiveEntry[]>([]);
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>("all");
  const [gameError, setGameError] = useState("");
  const [archiveError, setArchiveError] = useState("");
  const [busy, setBusy] = useState(false);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [publicResultId, setPublicResultId] = useState<string | null>(null);

  useEffect(() => {
    sendMetric("app_open");
    void fetch("/api/puzzles/today").then(async (response) => {
      if (response.ok) setTodayPuzzle((await response.json() as { puzzle: Puzzle }).puzzle);
    });
  }, []);

  const factors = useMemo(() => reveals.map((item) => item.factor), [reveals]);
  const dailyScore = factors.length ? factors.reduce((sum, factor) => sum + factor, 0) / factors.length : 1;
  const percentile = statistics?.topPercent;
  const completedArchive = archive.filter((item) => item.completedAt !== null);
  const filteredArchive = archive.filter((item) => archiveFilter === "all" || (archiveFilter === "completed" ? item.completedAt : !item.completedAt));

  async function loadStatistics(edition: number) {
    const response = await fetch(`/api/puzzles/${edition}/statistics`);
    if (response.ok) setStatistics((await response.json() as { statistics: Statistics }).statistics);
  }

  async function loadArchive() {
    setArchiveError("");
    const response = await fetch("/api/puzzles/archive");
    const data = await response.json() as { puzzles?: ArchiveEntry[]; error?: string };
    if (!response.ok || !data.puzzles) throw new Error(data.error || "Arhiva nu a putut fi încărcată.");
    setArchive(data.puzzles);
  }

  async function openArchive() {
    sendMetric("archive_opened");
    setView("archive");
    setBusy(true);
    try { await loadArchive(); } catch (error) { setArchiveError(error instanceof Error ? error.message : "A apărut o eroare."); } finally { setBusy(false); }
  }

  async function submit() {
    const value = parseGroupedInteger(input);
    if (!Number.isFinite(value) || value <= 0 || !puzzle || busy) { setGameError("Introdu o estimare numerică mai mare decât zero."); return; }
    setBusy(true); setGameError("");
    try {
      const response = await fetch("/api/attempts/answer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ edition: puzzle.edition, position: q + 1, guess: value }) });
      const data = await response.json() as { reveal?: Reveal; error?: string };
      if (!response.ok || !data.reveal) throw new Error(data.error || "Estimarea nu a putut fi blocată.");
      setReveals([...reveals, data.reveal]); setRevealed(true);
      if (data.reveal.publicResultId) setPublicResultId(data.reveal.publicResultId);
      if (data.reveal.completed) sendMetric("game_completed");
    } catch (error) { setGameError(error instanceof Error ? error.message : "A apărut o eroare."); } finally { setBusy(false); }
  }

  function next() {
    if (!puzzle) return;
    if (q < puzzle.questions.length - 1) { setQ(q + 1); setInput(""); setRevealed(false); }
    else { setView("result"); void loadStatistics(puzzle.edition); }
  }

  async function startPuzzle(edition?: number) {
    const cachedPuzzle = edition === undefined ? todayPuzzle : null;
    setQ(0); setInput(""); setReveals([]); setPuzzle(cachedPuzzle); setStatistics(null); setPublicResultId(null); setRevealed(false); setGameError(""); setBusy(true);
    if (cachedPuzzle) setView("play");
    try {
      const attemptRequest = fetch("/api/attempts", { method: "POST", headers: { "content-type": "application/json" }, body: edition === undefined ? undefined : JSON.stringify({ edition }) });
      const puzzleRequest = cachedPuzzle
        ? Promise.resolve(null)
        : fetch(`/api/puzzles/${edition}`);
      const [attemptResponse, puzzleResponse] = await Promise.all([attemptRequest, puzzleRequest]);
      const attemptData = await attemptResponse.json() as { attempt?: { edition: number; completedAt: string | null; publicResultId: string | null; answers: Array<Omit<Reveal, "completed" | "score" | "publicResultId">> }; error?: string };
      if (!attemptResponse.ok || !attemptData.attempt) throw new Error(attemptData.error || "Jocul nu este disponibil.");
      const data = cachedPuzzle
        ? { puzzle: cachedPuzzle }
        : await puzzleResponse!.json() as { puzzle?: Puzzle; error?: string };
      if ((!cachedPuzzle && !puzzleResponse!.ok) || !data.puzzle) throw new Error(data.error || "Jocul nu a putut fi încărcat.");
      const saved = attemptData.attempt.answers.map((answer) => ({ ...answer, completed: false, score: null, publicResultId: null }));
      setPuzzle(data.puzzle); setReveals(saved); setPublicResultId(attemptData.attempt.publicResultId);
      if (!attemptData.attempt.completedAt && saved.length === 0) sendMetric("game_started");
      if (attemptData.attempt.completedAt) { setView("result"); await loadStatistics(data.puzzle.edition); }
      else { setQ(saved.length); setRevealed(false); setView("play"); }
    } catch (error) { setPuzzle(null); setView("play"); setGameError(error instanceof Error ? error.message : "A apărut o eroare."); } finally { setBusy(false); }
  }

  async function share() {
    if (!puzzle) return;
    if (!publicResultId) { setGameError("Linkul public nu este încă disponibil."); return; }
    const url = `${window.location.origin}/rezultat/${publicResultId}`;
    sendMetric("share_opened");
    const text = `Ochiometric #${editionFmt(puzzle.edition)} — ${scoreFmt(statistics?.playerScore ?? dailyScore)}${percentile ? ` · Top ${percentile}%` : ""}\nMă bați?`;
    if (navigator.share) await navigator.share({ title: "Ochiometric", text, url });
    else await navigator.clipboard.writeText(`${text}\n${url}`);
  }

  const startPuzzleFromSharedResult = useEffectEvent((edition: number) => {
    void startPuzzle(edition);
  });

  useEffect(() => {
    const edition = Number(new URLSearchParams(window.location.search).get("editia"));
    if (!Number.isInteger(edition) || edition < 1) return;
    const timer = window.setTimeout(() => startPuzzleFromSharedResult(edition), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const currentQuestion = puzzle?.questions[q];
  return <main className={`app view-${view} ${view === "play" ? `question-${q+1}` : ""}`}>
    <div className={`drawer-shade ${menu ? "open" : ""}`} onClick={() => setMenu(false)} />
    <aside className={`drawer ${menu ? "open" : ""}`} aria-hidden={!menu} inert={!menu}><button className="round close" onClick={() => setMenu(false)} aria-label="Închide meniul">×</button><nav><button onClick={() => { void openArchive(); setMenu(false); }}>Arhivă</button><button onClick={() => { setView("home"); setMenu(false); }}>Jocul de azi</button><button onClick={() => { setView("about"); setMenu(false); }}>Despre Ochiometric</button><button>Trimite o întrebare</button><button>Feedback</button><button>Confidențialitate</button></nav><small>FĂCUT CU OCHIOMETRUL ÎN ROMÂNIA</small></aside>

    {view === "home" && <><Header onMenu={() => setMenu(true)} onBack={() => {}} /><section className="hero card">
      <div className="edition">OCHIOMETRIC · NR. {todayPuzzle ? editionFmt(todayPuzzle.edition) : "—"}</div><h1>Cât de bine<br /><em>estimezi?</em></h1><p>Trei întrebări. Fără Google. Doar logică, instinct și puțină matematică.</p>
      <div className="dots"><b>1</b><b>2</b><b>3</b></div><button className="primary" disabled={!todayPuzzle || busy} onClick={() => void startPuzzle()}>JOACĂ AZI <span>→</span></button><small>{todayPuzzle ? dateFmt(todayPuzzle.publishDate, true).toLocaleUpperCase("ro-RO") : "JOCUL DE AZI SE ÎNCARCĂ"} · DUREAZĂ 3 MINUTE</small>
    </section><section className="intro"><span>CUM SE JOACĂ</span><h2>Nu trebuie să știi.<br />Trebuie să te apropii.</h2><div className="steps"><article><b>01</b><h3>Estimează</h3><p>Dă cel mai bun răspuns al tău.</p></article><article><b>02</b><h3>Compară</h3><p>Vezi răspunsul și explicația.</p></article><article><b>03</b><h3>Provoacă</h3><p>Trimite scorul prietenilor.</p></article></div></section></>}

    {view === "play" && <><Header onMenu={() => setMenu(true)} onBack={() => setView("home")} back /><section className="play-card card">{gameError && <p role="alert" className="error-message">{gameError}</p>}{!currentQuestion ? <p>{busy ? "Se încarcă jocul…" : "Jocul nu este disponibil."}</p> : <><div className="progress"><span>NR. {editionFmt(puzzle.edition)} · ÎNTREBAREA {q + 1} DIN {puzzle.questions.length}</span><div><i style={{ width: `${((q + (revealed ? 1 : 0)) / puzzle.questions.length) * 100}%` }} /></div></div><h2>{currentQuestion.prompt}</h2>{!revealed ? <><label htmlFor="guess">ESTIMAREA TA</label><div className="guess"><input id="guess" className={guessSizeClass(input)} inputMode="numeric" autoComplete="off" value={input} onChange={(event) => setInput(formatGroupedInteger(event.target.value))} onKeyDown={(event) => event.key === "Enter" && void submit()} placeholder="0" autoFocus aria-describedby="guess-help" /><span>{currentQuestion.unit}</span></div><p className="micro" id="guess-help">Nu căuta. Ai încredere în instinct.</p><button className="primary" disabled={busy} onClick={() => void submit()}>{busy ? "SE BLOCHEAZĂ…" : "BLOCHEAZĂ RĂSPUNSUL"}</button></> : <div className="reveal"><div className="compare"><article><small>AI SPUS</small><b>{fmt(reveals[q].guess)}</b></article><article><small>RĂSPUNS</small><b>{fmt(reveals[q].answer)}</b></article></div><div className="factor"><b>{scoreFmt(reveals[q].factor)}</b><span>{reveals[q].guess === reveals[q].answer ? "PERFECT =" : reveals[q].guess > reveals[q].answer ? "PREA MULT ↑" : "PREA PUȚIN ↓"}</span></div><p className="answer-note">{reveals[q].explanation}</p>{reveals[q].napkinMath && <CalculationGuide value={reveals[q].napkinMath} sourceLabel={reveals[q].sourceLabel} sourceUrl={reveals[q].sourceUrl} />}<button className="primary" onClick={next}>{q < puzzle.questions.length - 1 ? "URMĂTOAREA ÎNTREBARE" : "VEZI SCORUL"} →</button></div>}</>}</section></>}

    {view === "result" && <><Header onMenu={() => setMenu(true)} onBack={() => setView("home")} back /><section className="results card"><span className="eyebrow">OCHIOMETRIC NR. {puzzle ? editionFmt(puzzle.edition) : "—"}</span><div className="big-score">{scoreFmt(statistics?.playerScore ?? dailyScore)}</div>{percentile && <b className="rank">TOP {percentile}%</b>}<h3>CUM S-AU DESCURCAT TOȚI</h3>{statistics ? <><Distribution score={statistics.playerScore} bins={statistics.bins} /><p>{statistics.participantCount === 1 ? "Ești primul rezultat pentru acest joc." : `${statistics.participantCount} jucători au terminat acest joc.`}</p></> : <p>Se încarcă distribuția reală…</p>}<h3>ÎNTREBĂRI</h3><div className="question-results">{puzzle?.questions.map((question, index) => <article key={question.position}><p>{question.prompt}</p><b>{reveals[index].guess === reveals[index].answer ? "=" : reveals[index].guess > reveals[index].answer ? ">" : "<"} {scoreFmt(reveals[index].factor)}</b></article>)}</div><button className="primary dark" onClick={() => void share()}>DISTRIBUIE REZULTATUL</button><button className="secondary" onClick={() => void openArchive()}>VEZI ARHIVA</button></section></>}

    {view === "archive" && <><Header onMenu={() => setMenu(true)} onBack={() => setView("home")} back /><section className="archive"><span className="eyebrow">ISTORICUL TĂU</span><h1>Arhivă</h1><p>Toate provocările Ochiometric publicate până astăzi.</p>{archiveError && <p role="alert" className="error-message">{archiveError}</p>}<div className="stats"><article><small>JOCURI</small><b>{completedArchive.length} / {archive.length}</b></article><article><small>SCOR MEDIU</small><b>{completedArchive.length ? scoreFmt(completedArchive.reduce((sum, item) => sum + (item.score ?? 0), 0) / completedArchive.length) : "—"}</b></article><article><small>CEA MAI BUNĂ ZI</small><b>{completedArchive.length ? scoreFmt(Math.min(...completedArchive.map((item) => item.score ?? Infinity))) : "—"}</b></article></div><div className="filters" aria-label="Filtrează arhiva">{([["all", "TOATE"], ["completed", "TERMINATE"], ["available", "DE JUCAT"]] as const).map(([value, label]) => <button key={value} className={archiveFilter === value ? "active" : ""} aria-pressed={archiveFilter === value} onClick={() => setArchiveFilter(value)}>{label}</button>)}</div><div className="archive-list" aria-live="polite">{busy && archive.length === 0 ? <p className="archive-empty">Se încarcă arhiva…</p> : filteredArchive.length === 0 ? <p className="archive-empty">Nu există jocuri în această categorie.</p> : filteredArchive.map((item) => <article key={item.edition}><small>{editionFmt(item.edition)}</small><div><b>{dateFmt(item.publishDate)}</b><span>{item.completedAt ? "Joc terminat" : item.answerCount ? `${item.answerCount}/3 răspunsuri` : "Disponibil"}</span></div><strong className={item.completedAt ? "good" : ""}>{item.score ? scoreFmt(item.score) : "—"}</strong><button onClick={() => void startPuzzle(item.edition)}>{item.completedAt ? "REZULTAT" : item.answerCount ? "CONTINUĂ" : "JOACĂ"}</button></article>)}</div></section></>}

    {view === "about" && <><Header onMenu={() => setMenu(true)} onBack={() => setView("home")} back /><section className="about card"><span className="eyebrow">DESPRE</span><h1>Ce înseamnă<br />„Ochiometric”?</h1><p>Este jocul zilnic în care nu contează dacă știi răspunsul, ci cât de bine poți construi o estimare.</p><p>Primești trei întrebări greu de știut exact și o singură încercare pentru fiecare. Scorul perfect este 1×. Cu cât scorul e mai mic, cu atât ai fost mai aproape.</p><button className="primary" onClick={() => void startPuzzle()}>JOACĂ AZI</button></section></>}
  </main>;
}
