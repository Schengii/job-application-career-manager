# Job Application & Career Manager

Eine vollständige, moderne Fullstack-Web-Anwendung zur professionellen Steuerung der gesamten Jobsuche als **Fachinformatiker für
Anwendungsentwicklung** (Schwerpunkt Frontend: TypeScript, JavaScript, CSS, React, Next.js – Region
Bonn/Dortmund/Remote). Alle Daten – Unternehmen, Stellenangebote, Bewerbungen, Präferenzen,
Dokumente, Historie, generierte Anschreiben, Interview-Dossiers, Lebensläufe und Recruiter-Portfolios – werden in einer echten SQLite-Datenbank via Prisma 7 gespeichert.

---

## 🚀 Features im Überblick

### 1. 🧩 Browser-Erweiterung: Career Manager Clipper (Manifest V3)
- **1-Klick Web-Clipper für Chrome, Edge & Brave**:
  - Auf StepStone, Indeed, LinkedIn oder Firmen-Karriereseiten mit einem Klick alle relevanten Daten erfassen.
  - Automatisches Auslesen von `schema.org/JobPosting` JSON-LD Metadaten und OpenGraph-Tags.
  - Extrahiert Jobtitel, Arbeitgeber, Standort, Remote-Status und geforderten Tech-Stack direkt im DOM.
- **Integrierter 1-Klick Download in den Einstellungen (`/settings`)**:
  - Die Erweiterung kann als fertiges `.zip`-Archiv direkt aus der App heruntergeladen und entpackt im Browser geladen werden.
  - Kommuniziert 100% lokal mit der Dashboard-REST-API (`localhost:3000/api/jobs`).

---

### 2. 💬 KI-Gehaltsverhandlungs-Coach & Roleplay-Simulator (`/interview-prep`)
- **Interaktives Verhandlungs-Roleplay gegen verschiedene HR-Personas**:
  - Wähle aus realistischen Szenarien: *Einstiegsangebot unter Erwartung*, *Verhandlung mit vorliegendem Gegenangebot (BATNA)* oder *Benefits & Sachbezüge verhandeln*.
  - Trainiere gegen verschiedene Gesprächspartner: *Head of People & Culture*, *Lead Architect / Engineering Manager* oder *Geschäftsführung*.
- **Taktische Live-Analyse & Dynamische Gegenangebote**:
  - Erkennt Value Framing (Verankerung von Praxisprojekten und Tech-Skills wie React 19/TypeScript).
  - Bewertet den Einsatz von Alternativen (BATNA) und nicht-monetären Kompromissen (Home-Office, Weiterbildung, Deutschlandticket).
  - Schließt mit einer detaillierten **Taktik-Scorecard (0–100%)** ab.

---

### 3. ⏱️ Bewerbungs-Aufwand & ROI-Tracker (`/analytics` & Bewerbungsdetails)
- **Return on Time Invested (ROTI-Score)**:
  - Erfassung der investierten Zeit (Recherche, Anschreiben-Erstellung, Vorbereitung) pro Bewerbung mit Schnell-Buttons (+15m, +30m, +1h).
  - Ermittelt die Kanal-Effizienz: Welche Jobportale (LinkedIn, StepStone, Get in IT, Direktbewerbung) liefern die meisten Vorstellungsgespräche pro 10 investierten Stunden?
  - Identifiziert Zeitfresser (*Time Sinks*) und gibt konkrete Empfehlungen zur Optimierung des wöchentlichen Zeitbudgets.

---

### 4. 🖨️ High-Fidelity PDF Export Generator (`/api/export/pdf`)
- **Druckfertige DIN A4 Dokumente**:
  - Konvertiert Anschreiben (DIN 5008), Lebensläufe und Interview-Dossiers in standardisierte, druck- und PDF-fertige Dokumente.
  - CSS Paged Media `@page` Regeln für pixelgenaue Seitenumbrüche und Vektor-Qualität.

---

### 5. 🔍 Echte Live-Jobsuche & Multi-Portal Scraper (`/jobs`)
- **Bundesagentur für Arbeit & Arbeitnow API Live-Suche**:
  - Direkte Abfrage von echten Stellenangeboten in Echtzeit nach Beruf, PLZ und Suchradius mit Match-Score.
  - 1-Klick Übernahme in den Bewerbungstrichter oder als Favorit.
- **Multi-Portal URL-Scraper**:
  - Beliebige Stellenanzeigen-URL einfügen und Details automatisch parsen lassen.

---

### 6. 🎙️ Voice-First KI-Interview Simulator mit Audio Dialog (`/interview-prep`)
- **Vollwertiger Sprachdialog mit Audio TTS & STT**:
  - Der KI-Interviewer liest Fragen natürlich vor (`SpeechSynthesis`). Eigene Antworten werden über die Web Speech API in Echtzeit transkribiert.
- **Rhetorik- & Füllwort-Analyse**:
  - Erkennt Füllwörter (*"äh", "quasi", "sozusagen"*) und misst Sprechtempo (WPM).
- **Dynamische KI-Follow-ups**:
  - Hakt bei oberflächlichen Antworten gezielt technisch nach.

---

### 7. 📄 ATS-optimierter CV-Builder & JSON-Resume Standard (`/cv-designer`)
- **ATS Compatibility Scorecard (`AtsScoreCard`)**:
  - Live-Audit auf Maschinenlesbarkeit für Recruiter-Systeme (Workday, Greenhouse, Personio).
- **Layout „ATS Minimal (Einspaltig)“**:
  - DIN A4 druckoptimiert, einspaltig, frei von Tabellenstrukturen.
- **JSON-Resume Standard Import & Export (`/api/resume/json`)**:
  - 100% kompatibel zum weltweiten Open-Source-Standard `resume.json`.

---

### 8. 🌐 Digitales Recruiter-Portfolio One-Pager (`/portfolio/[token]`)
- **Schreibgeschützter Showcase für Personaler**:
  - Teilen eines ansprechend gestalteten Profil-One-Pagers per individuellem Geheimlink (60 Tage gültig).
  - Präsentiert Werdegang, Top-Projekte mit Live-Links, Tech-Stack-Badges und Kontaktdaten.
  - Mit Live-Besucherzähler (Views) auf dem Dashboard.

---

### 9. 📊 Skill-Gap Matrix & Total Compensation Calculator (`/analytics`)
- **Skill-Gap Matrix**:
  - Gleicht Markt-Nachfrage mit dem eigenen Tech-Stack ab und generiert eine priorisierte Lern-Roadmap.
- **Total Compensation & Benefit-Rechner**:
  - Berechnet Gesamtvergütung inklusive bAV, ÖPNV, Home-Office und ermittelt den **effektiven Stundenlohn** inklusive automatischem **Verhandlungs-E-Mail-Skript**.

---

### 10. 📬 E-Mail Auto-Sync & Smart IMAP Inbox (`/api/email-sync` & Einstellungen)
- **Automatischer E-Mail-Abgleich für Bewerbungsrückmeldungen**:
  - Synchronisiert eingehende E-Mails via IMAP, matched Absender mit Bewerbungen und schlägt automatisierte Statusübergänge vor.

---

### 11. 🗂️ Bewerbungs- & Unternehmens-Management
- **Dashboard mit Live-Metriken & Wochenziel-Tracker**: KPI-Kacheln, tägliche Streak 🔥 und Meilensteine.
- **Interaktive Excel-Tabelle (`/excel-view`)**: Inline-Editing im Tabellen-Grid mit Tastatur-Navigation und Batch-Speichern.
- **Stapelverarbeitung (Batch Action Bar)**: Mehrere Bewerbungen gleichzeitig selektieren, taggen, exportieren oder löschen.
- **Live-Abonnierbarer Kalender-Feed (`/api/calendar/feed.ics`)**: Automatische iCal-Kalendersynchronisation für Apple/Google/Outlook mit Video-Meeting-Links.

---

## 🛠️ Tech-Stack

| Bereich   | Technologie                                                              |
| --------- | ------------------------------------------------------------------------- |
| Frontend  | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4 |
| Backend   | Next.js Route Handler (REST-API unter `/api/*`), Zod-Validierung          |
| Datenbank | SQLite via Prisma 7 ORM (Adapter: `better-sqlite3`)                       |
| State     | SWR (clientseitiges Caching + automatische Revalidierung)                 |
| Audio     | Web Speech API (SpeechSynthesis für TTS & webkitSpeechRecognition für STT)|
| Extension | Chrome/Edge Manifest V3 (Content Script, Popup UI, Background Worker)     |
| Testing   | Vitest (153 automatisierte Unit- & API-Integrationstests, s. `vitest.global-setup.ts`) |
| CI/CD     | GitHub Actions (`.github/workflows/ci.yml`) für automatisierte Test- & Build-Pipelines |

---

## 📁 Projektstruktur

```text
├── prisma/                     # Prisma 7 SQLite Schema, Migrationen & Test-Fixtures
│   ├── schema.prisma           # Datenmodelle (Company, JobPosting, Application, Preferences)
│   └── seed.ts                 # Realistische Test- & Beispieldaten
├── public/
│   ├── extension/              # Browser-Erweiterung Manifest V3 (manifest.json, popup.html, content.js)
│   └── manifest.webmanifest    # PWA Web-App-Manifest
├── src/
│   ├── app/                    # Next.js 16 App Router
│   │   ├── (routes)/           # Analytics, Applications, Companies, CV-Designer, Jobs, Portfolio, Settings
│   │   └── api/                # REST API Endpoints mit Zod-Validierung (Export, Extension, Jobs, Portfolio, Resume)
│   ├── components/             # Modulare React 19 Komponenten
│   │   ├── analytics/          # ROI-Tracker, Skill-Gap Matrix, Total Compensation, Gehalts-Analysen
│   │   ├── applications/       # Kanban-Board, Detailformulare, Time-Tracker & Dokumenten-Panel
│   │   ├── cv/                 # ATS-Scorecard, JSON-Resume Modal & Druckvorschau
│   │   ├── interview/          # Gehaltsverhandlungs-Coach, Voice Simulator & Dossier-Druck
│   │   ├── jobs/               # Live-Jobsuche Modal, URL-Scraper Card, Job-Vergleich & Alerts
│   │   ├── settings/           # Browser-Extension Card, Portfolio-Share Manager, E-Mail Sync
│   │   └── ui/                 # Wiederverwendbare Basiskomponenten (Button, Card, Dialog, Form, Toast)
│   ├── lib/                    # Domänenlogik (salaryNegotiationEngine, roiAnalytics, pdfExport, realJobSearch, atsChecker, jsonResume)
│   ├── test/                   # Test-Helfer (DB-Reset, SQLite Test-Setup)
│   └── types/                  # TypeScript Typdefinitionen & Prisma Model-Re-Exporte
```

---

## ⚡ Schnellstart & Setup

Voraussetzung: **Node.js ≥ 20**.

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. .env aus Vorlage anlegen (DATABASE_URL="file:./dev.db")
cp .env.example .env

# 3. Datenbank anlegen & Schema migrieren
npx prisma db push

# 4. Beispieldaten laden
npx prisma db seed

# 5. Entwicklungsserver starten
npm run dev
```

Die Anwendung läuft anschließend unter **http://localhost:3000**.

---

## 🧪 Nützliche Befehle

| Befehl                    | Zweck                                                          |
| -------------------------- | ---------------------------------------------------------------- |
| `npm run dev`               | Entwicklungsserver (Turbopack) starten                            |
| `npm run build`             | Produktions-Build erstellen (inkl. TypeScript-Check)               |
| `npm run lint`               | ESLint ausführen                                                    |
| `npm run test`                | Testsuite (Vitest, 153 Tests) einmalig ausführen                    |
| `npm run test:watch`           | Testsuite im Watch-Modus ausführen                                    |
| `npm run test:db:regenerate`   | SQL-Fixture für die Test-DB neu generieren (nach Schema-Änderungen) |
| `npx prisma studio`          | Datenbank-Inhalte im Browser ansehen/bearbeiten                     |
| `npx prisma db push`         | Schema-Änderungen direkt auf SQLite anwenden                        |
| `npx prisma generate`         | Prisma-Client nach Schema-Änderung neu generieren                    |
