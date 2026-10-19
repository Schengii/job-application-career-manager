// -----------------------------------------------------------------------------
// Prisma Client Singleton ÔÇö Neon (PostgreSQL, serverless via HTTP)
// -----------------------------------------------------------------------------
// Nutzt PrismaNeonHttp f├╝r Vercel-kompatibles serverless PostgreSQL via Neon.
// HTTP-Transport vermeidet WebSocket-Probleme in serverless Umgebungen und
// funktioniert zuverl├ñssig auf Vercel mit Node.js 22+.
// Der Singleton verhindert im Next.js-Dev-Modus (Hot Reload) mehrfache
// Instanzen.
// -----------------------------------------------------------------------------
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const adapter = new PrismaNeonHttp(connectionString, {});
  return new PrismaClient({ adapter });
}

let cached: PrismaClient | undefined;

function getPrisma(): PrismaClient {
  cached ??= globalForPrisma.prisma ?? createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = cached;
  }
  return cached;
}

// Lazy: Der Client wird erst beim ersten Zugriff erzeugt. So scheitert der
// Next.js-Build (Page-Data-Collection) nicht, wenn DATABASE_URL zur Build-Zeit
// fehlt, z. B. bei Vercel-Preview-Deployments ohne Datenbank-Variable.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});