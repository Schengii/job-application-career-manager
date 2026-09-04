// -----------------------------------------------------------------------------
// Portfolio Share Token Management Route: /api/portfolio/token
// -----------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { handleApiError } from "@/lib/core/apiUtils";
import { getOrCreatePreferences } from "@/lib/settings/preferences";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const preferences = await getOrCreatePreferences();
    return NextResponse.json({
      token: preferences.portfolioShareToken,
      active: preferences.portfolioActive,
      viewCount: preferences.portfolioViewCount,
      expiresAt: preferences.portfolioTokenExpiresAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST() {
  try {
    await getOrCreatePreferences();
    const token = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 60); // 60 Tage gültig

    const updated = await prisma.preferences.update({
      where: { id: "default" },
      data: {
        portfolioShareToken: token,
        portfolioTokenExpiresAt: expiresAt,
        portfolioActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      token: updated.portfolioShareToken,
      expiresAt: updated.portfolioTokenExpiresAt,
      message: "Neuer Portfolio-Share-Link erfolgreich generiert!",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    await getOrCreatePreferences();
    const updated = await prisma.preferences.update({
      where: { id: "default" },
      data: {
        portfolioShareToken: null,
        portfolioTokenExpiresAt: null,
        portfolioActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      active: updated.portfolioActive,
      message: "Portfolio-Share-Link wurde deaktiviert.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
