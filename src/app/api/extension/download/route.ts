// -----------------------------------------------------------------------------
// Browser Extension ZIP Download Route: /api/extension/download
// -----------------------------------------------------------------------------
import { NextResponse } from "next/server";
import JSZip from "jszip";
import fs from "fs";
import path from "path";
import { handleApiError } from "@/lib/apiUtils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const extensionDir = path.join(process.cwd(), "public", "extension");
    const zip = new JSZip();

    if (!fs.existsSync(extensionDir)) {
      return NextResponse.json({ error: "Extension-Ordner nicht gefunden." }, { status: 404 });
    }

    const files = fs.readdirSync(extensionDir);
    for (const file of files) {
      const filePath = path.join(extensionDir, file);
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        const content = fs.readFileSync(filePath);
        zip.file(file, content);
      }
    }

    const buffer = await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });

    return new Response(buffer, {
      headers: {
        "Content-Disposition": 'attachment; filename="career-manager-clipper-extension.zip"',
        "Content-Type": "application/zip",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
