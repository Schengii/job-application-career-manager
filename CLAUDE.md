# CLAUDE.md - Projekt-Leitfaden für Claude Code / Claude Desktop

Dieses Dokument dient als Kontext- und Architektur-Leitfaden für Claude bei der Arbeit im Projekt **Job Application & Career Manager**.

---

## 📌 Projektüberblick

- **Projektname:** Job Application & Career Manager
- **Zweck:** Professionelle Steuerung und Verwaltung der gesamten Jobsuche für Fachinformatiker für Anwendungsentwicklung (Schwerpunkt Frontend: TypeScript, React, Next.js, Tailwind CSS).
- **Architektur:** Next.js 16 Fullstack-App (App Router) mit lokaler SQLite-Datenbank über Prisma 7.
- **Wichtige Module:**
  - **Dashboard & Kanban:** Statusverwaltung für Bewerbungen und Kontakte.
  - **Browser-Extension / Web-Clipper (Manifest V3):** Erfassung von Stellen per Klick (`public/extension` bzw. Extension-Dateien).
  - **KI-Verhandlungs-Coach & Roleplay:** Gehalt- & Interviewtraining (`/interview-prep`).
  - **Anschreiben- & Dossier-Generator:** Automatisierte Bewerbungstexte (`src/lib/coverLetterGenerator.ts`).
  - **Job-Portal-Simulator & Matcher:** Scoring von Stellen (`src/lib/matching.ts`, `src/lib/mockJobPortals.ts`).

---

## 🛠️ Tech-Stack & Besonderheiten

- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI & Styling:** React 19, Tailwind CSS v4 (`@tailwindcss/postcss`), Lucide Icons, `next-themes`
- **Datenbank & ORM:** Prisma 7 mit `@prisma/adapter-better-sqlite3` und `better-sqlite3`
  - *Wichtig:* Der generierte Prisma-Client liegt unter `src/generated/prisma/` (in `.gitignore`).
  - Modelltypen folgen der Konvention `<Model>Model` (z. B. `CompanyModel`, `JobPostingModel`), re-exportiert in `src/types/index.ts`.
  - Nach jeder Schema-Änderung in `prisma/schema.prisma` immer `npx prisma generate` ausführen!
- **Validierung:** Zod (`src/lib/validation.ts`) für alle API-Routen (`src/app/api/**/route.ts`).
- **State & Data Fetching:** SWR für Client-Caching, Server Actions & App Router Route Handlers.
- **Testing:**
  - Unit/Integration: Vitest (`vitest.config.mts`, `vitest.global-setup.ts`)
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
npx prisma db push     # Schema-Änderungen auf lokale SQLite übertragen
npx prisma studio      # Grafische Datenbankoberfläche

# Build & Produktion
npm run build
npm run start
```

---

## 📁 Wichtige Verzeichnisse & Dateistruktur

```text
├── src/
│   ├── app/                 # Next.js App Router (Pages & API-Routen)
│   │   ├── api/             # REST-Endpunkte (Jobs, Applications, Settings etc.)
│   │   └── ...              # UI-Routen (/jobs, /companies, /interview-prep etc.)
│   ├── components/          # Reusable React-Komponenten (UI, Layout, Modals)
│   ├── lib/                 # Core-Business-Logik, Services & Utilities
│   │   ├── prisma.ts        # Prisma Client Instanz mit SQLite Adapter
│   │   ├── matching.ts      # Match-Score-Algorithmus
│   │   ├── validation.ts    # Zod-Schemas für Requests
│   │   └── secretCrypto.ts  # Verschlüsselung für API-Keys/Geheimnisse
│   ├── types/               # TypeScript Typdefinitionen & Model-Re-Exporte
│   └── generated/prisma/    # Generierter Prisma 7 Client (gitignored)
├── prisma/
│   └── schema.prisma        # Datenbankschema (SQLite)
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
3. **Prisma 7:** Niemals direkt im generierten Client editieren. Typen immer aus `src/types` bzw. `src/generated/prisma/client` beziehen.
4. **Sicherheit & Datenschutz:**
   - Niemals API-Keys oder sensible Daten hardcoden.
   - Lokale SQLite-Datenbanken (`dev.db`) und private Dokumente (`Bewerbungsunterlagen final/`) niemals in Git committen.
5. **Code-Style:**
   - Saubere Trennung von Domänenlogik (`src/lib`) und UI-Komponenten (`src/components`).
   - Tailwind CSS v4 Utilities verwenden, einheitliche Farb- und Spacing-Konventionen einhalten.
