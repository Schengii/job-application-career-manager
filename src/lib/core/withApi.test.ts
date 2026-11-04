import { describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withApi } from "./withApi";

function req(body?: string) {
  return new NextRequest("http://localhost/api/x", { method: "POST", body });
}
const ctx = { params: Promise.resolve({}) };

describe("withApi", () => {
  it("reicht die Response des Handlers durch", async () => {
    const route = withApi(async () => NextResponse.json({ ok: true }, { status: 201 }));
    const res = await route(req(), ctx);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("übergibt params an den Handler", async () => {
    const route = withApi<{ id: string }>(async (_r, { params }) => NextResponse.json(await params));
    const res = await route(req(), { params: Promise.resolve({ id: "42" }) });
    expect(await res.json()).toEqual({ id: "42" });
  });

  it("mappt ZodError auf 400", async () => {
    const route = withApi(async (r) => NextResponse.json(await readJson(r, z.object({ a: z.string() }))));
    const res = await route(req(JSON.stringify({ a: 1 })), ctx);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Validierungsfehler");
  });

  it("liefert 400 statt 500 bei kaputtem JSON", async () => {
    const route = withApi(async (r) => NextResponse.json(await readJson(r, z.object({}))));
    const res = await route(req("{nicht json"), ctx);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Ungültiger JSON-Body");
  });

  it("mappt Prisma P2025 auf 404", async () => {
    const route = withApi(async () => {
      throw Object.assign(new Error("x"), { code: "P2025" });
    });
    expect((await route(req(), ctx)).status).toBe(404);
  });

  it("unbekannte Fehler ergeben 500", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const route = withApi(async () => {
      throw new Error("kaputt");
    });
    const res = await route(req(), ctx);
    expect(res.status).toBe(500);
    spy.mockRestore();
  });

  it("Rate-Limit blockiert vor dem Handler", async () => {
    const handler = vi.fn(async () => NextResponse.json({}));
    const blocked = NextResponse.json({ error: "zu viele" }, { status: 429 });
    const route = withApi(handler, { rateLimit: () => blocked });
    const res = await route(req(), ctx);
    expect(res.status).toBe(429);
    expect(handler).not.toHaveBeenCalled();
  });
});
