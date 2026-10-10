# -----------------------------------------------------------------------------
# Dockerfile — Job Application & Career Manager
# -----------------------------------------------------------------------------
# Mehrstufiger Build für reproduzierbares Self-Hosting außerhalb von Vercel.
#
# Basis-Image `node:22-bookworm-slim` (Node 22+ wird für den PrismaNeonHttp-
# Adapter empfohlen, siehe README). Die App nutzt Neon-PostgreSQL über HTTP:
# eine erreichbare DATABASE_URL ist daher zur Laufzeit Pflicht; im Image selbst
# steckt keine Datenbank. Native Build-Tools werden nicht mehr benötigt.
# -----------------------------------------------------------------------------

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: das postinstall (`prisma generate`) braucht Schema und
# prisma.config.ts, die in dieser Stage noch nicht kopiert sind. Der Client
# wird in der builder-Stage generiert.
RUN npm ci --ignore-scripts

FROM node:22-bookworm-slim AS builder
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
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN npm run build

FROM node:22-bookworm-slim AS runner
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

# Verzeichnisse für persistente Daten (Uploads, Backups,
# Verschlüsselungsschlüssel/VAPID-Keys, siehe docker-compose.yml für die
# zugehörigen Volume-Mounts) müssen dem nicht-root-Nutzer gehören.
RUN mkdir -p /app/prisma /app/public/uploads /app/backups \
    && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
