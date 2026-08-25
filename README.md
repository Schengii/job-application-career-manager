# Job Application & Career Manager

Eine vollständige, moderne Fullstack-Web-Anwendung zur professionellen Steuerung der gesamten Jobsuche als **Fachinformatiker für
Anwendungsentwicklung** (Schwerpunkt Frontend: TypeScript, JavaScript, CSS, React, Next.js – Region
Bonn/Dortmund/Remote). Alle Daten – Unternehmen, Stellenangebote, Bewerbungen, Präferenzen,
Dokumente, Historie, generierte Anschreiben, Interview-Dossiers und Lebensläufe – werden in einer echten SQLite-Datenbank via Prisma 7 gespeichert.

---

## 🚀 Features im Überblick

### 1. Bewerbungs- & Unternehmens-Management
- **Dashboard mit Live-Metriken**: Gesamtanzahl, Offene Bewerbungen, Gespräche, Absagen und Zusagen auf einen Blick.
- **Wochenziel- & Aktivitäts-Streak Tracker (`GoalTrackerCard`)**:
  - Konfigurierbares Wochenziel (z. B. 5 Bewerbungen pro Woche) mit grafischem Fortschrittsring.
  - Tägliche Aktivitäts-Streak mit Flammen-Icon 🔥 zur Motivation.
  - Gamification-Meilensteine (z. B. *Erster Schritt*, *High Performer*, *Interview-Magnet*, *Fokus-Meister*).
- **Interaktive Excel-Tabelle (`/excel-view`)**: Tabellarischer Grid-Editor wie in Excel/Google Sheets mit direktem **Inline-Editing**, Tastatur-Navigation (Tab/Enter), schneller Erfassung neuer Zeilen und automatischem Batch-Speichern (`/api/applications/bulk`).
- **Stapelverarbeitung (Batch Action Bar)**: Mehrere Bewerbungen gleichzeitig selektieren, um Status zu ändern, Tags zuzuweisen, als CSV zu exportieren oder im Batch zu löschen.
- **Multi-Tagging & Farb-Badges (`/lib/tags.ts`)**: Beliebige Tags (z. B. `#Prio1`, `#Remote`, `#React19`, `#Empfehlung`) an Bewerbungen und Unternehmen vergeben und danach filtern.
- **Video-Meeting-Integration (Teams / Zoom / Meet)**: Direkte Verlinkung von Online-Vorstellungsgesprächen mit 1-Klick „Join“-Buttons auf dem Dashboard, in der Bewerbungstabelle und auf der Detailseite.
- **Detaillierte Interaktions-Historie**: Chronologische Erfassung von Telefonaten, E-Mails, Interview-Runden und Feedback direkt in der Timeline.
- **In-App Benachrichtigungs-Zentrale (Notification Bell)**: Glocken-Symbol in der Kopfzeile mit Live-Badge-Counter für überfällige Schritte, anstehende Vorstellungsgespräche in den nächsten 48h und empfohlene Nachfass-Aktionen (> 14 Tage).
- **In-Browser Excel & CSV Import (`.xlsx`, `.xls`, `.csv`)**: Dateien direkt per Drag & Drop im Browser hochladen, Vorschau prüfen und mit 1 Klick in die Datenbank übernehmen.
- **Markdown-Notizen & Checklisten-Editor (`InterviewNotesEditor`)**: Notizenbereich mit Live-Markdown-Vorschau und interaktiver Vorbereitungs-Checkliste.
- **Audio-Notizen & Sprachmemos**: Vorstellungsgespräche und Telefonate direkt im Browser aufnehmen (Web Audio / MediaRecorder API), abspielen und archivieren.
- **Live-Abonnierbarer Kalender-Feed (`/api/calendar/feed.ics`)**: Automatische iCal-Kalendersynchronisation für Smartphone (iOS / Android), Apple Kalender, Google Kalender und Outlook inkl. Meeting-Links.
- **3 Ansichtsmodi in der Bewerbungsliste**: Flexibler Wechsel zwischen **Tabelle**, nativem **Kanban-Board** (Drag & Drop) und **Excel-Grid**.
- **E-Mail-Rückmeldungs-Assistent**: Arbeitgeber-E-Mails (Absagen, Einladungen, Eingangsbestätigungen, Angebote) per Copy & Paste analysieren und mit einem Klick Status, Termine und Notizen aktualisieren.

---

### 2. Interview-Vorbereitung & Spickzettel-Generator (`/interview-prep`)
- **Interview-Dossier & DIN A4 Spickzettel-Druck (`InterviewDossierModal`)**:
  - Erzeugt auf Knopfdruck ein druckfertiges 1-Seiten-Dossier für anstehende Vorstellungsgespräche.
  - Beinhaltet Firmen-Kernfakten, Ansprechpartner, Meeting-Link, 30-Sekunden-Elevator-Pitch, verknüpfte Tech-Skills, eigene Gegenfragen an das Unternehmen, Gehaltsargumente und Vorbereitungs-Checkliste.
- **Interaktiver Fachfragenkatalog**: Strukturierte Fragen und Musterantworten für:
  - *React & Frontend* (Server Components, Performance, Re-Renders, SWR-Caching)
  - *TypeScript & JavaScript* (Generics, Type Narrowing, Event Loop, Closures)
  - *CSS & UI/UX* (Flexbox vs. Grid, A11y / Barrierefreiheit / WCAG, Tailwind)
  - *Architektur & Testing* (Vitest, REST API Design mit Zod, CI/CD)
  - *Werdegang & Praxisprojekte* (Elektroniker $\rightarrow$ Fachinformatiker, *electroCheck-ai*)
  - *Gegenfragen an den Arbeitgeber* (Onboarding, Code Reviews, Release-Zyklen)
- **Mock-Interview Simulator mit STAR-Methode**:
  - 5-Fragen-Durchlauf mit automatischer Antwort-Auswertung.
  - STAR-Methoden-Analyse (Situation/Aufgabe, Aktion, Ergebnis).
  - KI-gestützte Auswertung mit Stärken- und Verbesserungsvorschlägen (oder Offline-Heuristik).

---

### 3. Hybride KI-Veredelung & Anschreiben-Engine 2.0
- **Optionaler KI-Assistent (OpenAI / Anthropic / OpenRouter / Ollama)**:
  - Unter *Einstellungen* kann optional ein eigener API-Key hinterlegt werden.
  - **100% Offline-Garantie:** Wenn kein Key hinterlegt ist, arbeitet die gesamte App vollständig offline und kostenlos mit intelligenten heuristischen Algorithmen.
- **Multi-Tone Anschreiben-Generator**:
  - **Modern** (standard, lösungs- und praxisorientiert)
  - **Klassisch** (formell für Behörden, Banken & Großkonzerne)
  - **Startup / Agil** (dynamisch, teamorientiert, direkte Ansprache)
  - **Detailliert** (starker Fokus auf Umschulung, Handwerk & technischen Tiefgang)
- **„Mit KI verfeinern ✨“ Button**: Poliert das Anschreiben live nach stilistischen Kriterien und passt die Argumentation an die Stellenbeschreibung an.
- **Keyword-Booster & ATS-Match Optimizer**: Gleicht das Anschreiben live mit den geforderten Tech-Keywords der Stellenanzeige ab und vergibt einen ATS-Score (0-100%).
- **DIN 5008 Druck- & PDF-Ansicht**: Druckoptimiertes Brieflayout mit Absenderzeile, Empfängerfeld, Betreff, digitaler Signaturzeile und One-Click-PDF-Export.
- **Nachfass-E-Mail Generator**: Vorformulierte Nachfass-E-Mail auf Knopfdruck bei fehlender Rückmeldung.

---

### 4. Globale Tastaturkürzel & Navigation
Drücke jederzeit <kbd>?</kbd> in der App, um die interaktive Tastatur-Hilfe zu öffnen:

| Tastenkombination | Aktion |
| ----------------- | ------ |
| <kbd>⌘K</kbd> / <kbd>Strg+K</kbd> | Globale Suche (Command Palette) mit Tag- & Firmensuche |
| <kbd>/</kbd> | Schnellsuche in Command Palette öffnen |
| <kbd>N</kbd> | Neue Bewerbung blitzschnell anlegen |
| <kbd>?</kbd> | Tastaturkürzel-Dialog einblenden |
| <kbd>G</kbd> dann <kbd>D</kbd> | Zum **Dashboard** springen |
| <kbd>G</kbd> dann <kbd>A</kbd> | Zu den **Bewerbungen** springen |
| <kbd>G</kbd> dann <kbd>E</kbd> | Zur **Excel-Tabelle** springen |
| <kbd>G</kbd> dann <kbd>C</kbd> | Zu den **Unternehmen** springen |
| <kbd>G</kbd> dann <kbd>J</kbd> | Zur **Jobsuche** springen |
| <kbd>G</kbd> dann <kbd>I</kbd> | Zum **Interview-Prep Leitfaden** springen |
| <kbd>G</kbd> dann <kbd>V</kbd> | Zum **CV-Designer (Lebenslauf)** springen |
| <kbd>G</kbd> dann <kbd>S</kbd> | Zu den **Einstellungen** springen |
| <kbd>Esc</kbd> | Modale und Dialoge schließen |

---

### 5. Multi-Portal Jobsuche & Live-Synchronisations-Engine (`/jobs`)
- **Multi-Portal Live-Sync (`/api/jobs/sync`)**: Aggregiert und synchronisiert Stellenanzeigen über alle relevanten Jobportale (*StepStone*, *Indeed*, *Get in IT*, *LinkedIn Jobs*, *XING*, *Arbeitsagentur*, *Monster*, *Honeypot.io*).
- **Match-Score Feineinstellung (`MatchingWeightsCard`)**: Gewichtungs-Schieberegler zur individuellen Justierung der Matching-Säulen (*Tech-Stack* 10–80%, *Standort/Remote* 10–60%, *Rollen-Keywords* 10–50%).
- **Side-by-Side Stellenvergleich (`JobComparisonModal`)**: Zwei beliebige Stellenangebote gegenüberstellen – vergleicht Match-Score, Gehalt, Remote-Quote und Skills mit 1-Klick-Bewerbung.
- **Job-Alerts & Match-Radar (`JobAlertModal`)**: Konfigurierbarer Benachrichtigungs-Digest für Top-Matches.
- **NRW & Remote Pendel-Radar (`CommuteRadarCard`)**: Pendel- und Fahrzeit-Rechner von Bonn/Köln/Ruhrgebiet (ÖPNV vs. PKW) inkl. Zeitersparnis durch Home-Office-Tage.
- **Stellenanzeigen Smart Parser**: Beliebigen Freitext einer Stellenanzeige einfügen – der Parser extrahiert Titel, Unternehmen, Ort, Remote, Gehalt und Tech-Stack.

---

### 6. Analytics & Absagegründe-Analyse (`/analytics`)
- **Absagegründe & Feedback-Analyse (`RejectionReasonsChart`)**: Strukturierte Aufschlüsselung von Absagegründen mit strategischen Handlungsempfehlungen.
- **Gehalts-Benchmarking & Marktvergleich**: Berechnet marktübliche Gehälter nach Erfahrungsstufe und Region mit Verhandlungs-Hebeln.
- **Gehalts- & Benefit-Vergleichsrechner**: Vergleicht vorliegende Angebote (`OFFER`) anhand von Netto-Gehalt, Home-Office, Urlaub und Fahrtkosten.
- **Bewerbungs-Trichter (Conversion Funnel)**: Phasen *Verschickt $\rightarrow$ Rückmeldung $\rightarrow$ Gespräch $\rightarrow$ Angebot*.
- **Portal-Effizienz & Einladungsquoten**: Zeigt die erfolgreichsten Jobportale auf.
- **Reaktionszeiten & Erfolgsquote**: Durchschnittliche Dauer bis zur ersten Rückmeldung und Zusagequote.

---

### 7. Lebenslauf-Generator & Dokumenten-Handling
- **CV-Designer (`/cv-designer`)**: Erzeugt druckoptimierte Lebensläufe in 3 Layouts (*Modern*, *Klassisch*, *Kompakt*) mit selektiver Stationsauswahl.
- **Bewerbungs-Paket ZIP-Export**: Bündelt Anschreiben und alle Dokumente als fertiges ZIP-Archiv für den Versand.
- **In-App Dokumentenvorschau**: PDFs und Bilddateien direkt in der App per Modal ansehen.

---

## 🛠️ Tech-Stack

| Bereich   | Technologie                                                              |
| --------- | ------------------------------------------------------------------------- |
| Frontend  | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4 |
| Backend   | Next.js Route Handler (REST-API unter `/api/*`), Zod-Validierung          |
| Datenbank | SQLite via Prisma 7 ORM (Adapter: `better-sqlite3`)                       |
| State     | SWR (clientseitiges Caching + automatische Revalidierung)                 |
| PWA       | Web App Manifest, Service Worker Caching                                  |
| Testing   | Vitest (67 automatisierte Unit- & Integrationstests)                      |

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
| `npm run test`                | Testsuite (Vitest, 67 Tests) einmalig ausführen                     |
| `npm run test:watch`           | Testsuite im Watch-Modus ausführen                                    |
| `npx prisma studio`          | Datenbank-Inhalte im Browser ansehen/bearbeiten                     |
| `npx prisma db push`         | Schema-Änderungen direkt auf SQLite anwenden                        |
| `npx prisma generate`         | Prisma-Client nach Schema-Änderung neu generieren                    |
| `npm run import:bewerbungsliste` | Persönliche Excel-Bewerbungsliste importieren                 |
