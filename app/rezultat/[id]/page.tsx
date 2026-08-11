import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getD1Database } from "@/db";
import { getPublicResult } from "@/db/public-results";
import AnalyticsEvent from "@/app/analytics-event";

function scoreFmt(score: number) {
  return `${score < 10 ? score.toFixed(2) : score.toFixed(1)}×`;
}

async function resultFor(id: string) {
  return getPublicResult(await getD1Database(), id);
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const result = await resultFor(id);
  if (!result) return { title: "Rezultat indisponibil — Ochiometric" };
  const title = `Ochiometric #${String(result.edition).padStart(3, "0")} — ${scoreFmt(result.score)}`;
  const description = `Top ${result.topPercent}% la Ochiometric. Poți obține un scor mai bun?`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website", images: [{ url: `/api/results/${id}/card`, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [`/api/results/${id}/card`] },
  };
}

export default async function PublicResultPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await resultFor((await params).id);
  if (!result) notFound();
  const date = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${result.publishDate}T12:00:00Z`));

  return <main className="public-result-shell"><AnalyticsEvent event="public_result_viewed" /><section className="public-result-card">
    <header><Link href="/" className="public-brand" aria-label="Ochiometric — pagina principală"><Image className="brand-logo" src="/ochiometric-logo.png" width={869} height={209} alt="Ochiometric" priority /></Link></header>
    <span className="eyebrow">REZULTAT PUBLIC · NR. {String(result.edition).padStart(3, "0")}</span>
    <p className="public-date">{date}</p>
    <div className="big-score">{scoreFmt(result.score)}</div>
    <b className="rank">TOP {result.topPercent}%</b>
    <p>{result.participantCount === 1 ? "Primul rezultat al acestei ediții." : `Comparat cu ${result.participantCount} rezultate finalizate.`}</p>
    <h1>Poți estima mai bine?</h1>
    <div className="public-factors">{result.questions.map((question) => <article key={question.position}><small>ÎNTREBAREA {question.position}</small><p>{question.prompt}</p><b>{scoreFmt(question.factor)}</b></article>)}</div>
    <Link className="primary public-cta" href={`/?editia=${result.edition}`}>JOACĂ ACEEAȘI EDIȚIE <span>→</span></Link>
    <p className="privacy-note">Rezultatul este anonim. Nu sunt publicate răspunsurile, estimările sau identitatea jucătorului.</p>
  </section></main>;
}
