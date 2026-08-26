// -----------------------------------------------------------------------------
// Integrationstest: /api/applications/bulk (Stapel-Aktionen & Zeilen-Batch)
// -----------------------------------------------------------------------------
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { POST } from "./route";
import { resetDb, createTestCompany } from "@/test/dbTestUtils";
import { prisma } from "@/lib/prisma";

const BACKUP_DIR = path.join(process.cwd(), "backups");

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/applications/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/applications/bulk", () => {
  beforeEach(async () => {
    await resetDb();
    await fs.rm(BACKUP_DIR, { recursive: true, force: true });
  });

  afterEach(async () => {
    await fs.rm(BACKUP_DIR, { recursive: true, force: true });
  });

  it("DELETE löscht die angegebenen Bewerbungen und legt vorher einen Auto-Snapshot an", async () => {
    const company = await createTestCompany();
    const app1 = await prisma.application.create({ data: { position: "A", companyId: company.id } });
    const app2 = await prisma.application.create({ data: { position: "B", companyId: company.id } });

    const response = await POST(
      postRequest({ action: "DELETE", applicationIds: [app1.id, app2.id] })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.count).toBe(2);

    const remaining = await prisma.application.findMany();
    expect(remaining).toHaveLength(0);

    const snapshotFiles = await fs.readdir(BACKUP_DIR);
    const autoSnapshots = snapshotFiles.filter((f) => f.startsWith("auto-"));
    expect(autoSnapshots.length).toBe(1);
    expect(autoSnapshots[0]).toContain("bulk-delete-2-applications");

    // Der Snapshot muss die Bewerbungen VOR der Löschung enthalten.
    const snapshot = JSON.parse(await fs.readFile(path.join(BACKUP_DIR, autoSnapshots[0]), "utf-8"));
    expect(snapshot.applications).toHaveLength(2);
  });
});
