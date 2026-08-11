WITH math_data(edition, position, napkin_math) AS (
  VALUES
  (2, 1, 'România are 41 de județe plus București||Rotunjește la 42 zone × aproximativ 450.000 locuitori||42 × 450.000 ≈ 18.900.000 persoane'),
  (2, 2, 'România are puțin peste 3.000 de unități administrativ-teritoriale||Presupune o medie de circa 27 km de drum public pentru fiecare||3.200 × 27 ≈ 86.400 km'),
  (2, 3, 'Pornește de la aproximativ 19 milioane de locuitori||Estimează cam 18 colete pe persoană într-un an||19.000.000 × 18 ≈ 342.000.000 colete'),

  (3, 1, 'Imaginează România ca un dreptunghi de aproximativ 600 km × 400 km||Corectează puțin pentru forma neregulată a graniței||600 × 400 ≈ 240.000 km²'),
  (3, 2, 'Aproximativ 5 milioane de hectare sunt cultivate cu cereale||O recoltă medie de 3,5 tone pe hectar este o ancoră rezonabilă||5.000.000 × 3,5 ≈ 17.500.000 tone'),
  (3, 3, 'Sunt aproximativ 19 milioane de locuitori||Mulți au SIM personal și de serviciu; estimează 1,2 cartele active pe persoană||19.000.000 × 1,2 ≈ 22.800.000 cartele'),

  (4, 1, 'Vârfurile cele mai înalte ale Carpaților trec puțin de 2,5 km||Moldoveanu este cu câteva zeci de metri peste pragul de 2.500 m||2.500 + aproximativ 45 ≈ 2.545 metri'),
  (4, 2, 'România are aproximativ 19 milioane de locuitori||Dacă media este aproape o vizită la muzeu pe locuitor pe an||19.000.000 × aproximativ 1 ≈ 19.000.000 vizite'),
  (4, 3, 'Pornește de la 19 milioane de locuitori||Estimează un consum mediu anual de aproximativ 2.650 kWh pe persoană||19.000.000 × 2.650 ≈ 50.350.000.000 kWh'),

  (5, 1, 'Pornește de la aproximativ 19 milioane de locuitori||Estimează puțin peste un vehicul la doi locuitori: circa 0,57 pe persoană||19.000.000 × 0,57 ≈ 10.830.000 vehicule'),
  (5, 2, 'Aproximativ 19 milioane de oameni locuiesc în România||Dacă 60% fac cel puțin o sosire internă, obții 11,4 milioane||Adaugă aproximativ 2,5 milioane de sosiri străine: ≈ 13,9 milioane'),
  (5, 3, 'România are aproximativ 7,5 milioane de gospodării||Presupune că 9 din 10 au o conexiune fixă sau că unele sedii compensează lipsurile||7.500.000 × 0,9 ≈ 6.750.000 conexiuni'),

  (6, 1, 'În jurul anului 2005 România avea foarte puțină autostradă||Estimează aproape 60 km noi pe an timp de circa 19 ani||19 × 60 ≈ 1.140 km'),
  (6, 2, 'Aproximativ 2,25 milioane de hectare sunt cultivate cu grâu||Folosește un randament rotund de 4,1 tone pe hectar||2.250.000 × 4,1 ≈ 9.225.000 tone'),
  (6, 3, 'România are aproximativ 19 milioane de locuitori||Presupune în medie 0,6 vizite la cinema pe persoană pe an||19.000.000 × 0,6 ≈ 11.400.000 spectatori'),

  (7, 1, 'Parcul de autoturisme are aproximativ 8,45 milioane de mașini||Dacă aproape 0,6% sunt complet electrice||8.450.000 × 0,006 ≈ 50.700 autoturisme electrice'),
  (7, 2, 'Unitățile de cazare au aproximativ 14,3 milioane de sosiri anual||O ședere medie este puțin peste două nopți, aproximativ 2,1||14.300.000 × 2,1 ≈ 30.030.000 înnoptări'),
  (7, 3, 'Puterea hidro instalată este de ordinul a 6,4 GW||Un factor anual de utilizare de aproximativ 25% este o ancoră utilă||6,4 GW × 8.760 ore × 0,25 ≈ 14 TWh'),

  (8, 1, 'Rețeaua totală are aproximativ 87.000 km||Presupune că aproape un sfert este încă pietruit sau de pământ||87.000 × 25% ≈ 21.750 km'),
  (8, 2, 'România are aproximativ 238.000 km²||Estimează că pădurile acoperă cam 27% din teritoriu||238.000 × 27% ≈ 64.260 km² = 6.426.000 hectare'),
  (8, 3, 'Există aproximativ 22,8 milioane de cartele SIM active||Dacă 6% dintre numere se mută anual la alt operator||22.800.000 × 6% ≈ 1.368.000 portări'),

  (9, 1, 'România are aproximativ 19 milioane de locuitori||Estimează un apel la 112 pentru fiecare doi locuitori într-un an||19.000.000 ÷ 2 ≈ 9.500.000 apeluri'),
  (9, 2, 'România înregistrează aproximativ 14,3 milioane de sosiri turistice||Presupune că Bucureștiul atrage circa 14% din total||14.300.000 × 14% ≈ 2.000.000 sosiri'),
  (9, 3, 'Există aproximativ 21,7 milioane de conexiuni mobile active||Dacă aproximativ 16% folosesc 5G||21.700.000 × 16% ≈ 3.472.000 conexiuni 5G'),

  (10, 1, 'Estimează în jur de 30.000 de hectare cultivate cu cartofi||Folosește o producție medie de aproximativ 32 tone pe hectar||30.000 × 32 ≈ 960.000 tone'),
  (10, 2, 'Bibliotecile au aproximativ 2,4 milioane de utilizatori activi||Dacă fiecare împrumută în medie 8 volume pe an||2.400.000 × 8 ≈ 19.200.000 volume'),
  (10, 3, 'Ia o putere fotovoltaică medie disponibilă de aproximativ 2,3 GW||Soarele produce efectiv cam 17% din timp la puterea nominală||2,3 GW × 8.760 ore × 17% ≈ 3,43 TWh'),

  (11, 1, 'România are aproximativ 6,46 milioane de hectare de pădure||Estimează o recoltare medie anuală de circa 2,9 m³ pe hectar||6.460.000 × 2,9 ≈ 18.734.000 m³'),
  (11, 2, 'Pornește de la aproximativ 19 milioane de locuitori||Estimează 0,85 plecări externe înregistrate la frontieră pe persoană pe an||19.000.000 × 0,85 ≈ 16.150.000 plecări'),
  (11, 3, 'România are aproximativ 19 milioane de locuitori||Presupune 1,14 conexiuni mobile active pe persoană||19.000.000 × 1,14 ≈ 21.660.000 conexiuni')
)
UPDATE questions
SET napkin_math = (
  SELECT m.napkin_math
  FROM math_data m
  JOIN puzzles p ON p.edition = m.edition
  WHERE p.id = questions.puzzle_id AND m.position = questions.position
)
WHERE EXISTS (
  SELECT 1
  FROM math_data m
  JOIN puzzles p ON p.edition = m.edition
  WHERE p.id = questions.puzzle_id AND m.position = questions.position
);
