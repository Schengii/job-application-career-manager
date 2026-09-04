import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { resetDb } from "@/test/dbTestUtils";
import { prisma } from "@/lib/core/prisma";

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/push/unsubscribe", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("entfernt eine bestehende Subscription anhand des Endpoints", async () => {
    await prisma.pushSubscription.create({
      data: { endpoint: "https://push.example.com/abc123", p256dh: "x", auth: "y" },
    });

    const response = await POST(postRequest({ endpoint: "https://push.example.com/abc123" }));
    expect(response.status).toBe(200);
    expect(await prisma.pushSubscription.count()).toBe(0);
  });

  it("liefert Erfolg, auch wenn der Endpoint gar nicht (mehr) existiert", async () => {
    const response = await POST(postRequest({ endpoint: "https://push.example.com/unknown" }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it("lehnt einen ungültigen Endpoint (keine URL) mit 400 ab", async () => {
    const response = await POST(postRequest({ endpoint: "not-a-url" }));
    expect(response.status).toBe(400);
  });
});
