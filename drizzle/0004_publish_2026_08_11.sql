INSERT INTO puzzles (edition, publish_date, status)
VALUES (1, '2026-08-11', 'published')
ON CONFLICT(edition) DO UPDATE SET
  publish_date = excluded.publish_date,
  status = excluded.status,
  updated_at = CURRENT_TIMESTAMP;
--> statement-breakpoint
INSERT INTO questions (puzzle_id, position, prompt, answer, unit, explanation)
SELECT id, 1, 'Câți bărbați a avut mama lui Gabriel?', 100000, 'bărbați',
  'În jocul de astăzi, răspunsul stabilit este 100.000.'
FROM puzzles WHERE edition = 1
ON CONFLICT(puzzle_id, position) DO UPDATE SET
  prompt = excluded.prompt,
  answer = excluded.answer,
  unit = excluded.unit,
  explanation = excluded.explanation,
  updated_at = CURRENT_TIMESTAMP;
--> statement-breakpoint
INSERT INTO questions (puzzle_id, position, prompt, answer, unit, explanation)
SELECT id, 2, 'Cu câți bărbați s-a mozolit Sebi?', 69, 'bărbați',
  'În jocul de astăzi, răspunsul stabilit este 69.'
FROM puzzles WHERE edition = 1
ON CONFLICT(puzzle_id, position) DO UPDATE SET
  prompt = excluded.prompt,
  answer = excluded.answer,
  unit = excluded.unit,
  explanation = excluded.explanation,
  updated_at = CURRENT_TIMESTAMP;
--> statement-breakpoint
INSERT INTO questions (puzzle_id, position, prompt, answer, unit, explanation)
SELECT id, 3, 'De câte ori i-a spus socrul lui Tudi că Transilvania nu e România?', 1000000, 'ori',
  'În jocul de astăzi, răspunsul stabilit este 1.000.000.'
FROM puzzles WHERE edition = 1
ON CONFLICT(puzzle_id, position) DO UPDATE SET
  prompt = excluded.prompt,
  answer = excluded.answer,
  unit = excluded.unit,
  explanation = excluded.explanation,
  updated_at = CURRENT_TIMESTAMP;
