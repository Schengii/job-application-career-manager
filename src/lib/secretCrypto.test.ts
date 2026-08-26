import { describe, it, expect } from "vitest";
import { encryptSecret, decryptSecret, isEncryptedSecret } from "./secretCrypto";

describe("secretCrypto", () => {
  it("verschlüsselt und entschlüsselt einen Wert roundtrip-sicher", () => {
    const plain = "sk-openai-abcdef1234567890";
    const encrypted = encryptSecret(plain);

    expect(encrypted).not.toBe(plain);
    expect(encrypted.startsWith("enc:v1:")).toBe(true);
    expect(decryptSecret(encrypted)).toBe(plain);
  });

  it("erzeugt für denselben Klartext unterschiedliche Chiffretexte (zufällige IV)", () => {
    const plain = "sk-same-key-twice";
    expect(encryptSecret(plain)).not.toBe(encryptSecret(plain));
  });

  it("gibt Klartext-Altbestand ohne Präfix unverändert zurück (Rückwärtskompatibilität)", () => {
    expect(decryptSecret("sk-legacy-plaintext-key")).toBe("sk-legacy-plaintext-key");
  });

  it("isEncryptedSecret erkennt verschlüsselte vs. Klartext-Werte", () => {
    expect(isEncryptedSecret(encryptSecret("x"))).toBe(true);
    expect(isEncryptedSecret("sk-plain")).toBe(false);
    expect(isEncryptedSecret(null)).toBe(false);
    expect(isEncryptedSecret(undefined)).toBe(false);
  });
});
