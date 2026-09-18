import { describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/backup/zip/route";
import JSZip from "jszip";

describe("/api/backup/zip", () => {
  it("erzeugt einen gültigen ZIP-Download mit backup-data.json und README", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/zip");
    expect(response.headers.get("Content-Disposition")).toContain("career-manager-complete-");

    const arrayBuffer = await response.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    expect(zip.file("backup-data.json")).not.toBeNull();
    expect(zip.file("README.txt")).not.toBeNull();

    const readme = await zip.file("README.txt")?.async("string");
    expect(readme).toContain("Komplettsicherung");
  });
});
