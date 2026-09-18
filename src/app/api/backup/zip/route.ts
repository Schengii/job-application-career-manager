// -----------------------------------------------------------------------------
// GET /api/backup/zip  -> Vollständiger ZIP-Export (JSON + Metadaten)
// POST /api/backup/zip -> Wiederherstellung aus ZIP
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { createFullBackup, restoreFromBackup } from "@/lib/settings/backup";
import { handleApiError } from "@/lib/core/apiUtils";

export async function GET() {
  try {
    const fullBackup = await createFullBackup();
    const zip = new JSZip();

    // 1. Primärer JSON Datenexport
    zip.file("backup-data.json", JSON.stringify(fullBackup, null, 2));

    // 2. Info-Datei für den Nutzer
    const appsCount = fullBackup.applications?.length ?? 0;
    const compsCount = fullBackup.companies?.length ?? 0;
    const jobsCount = fullBackup.jobPostings?.length ?? 0;
    const docsCount = fullBackup.documents?.length ?? 0;

    const readmeContent = [
      "# Job Application & Career Manager — Komplettsicherung",
      `Exportiert am: ${new Date().toLocaleString("de-DE")}`,
      `Version: ${fullBackup.version}`,
      "",
      "Inhalt:",
      `- Bewerbungen: ${appsCount}`,
      `- Unternehmen: ${compsCount}`,
      `- Stellenangebote: ${jobsCount}`,
      `- Dokumente: ${docsCount}`,
      "",
      "Diese Datei kann direkt im Dashboard unter Einstellungen -> Backup & Daten wiederhergestellt werden.",
    ].join("\n");

    zip.file("README.txt", readmeContent);

    const zipBuffer = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
    const filename = `career-manager-complete-${new Date().toISOString().slice(0, 10)}.zip`;

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "application/zip",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Keine gültige ZIP-Datei übermittelt." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const jsonEntry = zip.file("backup-data.json");
    if (!jsonEntry) {
      return NextResponse.json(
        { error: "Die ZIP-Datei enthält keine gültige 'backup-data.json'." },
        { status: 400 }
      );
    }

    const jsonText = await jsonEntry.async("string");
    const data = JSON.parse(jsonText);

    const result = await restoreFromBackup(data);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
