# Ochiometric handoff

Last updated: 2026-08-11

## Product goal

Build a polished Romanian daily estimation game that captures the satisfying
game loop of fermi.gg without copying its source, proprietary assets, exact
branding, or exact visual identity.

The player receives three questions whose exact answers are difficult to know.
They estimate each answer, see the correct value and an explanation, then
receive a combined multiplier. A perfect score is `1x`; lower is better.

## Decisions already made

- Product name: **Ochiometric**.
- Product language: Romanian.
- Delivery: mobile-first browser application, with PWA support planned.
- A ChatGPT account must not be required to play.
- Initial identity should be anonymous and persistent.
- Result links must be public so friends can see a shared result and then play.
- Repository: `dfagaras/ochiometric`.
- Source repository is intentionally public.
- Existing public prototype:
  <https://din-ochi.dragosfagaras.chatgpt.site>
- A custom domain will be selected after the product is tested.
- The current typography direction is liked; future colors should remain
  distinctive from the reference product.
- Names in the current prototype questions are fictional.

## What is implemented

- Landing page and explanation of the game loop.
- Three-question play flow.
- Numeric answer validation.
- Per-question multiplicative error factor:
  `max(guess / answer, answer / guess)`.
- Combined daily score as the arithmetic mean of the three factors.
- Result screen with percentile label and distribution histogram.
- Share text using the Web Share API with clipboard fallback.
- Archive screen with summary cards and a seven-day prototype list.
- Device-local completed-game history in `localStorage`.
- Anonymous aggregate score submission to `/api/results`.
- Cloudflare D1 `results` table and Drizzle schema/migration.
- Cloudflare D1 `puzzles` and `questions` tables for editions, publication
  dates, lifecycle status, ordered prompts, answers, units, and explanations.
- Local D1 migration and idempotent development-seed commands, plus a
  server-only repository for selecting the published puzzle by date.
- Durable anonymous identity in a secure, HTTP-only cookie and one resumable
  server-side attempt record per player and published puzzle.
- Responsive layout for mobile and desktop.
- Public OpenAI Sites deployment.

## Prototype limitations

- The play flow still reads its edition, date, questions, answers, explanations,
  and archive rows from hardcoded prototype content instead of the new D1 model.
- Local history uses the legacy key `din-ochi-history`.
- Replaying or opening previous puzzles is not implemented.
- Shareable result URLs and server-rendered share cards are not implemented.
- There is no question-management or moderation workflow.
- There is no abuse or rate-limit protection yet.
- Accessibility and browser coverage need a dedicated QA pass.
- The current questions are private-group prototype jokes and should be replaced
  with broader launch content before public promotion.

## Recommended implementation order

1. **Completed:** Model daily puzzles and questions in D1, including publish
   date, edition, answer, unit, explanation, and status.
2. **Completed:** Add a durable anonymous player ID stored in a secure cookie
   and persist attempts server-side while keeping account creation optional.
3. **Completed:** Make scoring authoritative on the server so answers are not
   exposed before a guess and duplicate result submissions are prevented.
4. **Completed:** Replace seeded graph data with real daily score distribution
   and percentile calculations.
5. Implement archive routes and replay behavior for published puzzles.
6. Add stable public result routes and generated social share cards.
7. Add a protected question-management workflow with validation and moderation.
8. Add PWA metadata, offline shell behavior, analytics, rate limiting, automated
   tests, and a full accessibility/responsive QA pass.
9. Connect the selected custom domain after acceptance testing.

## Definition of done for the first public beta

- A new puzzle can be scheduled without editing application source.
- Each anonymous player can submit one completed attempt per puzzle.
- History survives browser restarts and is recoverable from the backend.
- Score, percentile, and histogram are based on real accepted attempts.
- A friend can open a public shared result without ChatGPT, see the result, and
  start the same puzzle.
- Archive lists all published puzzles with correct completion status.
- Mobile Safari and Chrome complete the full flow without layout or input bugs.
- No secrets, answers, or private player information are exposed in the client.

## How to resume in Codex Cloud

Select this repository and start with:

> Read `README.md`, `HANDOFF.md`, and `AGENTS.md`. Inspect the existing code and
> run the current validation commands. Report what is implemented and what is
> mocked, then continue with the first incomplete priority from `HANDOFF.md`.
> Preserve working behavior and make small, reviewable commits.
