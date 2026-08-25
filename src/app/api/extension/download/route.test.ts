import { describe, it, expect } from "vitest";
import { GET } from "./route";

describe("GET /api/extension/download", () => {
  it("erzeugt ein downloadbares ZIP-Archiv mit den Browser-Extension Dateien", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const headers = res.headers;
    expect(headers.get("Content-Type")).toBe("application/zip");
    expect(headers.get("Content-Disposition")).toContain('attachment; filename="career-manager-clipper-extension.zip"');

    const blob = await res.blob();
    expect(blob.size).toBeGreaterThan(100);
  });
});
