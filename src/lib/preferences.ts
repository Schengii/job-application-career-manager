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

// -----------------------------------------------------------------------------
// Sicherheit: Der KI-API-Key (`aiApiKey`) darf niemals im Klartext an den
// Browser zurückgegeben werden (er ist ein Geheimnis des Nutzers, z. B. ein
// OpenAI/Anthropic-Key). `getPreferencesWithProfile()`/`getOrCreatePreferences()`
// liefern den echten Key nur für den serverseitigen Gebrauch (siehe
// `/api/ai/route.ts`, das den Key direkt an den jeweiligen LLM-Provider
// weiterreicht). Jede Route, die Präferenzen an den Client zurückgibt, MUSS
// stattdessen `toPublicPreferences()` verwenden.
// -----------------------------------------------------------------------------
export function maskApiKey(apiKey: string | null | undefined): string | null {
  const trimmed = apiKey?.trim();
  if (!trimmed) return null;
  if (trimmed.length <= 4) return "••••";
  return `••••••••${trimmed.slice(-4)}`;
}

export function toPublicPreferences<T extends { aiApiKey: string | null }>(
  preferences: T
): Omit<T, "aiApiKey"> & { aiApiKey: null; hasAiApiKey: boolean; aiApiKeyPreview: string | null } {
  const { aiApiKey, ...rest } = preferences;
  return {
    ...rest,
    aiApiKey: null,
    hasAiApiKey: Boolean(aiApiKey && aiApiKey.trim()),
    aiApiKeyPreview: maskApiKey(aiApiKey),
  };
}
