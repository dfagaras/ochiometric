INSERT INTO puzzles (edition, publish_date, status)
VALUES
  (2, '2026-08-12', 'published'),
  (3, '2026-08-13', 'published'),
  (4, '2026-08-14', 'published'),
  (5, '2026-08-15', 'published'),
  (6, '2026-08-16', 'published'),
  (7, '2026-08-17', 'published'),
  (8, '2026-08-18', 'published'),
  (9, '2026-08-19', 'published'),
  (10, '2026-08-20', 'published'),
  (11, '2026-08-21', 'published')
ON CONFLICT(edition) DO UPDATE SET
  publish_date = excluded.publish_date,
  status = excluded.status,
  updated_at = CURRENT_TIMESTAMP;
--> statement-breakpoint
WITH question_data(edition, position, prompt, answer, unit, explanation, source_label, source_url) AS (
  VALUES
  (2, 1, 'Câți oameni locuiau în România în 2025?', 19036031, 'persoane', 'Eurostat indica pentru România o populație de 19.036.031 de persoane în 2025.', 'Eurostat · profilul României în UE', 'https://european-union.europa.eu/principles-countries-history/eu-countries/romania_en'),
  (2, 2, 'Câți kilometri însuma rețeaua de drumuri publice din România la sfârșitul lui 2024?', 86847, 'km', 'INS a raportat 86.847 km de drumuri publice: naționale, județene și comunale.', 'INS · infrastructura rutieră 2024, prin AGERPRES', 'https://agerpres.ro/economic/2025/04/24/lungimea-autostrazilor-a-crescut-cu-140-de-kilometri-in-2024--1442701'),
  (2, 3, 'Câte colete au fost livrate în România în 2024?', 335000000, 'colete', 'ANCOM a înregistrat 335 de milioane de colete în 2024, adică aproximativ 18 pe locuitor.', 'ANCOM · piața serviciilor poștale 2024', 'https://www.ancom.ro/despre-noi/media/comunicate-de-presa/premiera-in-sectorul-postal-din-romania-in-2024-58-traficul-de-colete-a-depasit-traficul-de-corespondenta/'),

  (3, 1, 'Ce suprafață are România?', 238398, 'km²', 'Eurostat indică o suprafață geografică de 238.398 km².', 'Eurostat · profilul României în UE', 'https://european-union.europa.eu/principles-countries-history/eu-countries/romania_en'),
  (3, 2, 'Câte tone de cereale pentru boabe a produs România în 2024?', 17866000, 'tone', 'Producția națională de cereale pentru boabe a fost de 17,866 milioane de tone în 2024.', 'INS și Ministerul Agriculturii · producția agricolă 2024', 'https://focus-agricol.ro/2025/05/06/productii-agricole-ale-romaniei-in-2024/'),
  (3, 3, 'Câte cartele SIM active existau în România la finalul lui 2024?', 22800000, 'cartele SIM', 'ANCOM a raportat 22,8 milioane de cartele SIM active la finalul anului 2024.', 'ANCOM · piața telecom 2024', 'https://www.ancom.ro/despre-noi/media/comunicate-de-presa/conectivitate-gigabit-pentru-1-din-3-conexiuni-de-internet-fix/'),

  (4, 1, 'Câți metri altitudine are Vârful Moldoveanu, cel mai înalt punct din România?', 2544, 'metri', 'Vârful Moldoveanu atinge 2.544 de metri și este cel mai înalt punct al României.', 'Agenția Europeană de Mediu · profilul biodiversității României', 'https://biodiversity.europa.eu/countries/romania'),
  (4, 2, 'Câte vizite au înregistrat muzeele și colecțiile publice din România în 2024?', 18400000, 'vizite', 'INS a raportat 18,4 milioane de vizite la muzee și colecții publice în 2024.', 'INS · activitatea culturală 2024', 'https://www.metropolatv.ro/stiri-actualitate/ins-mai-putini-vizitatori-la-muzee-si-colectii-publice-in-2024-a-scazut-si-numarul-spectatorilor-din-cinematografe/'),
  (4, 3, 'Câți kilowați-oră de electricitate a consumat România în 2024?', 50508000000, 'kWh', 'Consumul final de energie electrică a fost de 50,508 miliarde kWh în 2024.', 'INS · balanța energiei electrice 2024, prin AGERPRES', 'https://agerpres.ro/economic/2025/02/14/ins-consumul-final-de-energie-electrica-a-crescut-cu-1-8-in-romania-in-2024-importurile-s-au-majorat--1422411'),

  (5, 1, 'Câte vehicule erau înmatriculate în România la finalul lui 2024?', 10785260, 'vehicule', 'DGPCI a raportat 10.785.260 de vehicule înmatriculate la 31 decembrie 2024.', 'DGPCI · parcul auto național 2024', 'https://www.autoexpert.ro/parcul-auto-a-ajuns-la-107-milioane-de-vehicule-84-mil-sunt-autoturisme/'),
  (5, 2, 'Câte sosiri turistice au înregistrat unitățile de cazare din România în 2024?', 14263700, 'sosiri', 'Structurile de cazare au raportat 14.263.700 de sosiri turistice în 2024.', 'INS · turismul în 2024', 'https://www.mediafax.ro/economic/ins-numarul-de-turisti-din-unitatile-de-cazare-a-crescut-cu-45-in-2024-22681490'),
  (5, 3, 'Câte conexiuni de internet fix existau în România la finalul lui 2024?', 6800000, 'conexiuni', 'ANCOM a raportat 6,8 milioane de conexiuni de internet fix în 2024.', 'ANCOM · piața telecom 2024', 'https://www.ancom.ro/despre-noi/media/comunicate-de-presa/conectivitate-gigabit-pentru-1-din-3-conexiuni-de-internet-fix/'),

  (6, 1, 'Câți kilometri de autostradă avea România la sfârșitul lui 2024?', 1137, 'km', 'La finalul lui 2024, INS a raportat 1.137 km de autostradă.', 'INS · infrastructura rutieră 2024, prin AGERPRES', 'https://agerpres.ro/economic/2025/04/24/lungimea-autostrazilor-a-crescut-cu-140-de-kilometri-in-2024--1442701'),
  (6, 2, 'Câte tone de grâu a produs România în 2024?', 9290000, 'tone', 'Producția de grâu a României a fost de 9,29 milioane de tone în 2024.', 'INS și Ministerul Agriculturii · producția agricolă 2024', 'https://focus-agricol.ro/2025/05/06/productii-agricole-ale-romaniei-in-2024/'),
  (6, 3, 'Câte bilete au cumpărat spectatorii la cinematografele din România în 2024?', 11200000, 'spectatori', 'Filmele distribuite în cinematografele din România au atras 11,2 milioane de spectatori în 2024.', 'INS · activitatea culturală 2024', 'https://www.metropolatv.ro/stiri-actualitate/ins-mai-putini-vizitatori-la-muzee-si-colectii-publice-in-2024-a-scazut-si-numarul-spectatorilor-din-cinematografe/'),

  (7, 1, 'Câte autoturisme complet electrice erau înmatriculate în România la finalul lui 2024?', 49594, 'autoturisme', 'Parcul național cuprindea 49.594 de autoturisme complet electrice la finalul lui 2024.', 'DGPCI · parcul auto național 2024', 'https://www.autoexpert.ro/parcul-auto-a-ajuns-la-107-milioane-de-vehicule-84-mil-sunt-autoturisme/'),
  (7, 2, 'Câte nopți au petrecut turiștii în unitățile de cazare din România în 2024?', 30191200, 'înnoptări', 'Unitățile de cazare au raportat 30.191.200 de înnoptări în 2024.', 'INS · turismul în 2024', 'https://www.mediafax.ro/economic/ins-numarul-de-turisti-din-unitatile-de-cazare-a-crescut-cu-45-in-2024-22681490'),
  (7, 3, 'Câți kilowați-oră au produs hidrocentralele din România în 2024?', 14313000000, 'kWh', 'Producția hidrocentralelor a fost de 14,313 miliarde kWh în 2024.', 'INS · balanța energiei electrice 2024, prin AGERPRES', 'https://agerpres.ro/economic/2025/02/14/ins-consumul-final-de-energie-electrica-a-crescut-cu-1-8-in-romania-in-2024-importurile-s-au-majorat--1422411'),

  (8, 1, 'Câți kilometri de drumuri pietruite sau de pământ avea România la sfârșitul lui 2024?', 21532, 'km', 'INS a raportat 21.532 km de drumuri pietruite și de pământ la finalul lui 2024.', 'INS · infrastructura rutieră 2024, prin AGERPRES', 'https://agerpres.ro/economic/2025/04/24/lungimea-autostrazilor-a-crescut-cu-140-de-kilometri-in-2024--1442701'),
  (8, 2, 'Câte hectare de pădure avea România la finalul lui 2024?', 6460000, 'hectare', 'Suprafața efectiv acoperită cu păduri era de aproximativ 6,46 milioane de hectare.', 'INS · fondul forestier 2024', 'https://www.news.ro/economic/ins-suprafata-padurilor-din-romania-a-crescut-in-2024-cu-2-271-ha-fata-de-anul-precedent-la-6-46-milioane-hectare-1922400230182025051122050780'),
  (8, 3, 'Câte numere de telefon au fost portate între operatori în România în 2024?', 1360111, 'numere', 'ANCOM a înregistrat 1.360.111 numere de telefon portate în 2024.', 'ANCOM · portabilitatea numerelor în 2024', 'https://www.ancom.ro/despre-noi/media/comunicate-de-presa/peste-1-3-milioane-de-numere-portate-intre-operatorii-de-comunicatii-electronice-in-2024/'),

  (9, 1, 'Câte apeluri a primit serviciul 112 din România în 2024?', 9763443, 'apeluri', 'Operatorii 112 au preluat 9.763.443 de apeluri în 2024.', 'STS · activitatea serviciului 112 în 2024', 'https://www.radioromania.ro/Actualitate/numarul-apelurilor-la-112-in-scadere-in-2024-id47962.html'),
  (9, 2, 'Câte sosiri turistice au fost înregistrate în București în 2024?', 1998700, 'sosiri', 'Bucureștiul a înregistrat 1.998.700 de sosiri în structurile de cazare în 2024.', 'INS · turismul în 2024', 'https://www.mediafax.ro/economic/ins-numarul-de-turisti-din-unitatile-de-cazare-a-crescut-cu-45-in-2024-22681490'),
  (9, 3, 'Câte conexiuni 5G active existau în România la finalul lui 2024?', 3500000, 'conexiuni', 'Numărul conexiunilor 5G a ajuns la aproximativ 3,5 milioane la finalul anului 2024.', 'ANCOM · piața telecom 2024', 'https://www.ancom.ro/despre-noi/media/comunicate-de-presa/conectivitate-gigabit-pentru-1-din-3-conexiuni-de-internet-fix/'),

  (10, 1, 'Câte tone de cartofi a produs România în 2024?', 968000, 'tone', 'Producția de cartofi a României a fost de 968.000 de tone în 2024.', 'INS și Ministerul Agriculturii · producția agricolă 2024', 'https://focus-agricol.ro/2025/05/06/productii-agricole-ale-romaniei-in-2024/'),
  (10, 2, 'Câte volume au împrumutat bibliotecile din România în 2024?', 19000000, 'volume', 'Bibliotecile au eliberat 19 milioane de volume către utilizatori în 2024.', 'INS · activitatea culturală 2024', 'https://www.metropolatv.ro/stiri-actualitate/ins-mai-putini-vizitatori-la-muzee-si-colectii-publice-in-2024-a-scazut-si-numarul-spectatorilor-din-cinematografe/'),
  (10, 3, 'Câți kilowați-oră au produs instalațiile fotovoltaice din România în 2024?', 3408000000, 'kWh', 'Instalațiile fotovoltaice au produs 3,408 miliarde kWh în 2024.', 'INS · balanța energiei electrice 2024, prin AGERPRES', 'https://agerpres.ro/economic/2025/02/14/ins-consumul-final-de-energie-electrica-a-crescut-cu-1-8-in-romania-in-2024-importurile-s-au-majorat--1422411'),

  (11, 1, 'Câți metri cubi de lemn au fost recoltați din pădurile României în 2024?', 18640000, 'm³', 'Volumul de masă lemnoasă recoltată a fost de 18,64 milioane m³ în 2024.', 'INS · fondul forestier 2024', 'https://www.digi24.ro/digieconomic/macro/ins-suprafata-padurilor-din-romania-a-crescut-in-2024-dar-regenerarea-forestiera-este-in-scadere-56097'),
  (11, 2, 'Câte plecări ale românilor în străinătate au fost înregistrate la frontieră în 2024?', 16059500, 'plecări', 'Punctele de frontieră au înregistrat 16.059.500 de plecări ale vizitatorilor români în 2024.', 'INS · turismul în 2024', 'https://www.mediafax.ro/economic/ins-numarul-de-turisti-din-unitatile-de-cazare-a-crescut-cu-45-in-2024-22681490'),
  (11, 3, 'Câte conexiuni active de internet mobil existau în România la finalul lui 2024?', 21700000, 'conexiuni', 'ANCOM a raportat 21,7 milioane de conexiuni active de internet mobil la finalul lui 2024.', 'ANCOM · piața telecom 2024', 'https://www.ancom.ro/despre-noi/media/comunicate-de-presa/conectivitate-gigabit-pentru-1-din-3-conexiuni-de-internet-fix/')
)
INSERT INTO questions (puzzle_id, position, prompt, answer, unit, explanation, source_label, source_url)
SELECT p.id, q.position, q.prompt, q.answer, q.unit, q.explanation, q.source_label, q.source_url
FROM question_data q
JOIN puzzles p ON p.edition = q.edition
WHERE true
ON CONFLICT(puzzle_id, position) DO UPDATE SET
  prompt = excluded.prompt,
  answer = excluded.answer,
  unit = excluded.unit,
  explanation = excluded.explanation,
  source_label = excluded.source_label,
  source_url = excluded.source_url,
  updated_at = CURRENT_TIMESTAMP;
