# Ochiometric question schedule

The production question calendar lives in versioned D1 migrations so that the
same content is visible to Codex, reviewable in GitHub, and reproducible in a
new environment.

## Current calendar

- Edition 1 — 2026-08-11 — private-group prototype questions
- Editions 2–11 — 2026-08-12 through 2026-08-21 — 30 sourced questions about
  Romania

The full prompts, numeric answers, explanations, source labels, and source URLs
for editions 2–11 are in `drizzle/0006_schedule_10_days.sql`. Their three-step
estimation guides are in `drizzle/0008_add_napkin_guides.sql`.

## Content rules

1. Every edition has exactly three questions.
2. Every answer is a positive number and includes an explicit unit.
3. Time-sensitive values state their reference year in the prompt.
4. Every serious question includes a concise explanation, source label, and
   source URL. Sources are revealed only after the player locks an estimate.
5. Every serious question includes a short, human-readable `napkin_math` path
   showing how a player could estimate the order of magnitude without already
   knowing the exact statistic.
6. Future editions use a unique edition number and ISO publish date. Their
   status remains `published` because the application also filters by the exact
   Bucharest calendar date.

## Adding another day

Create a new custom Drizzle migration, add one row to `puzzles`, add three rows
to `questions`, then run the local migration, lint, and test commands before
deployment. Do not edit an already-applied migration; create a new one so the
production D1 history remains deterministic.

## Database ownership

OpenAI Sites provisions and operates the production Cloudflare D1 database.
The logical binding is `DB` in `.openai/hosting.json`. The repository contains
the schema and migrations, while Sites supplies the actual hosted database and
applies new migrations during a checkpoint deployment.
