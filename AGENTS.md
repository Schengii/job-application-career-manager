<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Projektüberblick

"Job Application & Career Manager" — eine Next.js-Vollstack-Anwendung zur Verwaltung der Jobsuche
(Fachinformatiker Anwendungsentwicklung, Frontend-Schwerpunkt). Siehe `README.md` für Setup,
Architektur und Feature-Übersicht.

- **Stack:** Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4, Prisma 7 (SQLite via
  `better-sqlite3`-Adapter, siehe `src/lib/prisma.ts` und `prisma.config.ts`).
- **API-Routen:** `src/app/api/**/route.ts` (REST, Zod-validiert über `src/lib/validation.ts`).
- **Domänenlogik:** `src/lib/matching.ts` (Match-Score), `src/lib/mockJobPortals.ts`
  (Job-Portal-Simulator), `src/lib/coverLetterGenerator.ts` (Anschreiben-Generator).
- **Prisma 7 Besonderheit:** Der generierte Client liegt unter `src/generated/prisma/` (gitignored,
  `npx prisma generate` nach jeder Schema-Änderung erneut ausführen). Modelltypen heißen
  `<Model>Model` (z. B. `CompanyModel`), re-exportiert in `src/types/index.ts`.
