import { describe, it, expect } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

describe("POST /api/export/pdf", () => {
  it("konvertiert HTML-Inhalte in ein druckfertiges DIN A4 Dokument mit Download-Header", async () => {
    const req = new NextRequest("http://localhost/api/export/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Anschreiben adesso SE",
        htmlContent: "<div class='letter'><p>Sehr geehrte Damen und Herren...</p></div>",
        documentType: "COVER_LETTER",
        filename: "anschreiben_adesso.html",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const headers = res.headers;
    expect(headers.get("Content-Type")).toContain("text/html");
    expect(headers.get("Content-Disposition")).toContain("attachment; filename=\"anschreiben_adesso.html\"");

    const text = await res.text();
    expect(text).toContain("<!DOCTYPE html>");
    expect(text).toContain("Anschreiben adesso SE");
  });

  it("gibt 400 zurück wenn kein htmlContent übergeben wird", async () => {
    const req = new NextRequest("http://localhost/api/export/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
