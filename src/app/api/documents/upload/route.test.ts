import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { resetDb } from "@/test/dbTestUtils";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function buildUploadRequest(file: File, category = "LEBENSLAUF") {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("category", category);
  return new NextRequest("http://localhost/api/documents/upload", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/documents/upload", () => {
  const createdFiles: string[] = [];

  beforeEach(async () => {
    await resetDb();
    createdFiles.length = 0;
  });

  afterEach(async () => {
    // Während des Tests tatsächlich geschriebene Dateien wieder entfernen,
    // damit Testläufe keine Spuren in public/uploads hinterlassen.
    await Promise.all(
      createdFiles.map((f) => fs.rm(f, { force: true }).catch(() => {}))
    );
  });

  it("lehnt Dateien mit nicht erlaubtem Typ ab (z.B. .html -> gespeichertes XSS)", async () => {
    const file = new File(["<script>alert(1)</script>"], "exploit.html", { type: "text/html" });
    const res = await POST(buildUploadRequest(file));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Dateityp nicht erlaubt/);
  });

  it("lehnt eine .pdf-Datei ab, deren vorgetäuschter MIME-Type nicht zur Endung passt", async () => {
    // Endung "erlaubt" (.pdf), aber MIME-Type gehört zu keinem erlaubten Eintrag
    // -> muss trotzdem abgelehnt werden, sonst wäre die Allowlist per
    // gefälschtem Content-Type umgehbar.
    const file = new File(["<script>alert(1)</script>"], "exploit.pdf", { type: "text/html" });
    const res = await POST(buildUploadRequest(file));

    expect(res.status).toBe(400);
  });

  it("akzeptiert eine gültige PDF-Datei", async () => {
    const file = new File(["%PDF-1.4 fake pdf content"], "lebenslauf.pdf", { type: "application/pdf" });
    const res = await POST(buildUploadRequest(file));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.fileUrl).toMatch(/^\/uploads\/.+\.pdf$/);
    expect(body.insights).toBeDefined();
    expect(body.insights.suggestedCategory).toBe("LEBENSLAUF");

    createdFiles.push(path.join(UPLOAD_DIR, path.basename(body.fileUrl)));
  });
});
