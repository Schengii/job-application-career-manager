// -----------------------------------------------------------------------------
// GET /api/backup  -> Vollständiger JSON-Export
// POST /api/backup -> Wiederherstellung aus JSON-Backup
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { createFullBackup, restoreFromBackup, BackupData } from "@/lib/backup";
import { handleApiError } from "@/lib/apiUtils";

export async function GET() {
  try {
    const backup = await createFullBackup();
    return NextResponse.json(backup, {
      headers: {
        "Content-Disposition": `attachment; filename="career-manager-backup-${new Date().toISOString().slice(0, 10)}.json"`,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BackupData;
    const result = await restoreFromBackup(body);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
