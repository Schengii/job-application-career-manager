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
- **Echter automatischer E-Mail-Abgleich für Bewerbungsrückmeldungen** (`src/lib/imapClient.ts`, via `imapflow`/`mailparser`):
  - Verbindet sich per IMAP/TLS mit dem konfigurierten Postfach, matched Absender/Betreff mit bestehenden Bewerbungen und schlägt Statusübergänge vor — der Statuswechsel selbst bleibt bewusst ein manueller 1-Klick-Schritt.
  - IMAP-Passwort verschlüsselt at-rest (AES-256-GCM, wie der KI-API-Key), nie im Klartext an den Client zurückgegeben.
  - Ohne hinterlegte Zugangsdaten (oder bei einem Verbindungsfehler) arbeitet die App transparent mit simulierten Beispiel-E-Mails weiter — nie ein Hard-Fail für den Nutzer.

---

### 11. 🔔 Echte Web-Push-Benachrichtigungen & Hintergrund-Automatisierung (Einstellungen → „Automatisierung & Push")
- **Browser-Push für Absagen, Zusagen, Interview-Einladungen und fällige Termine** (`src/lib/pushNotifications.ts`, Standard Web Push API + VAPID): Kommt auch an, wenn das Dashboard gerade nicht im Vordergrund ist, solange der Server läuft.
- **In-Process Hintergrund-Scheduler** (`src/lib/scheduler.ts`, gestartet über `src/instrumentation.ts`): läuft alle 15 Minuten automatisch, solange der Server aktiv ist — synct bei aktiviertem IMAP neue E-Mails und verschickt fällige Push-Benachrichtigungen. Standardmäßig aktiv, in den Einstellungen abschaltbar.

---

### 12. 🗂️ Bewerbungs- & Unternehmens-Management
- **Dashboard mit Live-Metriken & Wochenziel-Tracker**: KPI-Kacheln, tägliche Streak 🔥 und Meilensteine.
- **Interaktive Excel-Tabelle (`/excel-view`)**: Inline-Editing im Tabellen-Grid mit Tastatur-Navigation, serverseitig paginiertem Nachladen und Batch-Speichern.
- **Server-paginierte Tabellenansicht** (`/applications`): Kanban-Board bleibt bewusst vollständig geladen (Spalten-Übersicht), die Tabellen-/Excel-Ansicht lädt und filtert dagegen serverseitig seitenweise — bleibt auch bei vielen hundert Bewerbungen performant.
- **Tastaturbedienbares Kanban-Board**: jede Karte hat einen fokussierbaren „Status ändern"-Button mit zugänglichem Menü (inkl. `aria-live`-Ankündigung) als vollwertige Alternative zum Maus-Drag&Drop.
- **Unternehmens-Duplikat-Erkennung**: warnt beim Anlegen vor ähnlich benannten, bereits existierenden Unternehmen (normalisierter Namensvergleich inkl. Rechtsform-Suffixen), statt sie unbemerkt zu duplizieren.
- **Stapelverarbeitung (Batch Action Bar)**: Mehrere Bewerbungen gleichzeitig selektieren, taggen, exportieren oder löschen.
- **Live-Abonnierbarer Kalender-Feed (`/api/calendar/feed.ics`)**: Automatische iCal-Kalendersynchronisation für Apple/Google/Outlook mit Video-Meeting-Links.

---

### 13. 🤖 Hybrid-KI-Anbindung (Anschreiben-Polishing & Interview-Feedback)
- **Vier wählbare Provider** (Einstellungen → KI-Provider, s. `src/lib/aiService.ts`): **OpenAI** (GPT-4o/-mini), **Anthropic** (Claude), **OpenRouter** (Universal-Router für zahlreiche Modelle) sowie **Ollama** für vollständig lokale, kostenlose Modelle auf `localhost:11434` — Ollama benötigt dabei bewusst keinen API-Key.
- **100% Offline-Fallback**: Ohne konfigurierten Provider (oder bei einem fehlgeschlagenen Request) arbeitet die App transparent mit einer lokalen Heuristik weiter — nie ein Hard-Fail für den Nutzer.
- **API-Key verschlüsselt at-rest** (`src/lib/secretCrypto.ts`, AES-256-GCM): Der Key wird nie im Klartext an den Client zurückgegeben und auch in der SQLite-Datei nicht im Klartext abgelegt.

---

### 14. 🗂️ Visuelle Bewerbungsmappen-Zusammenstellung & PDF-Merge (`/api/applications/[id]/pdf-package`)
- **Interaktiver Bewerbungsmappen-Builder (`ApplicationPdfPackageModal`)**:
  - Fasst Premium-Deckblatt, DIN 5008 Anschreiben, Lebenslauf und alle angehängten PDF-Zeugnisse oder hochauflösenden Scans zu **einer einzigen, versandfertigen Gesamt-PDF** zusammen.
  - Dokument-Reihenfolge mit 1 Klick per Auf-/Ab-Buttons sortieren und Dokumente flexibel an- oder abwählen.
  - **Live-Dateigrößen-Schätzung**: Überwacht den MB-Umfang mit automatischer `sharp`-Bildkompression und A4-Anpassung (< 5 MB für Portale wie Workday/Personio).

---

### 15. 🎯 KI Requirement-Matching & Pitch-Tailoring (`src/lib/requirementTailoring.ts`)
- **Automatischer "Gap-to-Pitch"-Abgleich**:
  - Scannt Stellenanzeigen auf geforderte Kern-Technologien und gleicht sie mit dem Bewerberprofil und realen Referenzprojekten ab.
  - Hebt erfüllte Anforderungen mit konkreten Projektnachweisen hervor und identifiziert fehlende Kenntnisse.
  - **1-Klick-Absatz-Generator**: Formuliert maßgeschneiderte Argumentations-Absätze und fügt sie direkt in das Anschreiben oder die Zwischenablage ein.

---

### 16. 📧 Smart Multi-Szenario Nachfass-Assistent (`src/lib/followUp.ts`)
- **Vier spezialisierte Nachfass-Vorlagen**:
  - *1. Freundliche Nachfrage* (7–14 Tage nach Versand ohne Rückmeldung).
  - *2. Dankes-E-Mail & Re-Pitch* (24–48h nach Vorstellungsgespräch oder Screening).
  - *3. Status-Check nach Coding Challenge* (4–7 Tage nach Aufgaben-Abgabe).
  - *4. Wertschätzende Feedback-Anfrage* (1–3 Tage nach einer Absage).
- **Historien-Integration**: Speichert die Nachfass-Aktion per 1-Klick direkt als Interaktions-Eintrag in der Bewerbungshistorie.

---

### 17. ⚡ Tech- & Coding-Challenge Quiz-Simulator (`/interview-prep`)
- **Interaktiver Fachfragen-Trainer für moderne Web-Entwickler**:
  - Praxisnahe Multiple-Choice-Fragen und Code-Snippets zu **React 19** (`useActionState`, RSC-Boundaries), **TypeScript 5+** (`satisfies`, Discriminated Unions, `never`-Checks) und **Web Performance / CSS** (Event Loop, INP Core Web Vital, Tailwind v4).
  - Sofortige detaillierte Code-Erklärungen, Key-Takeaways für das Bewerbungsgespräch und Scorecards nach Fachbereich.

---

### 18. 📊 Funnel-Benchmarking & KI-Erfolgsdiagnose (`/analytics`)
- **Bewerbungstrichter-Vergleich mit Marktdurchschnittswerten**:
  - Vergleicht eigene Konversionsraten (*Gesendet ➔ Interview ➔ Angebot*) mit realen Branchen-Benchmarks für Frontend-Entwickler.
  - **Automatisierte Pipeline-Diagnose**: Gibt datengestützte Tipps (z. B. bei schwacher Einladungsquote: CV ATS-Optimierung; bei schwachem Abschluss: Tech-Quiz & Interview-Training).

---

### 19. ⌨️ Command Palette Quick Actions & Modern Two-Column CV-Layout
- **Schnellaktionen via `Strg+K / ⌘K`**: Sofortiges Anlegen neuer Bewerbungen, Starten des Tech-Quiz oder Voice-Simulators von überall in der App.
- **Modern Two-Column Layout im CV-Designer**: Stilvolle zweispaltige Vorlage mit dunkler Tech-Sidebar und übersichtlicher Werdegangs-Timeline.

---

### 20. 🎙️ Persönliche Interview-Notizen & Sprach-Diktat (`/interview-prep`)
- **Individuelle Formulierungen pro Fachfrage (`QuestionNoteEditor`)**:
  - Speichert eigene Formulierungen und Anekdoten zu Projekten (z. B. *electroCheck-ai*) direkt an jeder Fachfrage.
  - **Echtzeit-Sprachdiktat (Speech-to-Text)**: Mit einem Klick auf *„Diktieren 🎙️“* die eigene Antwort frei einsprechen (Web Speech API).
  - Lokale Auto-Save-Persistierung mit visueller Speicherbestätigung.

---

### 21. 📋 Druckbarer 2-Seiten-Interview-Vorbereitungs-Spickzettel (`src/lib/interviewCheatsheet.ts`)
- **Kompakter DIN A4 Spickzettel**:
  - Fasst 2-Minuten-Selbstpräsentations-Pitch, vorbereitete Fachfragen inkl. persönlicher Notizen und 3 strategische Gegenfragen an das Entwickler-Team zusammen.
  - Mit 1 Klick über *„Spickzettel drucken“* als optimierte DIN A4 PDF ausdrucken oder auf dem Smartphone/Tablet mitnehmen.

---

### 22. 🔍 Smart Recruiter- & Ansprechpartner-Erkennung im Career Manager Clipper
- **Automatische Extraktion von Kontaktdaten (`public/extension/content.js`)**:
  - Erkennt Personaler, Talent Acquisition Manager, Recruiting-E-Mails und Telefonnummern direkt im DOM von Stellenanzeigen.
  - Überträgt Ansprechpartner und Recruiter-E-Mail automatisch in die Unternehmensdatenbank beim 1-Klick-Import.

---

### 23. 📱 PWA Offline-First Caching-Upgrade (`public/sw.js`)
- **Service Worker V2 mit erweiterten Routen**:
  - Cacht `/interview-prep`, `/cv-designer`, `/applications` und `/companies` für unterbrechungsfreie Nutzung auch ohne Internetverbindung (z. B. im Zug vor einem Vor-Ort-Gespräch).

## 🛠️ Tech-Stack

| Bereich   | Technologie                                                              |
| --------- | ------------------------------------------------------------------------- |
| Frontend  | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4 |
| Backend   | Next.js Route Handler (REST-API unter `/api/*`), Zod-Validierung          |
| Datenbank | SQLite via Prisma 7 ORM (Adapter: `better-sqlite3`)                       |
| State     | SWR (clientseitiges Caching + automatische Revalidierung)                 |
| E-Mail    | `imapflow` + `mailparser` für echten IMAP/TLS-Postfachabruf (`src/lib/imapClient.ts`) |
| Push      | Web Push API + VAPID (`web-push`, `src/lib/pushNotifications.ts`), Hintergrund-Scheduler via `src/instrumentation.ts` |
| Audio     | Web Speech API (SpeechSynthesis für TTS & webkitSpeechRecognition für STT)|
| Extension | Chrome/Edge Manifest V3 (Content Script, Popup UI, Background Worker)     |
| Testing   | Vitest (322 automatisierte Tests: Unit-/API-Integrationstests, s. `vitest.global-setup.ts`, sowie Komponenten-Tests mit React Testing Library, s. `src/test/setupTests.ts`) + Playwright E2E-Tests gegen eine eigene SQLite-Testdatenbank (s. `playwright.config.mts`) |
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
| `npm run test`                | Testsuite (Vitest, 236 Tests) einmalig ausführen                    |
| `npm run test:e2e`            | E2E-Tests (Playwright) ausführen — startet den Dev-Server automatisch gegen `prisma/e2e.db` |
| `npm run test:e2e:ui`         | E2E-Tests im interaktiven Playwright-UI-Modus ausführen             |
| `npm run test:watch`           | Testsuite im Watch-Modus ausführen                                    |
| `npm run test:db:regenerate`   | SQL-Fixture für die Test-DB neu generieren (nach Schema-Änderungen) |
| `npx prisma studio`          | Datenbank-Inhalte im Browser ansehen/bearbeiten                     |
| `npx prisma db push`         | Schema-Änderungen direkt auf SQLite anwenden                        |
| `npx prisma generate`         | Prisma-Client nach Schema-Änderung neu generieren                    |

---

## 🔒 Sicherheit

Die App ist primär für den lokalen Einzelnutzer-Betrieb (`localhost`) konzipiert, unterstützt aber
bewusst auch Hosting darüber hinaus (z. B. Vercel) — siehe `middleware.ts`/`APP_PASSWORD`. Folgende
Schutzmaßnahmen greifen dabei zusätzlich:

| Bereich | Schutzmaßnahme |
| --- | --- |
| URL-Scraper (`/jobs/scrape-url`) | SSRF-Schutz (`src/lib/ssrfGuard.ts`): DNS-Auflösung + IP-Prüfung gegen private/interne Netzwerke (inkl. Cloud-Metadaten-Endpunkte) für die Ziel-URL UND jeden Redirect-Hop, plus Content-Type-/Größen-Limit der Antwort. |
| Datei-Upload (`/api/documents/upload`) | Allowlist statt Denylist für MIME-Type + Dateiendung (`src/lib/constants.ts`) — verhindert das Hochladen aktiver Inhalte (`.html`, `.svg`, `.js`, …), die unter `/uploads/` sonst als gespeichertes XSS ausführbar wären. |
| KI-API-Key & IMAP-Passwort (Einstellungen) | At-Rest-Verschlüsselung (AES-256-GCM, `src/lib/secretCrypto.ts`) statt Klartext in der SQLite-Datei; beide werden zusätzlich nie im Klartext an den Client zurückgegeben und nie in Backup-Exporte mit aufgenommen. |
| Stapel-Löschung & Restore | Automatischer JSON-Snapshot vor jeder unwiderruflichen Aktion (`src/lib/serverBackupRotation.ts`, rotierend unter `./backups/`). |
| Passwortabgleich (`middleware.ts`) | Konstante-Zeit-Vergleich (`timingSafeEqual`) gegen Timing-Angriffe. |
| Brute-Force auf `APP_PASSWORD` (`middleware.ts`) | Rate-Limiting mit Lockout pro Client (`src/lib/rateLimiter.ts`): Nach 10 Fehlversuchen in 15 Minuten wird die IP für 15 Minuten mit `429 Too Many Requests` gesperrt, statt weitere Versuche zuzulassen. |
| Missbrauch kostenpflichtiger/externer Routen (`/api/ai`, `/api/jobs/live-search`, `/api/jobs/scrape-url`) | Eigenständiges Rate-Limiting pro Route (`src/lib/apiRateLimit.ts`): begrenzt Aufrufe pro Client-IP (15–20 pro 10 Minuten), damit weder unnötige KI-Provider-Kosten entstehen noch die Route als Proxy zum Fluten externer Server missbraucht werden kann. |
| `xlsx`-Abhängigkeit (Excel-Import, `/excel-view`) | Bezug direkt vom offiziellen SheetJS-CDN (`https://cdn.sheetjs.com/...`) statt der veralteten npm-Registry-Version — behebt zwei bekannte High-Severity-CVEs (Prototype Pollution, ReDoS) beim Parsen hochgeladener `.xlsx`-Dateien (die npm-Registry-Version wird von SheetJS wegen eines Namensraum-Streits nicht mehr aktuell gehalten). |

Details und Begründungen stehen jeweils als Kommentar direkt am Code.

`npm audit` ist aktuell frei von bekannten Schwachstellen (0 findings). Ein einzelner verbleibender
Kandidat (`deepmerge-ts` < 8.0.0, transitiv über Prisma's CLI-Konfigurationslader `@prisma/config`)
ist über einen `overrides`-Eintrag in `package.json` auf eine gepatchte Version angehoben — Prisma
selbst hat diese Abhängigkeit in keiner stabilen 7.x-Version bisher aktualisiert (nur im experimentellen
8.0.0-Release-Candidate, der bewusst nicht eingesetzt wird, da diese App auf der Prisma-7-Client-Architektur
aufbaut, siehe `AGENTS.md`).
