// -----------------------------------------------------------------------------
// Prisma Client Singleton — Neon (PostgreSQL, serverless)
// -----------------------------------------------------------------------------
// Nutzt den @prisma/adapter-neon Adapter für Vercel-kompatibles serverless
// PostgreSQL via Neon. Der Singleton verhindert im Next.js-Dev-Modus
// (Hot Reload) mehrfache Verbindungen.
// -----------------------------------------------------------------------------
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";

// Neon serverless benötigt WebSockets außerhalb der Browser-Umgebung
// (Node.js / Vercel Serverless Functions).
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pool = new Pool({ connectionString }) as any;
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
