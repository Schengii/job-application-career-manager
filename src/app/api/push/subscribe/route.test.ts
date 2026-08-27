import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { resetDb } from "@/test/dbTestUtils";
import { prisma } from "@/lib/prisma";

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json", "user-agent": "TestBrowser/1.0" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  endpoint: "https://push.example.com/abc123",
  keys: { p256dh: "p256dh-value", auth: "auth-value" },
};

describe("POST /api/push/subscribe", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("legt eine neue Subscription inkl. User-Agent an", async () => {
    const response = await POST(postRequest(validBody));
    expect(response.status).toBe(200);

    const stored = await prisma.pushSubscription.findUnique({ where: { endpoint: validBody.endpoint } });
    expect(stored?.p256dh).toBe("p256dh-value");
    expect(stored?.userAgent).toBe("TestBrowser/1.0");
  });

  it("aktualisiert Keys statt zu duplizieren, wenn derselbe Endpoint erneut registriert wird", async () => {
    await POST(postRequest(validBody));
    await POST(postRequest({ ...validBody, keys: { p256dh: "neuer-p256dh", auth: "neuer-auth" } }));

    expect(await prisma.pushSubscription.count()).toBe(1);
    const stored = await prisma.pushSubscription.findUnique({ where: { endpoint: validBody.endpoint } });
    expect(stored?.p256dh).toBe("neuer-p256dh");
  });

  it("lehnt einen ungültigen Endpoint (keine URL) mit 400 ab", async () => {
    const response = await POST(postRequest({ endpoint: "not-a-url", keys: { p256dh: "x", auth: "y" } }));
    expect(response.status).toBe(400);
  });
});
