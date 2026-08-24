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
- **In-App Benachrichtigungs-Zentrale (Notification Bell)**: Interaktives Glocken-Symbol in der Kopfzeile mit Live-Badge-Counter für überfällige Schritte, anstehende Vorstellungsgespräche in den nächsten 48h und empfohlene Nachfass-Aktionen (> 14 Tage).
- **In-Browser Excel & CSV Import (`.xlsx`, `.xls`, `.csv`)**: Dateien direkt per Drag & Drop im Browser hochladen, Vorschau prüfen und mit 1 Klick in die Datenbank übernehmen – kein Terminal erforderlich.
- **Interaktive Excel-Tabelle (`/excel-view`)**: Tabellarischer Grid-Editor wie in Excel/Google Sheets mit direktem **Inline-Editing**, Tastatur-Navigation (Tab/Enter), schneller Erfassung neuer Zeilen und automatischem Batch-Speichern (`/api/applications/bulk`).
- **Spalten-Konfigurator (Column Customizer)**: Einzelne Tabellenspalten (Datum, Portal, Status, Ansprechpartner, E-Mail/Tel, Wiedervorlage, Notizen, Aktionen) flexibel ein- und ausblenden mit Schnell-Presets (*Standard*, *Kompakt*, *Kontakte*) und automatischer `localStorage`-Speicherung.
- **Audio-Notizen & Sprachmemos**: Vorstellungsgespräche und Telefonate direkt im Browser aufnehmen (Web Audio / MediaRecorder API), mit integriertem Player abspielen, herunterladen und bei der Bewerbung archivieren.
- **Live-Abonnierbarer Kalender-Feed (`/api/calendar/feed.ics`)**: Automatische iCal-Kalendersynchronisation für Smartphone (iOS / Android), Apple Kalender, Google Kalender und Outlook inkl. 1-Klick-Abo-Modal.
- **Erweiterte Filter- & Sortierleiste**: Überall verfügbar (Bewerbungen, Excel-Grid, Unternehmen, Jobsuche) – filtern nach Freitext, Status, Jobportal, Fristen/Wiedervorlage, Match-Score und sortieren nach Datum, Name oder Relevanz mit 1-Klick-Filter-Reset.
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
- **Keyword-Booster & ATS-Match Optimizer**: Gleicht das Anschreiben live mit den geforderten Tech-Keywords der Stellenanzeige ab, vergibt einen ATS-Score (0-100%) und erlaubt das 1-Klick-Einfügen passender Formulierungsvorschläge für fehlende Kernkompetenzen.
- **Projekt-Hervorhebung**: Gezielte Auswahl, welches Referenzprojekt (z. B. *electroCheck-ai*) im Anschreiben in den Mittelpunkt gestellt werden soll.
- **DIN 5008 Druck- & PDF-Ansicht**: Druckoptimiertes Brieflayout mit korrekter Absenderzeile, Empfängerfeld, Datum, Betreffzeile, optionaler digitaler Signaturzeile, 1-Klick-HTML-Export sowie Direktdruck (`window.print()` / PDF-Speicherung).
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

### 7. Analytics & Gehalts-Benchmarking
- **Gehalts-Benchmarking & Marktvergleich**: Berechnet marktübliche Gehaltsspannen für Fachinformatiker Anwendungsentwicklung (Frontend) nach Erfahrungsstufe (Junior, Mid-Level, Senior) und Region (Bonn/Köln, Ruhrgebiet, Remote, München, Berlin). Vergleicht das persönliche Wunschgehalt mit dem Marktmedian und liefert konkrete Verhandlungs-Hebel für Vorstellungsgespräche.
- **Gehalts- & Benefit-Vergleichsrechner**: Vergleicht vorliegende Angebote (`OFFER`) anhand von Brutto-/Netto-Gehalt, Home-Office-Tagen, Urlaubstagen, Fahrtkostenersparnis und Gesamt-Score.
- **Bewerbungs-Trichter (Conversion Funnel)**: Visualisiert die Phasen *Verschickt $\rightarrow$ Rückmeldung $\rightarrow$ Gespräch $\rightarrow$ Angebot*.
- **Portal-Effizienz & Einladungsquoten**: Zeigt auf, welche Portale (z. B. GetInIT, Stepstone, LinkedIn) die höchste Einladungsquote aufweisen.
- **Reaktionszeiten & Erfolgsquote**: Durchschnittliche Dauer bis zur ersten Rückmeldung und Zusagequote.

### 8. Farbleitsystem & Übersichtlichkeit (UI/UX)
- **Klare Farbcodierung im gesamten Dashboard:**
  - 🟡 **Gelb / Amber (`#f59e0b`)**: Offene & gesendete Bewerbungen (`SENT`, `DRAFT`)
  - 🔵 **Blau / Sky (`#0ea5e9`)**: Vorstellungsgespräche (`INTERVIEW`)
  - 🟢 **Grün / Emerald (`#10b981`)**: Zusagen & Angebote (`OFFER`)
  - 🔴 **Rot / Rose (`#ef4444`)**: Absagen (`REJECTED`)
  - 🟠 **Orange / Warning (`#ea580c`)**: Nachfass-Erinnerungen, überfällige Fristen und fällige Aktionen
- **Visuelle Akzentleisten:** Tabellenzeilen und Kanban-Karten besitzen dezente linke Farbbalken für sofortige Wiedererkennung.
- **SaaS Design System**: Feine Glassmorphism-Karten (`backdrop-blur`), flüssige Übergänge (`animate-fade-in`, `animate-scale-in`), dezent pulsierende Frist-Indikatoren (`animate-pulse-subtle`) und optimiertes Responsive-Layout für Mobilgeräte, Tablets und Desktop.

### 9. PWA & Offline-Fähigkeit (Progressive Web App)
- **Web App Manifest (`/manifest.webmanifest`)**: Ermöglicht die Installation der Anwendung als eigenständige Desktop- oder Smartphone-App (Standalone Window).
- **Service Worker (`public/sw.js`)**: Automatisches Caching statischer Kernkomponenten für ultraschnelle Ladezeiten und grundlegende Offline-Verfügbarkeit.

### 10. Datensicherheit & Backup
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
| PWA       | Web App Manifest, Service Worker Caching                                  |
| Testing   | Vitest (41 automatisierte Unit- & Integrationstests)                      |

---

## 📂 Architektur

```
prisma/
  schema.prisma        Datenbankschema mit optimierten Indizes
  seed.ts               Beispieldaten (Profil, Unternehmen, Jobs, Bewerbungen)
src/
  app/
    api/                 REST-API-Route-Handler (CRUD, Backup, Analytics, Bulk, Simulation, ZIP-Package, Calendar Feed, Generator)
    (Seiten)/             Dashboard (/), Bewerbungen (/applications), Excel-Tabelle (/excel-view),
                         Unternehmen (/companies), Jobsuche (/jobs), CV-Designer (/cv-designer),
                         Interview-Prep (/interview-prep), Auswertungen (/analytics), Einstellungen (/settings)
  components/            UI-Primitives, Modals, Kanban, ExcelGridTable, VoiceMemoPanel, Charts, Dokumenten-Vorschau, Suche, Rechner, Mock-Interview
  lib/
    prisma.ts            Prisma-Client-Singleton (better-sqlite3-Adapter)
    matching.ts           Match-Score-Berechnung (Tech-Stack, Standort, Rolle)
    salaryBenchmark.ts    Gehalts-Benchmarking & Marktvergleichs-Engine
    keywordBooster.ts     Anschreiben Keyword-Booster & ATS-Match Engine
    coverLetterGenerator.ts Multi-Tone Anschreiben & Nachfass-E-Mail Generator
    cvGenerator.ts        Lebenslauf-Generator & HTML/Print-Formatter
    interviewGuide.ts     Fachfragenkatalog & Tech-Stack-Filter
    mockInterviewEngine.ts Mock-Interview Antwort-Auswertungs-Engine
    sampleGenerator.ts    Batch-Bewerbungs-Generator für Statistiken
    emailResponseParser.ts E-Mail-Rückmeldungs-Parser (Absage/Einladung/Termine)
    salaryCalculator.ts   Gehalts- & Benefit-Vergleichsrechner
    zipPackage.ts         ZIP-Bewerbungspaket Generator
    followUp.ts           Wiedervorlage- und Fristen-Engine
    ical.ts               iCal / .ics Kalenderdatei- & Feed-Generator
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
| `npm run test`                | Testsuite (Vitest, 41 Tests) einmalig ausführen                     |
| `npm run test:watch`           | Testsuite im Watch-Modus ausführen                                    |
| `npx prisma studio`          | Datenbank-Inhalte im Browser ansehen/bearbeiten                     |
| `npx prisma db push`         | Schema-Änderungen direkt auf SQLite anwenden                        |
| `npx prisma generate`         | Prisma-Client nach Schema-Änderung neu generieren                    |
| `npm run import:bewerbungsliste` | Persönliche Excel-Bewerbungsliste importieren                 |
