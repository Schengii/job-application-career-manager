// -----------------------------------------------------------------------------
// Test-Hilfsfunktionen für API-Integrationstests gegen die echte (aber
// isolierte) SQLite-Testdatenbank aus vitest.global-setup.ts.
// -----------------------------------------------------------------------------
import { prisma } from "@/lib/prisma";

/**
 * Leert alle Tabellen in einer Reihenfolge, die Fremdschlüssel-Constraints
 * respektiert (abhängige Kind-Tabellen zuerst). Wird in `beforeEach()` der
 * API-Integrationstests aufgerufen, damit jeder Test mit einer sauberen,
 * von anderen Tests unabhängigen Datenbank startet.
 */
export async function resetDb() {
  await prisma.applicationDocument.deleteMany();
  await prisma.applicationStatusEvent.deleteMany();
  await prisma.applicationInteraction.deleteMany();
  await prisma.coverLetter.deleteMany();
  await prisma.application.deleteMany();
  await prisma.document.deleteMany();
  await prisma.jobPosting.deleteMany();
  await prisma.company.deleteMany();
  await prisma.educationEntry.deleteMany();
  await prisma.projectEntry.deleteMany();
  await prisma.preferences.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.sentPushNotification.deleteMany();
}

/** Legt ein minimales Unternehmen für Tests an, die eine `companyId` benötigen. */
export async function createTestCompany(overrides: Partial<{ name: string }> = {}) {
  return prisma.company.create({
    data: { name: overrides.name ?? "Test GmbH" },
  });
}
