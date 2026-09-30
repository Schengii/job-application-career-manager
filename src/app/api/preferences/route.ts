// -----------------------------------------------------------------------------
// GET   /api/preferences  -> Präferenzen & Profil (inkl. Ausbildung/Projekte)
// PATCH /api/preferences  -> Präferenzen aktualisieren (Upsert des Singletons)
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { preferencesSchema } from "@/lib/core/validation";
import { handleApiError } from "@/lib/core/apiUtils";
import {
  getPreferencesWithProfile,
  toPublicPreferences,
  withDecryptedApiKey,
  withDecryptedImapPassword,
  withDecryptedSmtpPassword,
} from "@/lib/settings/preferences";
import { encryptSecret } from "@/lib/core/secretCrypto";

export async function GET() {
  const preferences = await getPreferencesWithProfile();
  return NextResponse.json(toPublicPreferences(preferences));
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const data = preferencesSchema.parse(body);

    // Sicherheit: Secret-Felder (`aiApiKey`, `imapPassword`) werden nur
    // überschrieben, wenn das jeweilige Feld explizit im Request-Body
    // enthalten ist. Ein leerer String ("") entfernt den Wert bewusst (z. B.
    // über den "Key/Passwort entfernen"-Button im Frontend); fehlt das Feld
    // komplett, bleibt der zuvor gespeicherte Wert unverändert, damit das
    // Frontend den echten Wert niemals zurückgeschickt bekommen und erneut
    // mitsenden muss (siehe `toPublicPreferences`).
    const updateData = { ...data };
    if ("aiApiKey" in updateData) {
      const trimmed = updateData.aiApiKey?.trim();
      // Verschlüsselung at-rest (siehe src/lib/secretCrypto.ts): der Klartext-
      // Wert verlässt diese Route ab hier nie wieder, nur der Chiffretext wird
      // in die DB geschrieben.
      updateData.aiApiKey = trimmed ? encryptSecret(trimmed) : null;
    }
    if ("imapPassword" in updateData) {
      const trimmed = updateData.imapPassword?.trim();
      updateData.imapPassword = trimmed ? encryptSecret(trimmed) : null;
    }
    if ("smtpPassword" in updateData) {
      const trimmed = updateData.smtpPassword?.trim();
      updateData.smtpPassword = trimmed ? encryptSecret(trimmed) : null;
    }

    const existingPref = await prisma.preferences.findUnique({
      where: { id: "default" },
    });

    const preferences = existingPref
      ? await prisma.preferences.update({
          where: { id: "default" },
          data: updateData,
        })
      : await prisma.preferences.create({
          data: { id: "default", ...updateData },
        });

    // `preferences.aiApiKey`/`imapPassword` sind an dieser Stelle der frisch
    // verschlüsselte Chiffretext aus dem `upsert()` oben (Prisma gibt exakt
    // das zurück, was geschrieben wurde). `toPublicPreferences()`/
    // `maskSecret()` erwarten Klartext, um z.B. die letzten 4 Zeichen als
    // Vorschau anzuzeigen -> vor der Maskierung entschlüsseln, genau wie bei
    // jedem anderen DB-Read (siehe `withDecryptedApiKey()`/
    // `withDecryptedImapPassword()` in src/lib/preferences.ts).
    return NextResponse.json(
      toPublicPreferences(withDecryptedSmtpPassword(withDecryptedImapPassword(withDecryptedApiKey(preferences))))
    );
  } catch (error) {
    return handleApiError(error);
  }
}
