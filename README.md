# Job Application & Career Manager

Eine vollständige, moderne Web-Anwendung zur zentralen Verwaltung der Jobsuche als **Fachinformatiker für
Anwendungsentwicklung** (Schwerpunkt Frontend: TypeScript, JavaScript, CSS, React, Next.js – Region
Bonn/Dortmund/Remote). Alle Daten – Unternehmen, Stellenangebote, Bewerbungen, Präferenzen,
Dokumente, Historie, generierte Anschreiben und Lebensläufe – werden in einer echten Datenbank gespeichert, sodass nichts
verloren geht.

---

## 🚀 Features im Überblick

### 1. Bewerbungs- & Unternehmens-Management
- **Dashboard mit Live-Metriken**: Gesamtanzahl, Offene Bewerbungen, Gespräche, Absagen und Zusagen auf einen Blick.
- **Interaktive Excel-Tabelle (`/excel-view`)**: Tabellarischer Grid-Editor wie in Excel/Google Sheets mit direktem **Inline-Editing**, Tastatur-Navigation (Tab/Enter), schneller Erfassung neuer Zeilen und automatischem Batch-Speichern (`/api/applications/bulk`).
- **3 Ansichtsmodi in der Bewerbungsliste**: Flexibler Wechsel zwischen **Tabelle**, nativem **Kanban-Board** (Drag & Drop) und **Excel-Grid**.
- **E-Mail-Rückmeldungs-Assistent**: Arbeitgeber-E-Mails (Absagen, Einladungen, Eingangsbestätigungen, Angebote) per Copy & Paste analysieren und mit einem Klick Status, Termine und Notizen aktualisieren.
- **Smarte Wiedervorlage & Nachfass-Engine**: Hebt überfällige Schritte sowie Bewerbungen ohne Rückmeldung (> 14 Tage) auf dem Dashboard und in der Liste hervor.
- **Detailansicht**: Vollständige Kontaktdaten, lückenlose Status-Historie, Notizen und verknüpfte Unterlagen.
- **Termin- & Kalender-Export (.ics / iCal)**: Exportiert anstehende Vorstellungsgespräche und Termine mit einem Klick in Google Kalender, Outlook oder Apple Calendar.
- **Unternehmensverwaltung**: Vollständiges CRUD (Adresse, Ansprechpartner, Telefon, E-Mail, Notizen und Status).

### 2. Lebenslauf-Generator & CV-Designer (`/cv-designer`)
- **Strukturierter CV-Generator**: Erzeugt druckoptimierte Lebensläufe direkt aus hinterlegten Profil-, Ausbildungs- und Projektdaten.
- **3 Design-Layouts**:
  - **Modern** (Akzentfarbe Indigo, ideal für Frontend & Web)
  - **Klassisch** (Dezente Schiefer-Töne für Behörden & Konzerne)
  - **Kompakt** (Platzsparend für 1–2 Seiten)
- **Selektive Stationsauswahl & PDF-Druck**: Einzelne Ausbildungsstationen und Referenzprojekte flexibel an- oder abwählen; Live-Druckansicht (`window.print()` / PDF-Export).

### 3. Anschreiben-Engine 2.0 & Kommunikation
- **Multi-Tone Anschreiben-Generator**:
  - **Modern** (standard, lösungs- und praxisorientiert)
  - **Klassisch** (formell für Behörden, Banken & Großkonzerne)
  - **Startup / Agil** (dynamisch, teamorientiert, direkte Ansprache)
  - **Detailliert** (starker Fokus auf Umschulung, Handwerk & technischen Tiefgang)
- **Projekt-Hervorhebung**: Gezielte Auswahl, welches Referenzprojekt (z. B. *electroCheck-ai*) im Anschreiben in den Mittelpunkt gestellt werden soll.
- **DIN 5008 Druck- & PDF-Ansicht**: Druckoptimiertes Brieflayout mit korrekter Absenderzeile, Empfängerfeld, Datum, Betreffzeile und Unterschriftsbereich (`window.print()` / PDF-Speicherung).
- **Nachfass-E-Mail Generator**: Vorformulierte Nachfass-E-Mail auf Knopfdruck bei fehlender Rückmeldung inkl. One-Click-Copy und Mailto-Unterstützung.

### 4. Dokumenten-Handling & Bewerbungspaket-Download
- **Bewerbungs-Paket ZIP-Export**: Bündelt Anschreiben (als `.txt` und formatiertes HTML) sowie alle zugeordneten Zeugnisse/Dokumente auf Knopfdruck als fertiges ZIP-Archiv für den E-Mail-Versand.
- **In-App Dokumentenvorschau**: PDFs und Bilddateien direkt in der App per Modal ansehen, ohne sie erst separat herunterladen zu müssen.
- **Dokumenten-Manager**: Lebensläufe, Schul-/Ausbildungs-/Umschulungszeugnisse und Referenzen zentral verwalten und Bewerbungen zuordnen.

### 5. Interview-Vorbereitungsleitfaden & Mock-Interview (`/interview-prep`)
- **Interaktiver Fragenkatalog**: Strukturierte Fachfragen, Musterantworten und Interview-Tipps für:
  - *React & Frontend* (Server Components, Performance, Re-Renders, SWR-Caching)
  - *TypeScript & JavaScript* (Generics, Type Narrowing, Event Loop, Closures)
  - *CSS & UI/UX* (Flexbox vs. Grid, A11y / Barrierefreiheit / WCAG, Tailwind)
  - *Architektur & Testing* (Vitest, REST API Design mit Zod, CI/CD)
  - *Werdegang & Praxisprojekte* (Elektroniker $\rightarrow$ Fachinformatiker, *electroCheck-ai*)
  - *Gegenfragen an den Arbeitgeber* (Onboarding, Code Reviews, Release-Zyklen)
- **Mock-Interview Simulator**: Interaktiver 5-Fragen-Durchlauf mit automatischer Antwort-Auswertung (Score 0-100%, Keyword-Abgleich, Praxisbezug, konkretes Feedback und Musterlösung).
- **Stellen-spezifischer Tech-Stack-Filter**: Wählt man eine konkrete Bewerbung aus, filtert der Leitfaden automatisch die passenden Fragen zum Tech-Stack der ausgeschriebenen Stelle.
- **Checklisten-Fortschritt**: Fragen als vorbereitet markieren mit visueller Fortschrittsanzeige.

### 6. Jobsuche & Stellenanzeigen-Erfassung
- **Job-Portal-Simulator**: Simuliert Stellenangebote von Stepstone, Indeed, GetInIT und der Agentur für Arbeit inkl. **Match-Score-Berechnung** auf Basis der hinterlegten Präferenzen.
- **Stellenanzeigen-Schnellerfassung (Smart Parser)**: Beliebigen Freitext einer Stellenanzeige (LinkedIn, Stepstone, E-Mail) einfügen – der Parser extrahiert automatisch Titel, Unternehmen, Ort, Remote-Option, Gehalt, Tech-Stack und berechnet sofort den Match-Score.
- **1-Klick „Bewerben“**: Legt direkt eine neue Bewerbung im System an und verknüpft das Stellenangebot.

### 7. Analytics & Gehalts-Vergleichsmatrix
- **Gehalts- & Benefit-Vergleichsrechner**: Vergleicht vorliegende Angebote (`OFFER`) anhand von Brutto-/Netto-Gehalt, Home-Office-Tagen, Urlaubstagen, Fahrtkostenersparnis und Gesamt-Score.
- **Bewerbungs-Trichter (Conversion Funnel)**: Visualisiert die Phasen *Verschickt $\rightarrow$ Rückmeldung $\rightarrow$ Gespräch $\rightarrow$ Angebot*.
- **Portal-Effizienz & Einladungsquoten**: Zeigt auf, welche Portale (z. B. GetInIT, Stepstone, LinkedIn) die höchste Einladungsquote aufweisen.
- **Reaktionszeiten & Erfolgsquote**: Durchschnittliche Dauer bis zur ersten Rückmeldung und Zusagequote.

### 8. Premium UI/UX, Glassmorphism & Micro-Animations
- **SaaS Design System**: Feine Glassmorphism-Karten (`backdrop-blur`), flüssige Übergänge (`animate-fade-in`, `animate-scale-in`), dezent pulsierende Frist-Indikatoren (`animate-pulse-subtle`) und optimiertes Responsive-Layout für Mobilgeräte, Tablets und Desktop.

### 9. Datensicherheit & Backup
- **1-Klick JSON-Backup & Restore**: Vollständige Sicherung und Wiederherstellung aller Tabellen unter *Einstellungen $\rightarrow$ Backup & Daten*.
- **Excel-Bewerbungslisten-Import (`scripts/import-bewerbungsliste.ts`)**: Überträgt historische Excel-Bewerbungslisten in die SQLite-Datenbank.
- **Datenschutz**: Trennung zwischen Code/Vorlage (`scripts/profile-data.example.json`) und gitignorten Echtdaten (`profile-data.local.json`).

---

## 🛠️ Tech-Stack

| Bereich   | Technologie                                                              |
| --------- | ------------------------------------------------------------------------- |
| Frontend  | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4 |
| Backend   | Next.js Route Handler (REST-API unter `/api/*`), Zod-Validierung          |
| Datenbank | SQLite via Prisma 7 ORM (Adapter: `better-sqlite3`)                       |
| State     | SWR (clientseitiges Caching + automatische Revalidierung)                 |
| Testing   | Vitest (33 automatisierte Unit- & Integrationstests)                      |

---

## 📂 Architektur

```
prisma/
  schema.prisma        Datenbankschema mit optimierten Indizes
  seed.ts               Beispieldaten (Profil, Unternehmen, Jobs, Bewerbungen)
src/
  app/
    api/                 REST-API-Route-Handler (CRUD, Backup, Analytics, Bulk, Simulation, ZIP-Package, Generator)
    (Seiten)/             Dashboard (/), Bewerbungen (/applications), Excel-Tabelle (/excel-view),
                         Unternehmen (/companies), Jobsuche (/jobs), CV-Designer (/cv-designer),
                         Interview-Prep (/interview-prep), Auswertungen (/analytics), Einstellungen (/settings)
  components/            UI-Primitives, Modals, Kanban, ExcelGridTable, Charts, Dokumenten-Vorschau, Suche, Rechner, Mock-Interview
  lib/
    prisma.ts            Prisma-Client-Singleton (better-sqlite3-Adapter)
    matching.ts           Match-Score-Berechnung (Tech-Stack, Standort, Rolle)
    coverLetterGenerator.ts Multi-Tone Anschreiben & Nachfass-E-Mail Generator
    cvGenerator.ts        Lebenslauf-Generator & HTML/Print-Formatter
    interviewGuide.ts     Fachfragenkatalog & Tech-Stack-Filter
    mockInterviewEngine.ts Mock-Interview Antwort-Auswertungs-Engine
    sampleGenerator.ts    Batch-Bewerbungs-Generator für Statistiken
    emailResponseParser.ts E-Mail-Rückmeldungs-Parser (Absage/Einladung/Termine)
    salaryCalculator.ts   Gehalts- & Benefit-Vergleichsrechner
    zipPackage.ts         ZIP-Bewerbungspaket Generator
    followUp.ts           Wiedervorlage- und Fristen-Engine
    ical.ts               iCal / .ics Kalenderdatei-Generator
    jobParser.ts          Freitext-Stellenanzeigen Parser
    backup.ts             JSON Backup & Restore Serialisierung
    mockJobPortals.ts     Job-Portal-Simulator
    validation.ts         Zod-Schemata für alle API-Requests
    constants.ts           Status-/Kategorie-Definitionen (DE-Labels, Farben)
  types/                  Frontend-Typen (erweitern die generierten Prisma-Typen)
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
npx prisma migrate dev

# 4. Beispieldaten laden (Profil, Unternehmen, Jobs, Bewerbungen)
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
| `npm run test`                | Testsuite (Vitest, 33 Tests) einmalig ausführen                     |
| `npm run test:watch`           | Testsuite im Watch-Modus ausführen                                    |
| `npx prisma studio`          | Datenbank-Inhalte im Browser ansehen/bearbeiten                     |
| `npx prisma db push`         | Schema-Änderungen direkt auf SQLite anwenden                        |
| `npx prisma generate`         | Prisma-Client nach Schema-Änderung neu generieren                    |
| `npm run import:bewerbungsliste` | Persönliche Excel-Bewerbungsliste importieren                 |
