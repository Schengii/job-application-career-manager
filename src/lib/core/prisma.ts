// -----------------------------------------------------------------------------
// Prisma Client Singleton — Neon (PostgreSQL, serverless via HTTP)
// -----------------------------------------------------------------------------
// Nutzt PrismaNeonHttp für Vercel-kompatibles serverless PostgreSQL via Neon.
// HTTP-Transport vermeidet WebSocket-Probleme in serverless Umgebungen und
// funktioniert zuverlässig auf Vercel mit Node.js 22+.
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

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
