// -----------------------------------------------------------------------------
// Hilfsfunktion für den Zugriff auf die (einzige) Präferenzen-/Profil-Zeile.
// Legt beim ersten Aufruf automatisch einen Datensatz mit sinnvollen
// Standardwerten an ("Singleton mit id = 'default'").
// -----------------------------------------------------------------------------
import { prisma } from "@/lib/core/prisma";
import { decryptSecret } from "@/lib/core/secretCrypto";

/**
 * Entschlüsselt ein einzelnes verschlüsseltes Secret-Feld (siehe
 * src/lib/secretCrypto.ts), falls gesetzt. Generische Grundlage für
 * `withDecryptedApiKey`/`withDecryptedImapPassword` unten — Ver-/Entschlüsselung
 * bleibt so an einer Stelle, auch wenn inzwischen zwei Secret-Felder existieren
 * (`aiApiKey`, `imapPassword`).
 */
function withDecryptedSecret<T extends Record<K, string | null>, K extends string>(
  preferences: T,
  key: K
): T {
  const value = preferences[key];
  if (!value) return preferences;
  return { ...preferences, [key]: decryptSecret(value) };
}

/**
 * Entschlüsselt `aiApiKey`, falls gesetzt. Wird an der einen zentralen Stelle
 * angewendet, an der Preferences aus der DB gelesen werden, damit der Rest
 * der App (Masking in `toPublicPreferences`, Weiterreichen an den LLM-Provider
 * in `/api/ai/route.ts`) weiterhin ganz normal mit dem Klartext-Key arbeitet.
 */
export function withDecryptedApiKey<T extends { aiApiKey: string | null }>(preferences: T): T {
  return withDecryptedSecret(preferences, "aiApiKey");
}

/**
 * Entschlüsselt `imapPassword`, falls gesetzt — analog zu `withDecryptedApiKey`.
 * Wird u.a. von `getOrCreatePreferences()`/`getPreferencesWithProfile()` sowie
 * direkt von `src/lib/imapClient.ts` (echter IMAP-Sync) benötigt.
 */
export function withDecryptedImapPassword<T extends { imapPassword: string | null }>(preferences: T): T {
  return withDecryptedSecret(preferences, "imapPassword");
}

export async function getOrCreatePreferences() {
  const existing = await prisma.preferences.findUnique({ where: { id: "default" } });
  if (existing) return withDecryptedImapPassword(withDecryptedApiKey(existing));

  return prisma.preferences.create({
    data: { id: "default" },
  });
}

export async function getPreferencesWithProfile() {
  await getOrCreatePreferences();
  const preferences = await prisma.preferences.findUniqueOrThrow({
    where: { id: "default" },
    include: {
      educationEntries: { orderBy: { sortOrder: "asc" } },
      projectEntries: { orderBy: { sortOrder: "asc" } },
    },
  });
  return withDecryptedImapPassword(withDecryptedApiKey(preferences));
}

// -----------------------------------------------------------------------------
// Sicherheit: Secret-Felder (`aiApiKey`, `imapPassword`) dürfen niemals im
// Klartext an den Browser zurückgegeben werden. `getPreferencesWithProfile()`/
// `getOrCreatePreferences()` liefern den echten Wert nur für den
// serverseitigen Gebrauch (siehe `/api/ai/route.ts` bzw. `src/lib/imapClient.ts`).
// Jede Route, die Präferenzen an den Client zurückgibt, MUSS stattdessen
// `toPublicPreferences()` verwenden.
// -----------------------------------------------------------------------------
export function maskSecret(secret: string | null | undefined): string | null {
  const trimmed = secret?.trim();
  if (!trimmed) return null;
  if (trimmed.length <= 4) return "••••";
  return `••••••••${trimmed.slice(-4)}`;
}

export function toPublicPreferences<
  T extends { aiApiKey: string | null; imapPassword: string | null },
>(
  preferences: T
): Omit<T, "aiApiKey" | "imapPassword"> & {
  aiApiKey: null;
  hasAiApiKey: boolean;
  aiApiKeyPreview: string | null;
  imapPassword: null;
  hasImapPassword: boolean;
  imapPasswordPreview: string | null;
} {
  const { aiApiKey, imapPassword, ...rest } = preferences;
  return {
    ...rest,
    aiApiKey: null,
    hasAiApiKey: Boolean(aiApiKey && aiApiKey.trim()),
    aiApiKeyPreview: maskSecret(aiApiKey),
    imapPassword: null,
    hasImapPassword: Boolean(imapPassword && imapPassword.trim()),
    imapPasswordPreview: maskSecret(imapPassword),
  };
}
