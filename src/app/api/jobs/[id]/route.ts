// -----------------------------------------------------------------------------
// GET/PATCH/DELETE /api/jobs/:id
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { jobPostingUpdateSchema } from "@/lib/core/validation";
import { handleApiError } from "@/lib/core/apiUtils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const job = await prisma.jobPosting.findUnique({
    where: { id },
    include: { company: true, applications: true },
  });
  if (!job) return NextResponse.json({ error: "Stellenangebot nicht gefunden" }, { status: 404 });
  return NextResponse.json(job);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = jobPostingUpdateSchema.parse(body);
    const job = await prisma.jobPosting.update({ where: { id }, data, include: { company: true } });
    return NextResponse.json(job);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.jobPosting.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
