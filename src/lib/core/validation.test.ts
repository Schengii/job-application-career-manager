import { describe, expect, it } from "vitest";
import { documentSchema, safeFileUrlSchema } from "@/lib/core/validation";

describe("safeFileUrlSchema", () => {
  it("akzeptiert gültige relative Upload-Pfade und HTTPS-URLs", () => {
    expect(safeFileUrlSchema.safeParse("/uploads/lebenslauf.pdf").success).toBe(true);
    expect(safeFileUrlSchema.safeParse("uploads/zeugnis.png").success).toBe(true);
    expect(safeFileUrlSchema.safeParse("https://blob.vercel-storage.com/doc.pdf").success).toBe(true);
    expect(safeFileUrlSchema.safeParse(null).success).toBe(false); // Schema selbst ist required string
  });

  it("lehnt Path-Traversal-Muster mit .. und Backslashes ab", () => {
    expect(safeFileUrlSchema.safeParse("../../.env").success).toBe(false);
    expect(safeFileUrlSchema.safeParse("/uploads/../../.encryption-key").success).toBe(false);
    expect(safeFileUrlSchema.safeParse("..\\..\\passwords.txt").success).toBe(false);
  });

  it("validiert Dokumente über documentSchema und blockiert Path Traversal", () => {
    const valid = documentSchema.safeParse({
      name: "Lebenslauf",
      category: "LEBENSLAUF",
      fileUrl: "/uploads/cv.pdf",
    });
    expect(valid.success).toBe(true);

    const invalid = documentSchema.safeParse({
      name: "Angriff",
      category: "SONSTIGES",
      fileUrl: "../../.env",
    });
    expect(invalid.success).toBe(false);
  });
});
