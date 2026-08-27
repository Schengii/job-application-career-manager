import { describe, it, expect, vi, afterEach } from "vitest";
import { polishCoverLetterWithAI, evaluateInterviewAnswerWithAI, generateOpeningSentenceWithAI } from "./aiService";

describe("aiService (hybrid offline/online)", () => {
  it("provides smart offline fallback for cover letter polishing", async () => {
    const original = "Sehr geehrte Damen und Herren, hiermit bewerbe ich mich mit großem Interesse auf Ihre ausgeschriebene Stelle.";
    const result = await polishCoverLetterWithAI({
      coverLetter: original,
      jobTitle: "Frontend Entwickler",
      techStack: "React, TypeScript",
      apiKey: "", // No API key -> offline fallback
    });

    expect(result.usedAi).toBe(false);
    expect(result.modelUsed).toContain("Offline");
    expect(result.polishedContent).toContain("mit Begeisterung für moderne Web-Entwicklung");
    expect(result.improvements.length).toBeGreaterThan(0);
  });

  it("provides robust offline interview answer evaluation", async () => {
    const question = "Was ist der Unterschied zwischen Props und State in React?";
    const answer = "Props werden von außen übergeben und sind immutable. State wird innerhalb der Komponente verwaltet und triggert bei Änderung Re-Renders.";
    const ideal = "Props sind Parameter von Elternkomponenten (read-only), State ist lokaler, veränderlicher Zustand der Komponente.";

    const result = await evaluateInterviewAnswerWithAI({
      question,
      answer,
      idealAnswer: ideal,
      apiKey: null,
    });

    expect(result.usedAi).toBe(false);
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.feedback).toBeDefined();
    expect(result.starMethodScore).toBeDefined();
  });

  describe("Provider-Integrationen (gemockter fetch)", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("ruft Ollama auch OHNE apiKey auf (lokal, keine Authentifizierung nötig)", async () => {
      const fetchMock = vi.fn(async (url: string | URL) => {
        expect(String(url)).toBe("http://localhost:11434/api/chat");
        return new Response(JSON.stringify({ message: { content: "Poliertes Anschreiben." } }), { status: 200 });
      });
      vi.stubGlobal("fetch", fetchMock);

      const result = await polishCoverLetterWithAI({
        coverLetter: "Sehr geehrte Damen und Herren...",
        provider: "ollama",
        apiKey: null, // bewusst kein Key
        model: "llama3.1",
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.usedAi).toBe(true);
      expect(result.modelUsed).toContain("Ollama");
      expect(result.polishedContent).toBe("Poliertes Anschreiben.");
    });

    it("ruft die Anthropic Messages API mit korrekten Headern auf, wenn ein Key gesetzt ist", async () => {
      const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
        expect(String(url)).toBe("https://api.anthropic.com/v1/messages");
        const headers = init?.headers as Record<string, string>;
        expect(headers["x-api-key"]).toBe("sk-ant-test");
        expect(headers["anthropic-version"]).toBeDefined();
        return new Response(JSON.stringify({ content: [{ text: "Poliert via Claude." }] }), { status: 200 });
      });
      vi.stubGlobal("fetch", fetchMock);

      const result = await polishCoverLetterWithAI({
        coverLetter: "Sehr geehrte Damen und Herren...",
        provider: "anthropic",
        apiKey: "sk-ant-test",
      });

      expect(result.usedAi).toBe(true);
      expect(result.polishedContent).toBe("Poliert via Claude.");
    });

    it("fällt bei Anthropic OHNE apiKey auf die Offline-Heuristik zurück, statt zu fetchen", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      const result = await polishCoverLetterWithAI({
        coverLetter: "Sehr geehrte Damen und Herren, hiermit bewerbe ich mich mit großem Interesse auf Ihre ausgeschriebene Stelle.",
        provider: "anthropic",
        apiKey: "",
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.usedAi).toBe(false);
    });

    it("entfernt Markdown-Codefences aus Ollama-JSON-Antworten vor dem Parsen", async () => {
      const fetchMock = vi.fn(async () =>
        new Response(
          JSON.stringify({
            message: {
              content: '```json\n{"score": 88, "feedback": "Solide Antwort.", "strengths": [], "improvements": []}\n```',
            },
          }),
          { status: 200 }
        )
      );
      vi.stubGlobal("fetch", fetchMock);

      const result = await evaluateInterviewAnswerWithAI({
        question: "Was ist der Unterschied zwischen Props und State?",
        answer: "Props kommen von außen, State ist intern.",
        provider: "ollama",
        apiKey: null,
      });

      expect(result.usedAi).toBe(true);
      expect(result.score).toBe(88);
      expect(result.feedback).toBe("Solide Antwort.");
    });

    it("generateOpeningSentenceWithAI liefert den von der KI formulierten Satz zurück", async () => {
      const fetchMock = vi.fn(async () =>
        new Response(
          JSON.stringify({ choices: [{ message: { content: "die Kombination aus TypeScript und React bei Acme GmbH hat mich sofort angesprochen." } }] }),
          { status: 200 }
        )
      );
      vi.stubGlobal("fetch", fetchMock);

      const result = await generateOpeningSentenceWithAI({
        companyName: "Acme GmbH",
        position: "Frontend-Entwickler",
        jobTechStack: "TypeScript,React",
        provider: "openai",
        apiKey: "sk-test",
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.usedAi).toBe(true);
      expect(result.sentence).toBe("die Kombination aus TypeScript und React bei Acme GmbH hat mich sofort angesprochen.");
    });

    it("generateOpeningSentenceWithAI entfernt umschließende Anführungszeichen aus der KI-Antwort", async () => {
      const fetchMock = vi.fn(async () =>
        new Response(JSON.stringify({ choices: [{ message: { content: '„ein individueller Satz."' } }] }), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const result = await generateOpeningSentenceWithAI({
        companyName: "Acme GmbH",
        position: "Entwickler",
        provider: "openai",
        apiKey: "sk-test",
      });

      expect(result.sentence).toBe("ein individueller Satz.");
    });

    it("generateOpeningSentenceWithAI liefert ohne konfigurierten Provider einen leeren String (kein Fake-Fallback)", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      const result = await generateOpeningSentenceWithAI({
        companyName: "Acme GmbH",
        position: "Entwickler",
        apiKey: "",
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.usedAi).toBe(false);
      expect(result.sentence).toBe("");
    });
  });
});
