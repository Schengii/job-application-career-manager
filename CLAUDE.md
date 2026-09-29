# CLAUDE.md - Projekt-Leitfaden für Claude Code / Claude Desktop

Dieses Dokument dient als Kontext- und Architektur-Leitfaden für Claude bei der Arbeit im Projekt **Job Application & Career Manager**.

---

## 📌 Projektüberblick

- **Projektname:** Job Application & Career Manager
- **Zweck:** Professionelle Steuerung und Verwaltung der gesamten Jobsuche für Fachinformatiker für Anwendungsentwicklung (Schwerpunkt Frontend: TypeScript, React, Next.js, Tailwind CSS).
- **Architektur:** Next.js 16 Fullstack-App (App Router) mit **Neon PostgreSQL** über Prisma 7, deployed auf **Vercel**.
- **Live-URL:** https://job-application-career-manager.vercel.app
- **Wichtige Module:**
  - **Dashboard & Kanban:** Statusverwaltung für Bewerbungen und Kontakte.
  - **Browser-Extension / Web-Clipper (Manifest V3):** Erfassung von Stellen per Klick (`public/extension/`).
  - **KI-Verhandlungs-Coach & Roleplay:** Gehalt- & Interviewtraining (`/interview-prep`).
  - **Anschreiben- & Dossier-Generator:** Automatisierte Bewerbungstexte (`src/lib/documents/coverLetterGenerator.ts`).
  - **Job-Portal-Simulator & Matcher:** Scoring von Stellen (`src/lib/jobs/matching.ts`).

---

## 🛠️ Tech-Stack & Besonderheiten

- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI & Styling:** React 19, Tailwind CSS v4 (`@tailwindcss/postcss`), Lucide Icons, `next-themes`
- **Datenbank & ORM:** Prisma 7 mit **`@prisma/adapter-neon` (PrismaNeonHttp)** + Neon PostgreSQL Serverless
  - *Wichtig:* Der generierte Prisma-Client liegt unter `src/generated/prisma/` (in `.gitignore`).
  - Prisma Client Singleton in `src/lib/core/prisma.ts` — nutzt `PrismaNeonHttp` (HTTP-Transport, kein WebSocket).
  - Modelltypen folgen der Konvention `<Model>Model` (z. B. `CompanyModel`, `JobPostingModel`), re-exportiert in `src/types/index.ts`.
  - Nach jeder Schema-Änderung in `prisma/schema.prisma`: `npx prisma generate && npx prisma db push` ausführen!
  - `DIRECT_URL` (Non-Pooler) für `prisma db push` in `prisma.config.ts` konfiguriert.
- **Datei-Uploads:** Vercel Blob (`@vercel/blob`) — `put()` / `del()` aus `@vercel/blob`, kein lokales Dateisystem.
- **Hintergrund-Jobs:** Lokal via `src/instrumentation.ts` (setInterval), auf Vercel via Cron Job (`vercel.json`, täglich 8 Uhr) → `GET /api/cron/tick` mit `CRON_SECRET`-Authentifizierung.
- **Validierung:** Zod (`src/lib/core/validation.ts`) für alle API-Routen (`src/app/api/**/route.ts`).
- **State & Data Fetching:** SWR für Client-Caching, App Router Route Handlers.
- **Testing:**
  - Unit/Integration: Vitest (`vitest.config.mts`, `vitest.global-setup.ts` führt `prisma db push --force-reset` aus)
  - E2E: Playwright (`playwright.config.mts`, `e2e/`)

---

## 🚀 Häufige Befehle

```bash
# Entwicklungsserver starten
npm run dev

# Tests ausführen
npm run test           # Vitest einmalig
npm run test:watch     # Vitest im Watch-Modus
npm run test:e2e       # Playwright E2E-Tests

# Linting & Code-Qualität
npm run lint

# Prisma & Datenbank
npx prisma generate    # Prisma-Client generieren (nach Schema-Änderungen)
npx prisma db push     # Schema-Änderungen auf Neon PostgreSQL übertragen
npx prisma studio      # Grafische Datenbankoberfläche

# Build & Produktion
npm run build
npm run start

# Vercel Deployment
vercel env pull        # Production-Vars lokal ziehen
vercel --prod          # Production-Deploy
```

---

## 📁 Wichtige Verzeichnisse & Dateistruktur

```text
├── src/
│   ├── app/                 # Next.js App Router (Pages & API-Routen)
│   │   ├── api/             # REST-Endpunkte (Jobs, Applications, Settings, Cron etc.)
│   │   │   └── cron/tick/   # Vercel Cron Endpunkt (GET, auth via CRON_SECRET)
│   │   └── ...              # UI-Routen (/jobs, /companies, /interview-prep etc.)
│   ├── components/          # Reusable React-Komponenten (UI, Layout, Modals)
│   ├── lib/                 # Core-Business-Logik, Services & Utilities
│   │   ├── core/
│   │   │   ├── prisma.ts    # Prisma Client Singleton (PrismaNeonHttp)
│   │   │   ├── validation.ts # Zod-Schemas für Requests
│   │   │   └── secretCrypto.ts # Verschlüsselung für API-Keys/Geheimnisse
│   │   └── ...              # Feature-Bereiche: jobs, salary, interview, documents, email, settings
│   ├── types/               # TypeScript Typdefinitionen & Prisma Model-Re-Exporte
│   └── generated/prisma/    # Generierter Prisma 7 Client (gitignored)
├── prisma/
│   └── schema.prisma        # Datenbankschema (PostgreSQL)
├── prisma.config.ts         # DIRECT_URL für prisma db push (Non-Pooler)
├── vercel.json              # Vercel Cron-Konfiguration (täglich 8 Uhr UTC)
├── e2e/                     # Playwright End-to-End Tests
├── public/                  # Statische Assets & Browser-Extension
└── scripts/                 # Hilfs- und Import-Skripte
```

---

## ⚠️ Entwicklungs-Richtlinien & Best Practices

1. **Typensicherheit:** Niemals unüberprüfte `any`-Typen verwenden. Alle API-Inputs über Zod validieren.
2. **Next.js 16 & React 19:**
   - Client Components explizit mit `'use client';` kennzeichnen, wenn Hooks (`useState`, `useEffect`, `useSWR`) verwendet werden.
   - Server Components standardmäßig bevorzugen.
3. **Prisma 7:** Niemals direkt im generierten Client editieren. Typen immer aus `src/types` bzw. `src/generated/prisma/client` beziehen. Adapter: `PrismaNeonHttp` (HTTP-basiert, kein WebSocket — zuverlässiger auf Vercel Node.js 22+).
4. **Datei-Uploads:** Immer `@vercel/blob` nutzen (`put`, `del`). Kein lokales Dateisystem in Production. Bestehende lokale Pfade (`/uploads/...`) werden als Fallback weiterhin unterstützt.
5. **Sicherheit & Datenschutz:**
   - Niemals API-Keys oder sensible Daten hardcoden.
   - `.env` (mit echten Neon-URLs) niemals in Git committen — liegt in `.gitignore`.
   - Cron-Endpunkt (`/api/cron/tick`) ist fail-closed: Auf Vercel ohne `CRON_SECRET` → 500, mit falschem Token → 401. `crypto.timingSafeEqual` für Timing-sicheren Vergleich.
6. **Code-Style:**
   - Saubere Trennung von Domänenlogik (`src/lib`) und UI-Komponenten (`src/components`).
   - Tailwind CSS v4 Utilities verwenden, einheitliche Farb- und Spacing-Konventionen einhalten.

---

## 🌐 Umgebungsvariablen

| Variable | Zweck | Pflicht |
|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL Pooler-URL (für Laufzeit) | ✅ |
| `DIRECT_URL` | Neon PostgreSQL Direct-URL (für `prisma db push`) | ✅ |
| `ENCRYPTION_KEY` | AES-256-GCM Key für API-Keys & IMAP-Passwort at-rest | ✅ |
| `CRON_SECRET` | Bearer-Token für `/api/cron/tick` (Vercel Cron Auth) | Vercel |
| `VAPID_PUBLIC_KEY` | VAPID Public Key für Web Push | Optional |
| `VAPID_PRIVATE_KEY` | VAPID Private Key für Web Push | Optional |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob Token für Datei-Uploads | Optional |
| `APP_PASSWORD` | Passwort für Zugangsschutz via `middleware.ts` | Optional |
