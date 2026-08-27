// -----------------------------------------------------------------------------
// Import-Skript: überträgt eine persönliche "Bewerbungsliste-*.xlsx" (Format:
// Datum | Unternehmen | Homepage | Anzeigeportal | Stellenbezeichnung |
// Ansprechpartner | Adresse | Telefonnummer | Emailadresse | beworben am… |
// …telefonisch/…per Email/…im Portal/…persönlich | Wiedervorlage |
// Anmerkungen | Absagen Datum) sowie Profil-/Zeugnisdaten in die Datenbank.
//
// WICHTIG: Dieses Skript enthält selbst KEINE personenbezogenen Daten und
// kann daher gefahrlos versioniert werden. Alle echten Daten (Name, Adresse,
// Ausbildung, Projekte, Zeugnis-Dateien) liegen ausschließlich in
// "scripts/profile-data.local.json" — einer per .gitignore ausgeschlossenen
// lokalen Datei. Fehlt sie, bricht das Skript kontrolliert ab und verweist
// auf "scripts/profile-data.example.json" als Vorlage.
//
// Nutzung: npm run import:bewerbungsliste [Pfad-zur-Bewerbungsliste.xlsx]
// -----------------------------------------------------------------------------
import "dotenv/config";
import { existsSync, mkdirSync, copyFileSync, readFileSync } from "fs";
import path from "path";
import XLSX from "xlsx";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { generateCoverLetter } from "../src/lib/coverLetterGenerator";

const PROJECT_ROOT = path.resolve(__dirname, "..");
const SOURCE_FOLDER = path.join(PROJECT_ROOT, "Bewerbungsunterlagen final");
const DEFAULT_XLSX = path.join(SOURCE_FOLDER, "verschickte Bewerbungen", "Bewerbungsliste-2026.xlsx");
const UPLOAD_DIR = path.join(PROJECT_ROOT, "public", "uploads");
const PROFILE_DATA_PATH = path.join(__dirname, "profile-data.local.json");

const xlsxPath = process.argv[2] ?? DEFAULT_XLSX;

// ---------------------------------------------------------------------------
// Persönliche Profildaten (Name, Adresse, Ausbildung, Projekte, Dokumente) —
// bewusst als reine Laufzeit-Daten aus einer gitignorten JSON-Datei geladen,
// niemals als Konstanten im Quellcode (siehe Kommentar oben).
// ---------------------------------------------------------------------------
type EducationEntryInput = {
  type: string;
  title: string;
  institution: string;
  startDate: string;
  endDate: string;
  description: string;
  sortOrder: number;
};
type ProjectEntryInput = { title: string; description: string; techStack: string; role: string; sortOrder: number };
type DocumentInput = { file: string; name: string; category: string };
type ProfileData = {
  profile: {
    fullName: string;
    email: string;
    phone: string;
    street: string;
    postalCode: string;
    city: string;
    desiredRole: string;
    techStack: string;
    preferredLocations: string;
    searchRadiusKm: number;
    remotePreference: string;
    minSalary: number;
    profileSummary: string;
  };
  educationEntries: EducationEntryInput[];
  projectEntries: ProjectEntryInput[];
  documents: DocumentInput[];
};

function loadProfileData(): ProfileData {
  if (!existsSync(PROFILE_DATA_PATH)) {
    console.error(`❌ Profildaten nicht gefunden unter: ${PROFILE_DATA_PATH}`);
    console.error("   Kopiere 'scripts/profile-data.example.json' zu 'scripts/profile-data.local.json' und trage deine eigenen Daten ein.");
    process.exit(1);
  }
  return JSON.parse(readFileSync(PROFILE_DATA_PATH, "utf-8")) as ProfileData;
}

// ---------------------------------------------------------------------------
// Prisma-Client (gleiches Muster wie prisma/seed.ts: eigenständige Instanz,
// da dieses Skript außerhalb des Next.js-Bundlers läuft und Pfad-Aliase wie
// "@/..." dort nicht aufgelöst werden).
// ---------------------------------------------------------------------------
const rawUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const dbFilePath = rawUrl.startsWith("file:") ? rawUrl.slice(5) : rawUrl;
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: dbFilePath }) });

// ---------------------------------------------------------------------------
// Portal-Name (aus der Excel-Spalte "Anzeigeportal") -> JOB_PORTAL-Wert
// ---------------------------------------------------------------------------
const PORTAL_MAP: Record<string, string> = {
  stepstone: "STEPSTONE",
  indeed: "INDEED",
  "getin{it}": "GETINIT",
  "agentur für arbeit": "ARBEITSAGENTUR",
  jobware: "JOBWARE",
  linkedin: "LINKEDIN",
  joboo: "JOBOO",
  "stellenanzeigen.de": "STELLENANZEIGEN_DE",
};

function mapPortal(raw: string): string {
  return PORTAL_MAP[raw.trim().toLowerCase()] ?? "OTHER";
}

/** "Straße 1 / 12345 Musterstadt" -> { street, postalCode, city } */
function parseAddress(raw: string): { street: string | null; postalCode: string | null; city: string | null } {
  if (!raw?.trim()) return { street: null, postalCode: null, city: null };
  const [streetPart, ...rest] = raw.split("/").map((s) => s.trim());
  const cityPart = rest.join("/").trim();
  const match = cityPart.match(/^(\d{4,5})\s+(.*)$/);
  return {
    street: streetPart || null,
    postalCode: match ? match[1] : null,
    city: match ? match[2] : cityPart || null,
  };
}

/** "29.07.2026 per Email" -> { date: Date, method: "per Email" }
 *  Validiert Tag/Monat, statt sie blind an den Date-Konstruktor zu übergeben:
 *  ein Tippfehler wie "31.97.2026" (Original-Datei) würde sonst stillschweigend
 *  zu einem überlaufenden, um Jahre verschobenen Datum (2034) führen. */
function parseRejection(raw: string): { date: Date | null; method: string | null } {
  if (!raw?.trim()) return { date: null, method: null };
  const match = raw.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  const method = raw.replace(/\d{1,2}\.\d{1,2}\.\d{4}/, "").trim() || null;
  if (!match) return { date: null, method };
  const [, dayStr, monthStr, yearStr] = match;
  const day = Number(dayStr);
  const month = Number(monthStr);
  const year = Number(yearStr);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    console.warn(`   ⚠️  Ungültiges Datum in Absagen-Spalte ignoriert: "${raw}" (verwende Bewerbungsdatum als Ersatz)`);
    return { date: null, method };
  }
  return { date: new Date(year, month - 1, day), method };
}

const INTERVIEW_PATTERN = /gespräch|interview|videotermin|telefontermin|vorstellung|rückmeldung.*termin/i;

/** Erkennt ein grobes Datum wie "13.08" in einer Notiz (Jahr wird aus dem Bewerbungsdatum übernommen). */
function guessInterviewDate(note: string, fallback: Date): Date {
  const match = note.match(/(\d{1,2})\.(\d{1,2})(?!\.\d)/);
  if (!match) return fallback;
  const [, day, month] = match;
  return new Date(fallback.getFullYear(), Number(month) - 1, Number(day));
}

function excelDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  return null;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function main() {
  if (!existsSync(xlsxPath)) {
    console.error(`❌ Bewerbungsliste nicht gefunden unter: ${xlsxPath}`);
    console.error("   Lege den Ordner 'Bewerbungsunterlagen final/' im Projekt-Root ab oder übergib einen Pfad als Argument.");
    process.exit(1);
  }

  const data = loadProfileData();
  const educationEntries = data.educationEntries.map((e) => ({
    ...e,
    startDate: e.startDate ? new Date(e.startDate) : null,
    endDate: e.endDate ? new Date(e.endDate) : null,
  }));

  console.log("🌱 Übertrage Profil, Ausbildung & Projekte ...");
  await prisma.preferences.upsert({
    where: { id: "default" },
    update: data.profile,
    create: { id: "default", ...data.profile },
  });
  await prisma.educationEntry.deleteMany({ where: { preferencesId: "default" } });
  await prisma.educationEntry.createMany({ data: educationEntries.map((e) => ({ ...e, preferencesId: "default" })) });
  await prisma.projectEntry.deleteMany({ where: { preferencesId: "default" } });
  await prisma.projectEntry.createMany({ data: data.projectEntries.map((p) => ({ ...p, preferencesId: "default" })) });

  console.log("📎 Kopiere Zeugnisse/Unterlagen nach public/uploads ...");
  mkdirSync(UPLOAD_DIR, { recursive: true });
  const documentIds: string[] = [];
  for (const doc of data.documents) {
    const sourcePath = path.join(SOURCE_FOLDER, doc.file);
    if (!existsSync(sourcePath)) {
      console.warn(`   ⚠️  Datei nicht gefunden, übersprungen: ${doc.file}`);
      continue;
    }
    const ext = path.extname(sourcePath);
    const uniqueName = `${Date.now()}-${sanitizeFileName(path.basename(doc.file))}`;
    copyFileSync(sourcePath, path.join(UPLOAD_DIR, uniqueName));

    const created = await prisma.document.create({
      data: {
        name: doc.name,
        category: doc.category,
        fileName: path.basename(doc.file),
        fileUrl: `/uploads/${uniqueName}`,
        mimeType: ext === ".pdf" ? "application/pdf" : ext === ".png" ? "image/png" : null,
      },
    });
    documentIds.push(created.id);
  }

  console.log(`📊 Lese Bewerbungsliste: ${xlsxPath}`);
  const workbook = XLSX.readFile(xlsxPath, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  const profileWithRelations = {
    ...data.profile,
    educationEntries,
    projectEntries: data.projectEntries,
  };

  let imported = 0;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const companyName = String(row[3] ?? "").trim();
    if (!companyName) continue; // Leerzeile

    const website = String(row[4] ?? "").trim() || null;
    const portalRaw = String(row[5] ?? "").trim();
    const position = String(row[6] ?? "").trim() || "Unbekannte Position";
    const contactName = String(row[7] ?? "").trim() || null;
    const { street, postalCode, city } = parseAddress(String(row[8] ?? ""));
    const phone = String(row[9] ?? "").trim() || null;
    const email = String(row[10] ?? "").trim() || null;
    const applicationDate = excelDate(row[11]) ?? excelDate(row[2]) ?? new Date();
    const notes = String(row[17] ?? "").trim() || null;
    const rejectionRaw = String(row[18] ?? "").trim();
    const { date: parsedRejectionDate, method: rejectionMethod } = parseRejection(rejectionRaw);
    // Eine Absage liegt vor, sobald die Spalte befüllt ist – auch wenn das
    // Datum darin nicht sauber geparst werden konnte (siehe parseRejection).
    // In diesem Fall wird ersatzweise das Bewerbungsdatum verwendet, statt
    // die Absage fälschlich als "noch offen" zu behandeln.
    const wasRejected = rejectionRaw.length > 0;
    const rejectionDate = parsedRejectionDate ?? (wasRejected ? applicationDate : null);

    const hasInterview = notes ? INTERVIEW_PATTERN.test(notes) : false;
    const status = hasInterview ? "INTERVIEW" : wasRejected ? "REJECTED" : "SENT";
    const companyStatus = status === "REJECTED" ? "REJECTED" : status === "INTERVIEW" ? "IN_PROGRESS" : "CONTACTED";
    const portal = mapPortal(portalRaw);

    let company = await prisma.company.findFirst({ where: { name: companyName } });
    if (!company) {
      company = await prisma.company.create({
        data: { name: companyName, website, street, postalCode, city, contactName, contactPhone: phone, contactEmail: email, status: companyStatus },
      });
    }

    const application = await prisma.application.create({
      data: {
        position,
        status,
        applicationDate,
        notes,
        source: portal,
        companyId: company.id,
        statusEvents: {
          create: [
            { status: "SENT", note: `Bewerbung über ${portalRaw || "Sonstige"} verschickt`, changedAt: applicationDate },
            ...(status === "INTERVIEW"
              ? [{ status: "INTERVIEW", note: notes ?? "Einladung erhalten", changedAt: guessInterviewDate(notes ?? "", applicationDate) }]
              : []),
            ...(status === "REJECTED" && rejectionDate
              ? [{ status: "REJECTED", note: rejectionMethod ? `Absage ${rejectionMethod}` : "Absage erhalten", changedAt: rejectionDate }]
              : []),
          ],
        },
        documents: { create: documentIds.map((documentId) => ({ documentId })) },
      },
    });

    // useAi: false -> ein Massenimport über potenziell viele Zeilen soll
    // nicht pro Zeile einen KI-Request auslösen (Laufzeit/Kosten).
    const { content: coverLetterContent } = await generateCoverLetter({
      company,
      job: null,
      profile: profileWithRelations,
      position,
      useAi: false,
    });
    await prisma.coverLetter.create({
      data: { applicationId: application.id, content: coverLetterContent, status: "SENT" },
    });

    imported++;
  }

  console.log(`✅ ${imported} Bewerbungen aus der Excel-Liste übertragen (inkl. Anschreiben-Vorlagen & Verlauf).`);
}

main()
  .catch((e) => {
    console.error("❌ Import fehlgeschlagen:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
