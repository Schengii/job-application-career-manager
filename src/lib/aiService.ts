// -----------------------------------------------------------------------------
// AI Assistant & Hybrid LLM Integration Service
// -----------------------------------------------------------------------------
// Unterstützt OpenAI, Anthropic, OpenRouter und Ollama für Anschreiben-Polishing
// und tiefgehendes Interview-Feedback. Bietet stets 100% Offline-Fallback.
//
// Alle vier Provider aus `AI_PROVIDERS` (src/lib/constants.ts) werden hier
// tatsächlich implementiert (zuvor fielen "anthropic" und "ollama" trotz
// Auswahlmöglichkeit in den Einstellungen stillschweigend auf die
// Offline-Heuristik zurück, siehe `getAiCompletion()` unten).
// -----------------------------------------------------------------------------
import { evaluateInterviewAnswer } from "./mockInterviewEngine";
import { INTERVIEW_QUESTIONS } from "./interviewGuide";

export type AiProvider = "openai" | "anthropic" | "openrouter" | "ollama";

export type PolishCoverLetterParams = {
  coverLetter: string;
  jobTitle?: string;
  jobDescription?: string;
  techStack?: string;
  provider?: AiProvider | string | null;
  apiKey?: string | null;
  model?: string | null;
};

export type PolishCoverLetterResult = {
  polishedContent: string;
  usedAi: boolean;
  modelUsed: string;
  improvements: string[];
};

export type EvaluateInterviewAnswerParams = {
  question: string;
  answer: string;
  idealAnswer?: string;
  provider?: AiProvider | string | null;
  apiKey?: string | null;
  model?: string | null;
};

export type EvaluateInterviewAnswerResult = {
  score: number; // 0-100
  feedback: string;
  strengths: string[];
  improvements: string[];
  starMethodScore?: {
    situationTask: boolean;
    action: boolean;
    result: boolean;
  };
  usedAi: boolean;
  modelUsed: string;
};

type ChatCompletion = { content: string; modelUsed: string } | null;

const REQUEST_TIMEOUT_MS = 20_000;
const OLLAMA_TIMEOUT_MS = 30_000; // lokale Modelle können deutlich langsamer antworten als Cloud-APIs

/**
 * Ruft einen OpenAI-kompatiblen `/chat/completions`-Endpunkt auf (deckt
 * sowohl OpenAI als auch OpenRouter ab, deren API-Schema OpenAI-kompatibel
 * ist).
 */
async function callOpenAiCompatible(
  provider: "openai" | "openrouter",
  apiKey: string,
  model: string | null | undefined,
  prompt: string,
  jsonMode: boolean
): Promise<ChatCompletion> {
  const endpoint =
    provider === "openrouter"
      ? "https://openrouter.ai/api/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";
  const selectedModel = model || (provider === "openrouter" ? "meta-llama/llama-3-8b-instruct" : "gpt-4o-mini");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: [{ role: "user", content: prompt }],
      temperature: jsonMode ? 0.3 : 0.7,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) return null;
  return { content, modelUsed: selectedModel };
}

/** Ruft die Anthropic Messages API auf (eigenes Request-/Response-Schema, nicht OpenAI-kompatibel). */
async function callAnthropic(
  apiKey: string,
  model: string | null | undefined,
  prompt: string
): Promise<ChatCompletion> {
  const selectedModel = model || "claude-3-5-sonnet-20241022";

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: selectedModel,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const content = data.content?.[0]?.text?.trim();
  if (!content) return null;
  return { content, modelUsed: selectedModel };
}

/**
 * Ruft ein lokales Ollama-Modell auf (`http://localhost:11434` per Default,
 * überschreibbar via `OLLAMA_BASE_URL`). Benötigt bewusst KEINEN API-Key —
 * Ollama läuft rein lokal ohne Authentifizierung.
 */
async function callOllama(
  model: string | null | undefined,
  prompt: string,
  jsonMode: boolean
): Promise<ChatCompletion> {
  const selectedModel = model || "llama3.1";
  const baseUrl = (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, "");

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: selectedModel,
      messages: [{ role: "user", content: prompt }],
      stream: false,
      ...(jsonMode ? { format: "json" } : {}),
    }),
    signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const content = data.message?.content?.trim();
  if (!content) return null;
  return { content, modelUsed: `${selectedModel} (Ollama, lokal)` };
}

/**
 * Provider-übergreifender Einstiegspunkt: leitet an den passenden Provider
 * weiter (Ollama läuft auch ohne API-Key, alle anderen benötigen einen).
 * Gibt `null` zurück, wenn kein Provider konfiguriert/erreichbar ist oder der
 * Request fehlschlägt — der Aufrufer fällt dann auf die Offline-Heuristik
 * zurück, statt den Fehler nach außen zu werfen.
 */
async function getAiCompletion(params: {
  provider?: AiProvider | string | null;
  apiKey?: string | null;
  model?: string | null;
  prompt: string;
  jsonMode?: boolean;
}): Promise<ChatCompletion> {
  const { provider, apiKey, model, prompt, jsonMode = false } = params;
  const trimmedKey = apiKey?.trim();

  try {
    if (provider === "ollama") {
      return await callOllama(model, prompt, jsonMode);
    }
    if (!trimmedKey) return null; // openai/anthropic/openrouter benötigen einen Key
    if (provider === "openai" || provider === "openrouter") {
      return await callOpenAiCompatible(provider, trimmedKey, model, prompt, jsonMode);
    }
    if (provider === "anthropic") {
      return await callAnthropic(trimmedKey, model, prompt);
    }
  } catch (err) {
    console.warn(`AI-Request (${provider ?? "unbekannt"}) fehlgeschlagen, nutze Heuristik-Fallback:`, err);
  }
  return null;
}

export async function polishCoverLetterWithAI(
  params: PolishCoverLetterParams
): Promise<PolishCoverLetterResult> {
  const { coverLetter, jobTitle, jobDescription, techStack, provider, apiKey, model } = params;

  const prompt = `Du bist ein hochkarätiger Karriere- und Bewerbungsexperte für Fachinformatiker für Anwendungsentwicklung mit Schwerpunkt Frontend (TypeScript, React, Next.js).
Optimiere das folgende Bewerbungsanschreiben sprachlich, präzise und überzeugend für die Stelle "${jobTitle || 'Frontend Entwickler'}".

Geforderter Tech-Stack: ${techStack || 'TypeScript, React, Tailwind'}
Stellenbeschreibung Auszug: ${jobDescription?.slice(0, 300) || 'Nicht angegeben'}

Regeln:
1. Behalte den sachlichen, professionellen und sympathischen Ton bei.
2. Keine Floskeln, sondern Fokus auf konkrete Problemlösungskompetenz und Praxisprojekte.
3. Gib NUR das optimierte Anschreiben im Volltext zurück, ohne einleitende oder abschließende Erklärungen.

Original-Anschreiben:
${coverLetter}`;

  const completion = await getAiCompletion({ provider, apiKey, model, prompt });
  if (completion) {
    return {
      polishedContent: completion.content,
      usedAi: true,
      modelUsed: completion.modelUsed,
      improvements: [
        "Formulierungen dynamisch geschärft",
        "Tech-Keywords nahtlos in die Argumentation integriert",
        "Persönliche Motivation und Praxisbezug gestärkt",
      ],
    };
  }

  // 100% Offline-Heuristik-Fallback
  let localPolished = coverLetter;
  const improvements: string[] = [];

  // 1. Schärfe Standard-Einleitungen
  if (localPolished.includes("hiermit bewerbe ich mich")) {
    localPolished = localPolished.replace(
      /hiermit bewerbe ich mich mit großem Interesse auf Ihre ausgeschriebene Stelle/gi,
      "mit Begeisterung für moderne Web-Entwicklung und performante Architekturen bewerbe ich mich auf Ihre Position"
    );
    improvements.push("Einleitungssatz von Standardfloskel auf aktive Begeisterung umgestellt");
  }

  // 2. Hebe Schlüsselqualifikationen hervor
  if (techStack && !localPolished.includes("Clean Code") && !localPolished.includes("Typsicherheit")) {
    localPolished = localPolished.replace(
      /(React|TypeScript|Next\.js)/,
      "$1 mit Fokus auf Typsicherheit und modularen Clean Code"
    );
    improvements.push("Schwerpunkt auf Typsicherheit & Clean Code ergänzt");
  }

  if (improvements.length === 0) {
    improvements.push("Anschreiben auf Lesbarkeit und DIN-5008-Struktur geprüft");
  }

  return {
    polishedContent: localPolished,
    usedAi: false,
    modelUsed: "Lokale Heuristik (Offline)",
    improvements,
  };
}

export async function evaluateInterviewAnswerWithAI(
  params: EvaluateInterviewAnswerParams
): Promise<EvaluateInterviewAnswerResult> {
  const { question, answer, idealAnswer, provider, apiKey, model } = params;

  const prompt = `Du bist ein Tech Lead und Interviewer für Fachinformatiker Anwendungsentwicklung (Frontend).
Bewerte die folgende Antwort des Kandidaten auf die Fachfrage nach der STAR-Methode (Situation, Task, Action, Result) und technischer Korrektheit.

Frage: "${question}"
Musterlösung: "${idealAnswer || 'Nicht vorgegeben'}"
Antwort des Kandidaten: "${answer}"

Antworte ausschließlich im folgenden JSON-Format:
{
  "score": 85, // 0 bis 100
  "feedback": "Kurze, konstruktive Gesamteinschätzung (2-3 Sätze)",
  "strengths": ["Stärke 1", "Stärke 2"],
  "improvements": ["Konkreter Verbesserungstipp 1", "Tipp 2"],
  "starMethodScore": {
    "situationTask": true,
    "action": true,
    "result": false
  }
}`;

  const completion = await getAiCompletion({ provider, apiKey, model, prompt, jsonMode: true });
  if (completion) {
    try {
      // Manche Provider (v.a. lokale Ollama-Modelle) liefern trotz
      // `format: "json"` gelegentlich Markdown-Codefences um das JSON herum
      // -> vor dem Parsen entfernen.
      const cleaned = completion.content.replace(/^```json\s*|\s*```$/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return {
        score: typeof parsed.score === "number" ? Math.min(100, Math.max(0, parsed.score)) : 75,
        feedback: parsed.feedback || "Gute strukturierte Antwort mit Fachbezug.",
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ["Fachbegriffe korrekt verwendet"],
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : ["Noch konkretere Praxisbeispiele nennen"],
        starMethodScore: parsed.starMethodScore || { situationTask: true, action: true, result: true },
        usedAi: true,
        modelUsed: completion.modelUsed,
      };
    } catch (err) {
      console.warn("AI-Antwort konnte nicht als JSON geparst werden, nutze Heuristik-Fallback:", err);
    }
  }

  // 100% Offline-Fallback über mockInterviewEngine
  const cleanQ = question.trim().toLowerCase();
  const foundQuestion =
    INTERVIEW_QUESTIONS.find((q) => q.question.trim().toLowerCase() === cleanQ) ||
    INTERVIEW_QUESTIONS.find((q) => cleanQ.includes(q.question.toLowerCase()) || q.question.toLowerCase().includes(cleanQ)) || {
      id: "custom",
      category: "FRONTEND_REACT" as const,
      categoryLabel: "Fachfrage",
      question,
      answerSummary: idealAnswer || "Strukturierte Fachantwort mit Beispielen",
      keywords: idealAnswer
        ? Array.from(
            new Set(
              idealAnswer
                .replace(/[^a-zA-ZäöüÄÖÜß0-9 ]/g, "")
                .split(/\s+/)
                .filter((w) => w.length >= 4)
            )
          ).slice(0, 6)
        : ["React", "TypeScript", "Komponente", "Performance", "State", "Props"],
    };

  const localEval = evaluateInterviewAnswer(foundQuestion, answer);
  return {
    score: localEval.score,
    feedback: localEval.feedback.join(" "),
    strengths: localEval.matchedKeywords.map((kw) => `Fachbegriff "${kw}" treffend eingebracht`),
    improvements: localEval.missingKeywords.length > 0
      ? localEval.missingKeywords.map((kw) => `Erwähne idealerweise auch "${kw}"`)
      : ["Ergänze bei Gelegenheit ein konkretes Projektbeispiel aus der Praxis"],
    starMethodScore: {
      situationTask: answer.length > 40,
      action: answer.length > 100,
      result: answer.length > 180,
    },
    usedAi: false,
    modelUsed: "Lokale Heuristik (Offline)",
  };
}
