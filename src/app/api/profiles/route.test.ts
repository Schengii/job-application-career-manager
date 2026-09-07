import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { POST as ACTIVATE_POST } from "./[id]/route";
import { resetDb } from "@/test/dbTestUtils";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/core/prisma";

describe("CareerProfiles API (/api/profiles)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("erstellt ein neues Profil und listet es auf", async () => {
    const req = new NextRequest("http://localhost:3000/api/profiles", {
      method: "POST",
      body: JSON.stringify({
        name: "Fullstack Spezialist",
        desiredRole: "Fullstack Developer",
        techStack: "React, Node.js, Prisma, PostgreSQL",
        preferredLocations: "Köln, Remote",
        isDefault: true,
      }),
    });

    const postRes = await POST(req);
    expect(postRes.status).toBe(201);
    const created = await postRes.json();
    expect(created.id).toBeDefined();
    expect(created.name).toBe("Fullstack Spezialist");

    const getRes = await GET();
    const list = await getRes.json();
    expect(list.length).toBeGreaterThanOrEqual(1);
  });

  it("aktiviert ein Profil und synchronisiert die Hauptpräferenzen", async () => {
    await prisma.preferences.create({ data: { id: "default" } });
    const profile = await prisma.careerProfile.create({
      data: {
        name: "Frontend Junior",
        desiredRole: "Junior Frontend Dev",
        techStack: "HTML, CSS, JavaScript",
        preferencesId: "default",
      },
    });

    const activateReq = new NextRequest(`http://localhost:3000/api/profiles/${profile.id}`, { method: "POST" });
    const activateRes = await ACTIVATE_POST(activateReq, { params: Promise.resolve({ id: profile.id }) });
    expect(activateRes.status).toBe(200);

    const pref = await prisma.preferences.findUnique({ where: { id: "default" } });
    expect(pref?.desiredRole).toBe("Junior Frontend Dev");
    expect(pref?.techStack).toBe("HTML, CSS, JavaScript");
  });
});
