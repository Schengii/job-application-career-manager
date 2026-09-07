import { describe, it, expect } from "vitest";
import { buildMimeMessage, sendApplicationEmail, SmtpConfig } from "@/lib/email/smtpClient";

describe("smtpClient", () => {
  it("erstellt eine saubere MIME-Nachricht ohne Anhang", () => {
    const mime = buildMimeMessage(
      "me@test.de",
      "hr@company.de",
      "Bewerbung als Entwickler",
      "Sehr geehrte Damen und Herren,\n\nanbei meine Bewerbung."
    );

    expect(mime).toContain("From: me@test.de");
    expect(mime).toContain("To: hr@company.de");
    expect(mime).toContain("Content-Type: text/plain; charset=UTF-8");
    expect(mime).toContain("Sehr geehrte Damen und Herren,");
  });

  it("erstellt eine Multipart-MIME-Nachricht mit Base64-PDF-Anhang", () => {
    const fakePdfBuffer = Buffer.from("%PDF-1.5 test pdf content");
    const mime = buildMimeMessage(
      "me@test.de",
      "hr@company.de",
      "Bewerbung",
      "Hier das Anschreiben",
      { filename: "bewerbungsmappe.pdf", content: fakePdfBuffer }
    );

    expect(mime).toContain("Content-Type: multipart/mixed;");
    expect(mime).toContain('filename="bewerbungsmappe.pdf"');
    expect(mime).toContain("Content-Transfer-Encoding: base64");
  });

  it("fällt ohne SMTP-Zugangsdaten transparent auf den Simulations-Modus zurück", async () => {
    const res = await sendApplicationEmail(
      {
        id: "default",
        smtpHost: null,
        smtpUser: null,
        smtpPassword: null,
      } as SmtpConfig,
      {
        to: "hr@acme.de",
        subject: "Test",
        bodyText: "Hallo",
      }
    );

    expect(res.success).toBe(true);
    expect(res.messageId).toContain("simulated-");
  });
});
