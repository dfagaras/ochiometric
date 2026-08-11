import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Ești offline — Ochiometric" };

export default function OfflinePage() {
  return <main className="offline-shell"><section><Image src="/ochiometric-icon.svg" width="88" height="88" alt="" /><span className="eyebrow">MOD OFFLINE</span><h1>Ne-a fugit internetul din ochi.</h1><p>Jocurile și răspunsurile sunt păstrate în siguranță pe server. Reconectează-te ca să continui exact de unde ai rămas.</p><Link className="primary" href="/">ÎNCEARCĂ DIN NOU</Link></section></main>;
}
