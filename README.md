# Moestuinplanner

Een visuele moestuinplanner in het Nederlands voor één moestuin van 630 × 410 cm (kleigrond, West-Friesland) en een onverwarmde kas. Je tekent je bedden op schaal, sleept er gewassen in en plant het hele jaar door, week voor week.

## Starten

```bash
npm install
npm run dev
```

Open daarna de URL die Vite toont (standaard http://localhost:5173).

## Wat de app doet

### Tuinplan

- **Tuin op schaal**: 630 × 410 cm met een raster van 10 cm en linialen.
- **Bedden**: verslepen om te verplaatsen, aan het hoekje trekken om de maat te wijzigen, met naam en maten in het rechterpaneel. Ze klikken vast op 10 cm. Met **+ Bed toevoegen** maak je een nieuw bed.
- **Kas**: een apart vlak naast de tuin met een eigen breedte en lengte. Gewassen mogen hier ongeveer een maand eerder de grond in, en de oogst duurt standaard 4 weken langer.
- **Gewassen planten**: sleep een gewas uit de lijst naar een bed. Of klik het gewas aan en klik daarna in een bed (stoppen met Esc). Een teelt is een vlak dat je kunt verslepen en vergroten.
- **Plantafstand**: de stippen in een vlak tonen waar de planten komen. De app rekent het aantal planten uit (± N planten).
- **Afstand tot de rand**: bij een geselecteerde teelt tonen maatlijnen hoeveel cm de buitenste planten van de randen van het bed staan. In het rechterpaneel stel je de plek van het vlak in cm in.
- **Weekschuif**: laat zien wat er in een bepaalde week in de grond staat. Klik op een maand om ernaartoe te springen, of op **Vandaag**.
- **Toon andere teelten van dit jaar**: teelten die in de gekozen week niet in de grond staan, verschijnen gestippeld met naam en weken. Zo zie je welke plekken nog vrij zijn.
- **Nateelt plannen**: plan op dezelfde plek een volgend gewas dat begint zodra het vorige klaar is. Zo blijft de tuin het hele jaar in gebruik.
- **Rechterpaneel**:
  - bij een teelt: startweek, duur, grootte, gewaskalender, goede en slechte buren, adviezen
  - bij een bed: de teelten van dit jaar en de plantenfamilies van vorige jaren
  - zonder selectie: de taken voor de komende 3 weken (voorzaaien, uitplanten of zaaien, begin oogst of bloei, opruimen)
- **Sneltoetsen**: Esc deselecteert, Delete of Backspace verwijdert de selectie. De kas kun je niet verwijderen.

### Adviezen en waarschuwingen

- ⚠️ **Overlap**: twee teelten op dezelfde plek in dezelfde periode.
- ⚠️ / 💚 **Slechte en goede buren** in hetzelfde bed.
- ⚠️ **Vruchtwisseling**: dezelfde plantenfamilie op dezelfde plek binnen 3 jaar. Bloemen en de groep "overig" tellen niet mee.
- ⚠️ **Buiten het seizoen**: een gewas gaat in een maand de grond in waarin dat normaal niet kan. In de kas mag het een maand eerder.
- **Kleigrond** (instelbaar met **Grond** in de kopbalk):
  - ⚠️ waarschuwing bij zaaien of planten in de eerste 2 weken van het voorjaarsvenster (februari–mei)
  - 💡 tips voor wortel, pastinaak, knoflook, dahlia en gladiool
  - niet van toepassing in de kas

### Jaarplanning

- Per bed (en voor de kas) een tijdlijn van alle teelten in het gekozen jaar: voorzaaien (gestippeld), groei en oogst of bloei.
- Een rode lijn markeert vandaag. Teelten die over de jaargrens lopen, staan in beide jaren.
- Klik op een teelt om hem op het tuinplan te openen.

### Zaaikalender

- Per gewas per maand: binnen zaaien, buiten zaaien of poten, uitplanten, **in de kas**, en oogsten of bloei.
- Elke soort zet je aan of uit met de knoppen in de legenda.
- Filters: **Alleen gewassen in mijn plan**, en **Alleen gewassen met activiteit van … t/m …** (een vrij te kiezen periode, ook over de jaargrens).
- De maandkop blijft bovenaan staan als je scrolt.
- **PDF / printen**: maakt een printversie van de kalender met de filters die aanstaan. Kies in het printvenster *Opslaan als PDF* om hem op je telefoon te zetten.
- Op een telefoon opent de app meteen de zaaikalender, in een smalle opmaak.

### Gewassen

Ongeveer 45 gewassen, elk met plantafstand × rijafstand, plantenfamilie, zaai-, plant- en oogstmaanden, voorkweektijd, groeiduur, en goede en slechte buren:

- **Groenten**: tomaat, paprika, aardappel, courgette, komkommer, pompoen, sla, andijvie, spinazie, rode biet, snijbiet, wortel, pastinaak, knolselderij, knolvenkel, radijs, kool (boerenkool, spruitkool, broccoli, bloemkool, sluitkool, koolrabi), ui, sjalot, prei, knoflook, bonen (stamboon, stokboon, tuinboon), erwt, maïs, veldsla
- **Kruiden en fruit**: peterselie, dille, basilicum, aardbei
- **Bloemen**: goudsbloem, dahlia, zonnebloem, cosmea, zinnia, afrikaantje, Oost-Indische kers, lathyrus, gladiool. Bij bloemen staat de bloeiperiode op de plek van de oogst.

De gegevens zijn algemene richtwaarden voor het Nederlandse en Belgische klimaat. Controleer ze met het zaadzakje van je eigen ras.

## Opslag

Alles wordt lokaal in de browser bewaard (localStorage), dus alleen op dat apparaat en in die browser. Met **Exporteren** en **Importeren** in de kopbalk maak je een back-up als JSON-bestand of zet je je plan over.

## Techniek

Vite, Vue 3 en TypeScript, zonder backend.

- `src/lib/crops.ts`: gewassen en plantenfamilies
- `src/lib/store.ts`: toestand, opslag, adviezen en taken
- `src/lib/time.ts`: weken en maanden
- `src/components/`: de schermen en onderdelen
