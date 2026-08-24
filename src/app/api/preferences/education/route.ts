// -----------------------------------------------------------------------------
// POST /api/preferences/education -> Neuen Ausbildungs-/Bildungseintrag anlegen
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { educationEntrySchema } from "@/lib/validation";
import { handleApiError, toDateOrNull } from "@/lib/apiUtils";
import { getOrCreatePreferences } from "@/lib/preferences";

export async function POST(request: NextRequest) {
  try {
    await getOrCreatePreferences();
    const body = await request.json();
    const data = educationEntrySchema.parse(body);

    const entry = await prisma.educationEntry.create({
      data: {
        ...data,
        startDate: toDateOrNull(data.startDate) ?? null,
        endDate: toDateOrNull(data.endDate) ?? null,
        preferencesId: "default",
      },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
