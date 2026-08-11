import Link from "next/link";
import { requireChatGPTUser, chatGPTSignOutPath } from "@/app/chatgpt-auth";
import { getD1Database } from "@/db";
import { isPuzzleAdmin, listManagedPuzzles } from "@/db/admin";
import AdminClient from "./admin-client";

export const metadata = { title: "Administrare — Ochiometric", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  const database = await getD1Database();
  if (!await isPuzzleAdmin(database, user.email)) return <main className="admin-shell"><section className="admin-forbidden"><span className="eyebrow">ACCES RESTRICȚIONAT</span><h1>Nu ai acces la administrare.</h1><p>Contul autentificat nu este în lista administratorilor Ochiometric.</p><Link href="/">Înapoi la joc</Link></section></main>;
  const puzzles = await listManagedPuzzles(database);
  return <main className="admin-shell"><header className="admin-header"><Link href="/" className="public-brand">OCHIOMETRIC<small>ADMINISTRARE</small></Link><div><span>{user.displayName}</span><Link href={chatGPTSignOutPath("/")}>Ieșire</Link></div></header><div className="admin-intro"><span className="eyebrow">ATELIERUL DE ÎNTREBĂRI</span><h1>Planifică următoarea provocare.</h1><p>Creează, validează, programează și publică edițiile Ochiometric.</p></div><AdminClient initialPuzzles={puzzles} /></main>;
}
