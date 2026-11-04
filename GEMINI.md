# Gemini & Antigravity Guide — Job Application & Career Manager

Die gemeinsame, gepflegte Projektdokumentation (Stack, Modulstruktur unter `src/lib/`, Prisma-7-Besonderheiten,
Sicherheits-Leitplanken) steht in **[AGENTS.md](./AGENTS.md)** — dort lesen und dort ändern, damit die
Dokumente nicht auseinanderlaufen. Befehle, Env-Variablen und der Hook-Ablauf stehen in [CLAUDE.md](./CLAUDE.md).

## Gemini-spezifisch

- Lokale Schlüsseldateien (`.encryption-key`, `.vapid-keys.json`, `.ai-usage.json`) und `.env*` sind zusätzlich
  in `.geminiignore` geschützt.
- Wichtig: **keine Transaktionen** mit `PrismaNeonHttp` verwenden (Details in AGENTS.md).

```bash
npm run dev
npm run lint && npm run test
npm run security:check   # vor jedem Commit
npx prisma generate && npx prisma db push   # nach Schema-Änderungen
```
