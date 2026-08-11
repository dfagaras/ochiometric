import { getD1Database } from "@/db";
import { getPublicResult } from "@/db/public-results";

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character]!);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await getPublicResult(await getD1Database(), (await params).id);
  if (!result) return new Response("Rezultatul nu există.", { status: 404 });
  const score = result.score < 10 ? result.score.toFixed(2) : result.score.toFixed(1);
  const factors = result.questions.map(({ factor }) => `${factor < 10 ? factor.toFixed(2) : factor.toFixed(1)}×`).join("  ·  ");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(`Ochiometric ${score}×`)}">
    <rect width="1200" height="630" fill="#f3d477"/><rect width="400" height="16" fill="#6f8fcf"/><rect x="400" width="400" height="16" fill="#f3d477"/><rect x="800" width="400" height="16" fill="#df6570"/>
    <text x="80" y="105" fill="#17264a" font-family="Arial,sans-serif" font-size="30" font-weight="700" letter-spacing="5">OCHIOMETRIC · NR. ${String(result.edition).padStart(3, "0")}</text>
    <text x="80" y="330" fill="#17264a" font-family="Arial,sans-serif" font-size="190" font-weight="900" letter-spacing="-10">${score}×</text>
    <rect x="82" y="370" width="240" height="64" rx="32" fill="#17264a"/><text x="202" y="412" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="27" font-weight="700">TOP ${result.topPercent}%</text>
    <text x="80" y="505" fill="#17264a" font-family="Arial,sans-serif" font-size="29" font-weight="700">${escapeXml(factors)}</text>
    <text x="80" y="570" fill="#657088" font-family="Arial,sans-serif" font-size="25">Cât de bine estimezi? Joacă aceeași ediție.</text>
  </svg>`;
  return new Response(svg, { headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "public, max-age=300, s-maxage=86400", "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'" } });
}
