// -----------------------------------------------------------------------------
// POST /api/jobs/:id/restore
// -----------------------------------------------------------------------------
// Stellt ein zuvor ausgeblendetes Stellenangebot wieder her.
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiUtils";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const job = await prisma.jobPosting.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: "Stellenangebot nicht gefunden" }, { status: 404 });
    }

    const restoredJob = await prisma.jobPosting.update({
      where: { id },
      data: {
        isDismissed: false,
        dismissReason: null,
        dismissedAt: null,
      },
      include: { company: true },
    });

    return NextResponse.json({
      success: true,
      job: restoredJob,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
