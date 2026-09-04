import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { GET, DELETE } from "./route";
import { clearAiUsage, recordAiUsage } from "@/lib/settings/aiUsageTracker";

describe("/api/ai/usage", () => {
  beforeEach(() => {
    clearAiUsage();
  });
  afterEach(() => {
    clearAiUsage();
  });

  it("GET liefert eine leere Zusammenfassung ohne protokollierte Requests", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.totalRequests).toBe(0);
    expect(body.totalEstimatedCostUsd).toBe(0);
    expect(body.recentEntries).toEqual([]);
  });

  it("GET spiegelt zuvor protokollierte Requests wider", async () => {
    recordAiUsage({
      provider: "openai",
      model: "gpt-4o-mini",
      action: "POLISH_COVER_LETTER",
      promptTokens: 100,
      completionTokens: 50,
    });

    const res = await GET();
    const body = await res.json();

    expect(body.totalRequests).toBe(1);
    expect(body.totalTokens).toBe(150);
    expect(body.byProvider.openai.requests).toBe(1);
  });

  it("DELETE setzt die Statistik zurück, GET zeigt danach wieder 0 Requests", async () => {
    recordAiUsage({
      provider: "ollama",
      model: "llama3.1",
      action: "EVALUATE_INTERVIEW_ANSWER",
      promptTokens: 10,
      completionTokens: 10,
    });

    const deleteRes = await DELETE();
    expect(deleteRes.status).toBe(200);
    const deleteBody = await deleteRes.json();
    expect(deleteBody.totalRequests).toBe(0);

    const getRes = await GET();
    const getBody = await getRes.json();
    expect(getBody.totalRequests).toBe(0);
  });
});
