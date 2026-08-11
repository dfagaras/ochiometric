import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const resultCardRoute = await readFile(new URL("../app/api/results/[id]/card/route.ts", import.meta.url), "utf8");
const scoreValue = await readFile(new URL("../app/score-value.tsx", import.meta.url), "utf8");

test("aplică în ordine tema roșu, albastru și galben întrebărilor", () => {
  assert.match(page, /question-\$\{q\+1\}/);
  assert.match(css, /\.app\.question-1\{--question:var\(--coral\)/);
  assert.match(css, /\.app\.question-2\{--question:var\(--flag-1\)/);
  assert.match(css, /\.app\.question-3\{--question:var\(--yellow\)/);
});

test("afișează calculul tabelar și păstrează rezultatul în tema neutră", () => {
  assert.match(page, /className="napkin-row napkin-total"/);
  assert.match(page, /formula\.split\("≈"\)/);
  assert.match(css, /\.napkin-row\{[^}]*border-bottom:1px dashed/);
  assert.match(css, /\.results\{[^}]*background:var\(--paper\)/);
  assert.match(css, /\.results::before/);
});

test("afișează prima întrebare imediat din puzzle-ul deja încărcat", () => {
  assert.match(page, /const cachedPuzzle = edition === undefined \? todayPuzzle : null/);
  assert.match(page, /setPuzzle\(cachedPuzzle\)/);
  assert.match(page, /if \(cachedPuzzle\) setView\("play"\)/);
  assert.match(page, /Promise\.all\(\[attemptRequest, puzzleRequest\]\)/);
});

test("arhiva are coloane explicite și rezultatul se distribuie ca imagine", () => {
  assert.match(page, /<span>NR\.<\/span><span>DATĂ<\/span><span>SCOR<\/span><span>STATUS<\/span>/);
  assert.match(page, /new File\(\[png\]/);
  assert.match(page, /navigator\.canShare\(imageShare\)/);
  assert.match(page, /DISTRIBUIE CA IMAGINE/);
});

test("cardul rezultatului escapează comparatorul înainte să genereze SVG-ul", () => {
  assert.match(resultCardRoute, /escapeXml\(question\.relation\)/);
  assert.doesNotMatch(resultCardRoute, />\$\{question\.relation\} /);
});

test("scorul separă semnul ori și micșorează valorile lungi", () => {
  assert.match(scoreValue, /className="score-digits"/);
  assert.match(scoreValue, /className="score-times"/);
  assert.match(scoreValue, /value\.length >= 8/);
  assert.match(css, /\.score-value \.score-digits\{[^}]*letter-spacing:-\.025em/);
  assert.match(css, /gap:clamp\(8px,\.1em,14px\)/);
  assert.match(css, /\.big-score\.score-value\.big-score-long\{font-size:80px\}/);
  assert.match(css, /\.big-score\.score-value\.big-score-xlong\{font-size:66px\}/);
});
