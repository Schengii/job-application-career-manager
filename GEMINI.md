# Gemini Assistant Guide — Job Application & Career Manager

Dieses Dokument definiert spezifische Richtlinien für Google Gemini und die Antigravity-IDE beim Arbeiten mit dieser Codebase.

---

## 🧭 Kontext & Kernarchitektur

- **Framework:** Next.js 16 (App Router mit Turbopack) und React 19.
- **Typisierung & Styling:** TypeScript (Strict-Modus), Tailwind CSS v4.
- **Persistenz:** Neon PostgreSQL über Prisma 7 mit `@prisma/adapter-neon` (`PrismaNeonHttp`).
  - Der generierte Client liegt in `src/generated/prisma/client` und ist gitignored.
- **Testing:**
  - Vitest für Unit- und Integrationstests (`npm run test`). Verwendet eine isolierte Testdatenbank via `vitest.global-setup.ts`.
  - Playwright für End-to-End Tests (`npm run test:e2e`).
  - ESLint 9 mit Next.js Konfiguration (`npm run lint`).

---

## 📂 Domänen- & Modulstruktur (`src/lib/`)

Beim Bearbeiten oder Erweitern von Geschäftslogik immer das passende Submodul verwenden:

```text
src/lib/
├── core/         # Prisma-Singleton, SSRF-Filter, Rate-Limiter, Verschlüsselung, Zod-Schemas
├── applications/ # Bewerbungslogik, Kanban, Zeiterfassung (ROTI), PDF-Mappen-Kompilierung
├── jobs/         # Live-Jobsuche (Arbeitsagentur, Arbeitnow), Scraper, Match-Score Heuristik
├── interview/    # Voice-Simulator (TTS/STT), Gehaltscoach, STAR-Audit Heuristik
├── documents/    # Anschreiben-Generator (DIN 5008), ATS-Kompatibilitäts-Check, JSON-Resume
├── salary/       # Total-Compensation-Rechner, Gehaltsbenchmarks, BATNA-Verhandlungsskripte
├── email/        # IMAP/TLS Postfachsynchronisation, Response-Parser, Digest-Generierung
└── settings/     # Automatischer Scheduler, Web-Push (VAPID), KI-Provider & Token-Tracker
```

---

## 🔒 Sicherheits- & Datenschutz-Leitplanken

1. **Privatsphäre & Datenschutz:**
   - Echte persönliche Bewerbungsunterlagen (Zeugnisse, Lebensläufe, Adressen) unter `Bewerbungsunterlagen final/` und `public/uploads/` dürfen niemals in Git committet werden.
   - Lokale Schlüsseldateien (`.encryption-key`, `.vapid-keys.json`, `.ai-usage.json`) sind in `.gitignore` und `.claudeignore` geschützt.
2. **SSRF-Schutz:**
   - Bei allen externen URL-Aufrufen (z. B. Job-Scraper) muss der `ssrfGuard` (`src/lib/core/ssrfGuard.ts`) vorgeschaltet sein, um Zugriff auf interne Netze und Metadaten-Endpunkte zu blockieren.
3. **At-Rest-Verschlüsselung:**
   - API-Keys und IMAP-Zugangsdaten werden über `src/lib/core/secretCrypto.ts` mit AES-256-GCM verschlüsselt in SQLite gespeichert.
4. **Pre-Commit Hook (.githooks/pre-commit & scripts/check-secrets.mjs):**
   - Blockiert vor jedem Git Commit automatisch versehentlich gestagte `.env`-Dateien, echte API-Keys (`sk-`, `ghp_`, etc.) und private Bewerbungsunterlagen. Manuell prüfbar via `npm run security:check`.

---

## 🚀 Wichtige Entwickler-Befehle

```bash
# Entwicklungsserver starten
npm run dev

# Tests & Linting
npm run lint
npm run test
npm run test:e2e

# Prisma DB Push & Client-Generierung
npx prisma db push
npx prisma generate
```
