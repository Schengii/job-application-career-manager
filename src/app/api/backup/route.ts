// -----------------------------------------------------------------------------
// GET /api/backup  -> Vollständiger JSON-Export
// POST /api/backup -> Wiederherstellung aus JSON-Backup
//
// Auth: Wenn APP_PASSWORD gesetzt ist, muss der Request denselben
// Authorization: Basic-Header mitschicken, den auch die Middleware prüft.
// In der Produktion ohne APP_PASSWORD wird der Endpunkt komplett gesperrt,
// um einen versehentlich ungeschützten Datenbank-Export zu verhindern.
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { createFullBackup, restoreFromBackup, BackupData } from "@/lib/settings/backup";
import { handleApiError } from "@/lib/core/apiUtils";
import { isBasicAuthValid } from "@/lib/core/basicAuth";

function checkBackupAuth(request: NextRequest): NextResponse | null {
  const appPassword = process.env.APP_PASSWORD;
  const isDev = process.env.NODE_ENV === "development";

  if (!appPassword) {
    // Ohne gesetztes Passwort: In Produktion komplett sperren, in Dev erlauben.
    if (!isDev) {
      return new NextResponse("Backup-Endpunkt erfordert APP_PASSWORD in der Produktion.", { status: 403 });
    }
    return null;
  }

  if (!isBasicAuthValid(request.headers.get("authorization"), appPassword)) {
    return new NextResponse("Authentifizierung erforderlich", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Job Application Manager"' },
    });
  }

  return null;
}

export async function GET(request: NextRequest) {
  const authError = checkBackupAuth(request);
  if (authError) return authError;

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
  const authError = checkBackupAuth(request);
  if (authError) return authError;

  try {
    const body = (await request.json()) as BackupData;
    const result = await restoreFromBackup(body);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
