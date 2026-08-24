# Job Application & Career Manager

Eine vollständige Web-Anwendung zur zentralen Verwaltung der Jobsuche als **Fachinformatiker für
Anwendungsentwicklung** (Schwerpunkt Frontend: TypeScript, JavaScript, CSS – Region
Bonn/Dortmund/Remote). Alle Daten – Unternehmen, Stellenangebote, Bewerbungen, Präferenzen,
Dokumente und generierte Anschreiben – werden in einer echten Datenbank gespeichert, sodass nichts
verloren geht.

## Features

- **Dashboard** mit Live-Metrik-Karten (Bewerbungen gesamt, offen, Gespräche, Absagen, Zusagen)
- **Bewerbungs-Tracker** mit Tabellenansicht, Status-Filter und direktem Status-Update
- **Detailansicht** je Bewerbung: Unternehmensdaten, Status-Historie, Notizen, verknüpfte Dokumente
- **Unternehmensverwaltung** mit vollständigem CRUD (Adresse, Ansprechpartner, Notizen, Status)
- **Präferenzen & Profil**: Rolle, Tech-Stack, Standorte, Remote-Präferenz, Ausbildungs- und
  Projektdaten (z. B. Elektroniker für Betriebstechnik → Umschulung → electroCheck-ai)
- **Dokumenten-Manager**: Lebenslauf, Zeugnisse, Referenzen hochladen und Bewerbungen zuordnen
- **Job-Portal-Simulator**: simuliert Stellenangebote von Stepstone, Indeed, GetInIT und der Agentur
  für Arbeit inkl. **Match-Score** auf Basis der hinterlegten Präferenzen, mit „Bewerben“-Button
- **Anschreiben-Generator**: erstellt auf Knopfdruck ein individuelles Anschreiben aus
  Unternehmensdaten, Stellenanzeige und Profil und speichert es als Entwurf in der Datenbank
- **Auswertungen**: Erfolgsquote, durchschnittliche Reaktionszeit, Status-Verteilung,
  Bewerbungen pro Monat und je Jobportal — als interaktive Charts (Hover-Tooltips)
- **Kanban-Board** als Alternative zur Tabellenansicht: Bewerbungen per Drag & Drop
  zwischen Status-Spalten verschieben
- **Globale Suche (⌘K / Strg+K)**: durchsucht Bewerbungen, Unternehmen und Stellenangebote
  gleichzeitig und springt direkt zum passenden Datensatz
- **CSV-Export** der (gefilterten) Bewerbungsliste, Excel-kompatibel
- **Light/Dark Mode**, responsives SaaS-Design, tastaturzugänglich (WCAG-orientiert)
- **Automatisierte Tests** (Vitest) für Matching-Engine und Anschreiben-Generator

## Tech-Stack

| Bereich   | Technologie                                                              |
| --------- | ------------------------------------------------------------------------- |
| Frontend  | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4 |
| Backend   | Next.js Route Handler (REST-API unter `/api/*`), Zod-Validierung          |
| Datenbank | SQLite via Prisma 7 ORM (Adapter: `better-sqlite3`)                       |
| State     | SWR (clientseitiges Caching + Revalidierung nach jeder Mutation)          |

Die Anwendung ist bewusst als **ein** Next.js-Projekt aufgebaut (statt separatem Express-Server):
Backend (Route Handler) und Frontend laufen im selben Prozess, sodass `npm run dev` genügt, um die
komplette Anwendung zu starten.

## Architektur

```
prisma/
  schema.prisma        Datenbankschema (siehe unten)
  seed.ts               Beispieldaten (Profil, Unternehmen, Jobs, Bewerbungen)
src/
  app/
    api/                 REST-API-Route-Handler (CRUD für alle Entitäten)
    (Seiten)/             Dashboard, Bewerbungen, Unternehmen, Jobsuche, Einstellungen
  components/            UI-Komponenten (Primitives, Domänen-Komponenten)
  lib/
    prisma.ts            Prisma-Client-Singleton (better-sqlite3-Adapter)
    matching.ts           Match-Score-Berechnung (Tech-Stack, Standort, Rolle)
    mockJobPortals.ts     Job-Portal-Simulator (Stepstone/Indeed/GetInIT/Arbeitsagentur)
    coverLetterGenerator.ts  Anschreiben-Generator
    validation.ts         Zod-Schemata für alle API-Requests
    constants.ts           Status-/Kategorie-Definitionen (DE-Labels, Farben)
  types/                  Frontend-Typen (erweitern die generierten Prisma-Typen)
```

### Datenbankschema (Prisma)

```
Company (1) ──< JobPosting (n)          Ein Unternehmen kann mehrere Stellenangebote haben
Company (1) ──< Application (n)          Ein Unternehmen kann mehrere Bewerbungen haben
JobPosting (1) ──< Application (n)       Optional: Bewerbung bezieht sich auf ein Stellenangebot
Application (1) ──< ApplicationStatusEvent (n)   Status-Historie
Application (1) ── CoverLetter (1)        Generiertes Anschreiben
Application (n) ──< ApplicationDocument >── (n) Document   Wiederverwendbare Dokumente (n:m)
Preferences (1) ──< EducationEntry (n)    Ausbildungs-/Bildungsdaten
Preferences (1) ──< ProjectEntry (n)      Projekte/Referenzen (z. B. electroCheck-ai)
```

> SQLite unterstützt in Prisma keine nativen Enums – Status-/Kategorie-Felder sind daher als
> validierter `String` abgebildet (siehe `src/lib/constants.ts` für die erlaubten Werte inkl.
> deutscher Labels).

## Setup

Voraussetzung: Node.js ≥ 20.

```bash
npm install

# .env aus Vorlage anlegen (DATABASE_URL="file:./dev.db")
cp .env.example .env

# Datenbank anlegen + Schema migrieren
npx prisma migrate dev

# Beispieldaten laden (Profil, Unternehmen, Jobs, Bewerbungen)
npx prisma db seed

# Entwicklungsserver starten
npm run dev
```

Die Anwendung läuft anschließend unter **http://localhost:3000**.

## Eigene Bewerbungsliste importieren

`scripts/import-bewerbungsliste.ts` überträgt eine persönliche Excel-Bewerbungsliste (Spalten:
Datum, Unternehmen, Homepage, Anzeigeportal, Stellenbezeichnung, Ansprechpartner, Adresse,
Telefonnummer, Emailadresse, "beworben am…", Wiedervorlage, Anmerkungen, Absagen-Datum) sowie
Profil-/Zeugnisdaten in die Datenbank — inklusive automatisch generierter Anschreiben je
Unternehmen. Das Skript selbst enthält keine personenbezogenen Daten und ist git-versioniert;
gelesen werden nur lokale, per `.gitignore` ausgeschlossene Dateien.

```bash
npm run import:bewerbungsliste
# oder mit explizitem Pfad:
npm run import:bewerbungsliste -- "Pfad/zur/Bewerbungsliste.xlsx"
```

> **Sicherheitshinweis:** `xlsx` (SheetJS) hat aktuell zwei ungepatchte Advisories (Prototype
> Pollution, ReDoS) und ist deshalb bewusst nur als `devDependency` eingebunden — genutzt wird es
> ausschließlich in diesem lokalen Import-Skript mit selbst erstellten, vertrauenswürdigen
> Dateien, niemals zur Laufzeit der Web-Anwendung oder für von außen hochgeladene Dateien.

### Nützliche Befehle

| Befehl                    | Zweck                                                          |
| -------------------------- | ---------------------------------------------------------------- |
| `npm run dev`               | Entwicklungsserver (Turbopack) starten                            |
| `npm run build`             | Produktions-Build erstellen (inkl. TypeScript-Check)               |
| `npm run lint`               | ESLint ausführen                                                    |
| `npx prisma studio`          | Datenbank-Inhalte im Browser ansehen/bearbeiten                     |
| `npx prisma migrate dev`     | Neue Migration nach Schema-Änderung erstellen                       |
| `npx prisma generate`         | Prisma-Client nach Schema-Änderung neu generieren                    |
| `npm run test`                | Testsuite (Vitest) einmalig ausführen                                |
| `npm run test:watch`           | Testsuite im Watch-Modus ausführen                                    |

## Eigene Daten hinterlegen

1. **Einstellungen → Profil & Präferenzen**: Name, Kontaktdaten, gewünschte Rolle, Tech-Stack,
   Standorte und Remote-Präferenz eintragen (Basis für Matching & Anschreiben).
2. **Einstellungen → Ausbildung & Projekte**: eigene Ausbildungs-/Umschulungsstationen und Projekte
   (z. B. eigene Referenzprojekte) hinzufügen.
3. **Einstellungen → Dokumente**: Lebenslauf, Zeugnisse und Referenzen hochladen.
4. **Jobsuche**: „Jobportale durchsuchen“ klicken, um simulierte Stellenangebote mit Match-Score zu
   erhalten, und direkt „Bewerben“.
5. In der neu angelegten Bewerbung: „Anschreiben generieren“ klicken – das Ergebnis lässt sich vor
   dem Versand noch frei bearbeiten.

## Hinweis zum Job-Portal-Simulator

Ein Live-Scraping realer Portale (Stepstone, Indeed, GetInIT, Agentur für Arbeit) ist rechtlich und
technisch aufwändig (Anti-Bot-Schutz, Nutzungsbedingungen). `src/lib/mockJobPortals.ts` simuliert
daher realistische, thematisch passende Stellenanzeigen nach demselben Datenmodell wie echte
Stellenangebote (`JobPosting`) – ein späterer Anschluss an eine echte Portal-API oder einen erlaubten
Scraper kann an genau dieser Stelle erfolgen, ohne den Rest der Anwendung anzupassen.
