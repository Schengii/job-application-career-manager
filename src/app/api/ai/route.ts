// -----------------------------------------------------------------------------
// POST /api/ai  -> KI-Assistent für Anschreiben-Polishing & Mock-Interview
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { aiRequestSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/apiUtils";
import { getPreferencesWithProfile } from "@/lib/preferences";
import {
  polishCoverLetterWithAI,
  evaluateInterviewAnswerWithAI,
} from "@/lib/aiService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = aiRequestSchema.parse(body);

    const preferences = await getPreferencesWithProfile();

    if (data.action === "POLISH_COVER_LETTER") {
      if (!data.coverLetter) {
        return NextResponse.json({ error: "coverLetter ist erforderlich" }, { status: 400 });
      }

      const result = await polishCoverLetterWithAI({
        coverLetter: data.coverLetter,
        jobTitle: data.jobTitle,
        jobDescription: data.jobDescription,
        techStack: data.techStack,
        provider: preferences.aiProvider,
        apiKey: preferences.aiApiKey,
        model: preferences.aiModel,
      });

      return NextResponse.json(result);
    }

    if (data.action === "EVALUATE_INTERVIEW_ANSWER") {
      if (!data.question || !data.answer) {
        return NextResponse.json(
          { error: "question und answer sind erforderlich" },
          { status: 400 }
        );
      }

      const result = await evaluateInterviewAnswerWithAI({
        question: data.question,
        answer: data.answer,
        idealAnswer: data.idealAnswer,
        provider: preferences.aiProvider,
        apiKey: preferences.aiApiKey,
        model: preferences.aiModel,
      });

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Ungültige Aktion" }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}
