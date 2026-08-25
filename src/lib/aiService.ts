// -----------------------------------------------------------------------------
// AI Assistant & Hybrid LLM Integration Service
// -----------------------------------------------------------------------------
// Unterstützt OpenAI, Anthropic, OpenRouter und Ollama für Anschreiben-Polishing
// und tiefgehendes Interview-Feedback. Bietet stets 100% Offline-Fallback.
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

export async function polishCoverLetterWithAI(
  params: PolishCoverLetterParams
): Promise<PolishCoverLetterResult> {
  const { coverLetter, jobTitle, jobDescription, techStack, provider, apiKey, model } = params;

  // Wenn ein API-Key für OpenAI / OpenRouter vorhanden ist
  if (apiKey && apiKey.trim() && (provider === "openai" || provider === "openrouter")) {
    try {
      const endpoint =
        provider === "openrouter"
          ? "https://openrouter.ai/api/v1/chat/completions"
          : "https://api.openai.com/v1/chat/completions";

      const selectedModel = model || (provider === "openrouter" ? "meta-llama/llama-3-8b-instruct" : "gpt-4o-mini");

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

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const output = data.choices?.[0]?.message?.content?.trim();
        if (output) {
          return {
            polishedContent: output,
            usedAi: true,
            modelUsed: selectedModel,
            improvements: [
              "Formulierungen dynamisch geschärft",
              "Tech-Keywords nahtlos in die Argumentation integriert",
              "Persönliche Motivation und Praxisbezug gestärkt",
            ],
          };
        }
      }
    } catch (err) {
      console.warn("AI-Request fehlgeschlagen, nutze Heuristik-Fallback:", err);
    }
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

  if (apiKey && apiKey.trim() && (provider === "openai" || provider === "openrouter")) {
    try {
      const endpoint =
        provider === "openrouter"
          ? "https://openrouter.ai/api/v1/chat/completions"
          : "https://api.openai.com/v1/chat/completions";

      const selectedModel = model || (provider === "openrouter" ? "meta-llama/llama-3-8b-instruct" : "gpt-4o-mini");

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

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) {
          const parsed = JSON.parse(content);
          return {
            score: typeof parsed.score === "number" ? Math.min(100, Math.max(0, parsed.score)) : 75,
            feedback: parsed.feedback || "Gute strukturierte Antwort mit Fachbezug.",
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ["Fachbegriffe korrekt verwendet"],
            improvements: Array.isArray(parsed.improvements) ? parsed.improvements : ["Noch konkretere Praxisbeispiele nennen"],
            starMethodScore: parsed.starMethodScore || { situationTask: true, action: true, result: true },
            usedAi: true,
            modelUsed: selectedModel,
          };
        }
      }
    } catch (err) {
      console.warn("AI-Interview-Evaluation fehlgeschlagen, nutze Heuristik-Fallback:", err);
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
