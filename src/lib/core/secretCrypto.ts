// -----------------------------------------------------------------------------
// At-Rest-Verschlüsselung für Geheimnisse in der Datenbank
// -----------------------------------------------------------------------------
// Aktuell betrifft das genau ein Feld: `Preferences.aiApiKey` (der KI-API-Key
// des Nutzers für OpenAI/Anthropic/OpenRouter, siehe src/lib/aiService.ts).
// Er wurde bisher im Klartext in `dev.db` gespeichert. Das ist für den
// reinen `localhost`-Betrieb ein akzeptables Risiko (wer Dateizugriff auf die
// DB hat, hat i.d.R. auch Zugriff auf `.env`), aber `dev.db` landet leicht
// versehentlich in einem Backup, einem Cloud-Sync-Ordner oder wird für einen
// Support-Screenshot geöffnet (`npx prisma studio`) — ein mitkopierter
// Klartext-Key wäre dann ein Datenleck. `src/lib/backup.ts` schließt den Key
// deshalb bereits explizit aus dem JSON-Export aus; diese Datei schützt
// zusätzlich die DB-Datei selbst.
//
// Schlüsselverwaltung:
// - Ist die Umgebungsvariable `ENCRYPTION_KEY` gesetzt (64-stelliger Hex-
//   String = 32 Byte, z. B. erzeugt mit `openssl rand -hex 32`), wird sie
//   verwendet. Empfohlen für jedes Hosting außerhalb von `localhost`.
// - Andernfalls wird beim ersten Verschlüsselungsvorgang automatisch ein
//   Schlüssel erzeugt und lokal unter `.encryption-key` (siehe .gitignore)
//   abgelegt, damit die App auch ohne manuelle Konfiguration sofort
//   funktioniert (Zero-Config für den lokalen Einzelnutzer-Betrieb).
// - WICHTIG: Geht dieser Schlüssel verloren (Datei gelöscht, kein
//   `ENCRYPTION_KEY` gesetzt und Prozess auf einem neuen Rechner/Container
//   gestartet), lässt sich ein zuvor verschlüsselter `aiApiKey` nicht mehr
//   entschlüsseln. Das ist unkritisch — der Nutzer trägt den Key in den
//   Einstellungen einfach erneut ein (`preferences-form.tsx` unterstützt das
//   ohnehin, siehe "Key entfernen"-Button).
// -----------------------------------------------------------------------------
import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // empfohlene IV-Länge für GCM
const AUTH_TAG_LENGTH = 16;
// Marker, an dem `decryptSecret()` bereits verschlüsselte Werte erkennt und
// von (vor Einführung dieser Datei gespeicherten) Klartext-Altwerten
// unterscheidet — siehe `decryptSecret()`.
const ENCRYPTED_PREFIX = "enc:v1:";

const KEY_FILE_PATH = path.join(process.cwd(), ".encryption-key");
const HEX_32_BYTES = /^[0-9a-f]{64}$/i;

let cachedKey: Buffer | null = null;

function loadOrCreateLocalKey(): Buffer {
  if (existsSync(KEY_FILE_PATH)) {
    const hex = readFileSync(KEY_FILE_PATH, "utf-8").trim();
    if (HEX_32_BYTES.test(hex)) return Buffer.from(hex, "hex");
  }

  const key = randomBytes(32);
  try {
    writeFileSync(KEY_FILE_PATH, key.toString("hex"), { mode: 0o600 });
  } catch {
    // z.B. read-only Dateisystem in manchen Hosting-Umgebungen: Der Schlüssel
    // bleibt dann nur für die Laufzeit dieses Prozesses gültig (nach einem
    // Neustart wären zuvor verschlüsselte Werte nicht mehr entschlüsselbar).
    // In diesem Fall sollte `ENCRYPTION_KEY` explizit gesetzt werden.
    console.warn(
      `secretCrypto: Konnte Schlüssel nicht unter ${KEY_FILE_PATH} persistieren. ` +
        "Setze die Umgebungsvariable ENCRYPTION_KEY für einen stabilen Schlüssel über Neustarts hinweg."
    );
  }
  return key;
}

function getEncryptionKey(): Buffer {
  if (cachedKey) return cachedKey;

  const envKey = process.env.ENCRYPTION_KEY?.trim();
  if (envKey) {
    if (!HEX_32_BYTES.test(envKey)) {
      throw new Error(
        "ENCRYPTION_KEY muss ein 32-Byte-Schlüssel als 64-stelliger Hex-String sein (z.B. erzeugt mit `openssl rand -hex 32`)."
      );
    }
    cachedKey = Buffer.from(envKey, "hex");
    return cachedKey;
  }

  cachedKey = loadOrCreateLocalKey();
  return cachedKey;
}

/** Verschlüsselt einen Klartext-String für die Speicherung in der Datenbank. */
export function encryptSecret(plainText: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plainText, "utf-8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return ENCRYPTED_PREFIX + Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

/**
 * Entschlüsselt einen mit `encryptSecret()` gespeicherten Wert. Werte ohne
 * den `enc:v1:`-Präfix gelten als Klartext-Altbestand (vor Einführung dieser
 * Verschlüsselung gespeichert) und werden unverändert zurückgegeben, statt
 * einen Fehler zu werfen — beim nächsten Speichern über die Einstellungen
 * wird der Wert automatisch verschlüsselt (siehe PATCH /api/preferences).
 */
export function decryptSecret(value: string): string {
  if (!value.startsWith(ENCRYPTED_PREFIX)) {
    return value;
  }

  const key = getEncryptionKey();
  const raw = Buffer.from(value.slice(ENCRYPTED_PREFIX.length), "base64");
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf-8");
}

export function isEncryptedSecret(value: string | null | undefined): boolean {
  return Boolean(value && value.startsWith(ENCRYPTED_PREFIX));
}
