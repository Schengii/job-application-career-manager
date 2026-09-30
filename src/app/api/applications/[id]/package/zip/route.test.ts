import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

vi.mock("@/lib/core/prisma", () => ({
  prisma: {
    application: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.id === "app-found") {
          return Promise.resolve({
            id: "app-found",
            position: "Frontend Entwickler",
            company: { name: "TechCorp GmbH" },
            applicationDate: new Date(),
            notes: "Testnotizen",
            coverLetter: { content: "Sehr geehrte Damen und Herren..." },
            documents: [],
          });
        }
        return Promise.resolve(null);
      }),
    },
  },
}));

describe("GET /api/applications/[id]/package/zip", () => {
  it("returns 404 when application does not exist", async () => {
    const req = new NextRequest("http://localhost/api/applications/non-existent/package/zip");
    const res = await GET(req, { params: Promise.resolve({ id: "non-existent" }) });
    expect(res.status).toBe(404);
  });

  it("returns application/zip attachment for existing application", async () => {
    const req = new NextRequest("http://localhost/api/applications/app-found/package/zip");
    const res = await GET(req, { params: Promise.resolve({ id: "app-found" }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/zip");
    expect(res.headers.get("content-disposition")).toContain("attachment; filename=");
    const buffer = await res.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(0);
  });
});
