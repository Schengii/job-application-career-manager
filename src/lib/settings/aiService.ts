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
import {
  evaluateInterviewAnswer,
  generateFollowUpQuestion,
} from "@/lib/interview/mockInterviewEngine";
import { INTERVIEW_QUESTIONS } from "@/lib/interview/interviewGuide";
import { recordAiUsage, type AiUsageAction } from "@/lib/settings/aiUsageTracker";

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

type ChatCompletion = { content: string; modelUsed: string; promptTokens: number; completionTokens: number } | null;

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
  return {
    content,
    modelUsed: selectedModel,
    // `usage` fehlt bei manchen OpenRouter-Modellen/Proxys — 0 statt undefined,
    // damit das Kosten-Tracking (src/lib/aiUsageTracker.ts) nicht mit NaN rechnet.
    promptTokens: data.usage?.prompt_tokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? 0,
  };
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
  return {
    content,
    modelUsed: selectedModel,
    promptTokens: data.usage?.input_tokens ?? 0,
    completionTokens: data.usage?.output_tokens ?? 0,
  };
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
  return {
    content,
    modelUsed: `${selectedModel} (Ollama, lokal)`,
    // Ollama liefert bei stream:false `prompt_eval_count`/`eval_count` statt
    // eines `usage`-Objekts — kostet ohnehin immer 0 (s. estimateCostUsd),
    // dient hier nur der Token-Statistik.
    promptTokens: data.prompt_eval_count ?? 0,
    completionTokens: data.eval_count ?? 0,
  };
}

/**
 * Provider-übergreifender Einstiegspunkt: leitet an den passenden Provider
 * weiter (Ollama läuft auch ohne API-Key, alle anderen benötigen einen).
 * Gibt `null` zurück, wenn kein Provider konfiguriert/erreichbar ist oder der
 * Request fehlschlägt — der Aufrufer fällt dann auf die Offline-Heuristik
 * zurück, statt den Fehler nach außen zu werfen.
 *
 * Protokolliert bei Erfolg zentral den Token-/Kostenverbrauch (s.
 * src/lib/aiUsageTracker.ts, angezeigt in Einstellungen -> Profil &
 * Präferenzen) — an EINER Stelle statt in jeder der drei aufrufenden
 * Funktionen einzeln, damit kein Aufrufer versehentlich vergessen wird.
 */
async function getAiCompletion(params: {
  provider?: AiProvider | string | null;
  apiKey?: string | null;
  model?: string | null;
  prompt: string;
  jsonMode?: boolean;
  action: AiUsageAction;
}): Promise<ChatCompletion> {
  const { provider, apiKey, model, prompt, jsonMode = false, action } = params;
  const trimmedKey = apiKey?.trim();

  try {
    let completion: ChatCompletion = null;
    if (provider === "ollama") {
      completion = await callOllama(model, prompt, jsonMode);
    } else if (trimmedKey && (provider === "openai" || provider === "openrouter")) {
      completion = await callOpenAiCompatible(provider, trimmedKey, model, prompt, jsonMode);
    } else if (trimmedKey && provider === "anthropic") {
      completion = await callAnthropic(trimmedKey, model, prompt);
    }

    if (completion) {
      recordAiUsage({
        provider: provider ?? "unbekannt",
        model: completion.modelUsed,
        action,
        promptTokens: completion.promptTokens,
        completionTokens: completion.completionTokens,
      });
    }
    return completion;
  } catch (err) {
    console.warn(`AI-Request (${provider ?? "unbekannt"}) fehlgeschlagen, nutze Heuristik-Fallback:`, err);
    return null;
  }
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

  const completion = await getAiCompletion({ provider, apiKey, model, prompt, action: "POLISH_COVER_LETTER" });
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

export type GenerateOpeningSentenceParams = {
  companyName: string;
  companyNotes?: string | null;
  position: string;
  jobDescription?: string | null;
  jobRequirementsProfile?: string | null;
  jobTechStack?: string | null;
  profileTechStack?: string | null;
  provider?: AiProvider | string | null;
  apiKey?: string | null;
  model?: string | null;
};

export type GenerateOpeningSentenceResult = {
  /** Leerstring, wenn kein Provider konfiguriert war/der Request fehlschlug —
   *  der Aufrufer (coverLetterGenerator.ts) fällt dann auf die feste
   *  Einleitungssatz-Vorlage zurück. */
  sentence: string;
  usedAi: boolean;
  modelUsed: string;
};

/**
 * Formuliert per KI einen einzelnen, individuellen Einleitungssatz für ein
 * Anschreiben, der ausdrückt, warum sich der Bewerber gerade bei DIESEM
 * Unternehmen für DIESE Position bewirbt. Ohne konfigurierten Provider (oder
 * bei einem fehlgeschlagenen Request) liefert diese Funktion einen leeren
 * String zurück — es gibt hier bewusst KEINE lokale Heuristik-Simulation
 * einer "individuellen" Begründung (das wäre nicht ehrlich individuell),
 * stattdessen greift beim Aufrufer die neutrale, aber ehrliche
 * Platzhalter-Vorlage aus den Einstellungen.
 */
export async function generateOpeningSentenceWithAI(
  params: GenerateOpeningSentenceParams
): Promise<GenerateOpeningSentenceResult> {
  const {
    companyName,
    companyNotes,
    position,
    jobDescription,
    jobRequirementsProfile,
    jobTechStack,
    profileTechStack,
    provider,
    apiKey,
    model,
  } = params;

  const context = [
    companyNotes?.trim() ? `Notizen zum Unternehmen: ${companyNotes.trim()}` : null,
    jobRequirementsProfile?.trim() ? `Anforderungsprofil der Stelle: ${jobRequirementsProfile.trim()}` : null,
    jobTechStack?.trim() ? `Geforderter Tech-Stack der Stelle: ${jobTechStack.trim()}` : null,
    jobDescription?.trim() ? `Auszug Stellenbeschreibung: ${jobDescription.trim().slice(0, 500)}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `Du hilfst dabei, GENAU EINEN Einleitungssatz für ein deutsches Bewerbungsanschreiben zu formulieren.

Unternehmen: ${companyName}
Position: ${position}
Eigener Tech-Stack des Bewerbers: ${profileTechStack || "TypeScript, React, Next.js"}
${context || "Keine weiteren Informationen zum Unternehmen oder zur Stelle vorhanden."}

Der Satz folgt direkt nach "Sehr geehrte Damen und Herren," (klein weitergeschrieben, keine eigene Anrede) und soll ausdrücken, warum sich der Bewerber genau bei ${companyName} auf die Position "${position}" bewirbt bzw. was ihn daran besonders interessiert.

Regeln:
1. Gib NUR diesen einen Satz zurück — keine Einleitung, keine Anführungszeichen, keine Erklärung.
2. Erfinde KEINE konkreten Fakten über das Unternehmen (Produkte, Kunden, Unternehmensmission etc.), die dir oben nicht explizit gegeben wurden. Formuliere stattdessen allgemein plausibel, aber spezifisch bezogen auf Position, Anforderungen und Tech-Stack.
3. Vermeide ausgelutschte Floskeln wie "hiermit bewerbe ich mich" oder "mit großem Interesse habe ich Ihre Stellenanzeige gelesen".
4. Maximal 35 Wörter, ein einzelner Satz.`;

  const completion = await getAiCompletion({ provider, apiKey, model, prompt, action: "GENERATE_OPENING_SENTENCE" });
  if (!completion) {
    return { sentence: "", usedAi: false, modelUsed: "Lokale Heuristik (Offline)" };
  }

  const cleaned = completion.content
    .trim()
    .replace(/^["„“]|["“]$/g, "")
    .trim();

  return { sentence: cleaned, usedAi: true, modelUsed: completion.modelUsed };
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

  const completion = await getAiCompletion({
    provider,
    apiKey,
    model,
    prompt,
    jsonMode: true,
    action: "EVALUATE_INTERVIEW_ANSWER",
  });
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

export type GenerateInterviewFollowUpParams = {
  question: string;
  answer: string;
  targetJobTitle?: string;
  provider?: AiProvider | string | null;
  apiKey?: string | null;
  model?: string | null;
};

export type GenerateInterviewFollowUpResult = {
  followUp: string;
  usedAi: boolean;
  modelUsed: string;
};

export async function generateInterviewFollowUpWithAI(
  params: GenerateInterviewFollowUpParams
): Promise<GenerateInterviewFollowUpResult> {
  const { question, answer, targetJobTitle, provider, apiKey, model } = params;

  const prompt = `Du bist ein erfahrener Tech Lead / Frontend Architect in einem Fachinterview für Fachinformatiker Anwendungsentwicklung.
Der Bewerber hat auf deine Fachfrage geantwortet.
${targetJobTitle ? `Zielposition des Bewerbers: ${targetJobTitle}` : ""}

Ausgangsfrage: "${question}"
Antwort des Bewerbers: "${answer}"

Aufgabe:
Formuliere genau EINE prägnante, tiefgehende technische Nachfrage (1 bis maximal 2 Sätze) als direkter Gesprächspartner.
Hake an einem konkreten Detail auf (z. B. Performance, State Management, Fehlerbehandlung, TypeScript-Typsicherheit, Revalidierung oder Teamabsprachen).
Formuliere direkt in der Du-Form, sympathisch aber fachlich anspruchsvoll.
Antworte AUSSCHLIESSLICH mit der Nachfrage als reiner Text (keine Anführungszeichen, keine Einleitungsfloskeln wie "Hier ist meine Frage").`;

  const completion = await getAiCompletion({
    provider,
    apiKey,
    model,
    prompt,
    jsonMode: false,
    action: "GENERATE_INTERVIEW_FOLLOW_UP",
  });

  if (completion && completion.content.trim()) {
    const cleaned = completion.content
      .replace(/^["„“]|["“]$/g, "")
      .replace(/^(Interviewer:|Tech Lead:|Nachfrage:)\s*/i, "")
      .trim();

    if (cleaned.length > 10) {
      return {
        followUp: cleaned,
        usedAi: true,
        modelUsed: completion.modelUsed,
      };
    }
  }

  // 100% Offline-Fallback:
  const foundQuestion =
    INTERVIEW_QUESTIONS.find((q) => q.question.trim().toLowerCase() === question.trim().toLowerCase()) || {
      id: "custom",
      category: "FRONTEND_REACT" as const,
      categoryLabel: "Fachfrage",
      question,
      answerSummary: "",
      keywords: [],
    };

  const fallbackFollowUp = generateFollowUpQuestion(foundQuestion, answer);

  return {
    followUp: fallbackFollowUp,
    usedAi: false,
    modelUsed: "Lokale Heuristik (Offline)",
  };
}

