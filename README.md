# Job Application & Career Manager

Eine vollständige, moderne Web-Anwendung zur zentralen Verwaltung der Jobsuche als **Fachinformatiker für
Anwendungsentwicklung** (Schwerpunkt Frontend: TypeScript, JavaScript, CSS, React, Next.js – Region
Bonn/Dortmund/Remote). Alle Daten – Unternehmen, Stellenangebote, Bewerbungen, Präferenzen,
Dokumente, Historie und generierte Anschreiben – werden in einer echten Datenbank gespeichert, sodass nichts
verloren geht.

---

## 🚀 Features im Überblick

### 1. Bewerbungs- & Unternehmens-Management
- **Dashboard mit Live-Metriken**: Gesamtanzahl, Offene Bewerbungen, Gespräche, Absagen und Zusagen auf einen Blick.
- **Smarte Wiedervorlage & Nachfass-Engine**: Hebt überfällige Schritte sowie Bewerbungen ohne Rückmeldung (> 14 Tage) auf dem Dashboard und in der Liste hervor.
- **Bewerbungs-Tracker & Kanban-Board**: Wechsel zwischen übersichtlicher Tabellenansicht und nativem HTML5 Drag-and-Drop Kanban-Board.
- **Detailansicht**: Vollständige Kontaktdaten, lückenlose Status-Historie, Notizen und verknüpfte Unterlagen.
- **Termin- & Kalender-Export (.ics / iCal)**: Exportiert anstehende Vorstellungsgespräche und Termine mit einem Klick in Google Kalender, Outlook oder Apple Calendar.
- **Unternehmensverwaltung**: Vollständiges CRUD (Adresse, Ansprechpartner, Telefon, E-Mail, Notizen und Status).

### 2. Anschreiben-Engine 2.0 & Kommunikation
- **Multi-Tone Anschreiben-Generator**:
  - **Modern** (standard, lösungs- und praxisorientiert)
  - **Klassisch** (formell für Behörden, Banken & Großkonzerne)
  - **Startup / Agil** (dynamisch, teamorientiert, direkte Ansprache)
  - **Detailliert** (starker Fokus auf Umschulung, Handwerk & technischen Tiefgang)
- **Projekt-Hervorhebung**: Gezielte Auswahl, welches Referenzprojekt (z. B. *electroCheck-ai*) im Anschreiben in den Mittelpunkt gestellt werden soll.
- **DIN 5008 Druck- & PDF-Ansicht**: Druckoptimiertes Brieflayout mit korrekter Absenderzeile, Empfängerfeld, Datum, Betreffzeile und Unterschriftsbereich (`window.print()` / PDF-Speicherung).
- **Nachfass-E-Mail Generator**: Vorformulierte Nachfass-E-Mail auf Knopfdruck bei fehlender Rückmeldung inkl. One-Click-Copy und Mailto-Unterstützung.

### 3. Dokumenten-Handling & In-App Vorschau
- **Dokumenten-Manager**: Lebensläufe, Schul-/Ausbildungs-/Umschulungszeugnisse und Referenzen zentral verwalten.
- **In-App Dokumentenvorschau**: PDFs und Bilddateien direkt in der App per Modal ansehen, ohne sie erst separat herunterladen zu müssen.
- **Wiederverwendbarkeit**: Dokumente einmalig hochladen und beliebig vielen Bewerbungen flexibel zuordnen.

### 4. Jobsuche & Stellenanzeigen-Erfassung
- **Job-Portal-Simulator**: Simuliert Stellenangebote von Stepstone, Indeed, GetInIT und der Agentur für Arbeit inkl. **Match-Score-Berechnung** auf Basis der hinterlegten Präferenzen.
- **Stellenanzeigen-Schnellerfassung (Smart Parser)**: Beliebigen Freitext einer Stellenanzeige (LinkedIn, Stepstone, E-Mail) einfügen – der Parser extrahiert automatisch Titel, Unternehmen, Ort, Remote-Option, Gehalt, Tech-Stack und berechnet sofort den Match-Score.
- **1-Klick „Bewerben“**: Legt direkt eine neue Bewerbung im System an und verknüpft das Stellenangebot.

### 5. Analytics & Karriere-Insights
- **Bewerbungs-Trichter (Conversion Funnel)**: Visualisiert die Phasen *Verschickt $\rightarrow$ Rückmeldung $\rightarrow$ Gespräch $\rightarrow$ Angebot*.
- **Portal-Effizienz & Einladungsquoten**: Zeigt auf, welche Portale (z. B. GetInIT, Stepstone, LinkedIn) die höchste Einladungsquote aufweisen.
- **Reaktionszeiten & Erfolgsquote**: Durchschnittliche Dauer bis zur ersten Rückmeldung und Zusagequote.
- **Interaktive Charts**: Reine Inline-SVG-Diagramme für monatliche Bewerbungstrends und Statusverteilungen.

### 6. Datensicherheit & Backup
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
| Testing   | Vitest (19 automatisierte Unit- & Integrationstests)                      |

---

## 📂 Architektur

```
prisma/
  schema.prisma        Datenbankschema mit optimierten Indizes
  seed.ts               Beispieldaten (Profil, Unternehmen, Jobs, Bewerbungen)
src/
  app/
    api/                 REST-API-Route-Handler (CRUD, Backup, Analytics, Generator)
    (Seiten)/             Dashboard (/), Bewerbungen (/applications), Unternehmen (/companies),
                         Jobsuche (/jobs), Auswertungen (/analytics), Einstellungen (/settings)
  components/            UI-Primitives, Modals, Kanban, Charts, Dokumenten-Vorschau, Suche
  lib/
    prisma.ts            Prisma-Client-Singleton (better-sqlite3-Adapter)
    matching.ts           Match-Score-Berechnung (Tech-Stack, Standort, Rolle)
    coverLetterGenerator.ts Multi-Tone Anschreiben & Nachfass-E-Mail Generator
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
| `npm run test`                | Testsuite (Vitest, 19 Tests) einmalig ausführen                     |
| `npm run test:watch`           | Testsuite im Watch-Modus ausführen                                    |
| `npx prisma studio`          | Datenbank-Inhalte im Browser ansehen/bearbeiten                     |
| `npx prisma db push`         | Schema-Änderungen direkt auf SQLite anwenden                        |
| `npx prisma generate`         | Prisma-Client nach Schema-Änderung neu generieren                    |
| `npm run import:bewerbungsliste` | Persönliche Excel-Bewerbungsliste importieren                 |
