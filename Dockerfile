# -----------------------------------------------------------------------------
# Dockerfile — Job Application & Career Manager
# -----------------------------------------------------------------------------
# Mehrstufiger Build für reproduzierbares Self-Hosting außerhalb von Vercel.
#
# Bewusst `node:20-bookworm-slim` (Debian/glibc) statt `node:20-alpine`: Die
# App hängt zur Laufzeit von `better-sqlite3` ab, einem nativen Node-Addon,
# das beim `npm install` aus dem Quellcode kompiliert wird. Auf Alpine
# (musl-libc) bedeutet das zusätzliche musl-spezifische Build-Fallstricke und
# einen größeren Kompatibilitäts-Blast-Radius für ein Einzelnutzer-Projekt,
# bei dem Image-Größe zweitrangig ist — Debian-slim mit Standard-Build-Tools
# ist der robustere Kompromiss.
#
# Bewusst KEIN `output: "standalone"` in next.config.ts: Next.js' File-Tracing
# für den Standalone-Modus erkennt native Node-Addons wie better-sqlite3s
# .node-Binary nicht immer zuverlässig automatisch (bekannter Stolperstein
# bei nativen SQLite-Bindings). Statt das Risiko einer zur Laufzeit fehlenden
# `.node`-Datei einzugehen, wird hier der komplette Produktions-`node_modules`-
# Baum (inkl. der bereits im Build kompilierten nativen Binaries) unverändert
# in das Runtime-Image übernommen — größer, aber garantiert vollständig.
# -----------------------------------------------------------------------------

FROM node:20-bookworm-slim AS deps
WORKDIR /app
# python3/make/g++: Build-Toolchain, die `npm install` für better-sqlite3
# (node-gyp) benötigt — nur in dieser Stage, landet nicht im finalen Image.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generiert den Prisma-Client nach src/generated/prisma (siehe AGENTS.md:
# Prisma-7-Besonderheit dieses Projekts) — vor `next build`, da die App-Typen
# davon abhängen.
RUN npx prisma generate
# `next build` inkl. TypeScript-Check (siehe package.json-Kommentar zu
# `npm run build`). DATABASE_URL wird nur für den (hier ungenutzten)
# Build-Time-Schema-Zugriff von Prisma verlangt, nicht für tatsächliche
# Datenbankzugriffe während des Builds.
ENV DATABASE_URL="file:/app/prisma/dev.db"
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/middleware.ts ./middleware.ts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Verzeichnisse für persistente Daten (SQLite-DB, Uploads, Backups,
# Verschlüsselungsschlüssel/VAPID-Keys, siehe docker-compose.yml für die
# zugehörigen Volume-Mounts) müssen dem nicht-root-Nutzer gehören.
RUN mkdir -p /app/prisma /app/public/uploads /app/backups \
    && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
