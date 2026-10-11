# Gemini & Antigravity Guide — Job Application & Career Manager

Dieses Dokument definiert verbindliche Richtlinien für Google Gemini Modelle, Antigravity und Google Developer Tools beim Arbeiten in diesem Repository.

---

## 🧭 Kontext & Kernarchitektur

- **Framework:** Next.js 16 (App Router mit Turbopack) und React 19.
- **Typisierung & Styling:** TypeScript (Strict-Modus), Tailwind CSS v4 (`@tailwindcss/postcss`).
- **Persistenz:** Neon PostgreSQL über Prisma 7 mit `@prisma/adapter-neon` (`PrismaNeonHttp`).
  - Runtime-Queries verwenden HTTP-Transport (`DATABASE_URL`, Connection Pooler).
  - DDL-Migrationen & `npx prisma db push` nutzen Direct Connection (`DIRECT_URL`).
  - Der generierte Prisma-Client liegt in `src/generated/prisma/` und ist gitignored.
  - Modelltypen folgen der Konvention `<Model>Model` (z. B. `CompanyModel`, `ApplicationModel`), re-exportiert in `src/types/index.ts`.
- **Cloud Hosting & Speicherung:** Vercel
  - Datei-Uploads (Lebensläufe, Zeugnisse) laufen über `@vercel/blob` (keine lokalen Dateisystem-Schreibvorgänge in Vercel Serverless Functions!).
  - Tägliche Hintergrundaufgaben laufen serverless über `/api/cron/tick` (definiert in `vercel.json`), geschützt mit `CRON_SECRET`.
- **Testing:**
  - Vitest für Unit- und Integrationstests (`npm run test`).
  - Playwright für End-to-End Tests (`npm run test:e2e`).
  - ESLint 9 mit Next.js Konfiguration (`npm run lint`).

---

## 📂 Domänen- & Modulstruktur (`src/lib/`)

Logik immer modular im passenden Submodul unter `src/lib/` pflegen:

```text
src/lib/
├── core/         # Prisma-Singleton, SSRF-Filter, Rate-Limiter, Verschlüsselung, Zod-Schemas
├── applications/ # Bewerbungslogik, Kanban, Zeiterfassung (ROTI), Mappen-Kompilierung
├── analytics/    # Response-Heatmap, Erfolgs- und Trichteranalysen
├── career/       # Kündigungsfrist-Rechner
├── companies/    # Unternehmensrecherche & Interview-Vorbereitung
├── documents/    # Anschreiben-Generator (DIN 5008), ATS-Kompatibilitäts-Check, JSON-Resume
├── email/        # IMAP/TLS Postfachsynchronisation, Response-Parser, Digest-Generierung
├── interview/    # Voice-Simulator (TTS/STT), Gehaltscoach, STAR-Audit, Tech-Quiz
├── jobs/         # Live-Jobsuche (Arbeitsagentur, Arbeitnow), Scraper, Match-Score Heuristik
├── portfolio/    # GitHub-Integration & Portfolio-Showcase
├── salary/       # Total-Compensation-Rechner, Gehaltsbenchmarks, BATNA-Verhandlungsskripte
└── settings/     # Automatischer Scheduler, Web-Push (VAPID), KI-Provider & Token-Tracker
```

---

## 🔒 Sicherheits- & Datenschutz-Leitplanken

1. **Privatsphäre & Datenschutz:**
   - Echte persönliche Bewerbungsunterlagen (Zeugnisse, Lebensläufe, Adressen) unter `Bewerbungsunterlagen final/` und `public/uploads/` dürfen niemals committet werden.
   - Lokale Schlüsseldateien (`.encryption-key`, `.vapid-keys.json`, `.ai-usage.json`) und `.env*` sind in `.gitignore`, `.claudeignore` und `.geminiignore` geschützt.
2. **SSRF-Schutz:**
   - Bei allen externen URL-Aufrufen (z. B. Job-Scraper) muss zwingend `ssrfGuard` (`src/lib/core/ssrfGuard.ts`) vorgeschaltet sein, um interne Netze und Cloud-Metadaten-Endpunkte zu blockieren.
3. **At-Rest-Verschlüsselung:**
   - API-Keys und IMAP-Zugangsdaten werden über `src/lib/core/secretCrypto.ts` mit AES-256-GCM verschlüsselt in PostgreSQL gespeichert.
4. **Pre-Commit Hook (.githooks/pre-commit & scripts/check-secrets.mjs):**
   - Blockiert vor jedem Git Commit automatisch versehentlich gestagte `.env`-Dateien, echte API-Keys (`sk-`, `ghp_`, etc.) und private Bewerbungsunterlagen. Manuell prüfbar via `npm run security:check`.
5. **Basic Auth & Rate Limiting:**
   - In Produktivumgebungen schützt `middleware.ts` Routen via HTTP Basic Auth (`APP_PASSWORD`), mit Timing-Angriffsschutz und IP-basiertem Rate-Limiting.

---

## 🚀 Wichtige Entwickler-Befehle

```bash
# Entwicklungsserver starten
npm run dev

# Tests & Linting
npm run lint
npm run test
npm run test:e2e

# Sicherheit & Pre-Commit Check
npm run security:hook:install  # Git-Hook in Git aktivieren (.githooks)
npm run security:check         # Gestagte Dateien & Secrets vor Commit prüfen

# Prisma DB Push & Client-Generierung
npx prisma generate
npx prisma db push
```
