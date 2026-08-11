WITH math_data(position, napkin_math) AS (
  VALUES
  (1, 'Aceasta este o întrebare fictivă, cu răspuns stabilit de autor||Pornește de la 100 și folosește un factor rotund de 1.000||100 × 1.000 ≈ 100.000 bărbați'),
  (2, 'Aceasta este o întrebare fictivă, cu răspuns stabilit de autor||Pornește de la un număr par ales pentru joc și împarte-l la doi||138 ÷ 2 ≈ 69 bărbați'),
  (3, 'Aceasta este o întrebare fictivă, cu răspuns stabilit de autor||Folosește două ordine de mărime identice, ușor de înmulțit||1.000 × 1.000 ≈ 1.000.000 ori')
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
