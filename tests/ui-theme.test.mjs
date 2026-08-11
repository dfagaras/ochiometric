import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

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
