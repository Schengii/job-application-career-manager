// -----------------------------------------------------------------------------
// Integrationstest: /api/snippets (GET/POST)
// -----------------------------------------------------------------------------
import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { resetDb } from "@/test/dbTestUtils";
import { prisma } from "@/lib/prisma";

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/snippets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/snippets", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("GET liefert eine leere Liste ohne angelegte Textbausteine", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("POST legt einen neuen Textbaustein an und gibt ihn mit Status 201 zurück", async () => {
    const response = await POST(postRequest({ title: "Remote-Absatz", content: "Ich arbeite bevorzugt remote." }));
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.title).toBe("Remote-Absatz");
    expect(body.content).toBe("Ich arbeite bevorzugt remote.");

    const stored = await prisma.coverLetterSnippet.findUnique({ where: { id: body.id } });
    expect(stored?.title).toBe("Remote-Absatz");
  });

  it("POST lehnt einen fehlenden Titel mit 400 + Validierungsdetails ab", async () => {
    const response = await POST(postRequest({ content: "Nur Inhalt, kein Titel" }));
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("Validierungsfehler");
    expect(body.details).toBeDefined();
  });

  it("GET liefert mehrere Textbausteine alphabetisch nach Titel sortiert", async () => {
    await prisma.coverLetterSnippet.create({ data: { title: "Zebra-Absatz", content: "..." } });
    await prisma.coverLetterSnippet.create({ data: { title: "Anfangs-Absatz", content: "..." } });

    const response = await GET();
    const body = await response.json();
    expect(body.map((s: { title: string }) => s.title)).toEqual(["Anfangs-Absatz", "Zebra-Absatz"]);
  });
});
