-- Development-only, idempotent content. Run through `npm run db:seed:local`.
INSERT INTO puzzles (edition, publish_date, status)
VALUES (1, '2026-08-11', 'published')
ON CONFLICT(edition) DO UPDATE SET
  publish_date = excluded.publish_date,
  status = excluded.status,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO questions (puzzle_id, position, prompt, answer, unit, explanation)
SELECT id, 1, 'Câte minute are o săptămână?', 10080, 'minute',
  'O săptămână are 7 × 24 × 60 de minute.'
FROM puzzles WHERE edition = 1
ON CONFLICT(puzzle_id, position) DO UPDATE SET
  prompt = excluded.prompt,
  answer = excluded.answer,
  unit = excluded.unit,
  explanation = excluded.explanation,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO questions (puzzle_id, position, prompt, answer, unit, explanation)
SELECT id, 2, 'Câți kilometri măsoară aproximativ circumferința Pământului la Ecuator?', 40075, 'km',
  'Circumferința ecuatorială a Pământului este de aproximativ 40.075 km.'
FROM puzzles WHERE edition = 1
ON CONFLICT(puzzle_id, position) DO UPDATE SET
  prompt = excluded.prompt,
  answer = excluded.answer,
  unit = excluded.unit,
  explanation = excluded.explanation,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO questions (puzzle_id, position, prompt, answer, unit, explanation)
SELECT id, 3, 'Câte taste are un pian standard?', 88, 'taste',
  'Un pian standard are 52 de taste albe și 36 de taste negre.'
FROM puzzles WHERE edition = 1
ON CONFLICT(puzzle_id, position) DO UPDATE SET
  prompt = excluded.prompt,
  answer = excluded.answer,
  unit = excluded.unit,
  explanation = excluded.explanation,
  updated_at = CURRENT_TIMESTAMP;
