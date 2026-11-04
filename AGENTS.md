<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Projektüberblick

> Gemeinsame Referenz für alle KI-Werkzeuge (Claude, Gemini, …). `CLAUDE.md` enthält zusätzlich
> Claude-spezifische Befehle und verbindliche Regeln, `GEMINI.md` verweist hierher.

"Job Application & Career Manager" — eine Next.js-Vollstack-Anwendung zur Verwaltung der Jobsuche
(Fachinformatiker Anwendungsentwicklung, Frontend-Schwerpunkt). Siehe `README.md` für Setup,
Architektur und Feature-Übersicht.

- **Stack:** Next.js 16 (App Router, Turbopack), TypeScript (Strict), Tailwind CSS v4, Prisma 7 (Neon PostgreSQL via
  `PrismaNeonHttp`-Adapter, siehe `src/lib/core/prisma.ts` und `prisma.config.ts`).
- **API-Routen:** `src/app/api/**/route.ts` (REST, Zod-validiert über `src/lib/core/validation.ts`).
  Neue Routen mit `withApi`/`readJson` aus `src/lib/core/withApi.ts` bauen (einheitliche Fehlerbehandlung,
  Zod-Validierung, optionales Rate-Limit; kaputtes JSON ergibt 400); bestehende werden schrittweise migriert.
- **Domänenlogik:** Strukturiert in Submodule unter `src/lib/`:
  - `core/`: DB-Client, Validierung, SSRF-Schutz, Rate-Limiting, Verschlüsselung (`secretCrypto.ts`).
  - `applications/`: Bewerbungen, Kanban-Board, Time-Tracking (ROTI), Ghosting-Radar, Mappen-Builder.
  - `analytics/`: Response-Heatmap & Timing-Analysen (`responseHeatmap.ts`), Erfolgs- und Trichteranalysen.
  - `career/`: Kündigungsfristen & Probezeit-Rechner (`noticePeriodCalculator.ts`).
  - `companies/`: Unternehmensrecherche und Gesprächsvorbereitung (`companyPrep.ts`).
  - `documents/`: Anschreiben-Generator (`coverLetterGenerator.ts`), DIN-5008 PDF-Export, ATS-Score, JSON-Resume.
  - `email/`: IMAP-Client (`imapClient.ts`), Auto-Sync, wöchentlicher Digest.
  - `interview/`: KI-Interview-Simulator (TTS/STT), Gehaltscoach, STAR-Audit, Tech-Quiz.
  - `jobs/`: Jobsuche & Scraper (`matching.ts`, `realJobSearch.ts`, `urlJobScraper.ts`, `commuteRadar.ts`).
  - `portfolio/`: GitHub-Integration, Showcase- und PDF-Generierung (`portfolioPdfGenerator.ts`).
  - `salary/`: Benchmarks, Vergütungsrechner, Verhandlungsskripte, Arbeitsvertrags-Audit.
  - `settings/`: Backup-Rotation, Scheduler, Web-Push (`pushNotifications.ts`), KI-Tracker.
- **Prisma 7 Besonderheit:** Der generierte Client liegt unter `src/generated/prisma/` (gitignored,
  `npx prisma generate` nach jeder Schema-Änderung erneut ausführen). Modelltypen heißen
  `<Model>Model` (z. B. `CompanyModel`, `ApplicationModel`), re-exportiert in `src/types/index.ts`.
- **Testing & Linting:** Vitest (`npm run test`), Playwright (`npm run test:e2e`), ESLint (`npm run lint`).

## Verbindliche Leitplanken

- **Keine DB-Transaktionen:** `PrismaNeonHttp` lehnt jede Transaktion ab (`"Transactions are not supported
  in HTTP mode"`) — weder `$transaction(async tx => …)` noch `$transaction([…])` funktioniert. Mehrstufige
  Schreibvorgänge sequenziell ausführen und die Reihenfolge so wählen, dass ein Abbruch keinen
  inkonsistenten Zustand hinterlässt (siehe `applicationStatus.ts`, `backup.ts`). Verschachtelte Writes
  (`create` in `update`) ebenfalls vermeiden.
- **SSRF-Schutz:** Vor jedem Abruf nutzergelieferter URLs `src/lib/core/ssrfGuard.ts` verwenden.
- **Geheimnisse:** API-Keys/IMAP-Passwörter nur verschlüsselt via `src/lib/core/secretCrypto.ts` speichern.
- **Rate-Limiting:** Der Limiter (`src/lib/core/rateLimiter.ts`) liegt im Speicher je Serverless-Instanz —
  auf Vercel nur Best-Effort, keine harte Garantie.
- **Privatdaten & Hook:** Persönliche Unterlagen und `.env*` nie committen; vor jedem Commit
  `npm run security:check`, den Pre-Commit-Hook niemals mit `--no-verify` umgehen.
- **Datei-Uploads:** `@vercel/blob`, kein lokales Dateisystem in Produktion.
