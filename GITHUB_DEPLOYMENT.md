# 🚀 GitHub Pages Deployment Guide

## Stap 1: Maak een GitHub account (indien nog niet)

1. Ga naar [github.com](https://github.com)
2. Klik op "Sign up"
3. Volg de stappen om een gratis account aan te maken

## Stap 2: Maak een nieuwe repository

1. Log in op GitHub
2. Klik rechtsboven op het "+" icoon
3. Selecteer "New repository"
4. Vul in:
   - **Repository name**: `csv-analyzer` (of een andere naam)
   - **Description**: `CSV Analyzer - Track en analyseer CSV bestanden`
   - ✅ Zet op **Public** (voor gratis GitHub Pages)
   - ✅ NIET "Initialize with README" aanvinken
5. Klik op "Create repository"

## Stap 3: Upload je bestanden naar GitHub

### Optie A: Via GitHub website (makkelijkst)

1. In je nieuwe repository, klik op "uploading an existing file"
2. Sleep deze bestanden naar het upload vak:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `README.md`
3. Scroll naar beneden en klik "Commit changes"

### Optie B: Via Git command line (voor gevorderden)

Open PowerShell in de `C:\Users\Marco\Desktop\Excel` map en voer uit:

```powershell
# Initialiseer git (alleen eerste keer)
git init

# Voeg alle bestanden toe
git add index.html styles.css script.js README.md

# Maak eerste commit
git commit -m "Initial commit - CSV Analyzer"

# Koppel aan GitHub (vervang JOUW_USERNAME en REPOSITORY_NAME)
git remote add origin https://github.com/JOUW_USERNAME/REPOSITORY_NAME.git

# Push naar GitHub
git branch -M main
git push -u origin main
```

## Stap 4: Activeer GitHub Pages

1. Ga naar je repository op GitHub
2. Klik op "Settings" (tandwiel icoon)
3. Klik in het linker menu op "Pages"
4. Bij "Source" selecteer:
   - **Branch**: `main`
   - **Folder**: `/ (root)`
5. Klik op "Save"
6. ✅ GitHub toont nu je URL: `https://jouw-username.github.io/csv-analyzer`

⏱️ **Wacht 2-5 minuten** - GitHub moet de site eerst bouwen

## Stap 5: Test je online app

1. Open je browser
2. Ga naar: `https://jouw-username.github.io/csv-analyzer`
3. ✅ Je app is nu online beschikbaar!

---

## 🔄 Updates maken

Als je iets wilt aanpassen:

### Via GitHub website:

1. Ga naar je repository
2. Klik op het bestand dat je wilt wijzigen
3. Klik op het potlood icoon (Edit)
4. Maak je wijzigingen
5. Scroll naar beneden en klik "Commit changes"
6. Wacht 1-2 minuten → je site is bijgewerkt!

### Via Git:

```powershell
# Maak wijzigingen in je lokale bestanden
# Voeg wijzigingen toe
git add .

# Commit met beschrijving
git commit -m "Beschrijving van wijziging"

# Push naar GitHub
git push
```

---

## 📋 Belangrijke opmerkingen

✅ **Werkt overal**: Je app werkt nu op elke computer met internet
✅ **Geen server nodig**: Alles draait in de browser
✅ **Privacy**: CSV bestanden blijven lokaal, worden NIET naar GitHub gestuurd
✅ **Gratis**: GitHub Pages is 100% gratis voor publieke repositories
✅ **Snel**: Updates zijn binnen enkele minuten live

---

## 🔗 Alternatieve hosting opties

Als GitHub Pages niet werkt, kun je ook gebruiken:

### 1. **Netlify** (netlify.com)

- Sleep je bestanden naar de Netlify Drop zone
- Krijg instant een URL
- Super simpel, geen account nodig voor test

### 2. **Vercel** (vercel.com)

- Importeer je GitHub repository
- Automatische deployments bij elke update

### 3. **Cloudflare Pages** (pages.cloudflare.com)

- Gratis en zeer snel
- Goede integratie met GitHub

---

## ❓ Hulp nodig?

**Bestand niet toegevoegd aan Git?**

```powershell
git add bestandsnaam.ext
git commit -m "Bestand toegevoegd"
git push
```

**Wachtwoord vragen tijdens push?**

- Gebruik een Personal Access Token in plaats van wachtwoord
- Ga naar GitHub → Settings → Developer settings → Personal access tokens
- Maak een nieuwe token met `repo` permissions

**Site niet bereikbaar?**

- Controleer of GitHub Pages is geactiveerd in Settings → Pages
- Wacht 5 minuten na eerste deployment
- Check of de URL correct is (inclusief repository naam)

---

## 📱 Delen met anderen

Je kunt je app nu delen door simpelweg de URL te sturen:

```
https://jouw-username.github.io/csv-analyzer
```

Iedereen met deze link kan de app gebruiken zonder enige installatie! 🎉
