// -----------------------------------------------------------------------------
// Test-Hilfsfunktionen für API-Integrationstests gegen eine isolierte
// PostgreSQL-Testdatenbank (Neon) aus vitest.global-setup.ts.
// -----------------------------------------------------------------------------
import { prisma } from "@/lib/core/prisma";

/**
 * Leert alle Tabellen in einer Reihenfolge, die Fremdschlüssel-Constraints
 * respektiert (abhängige Kind-Tabellen zuerst). Wird in `beforeEach()` der
 * API-Integrationstests aufgerufen, damit jeder Test mit einer sauberen,
 * von anderen Tests unabhängigen Datenbank startet.
 */
export async function resetDb() {
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error(
      "SICHERHEITSABBRUCH: resetDb() darf nur ausgeführt werden, wenn TEST_DATABASE_URL explizit gesetzt ist (verhindert versehentliches Leeren der Entwicklungsdatenbank)."
    );
  }
  await prisma.applicationDocument.deleteMany();
  await prisma.applicationStatusEvent.deleteMany();
  await prisma.applicationInteraction.deleteMany();
  await prisma.emailSuggestion.deleteMany();
  await prisma.coverLetter.deleteMany();
  await prisma.application.deleteMany();
  await prisma.document.deleteMany();
  await prisma.jobPosting.deleteMany();
  await prisma.company.deleteMany();
  await prisma.educationEntry.deleteMany();
  await prisma.projectEntry.deleteMany();
  await prisma.careerProfile.deleteMany();
  await prisma.preferences.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.sentPushNotification.deleteMany();
  await prisma.coverLetterSnippet.deleteMany();
}

/** Legt ein minimales Unternehmen für Tests an, die eine `companyId` benötigen. */
export async function createTestCompany(overrides: Partial<{ name: string }> = {}) {
  return prisma.company.create({
    data: { name: overrides.name ?? "Test GmbH" },
  });
}
