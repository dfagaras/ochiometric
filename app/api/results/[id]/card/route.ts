import { getD1Database } from "@/db";
import { getPublicResult, type PublicResult } from "@/db/public-results";

const colors = {
  ink: "#17264a",
  muted: "#657088",
  paper: "#fffdfa",
  coral: "#df6570",
  blue: "#6f8fcf",
  yellow: "#f3d477",
  green: "#36a184",
  chart: "#8b79a2",
};

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character]!);
}

function scoreLabel(value: number) {
  return `${value < 10 ? value.toFixed(2) : value.toFixed(1)}×`;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Bucharest" })
    .format(new Date(`${value}T12:00:00Z`));
}

function wrapText(value: string, maxCharacters = 23, maxLines = 4) {
  const words = value.trim().split(/\s+/);
  const lines: string[] = [];
  for (const word of words) {
    const index = Math.max(0, lines.length - 1);
    if (!lines.length || `${lines[index]} ${word}`.trim().length > maxCharacters) lines.push(word);
    else lines[index] += ` ${word}`;
  }
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.,;:!?]?$/, "")}…`;
  }
  return lines;
}

function questionMarkup(result: PublicResult) {
  return result.questions.map((question, index) => {
    const top = 166 + index * 138;
    const lines = wrapText(question.prompt);
    const tspans = lines.map((line, lineIndex) => `<tspan x="690" dy="${lineIndex ? 27 : 0}">${escapeXml(line)}</tspan>`).join("");
    return `<text x="650" y="${top}" fill="${colors.muted}" font-family="Arial,sans-serif" font-size="17" font-weight="800">Î${question.position}</text>
      <text x="690" y="${top}" fill="${colors.ink}" font-family="Arial,sans-serif" font-size="23" font-weight="700">${tspans}</text>
      <text x="1128" y="${top}" text-anchor="end" fill="${colors.ink}" font-family="Arial,sans-serif" font-size="25" font-weight="900">${question.relation} ${scoreLabel(question.factor)}</text>
      ${index < result.questions.length - 1 ? `<line x1="650" y1="${top + 95}" x2="1130" y2="${top + 95}" stroke="${colors.ink}" stroke-opacity=".16"/>` : ""}`;
  }).join("");
}

function chartMarkup(result: PublicResult) {
  const maximum = Math.max(1, ...result.bins);
  const baseline = 495;
  const bars = result.bins.map((count, index) => {
    const height = Math.max(count ? 8 : 3, count / maximum * 78);
    return `<rect x="${72 + index * 19}" y="${baseline - height}" width="15" height="${height}" rx="4" fill="${colors.chart}" fill-opacity=".72"/>`;
  }).join("");
  const markerX = 72 + Math.min(25, Math.max(0, Math.floor(Math.log10(Math.max(1, result.score)) / 3 * 26))) * 19 + 7;
  return `${bars}
    <line x1="${markerX}" y1="429" x2="${markerX}" y2="500" stroke="${colors.ink}" stroke-width="4"/>
    <rect x="${markerX - 28}" y="405" width="56" height="34" rx="9" fill="${colors.ink}"/>
    <text x="${markerX}" y="429" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="16" font-weight="900">TU</text>
    <line x1="72" y1="500" x2="574" y2="500" stroke="${colors.ink}" stroke-opacity=".45"/>
    <text x="72" y="530" fill="${colors.ink}" font-family="Arial,sans-serif" font-size="17" font-weight="700">1×</text>
    <text x="235" y="530" fill="${colors.ink}" font-family="Arial,sans-serif" font-size="17" font-weight="700">10×</text>
    <text x="397" y="530" fill="${colors.ink}" font-family="Arial,sans-serif" font-size="17" font-weight="700">100×</text>
    <text x="574" y="530" text-anchor="end" fill="${colors.ink}" font-family="Arial,sans-serif" font-size="17" font-weight="700">1.000×</text>`;
}

export function resultCardSvg(result: PublicResult) {
  const edition = String(result.edition).padStart(3, "0");
  const score = scoreLabel(result.score);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(`Ochiometric ${score}`)}">
    <rect width="1200" height="630" rx="34" fill="${colors.paper}"/>
    <path d="M0 34A34 34 0 0 1 34 0H400V14H0Z" fill="${colors.coral}"/><rect x="400" width="400" height="14" fill="${colors.blue}"/><path d="M800 0h366a34 34 0 0 1 34 34V14H800Z" fill="${colors.yellow}"/>
    <text x="70" y="73" fill="${colors.coral}" font-family="Arial Rounded MT Bold,Arial,sans-serif" font-size="38" font-weight="900" letter-spacing="-1">Ochiometric</text>
    <line x1="70" y1="84" x2="259" y2="84" stroke="${colors.yellow}" stroke-width="8" stroke-linecap="round"/>
    <path d="M83 78v12m16-12v8m16-8v12m16-12v8m16-8v12m16-12v8m16-8v12m16-12v8m16-8v12m16-12v8m16-8v12" stroke="${colors.ink}" stroke-width="2"/>
    <text x="1130" y="69" text-anchor="end" fill="${colors.ink}" font-family="Arial,sans-serif" font-size="24" font-weight="800">NR. ${edition} · ${escapeXml(dateLabel(result.publishDate))}</text>
    <line x1="612" y1="112" x2="612" y2="557" stroke="${colors.ink}" stroke-opacity=".16"/>
    <text x="70" y="145" fill="${colors.muted}" font-family="Arial,sans-serif" font-size="17" font-weight="900" letter-spacing="3">SCOR</text>
    <text x="67" y="285" fill="${colors.ink}" font-family="Arial,sans-serif" font-size="156" font-weight="900" letter-spacing="-8">${score}</text>
    <rect x="72" y="302" width="170" height="48" rx="24" fill="${colors.coral}"/>
    <text x="157" y="334" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="20" font-weight="900" letter-spacing="2">TOP ${result.topPercent}%</text>
    <text x="70" y="385" fill="${colors.muted}" font-family="Arial,sans-serif" font-size="17" font-weight="900" letter-spacing="2">CUM S-AU DESCURCAT TOȚI</text>
    ${chartMarkup(result)}
    <text x="650" y="120" fill="${colors.muted}" font-family="Arial,sans-serif" font-size="17" font-weight="900" letter-spacing="3">ÎNTREBĂRI</text>
    ${questionMarkup(result)}
    <text x="70" y="590" fill="${colors.muted}" font-family="Arial,sans-serif" font-size="18" font-weight="700">Cât de bine estimezi? Joacă aceeași ediție.</text>
    <text x="1130" y="590" text-anchor="end" fill="${colors.ink}" font-family="Arial,sans-serif" font-size="24" font-weight="900">OCHIOMETRIC</text>
  </svg>`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await getPublicResult(await getD1Database(), (await params).id);
  if (!result) return new Response("Rezultatul nu există.", { status: 404 });
  return new Response(resultCardSvg(result), {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=86400",
      "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}
