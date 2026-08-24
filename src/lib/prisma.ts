// -----------------------------------------------------------------------------
// Prisma Client Singleton
// -----------------------------------------------------------------------------
// Prisma 7 verwendet für SQLite einen "driver adapter" statt der eingebauten
// Query-Engine. Wir nutzen `better-sqlite3` (synchron, sehr schnell, ideal für
// lokale Entwicklung). Der Singleton verhindert, dass im Next.js-Dev-Modus
// (Hot Reload) bei jedem Request eine neue DB-Verbindung aufgebaut wird.
// -----------------------------------------------------------------------------
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // better-sqlite3 erwartet einen Dateipfad, kein "file:"-URI-Präfix.
  const rawUrl = process.env.DATABASE_URL ?? "file:./dev.db";
  const filePath = rawUrl.startsWith("file:") ? rawUrl.slice(5) : rawUrl;
  const adapter = new PrismaBetterSqlite3({ url: filePath });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
