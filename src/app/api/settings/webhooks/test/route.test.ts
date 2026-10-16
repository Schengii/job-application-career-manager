import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/settings/webhooks/test", () => {
  it("weist private IP-Adressen (SSRF) mit HTTP 400 ab", async () => {
    const req = new Request("http://localhost/api/settings/webhooks/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "discord", webhookUrl: "http://127.0.0.1:8080/webhook" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("weist Link-Local/Metadaten-IPs mit HTTP 400 ab", async () => {
    const req = new Request("http://localhost/api/settings/webhooks/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "slack", webhookUrl: "http://169.254.169.254/latest/meta-data" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
