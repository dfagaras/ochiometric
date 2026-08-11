# AGENTS.md

## Mission

Develop Ochiometric as a Romanian, mobile-first daily estimation game. Continue
from the existing implementation; do not replace it with a new scaffold.

## Required reading

Before changing code, read:

1. `README.md`
2. `HANDOFF.md`
3. `.openai/hosting.json`

## Product constraints

- Keep the product name **Ochiometric** and the user interface in Romanian.
- Preserve anonymous play; a ChatGPT or social account must not be required.
- Keep the game visually and technically distinct from fermi.gg. Do not copy
  proprietary code, assets, exact copy, or exact styling.
- Treat names in prototype questions as fictional.
- Lower scores are better and `1x` is perfect.
- Shared result pages must remain public and must not expose private identifiers.
- Do not expose correct answers to the client before an attempt is locked.

## Engineering constraints

- Preserve the Vinext/Vite/Cloudflare Worker architecture, package lock, Sites
  scripts, and `.openai/hosting.json` binding names.
- Keep Worker code ESM-compatible.
- Use D1 migrations for durable schema changes.
- Never commit secrets, `.env` files, local databases, dependencies, or build
  output.
- Make small, focused changes and retain working behavior unless the task
  explicitly requires a migration.
- Add or update tests for scoring, persistence, and public result behavior.
- Validate with `npm run lint` and `npm test` before proposing a merge.

## UX and QA expectations

- Design mobile-first and verify desktop behavior.
- Preserve keyboard operation, visible focus, semantic labels, and adequate
  contrast.
- Test invalid, empty, very small, and very large guesses.
- Test refresh/resume behavior and duplicate submissions.
- Test public result links in a signed-out browser.
- Test archive status and date boundaries using Romanian locale expectations.
