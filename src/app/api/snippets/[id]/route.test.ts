import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PATCH, DELETE } from "./route";
import { resetDb } from "@/test/dbTestUtils";
import { prisma } from "@/lib/prisma";

function patchRequest(id: string, body: unknown) {
  return new NextRequest(`http://localhost/api/snippets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/snippets/[id]", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("PATCH aktualisiert Titel und Inhalt eines Textbausteins", async () => {
    const snippet = await prisma.coverLetterSnippet.create({
      data: { title: "Alter Titel", content: "Alter Inhalt" },
    });

    const res = await PATCH(patchRequest(snippet.id, { title: "Neuer Titel" }), {
      params: Promise.resolve({ id: snippet.id }),
    });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.title).toBe("Neuer Titel");
    expect(body.content).toBe("Alter Inhalt"); // unverändert, da nicht mitgeschickt
  });

  it("PATCH liefert 404, wenn der Textbaustein nicht existiert", async () => {
    const res = await PATCH(patchRequest("does-not-exist", { title: "X" }), {
      params: Promise.resolve({ id: "does-not-exist" }),
    });
    expect(res.status).toBe(404);
  });

  it("DELETE entfernt den Textbaustein endgültig", async () => {
    const snippet = await prisma.coverLetterSnippet.create({
      data: { title: "Zu löschen", content: "..." },
    });

    const res = await DELETE(new NextRequest(`http://localhost/api/snippets/${snippet.id}`, { method: "DELETE" }), {
      params: Promise.resolve({ id: snippet.id }),
    });
    expect(res.status).toBe(200);
    expect(await prisma.coverLetterSnippet.findUnique({ where: { id: snippet.id } })).toBeNull();
  });
});
