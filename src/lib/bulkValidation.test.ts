import { describe, expect, it } from "vitest";
import { z } from "zod";

const bulkRowSchema = z.object({
  id: z.string().optional(),
  companyName: z.string().min(1, "Unternehmensname ist erforderlich"),
  position: z.string().min(1, "Position ist erforderlich"),
  status: z.enum(["DRAFT", "SENT", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"]).default("DRAFT"),
  applicationDate: z.string().nullable().optional(),
  portal: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  nextStep: z.string().nullable().optional(),
  nextStepDate: z.string().nullable().optional(),
});

describe("bulkRowSchema", () => {
  it("validiert korrekte Excel-Zeilen erfolgreich", () => {
    const validRow = {
      companyName: "CodeCraft GmbH",
      position: "Frontend Entwickler",
      status: "SENT" as const,
      applicationDate: "2026-08-20",
      portal: "Stepstone",
      notes: "Bewerbung per Mail versendet",
    };

    const parsed = bulkRowSchema.parse(validRow);
    expect(parsed.companyName).toBe("CodeCraft GmbH");
    expect(parsed.status).toBe("SENT");
  });

  it("schlägt fehl wenn Pflichtfelder fehlen", () => {
    expect(() => bulkRowSchema.parse({ position: "Frontend" })).toThrow();
  });
});
