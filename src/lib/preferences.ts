// -----------------------------------------------------------------------------
// Hilfsfunktion für den Zugriff auf die (einzige) Präferenzen-/Profil-Zeile.
// Legt beim ersten Aufruf automatisch einen Datensatz mit sinnvollen
// Standardwerten an ("Singleton mit id = 'default'").
// -----------------------------------------------------------------------------
import { prisma } from "./prisma";

export async function getOrCreatePreferences() {
  const existing = await prisma.preferences.findUnique({ where: { id: "default" } });
  if (existing) return existing;

  return prisma.preferences.create({
    data: { id: "default" },
  });
}

export async function getPreferencesWithProfile() {
  await getOrCreatePreferences();
  return prisma.preferences.findUniqueOrThrow({
    where: { id: "default" },
    include: {
      educationEntries: { orderBy: { sortOrder: "asc" } },
      projectEntries: { orderBy: { sortOrder: "asc" } },
    },
  });
}
