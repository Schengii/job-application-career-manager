// -----------------------------------------------------------------------------
// VAPID-Schlüsselverwaltung für Web-Push-Benachrichtigungen (src/lib/pushNotifications.ts)
// -----------------------------------------------------------------------------
// Dasselbe Zero-Config-Muster wie src/lib/secretCrypto.ts für den
// Verschlüsselungs-Key: Sind `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` als
// Umgebungsvariablen gesetzt, werden sie verwendet (empfohlen für Hosting
// außerhalb von localhost). Andernfalls wird beim ersten Bedarf automatisch
// ein Schlüsselpaar erzeugt und lokal unter `.vapid-keys.json` (siehe
// .gitignore) persistiert, damit Web-Push ohne manuelle Konfiguration sofort
// funktioniert.
// -----------------------------------------------------------------------------
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import webpush from "web-push";

export type VapidKeyPair = { publicKey: string; privateKey: string };

const KEYS_FILE_PATH = path.join(process.cwd(), ".vapid-keys.json");

let cachedKeys: VapidKeyPair | null = null;

function loadOrCreateLocalKeys(): VapidKeyPair {
  if (existsSync(KEYS_FILE_PATH)) {
    try {
      const parsed = JSON.parse(readFileSync(KEYS_FILE_PATH, "utf-8"));
      if (parsed?.publicKey && parsed?.privateKey) return parsed;
    } catch {
      // Datei beschädigt/unlesbar -> unten neu erzeugen.
    }
  }

  const keys = webpush.generateVAPIDKeys();
  try {
    writeFileSync(KEYS_FILE_PATH, JSON.stringify(keys, null, 2), { mode: 0o600 });
  } catch {
    // z.B. read-only Dateisystem in manchen Hosting-Umgebungen: Das
    // Schlüsselpaar bleibt dann nur für die Laufzeit dieses Prozesses gültig
    // (nach einem Neustart würden zuvor registrierte Push-Subscriptions
    // ungültig, da der Browser sie gegen den ALTEN Public Key erzeugt hat).
    // In diesem Fall sollten VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY explizit
    // gesetzt werden.
    console.warn(
      `vapidKeys: Konnte Schlüsselpaar nicht unter ${KEYS_FILE_PATH} persistieren. ` +
        "Setze VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY für ein über Neustarts hinweg stabiles Schlüsselpaar."
    );
  }
  return keys;
}

export function getVapidKeys(): VapidKeyPair {
  if (cachedKeys) return cachedKeys;

  const envPublic = process.env.VAPID_PUBLIC_KEY?.trim();
  const envPrivate = process.env.VAPID_PRIVATE_KEY?.trim();
  if (envPublic && envPrivate) {
    cachedKeys = { publicKey: envPublic, privateKey: envPrivate };
    return cachedKeys;
  }

  cachedKeys = loadOrCreateLocalKeys();
  return cachedKeys;
}

export function getVapidPublicKey(): string {
  return getVapidKeys().publicKey;
}
