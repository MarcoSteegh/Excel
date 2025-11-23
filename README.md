# CSV Analyzer - Web Interface

## 🌐 Web-gebaseerde CSV Analyzer

Deze webapplicatie maakt het mogelijk om CSV-bestanden te analyseren en vergelijken direct in je browser. Geen software installatie vereist!

## 🚀 Quick Start

### Start de applicatie

```bash
# Dubbelklik op start_analyzer.bat
# OF handmatig:
node server.js
```

De browser opent automatisch naar: `http://localhost:8000`

## 📋 Gebruiksinstructies

### Stap 1: CSV Bestanden uploaden

1. **Basis CSV**: Upload je referentie/originele CSV-bestand
2. **Nieuw CSV**: Upload het nieuwe CSV-bestand om mee te vergelijken

### Stap 2: Instellingen configureren

- **Unieke Identificatie Kolom**: Selecteer welke kolom als unieke sleutel dient (bijv. ID, Naam)
- **Tekstcodering**: Kies de juiste encoding voor je bestanden  
- **Scheidingsteken**: Selecteer het karakter dat kolommen scheidt

### Stap 3: Analyseren

- Klik op "Analyseren" om de vergelijking te starten
- Bekijk de resultaten in overzichtelijke tabellen en grafieken

### Stap 4: Exporteren

- **Excel**: Volledige rapport met meerdere tabbladen
- **CSV**: Exporteer specifieke categorieën (nieuwe/gewijzigde/verwijderde records)
- **Print**: Genereer een printbaar rapport

## 🎯 Functies

### ✅ Wat kan de CSV Analyzer

- **Drag & Drop** CSV bestanden uploaden
- **Real-time vergelijking** van datasets
- **Automatische detectie** van nieuwe, gewijzigde en verwijderde records
- **Kleurgecodeerde resultaten** voor overzichtelijkheid
- **Interactieve tabellen** met filtering en zoeken
- **Multi-formaat export** (Excel, CSV, Print)
- **Responsief design** - werkt op desktop, tablet en mobiel
- **Geen installatie vereist** - werkt in elke moderne browser

### 🔧 Ondersteunde Formaten

- **CSV bestanden** (alle scheidingstekens)
- **Verschillende encodings** (UTF-8, ISO-8859-1, Windows-1252)
- **Export naar Excel** (.xlsx)
- **Export naar CSV**

## 💡 Tips voor Optimaal Gebruik

### 📁 Bestandsvoorbereiding

- Zorg dat beide CSV-bestanden dezelfde kolomstructuur hebben
- Gebruik consistente kolomnamen
- Zorg voor een unieke identificatiekolom (ID, sleutelnummer, etc.)

### 🎨 Interface Tips

- Gebruik de **tab-navigatie** om tussen resultaatcategorieën te wisselen
- **Hover over kaarten** voor animaties en extra details
- **Klik op tabellen** voor sorteer- en filtermogelijkheden

### 📊 Analyse Tips

- **Nieuwe records**: Items die alleen in het nieuwe bestand staan
- **Gewijzigde records**: Items met andere waarden tussen de bestanden
- **Verwijderde records**: Items die alleen in het basis bestand staan
- **Ongewijzigde records**: Items die identiek zijn in beide bestanden

## 🛠 Technische Details

### Vereisten

- **Node.js** (voor lokale server)
- **Moderne browser** (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### Gebruikte Technologieën

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Styling**: Modern CSS Grid/Flexbox, Font Awesome icons
- **CSV Parsing**: Custom JavaScript parser
- **Excel Export**: SheetJS (xlsx.js)
- **Server**: Node.js (voor lokale hosting)

### Prestaties

- **Bestandsgrootte**: Tot 10MB CSV bestanden (afhankelijk van browser geheugen)
- **Records**: Getest tot 50.000+ rijen
- **Snelheid**: Real-time analyse voor de meeste bestanden

## 🔒 Privacy & Beveiliging

- **100% Client-side**: Alle data blijft in je browser
- **Geen uploads**: Bestanden verlaten nooit je computer
- **Geen tracking**: Geen analytics of tracking cookies
- **Offline capable**: Werkt zonder internetverbinding (na eerste load)

## 🚀 Voor Ontwikkelaars

### Project Structuur

```html
📁 CSV Analyzer/
├── 📄 index.html              # Hoofdpagina
├── 🎨 styles.css              # Styling
├── ⚡ script.js               # JavaScript functionaliteit
├── 🖥️ server.js              # Node.js server
├── 🚀 start_analyzer.bat     # Windows launcher
├── 📄 voorbeeld_*.csv         # Testbestanden
└── 📚 README_Web.md           # Deze documentatie
```

### Aanpassingen maken

1. **Styling wijzigen**: Bewerk `styles.css`
2. **Functionaliteit uitbreiden**: Bewerk `script.js`
3. **Layout aanpassen**: Bewerk `index.html`

### Deployment

- **Lokaal**: `node server.js` of dubbelklik `start_analyzer.bat`
- **Web hosting**: Upload alle bestanden naar webserver
- **GitHub Pages**: Perfect voor gratis hosting

## 🎉 Voorbeeldscenario

Stel je hebt wekelijks een nieuwe export van je CRM systeem:

1. **Week 1**: Upload `klanten_week1.csv` als basis
2. **Week 2**: Upload `klanten_week2.csv` als nieuw bestand
3. **Analyseer**: Zie direct welke klanten:
   - 🟢 Nieuw zijn toegevoegd
   - 🟡 Gewijzigde informatie hebben  
   - 🔴 Zijn weggevallen
4. **Exporteer**: Maak een Excel rapport voor je team
5. **Volgende week**: Gebruik `klanten_week2.csv` als nieuwe basis

## 🐛 Probleemoplossing

### "Kan bestand niet laden"

- Controleer of het een geldig CSV bestand is
- Probeer een andere tekstcodering
- Zorg dat het bestand niet groter is dan 10MB

### "Kolom niet gevonden"

- Controleer of beide CSV bestanden dezelfde kolomnamen hebben
- Let op hoofdletters en spaties in kolomnamen

### "Browser wordt traag"

- Probeer kleinere bestanden (< 5MB)
- Sluit andere browser tabs
- Herstart de browser indien nodig

### "Server start niet"

- Controleer of Node.js geïnstalleerd is: `node --version`
- Controleer of poort 8000 vrij is
- Probeer een andere poort in `server.js`

## 🌟 Starten

**Klaar om te beginnen?**

1. Dubbelklik op `start_analyzer.bat`
2. Wacht tot de browser opent
3. Sleep je CSV bestanden naar de interface
4. Analyseer en exporteer je resultaten!

---

**🎉 Veel plezier met het analyseren van je CSV bestanden!**
