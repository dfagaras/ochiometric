WITH math_data(position, napkin_math) AS (
  VALUES
  (1, 'Aceasta este o întrebare fictivă, cu răspuns stabilit de autor||Pornește de la 100 și înmulțește de trei ori cu 10||100 × 10 × 10 × 10 = 100.000'),
  (2, 'Aceasta este o întrebare fictivă, cu răspuns stabilit de autor||Folosește numărul-memă ales pentru ediția de azi||Răspunsul jocului este 69'),
  (3, 'Aceasta este o întrebare fictivă, cu răspuns stabilit de autor||Pornește de la 1.000 și înmulțește încă o dată cu 1.000||1.000 × 1.000 = 1.000.000')
)
UPDATE questions
SET napkin_math = (
  SELECT m.napkin_math
  FROM math_data m
  JOIN puzzles p ON p.edition = 1
  WHERE p.id = questions.puzzle_id AND m.position = questions.position
)
WHERE EXISTS (
  SELECT 1
  FROM math_data m
  JOIN puzzles p ON p.edition = 1
  WHERE p.id = questions.puzzle_id AND m.position = questions.position
);
