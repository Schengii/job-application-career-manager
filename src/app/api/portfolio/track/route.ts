// -----------------------------------------------------------------------------
// Portfolio Recruiter View Tracker Route: /api/portfolio/track
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiUtils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token fehlt" }, { status: 400 });
    }

    const preferences = await prisma.preferences.findFirst({
      where: {
        portfolioShareToken: token,
        portfolioActive: true,
      },
    });

    if (!preferences) {
      return NextResponse.json({ error: "Ungültiger oder abgelaufener Link" }, { status: 404 });
    }

    const updated = await prisma.preferences.update({
      where: { id: preferences.id },
      data: {
        portfolioViewCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      viewCount: updated.portfolioViewCount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
