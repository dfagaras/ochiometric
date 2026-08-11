# Ochiometric

Ochiometric is a Romanian daily estimation game. Players answer three questions,
receive an error multiplier for each answer, compare their combined score with
other players, and share the result with friends.

The project is inspired by the estimation-game format of fermi.gg, but uses its
own Romanian branding, copy, colors, assets, and implementation.

## Current prototype

- public web app: <https://din-ochi.dragosfagaras.chatgpt.site>
- three-question daily game flow
- multiplicative error scoring where `1x` is perfect
- result distribution graph and percentile
- server-backed archive with replay and resume behavior
- anonymous public result links with generated social share cards
- protected question-management and moderation workspace at `/admin`
- installable PWA shell with an offline fallback
- privacy-preserving aggregate analytics and D1-backed abuse rate limiting
- anonymous aggregate result storage in Cloudflare D1
- D1 schema for scheduled daily puzzles and their ordered questions
- secure anonymous player identity and resumable server-side attempt records
- native Web Share API support with clipboard fallback
- mobile-first responsive interface

The current launch questions are prototype content stored in the development
seed; daily editions, play state, and archive rows are loaded from D1. See
[`HANDOFF.md`](HANDOFF.md) for product state and priorities.

## Stack

- React 19
- Next.js 16 source compiled with Vinext/Vite
- Cloudflare Worker runtime
- Cloudflare D1 and Drizzle ORM
- OpenAI Sites hosting manifest

## Development

Prerequisites:

- Node.js `>=22.13.0`
- Linux or WSL with `bash`, `flock`, `curl`, and GNU `timeout`

Install and run:

```bash
npm ci
npm run db:seed:local
npm run dev
```

`db:seed:local` applies all D1 migrations to the local Miniflare database and
loads an idempotent, public-safe development puzzle. It never targets the remote
Sites database. Production continues to receive its `DB` binding from
`.openai/hosting.json`.

## Editorial administration

`/admin` uses the hosting platform's ChatGPT authentication only for editorial
staff; anonymous players never need an account. Access additionally requires a
normalized email in the D1 `admin_users` table. Provision administrators through
the deployment control plane or a deliberate D1 command, never through a public
signup route.

The workspace creates and edits draft or scheduled editions, validates exactly
three complete questions, and enforces explicit lifecycle transitions before
publishing or archiving. Every editorial action is recorded in
`puzzle_audit_log`.

## Privacy and resilience

Product analytics increments daily event counters only; it does not store IP
addresses, player IDs, guesses, answers, or user-agent strings. Attempt and
answer endpoints use short-lived D1 counters keyed by the existing hashed
anonymous player identity. The service worker never caches API or admin
responses and uses the offline page only as a navigation fallback.

Validation:

```bash
npm run lint
npm test
```

The production build must emit `dist/server/index.js` as a Cloudflare-compatible
ES module and a valid `dist/.openai/hosting.json` manifest.

## Repository guidance

- Never commit `.env` files, credentials, tokens, build output, or local
  databases.
- Keep `.openai/hosting.json`; it links the source to the existing Sites project
  and declares the D1 binding.
- Read [`AGENTS.md`](AGENTS.md) before using a coding agent on this repository.
- Names used in prototype questions are fictional.

## Product direction

The intended production version will add server-backed daily puzzles, stable
anonymous player identity, persistent cross-device history, real percentile
data, replayable archives, generated share cards, moderation/admin tooling, and
a custom domain.
