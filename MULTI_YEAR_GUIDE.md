# Multi-Year CSV Management System

## Overzicht

De CSV Analyzer ondersteunt nu het beheren van meerdere jaarbestanden (2020-2024). Je kunt historische gegevens van voorgaande jaren uploaden en deze samenvoegen met het huidige Aangiftes.csv bestand.

## Belangrijke Functies

### 1. Jaarbestanden uploaden

- **Locatie**: Nieuwe sectie "Jaarbestanden" bovenaan de pagina
- **Upload per jaar**: Aparte upload boxen voor elk jaar (2020-2024)
- **Eenmalig uploaden**: Bestanden worden opgeslagen in je browser en hoeven maar één keer geüpload te worden
- **Status indicatie**: Elk jaar toont of het bestand geladen is (❌ of ✅)

### 2. Kolom selectie

Bij het uploaden van een jaarbestand wordt automatisch een dialoog geopend waarin je kunt kiezen:

- **Welke kolommen** uit het jaarbestand je wilt bewaren
- **Voorbeeld**: Je kunt kiezen om alleen "Status" en "Notities" uit 2023 te bewaren
- **Flexibiliteit**: Verschillende kolommen voor verschillende jaren

### 3. Data merge

Het systeem voegt automatisch data samen op basis van:

- **Klantnummer**: Unieke identifier voor elke klant
- **Jaar**: Het specifieke jaar van de aangifte
- **Intelligente merge**: Alleen geselecteerde kolommen worden toegevoegd

### 4. Jaar selectie

Na het uploaden van jaarbestanden kun je:

- **Filter op jaar**: Bekijk alleen data van een specifiek jaar
- **Alle jaren**: Of bekijk alle jaren tegelijk
- **Filter op actie**: Toon alleen rijen waar actie nodig is

### 5. Statistieken

Het systeem toont automatisch:

- **Aantal geladen jaren**: Hoeveel jaarbestanden zijn er actief
- **Voortgang per jaar**: Percentage voltooid per jaar
- **Overzicht**: Snelle insights in je werkvoorraad

## Hoe te gebruiken

### Stap 1: Jaarbestanden uploaden

1. Klik op de upload box voor het gewenste jaar
2. Selecteer het CSV-bestand voor dat jaar
3. Kies in het dialoogvenster welke kolommen je wilt bewaren
4. Klik op "Kolommen opslaan"
5. Het bestand wordt opgeslagen in je browser

### Stap 2: Aangiftes.csv uploaden

1. Upload het huidige Aangiftes.csv bestand zoals gewoonlijk
2. Het systeem voegt automatisch de geselecteerde kolommen uit de jaarbestanden toe
3. De data wordt samengevoegd op basis van Klantnummer + Jaar

### Stap 3: Werken met de data

1. Gebruik de jaar selector om te filteren
2. Voeg tracking kolommen toe (werkt per jaar)
3. Gebruik de zoekfunctie om specifieke klanten te vinden
4. Exporteer naar Excel of PDF met jaarinformatie

### Stap 4: Data beheren

- **Verwijderen**: Klik op "Verwijderen" bij een jaar om het te verwijderen
- **Updaten**: Upload opnieuw om een jaarbestand te vervangen
- **Browser storage**: Alle data wordt lokaal opgeslagen

## Data structuur

### Jaarbestand formaat

Elk jaarbestand moet minimaal deze kolommen bevatten:

```
Klantnummer,Jaar,<andere kolommen>
12345,2023,<data>
67890,2023,<data>
```

### Merge logica

1. **Match**: Systeem zoekt naar overeenkomende `Klantnummer` + `Jaar`
2. **Toevoegen**: Geselecteerde kolommen worden toegevoegd aan de rij
3. **Geen match**: Rij blijft ongewijzigd

## Browser Storage

### Opslag locatie

- **localStorage**: Alle jaarbestanden worden opgeslagen in je browser
- **Persistent**: Data blijft behouden tussen sessies
- **Lokaal**: Geen data wordt naar servers gestuurd

### Opslag limiet

- **Typisch**: 5-10 MB per domein
- **Voldoende**: Voor meerdere jaren CSV data
- **Monitoring**: Systeem waarschuwt bij vol zijn

### Data wissen

- **Per jaar**: Klik op "Verwijderen" bij specifiek jaar
- **Alles**: Clear browser data (let op: dit wist ook tracking!)

## Modules Architectuur

### csv-parser.js (140 regels)

- CSV bestanden lezen en parsen
- Automatische delimiter detectie
- Data validatie

### storage-manager.js (110 regels)

- localStorage operaties
- Data persistentie
- Browser storage beheer

### year-manager.js (230 regels)

- Multi-year bestandsbeheer
- Data merge logica
- Jaar validatie

### year-ui.js (270 regels)

- UI interacties voor jaar upload
- Kolom selectie dialoog
- Status updates

### main.js (2200 regels)

- Hoofd applicatie logica
- CSV analyse
- Tracking systeem
- Export functies

### init.js (40 regels)

- Applicatie initialisatie
- Module integratie
- Startup logica

## Veelgestelde vragen

### Q: Moet ik elk jaar opnieuw uploaden?

**A**: Nee, jaarbestanden worden opgeslagen in je browser en hoeven maar één keer geüpload te worden.

### Q: Kan ik verschillende kolommen per jaar kiezen?

**A**: Ja, bij elke upload kun je specifieke kolommen kiezen.

### Q: Wat gebeurt er als ik een jaar opnieuw upload?

**A**: Het oude bestand wordt vervangen door het nieuwe.

### Q: Werkt tracking per jaar?

**A**: Ja, tracking data wordt opgeslagen per klantnummer + jaar combinatie.

### Q: Kan ik meerdere browsers gebruiken?

**A**: Ja, maar elke browser heeft zijn eigen lokale storage. Data wordt niet gesynchroniseerd.

### Q: Hoe weet ik welke jaren geladen zijn?

**A**: De status indicator bij elk jaar toont een ✅ als het geladen is.

### Q: Kan ik jaren verwijderen?

**A**: Ja, klik op de "Verwijderen" knop bij het specifieke jaar.

### Q: Wordt mijn tracking data behouden?

**A**: Ja, tracking data wordt apart opgeslagen en blijft behouden.

## Technische Details

### Data Flow

```
1. Upload jaarbestand → YearManager.uploadYearFile()
2. Kies kolommen → YearUI.showColumnSelectionDialog()
3. Opslaan → StorageManager.save()
4. Upload Aangiftes.csv → CSVAnalyzer.parseFile()
5. Merge data → YearManager.mergeWithAangiftes()
6. Toon data → CSVAnalyzer.displayData()
```

### Kolom naming

Kolommen uit jaarbestanden krijgen een prefix:

```
Origineel: "Status"
In tabel: "Status (2023)"
```

Dit voorkomt naam conflicten.

### Performance

- **Lazy loading**: Alleen geselecteerde jaren worden gemerged
- **Caching**: Data wordt gecached in memory
- **Efficient**: Grote bestanden (10,000+ rijen) worden snel verwerkt

## Troubleshooting

### Jaarbestand wordt niet geladen

1. **Controleer formaat**: Moet CSV zijn met Klantnummer en Jaar kolommen
2. **Check browser console**: Open Developer Tools (F12) voor error messages
3. **Probeer opnieuw**: Klik op "Verwijderen" en upload opnieuw

### Data wordt niet samengevoegd

1. **Klantnummer match**: Controleer of Klantnummer exact overeenkomt
2. **Jaar match**: Controleer of het Jaar klopt
3. **Kolom selectie**: Zorg dat je kolommen hebt geselecteerd

### Browser storage vol

1. **Verwijder oude jaren**: Verwijder jaren die je niet meer nodig hebt
2. **Export data**: Exporteer belangrijke data eerst
3. **Clear storage**: Wis browser data (let op: verlies van data!)

### Performance problemen

1. **Te veel jaren**: Laad alleen de jaren die je nodig hebt
2. **Grote bestanden**: Overweeg bestanden te splitsen
3. **Browser update**: Update naar laatste browser versie

## Roadmap

### Geplande features

- ✅ Multi-year upload systeem
- ✅ Kolom selectie per jaar
- ✅ Data merge logica
- ✅ Jaar selector UI
- 🔄 Dashboard met multi-year statistieken
- 🔄 Export met jaar informatie
- 🔄 Geavanceerde filter opties
- 🔄 Data sync tussen browsers
- 🔄 Import/export van configuratie

### In ontwikkeling

- Multi-year completion dashboard
- Year-over-year vergelijking
- Bulk year operations
- Advanced search filters

## Support

Voor vragen of problemen:

1. **Check deze documentatie** eerst
2. **Browser console**: Kijk naar error messages (F12)
3. **GitHub Issues**: Rapporteer bugs op GitHub
4. **Contact**: Neem contact op met Marco Steegh

---

**Versie**: 2.0  
**Laatste update**: 2025  
**Auteur**: Marco Steegh
