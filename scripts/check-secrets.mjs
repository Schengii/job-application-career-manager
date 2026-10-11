#!/usr/bin/env node
// =============================================================================
// Pre-Commit Hook & Secret Validator
// Job Application & Career Manager
// =============================================================================
// Blockiert Commits mit .env-Dateien, API-Keys oder sensiblen Bewerbungsdokumenten.
// Plattformunabhängig (Windows, macOS, Linux).
// =============================================================================

import { execSync } from "node:child_process";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const RESET = "\x1b[0m";

let hasError = false;

// 1. Gestagte Dateien abfragen
let stagedFiles = [];
try {
  const output = execSync("git diff --cached --name-only", { encoding: "utf8" });
  stagedFiles = output
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);
} catch (error) {
  console.error(`${RED}Fehler beim Ermitteln der gestagten Dateien:${RESET}`, error.message);
  process.exit(1);
}

if (stagedFiles.length === 0) {
  console.log(`${BLUE}ℹ Keine gestagten Dateien für Sicherheitsprüfung vorhanden.${RESET}`);
  process.exit(0);
}

console.log(`${BLUE}🔍 Prüfe ${stagedFiles.length} gestagte Datei(en) auf Secrets und .env-Dateien...${RESET}`);

// 2. Dateinamen-Prüfung
const FORBIDDEN_FILE_PATTERNS = [
  /^\.env(\..+)?$/i,
  /\/\.env(\..+)?$/i,
  /^\.encryption-key$/i,
  /^\.vapid-keys\.json$/i,
  /^\.ai-usage\.json$/i,
  /profile-data\.local\.json$/i,
];

const FORBIDDEN_DIR_PATTERNS = [
  /^Bewerbungsunterlagen final\//i,
  /^public\/uploads\/(?!.*\.gitkeep$)/i,
  /^backups\//i,
];

for (const file of stagedFiles) {
  // .env.example ist erlaubt
  if (file.endsWith(".env.example")) {
    continue;
  }

  for (const pattern of FORBIDDEN_FILE_PATTERNS) {
    if (pattern.test(file)) {
      console.error(`${RED}✖ FEHLER:${RESET} Die Datei '${file}' darf NICHT committet werden (sensible Datei)!`);
      hasError = true;
      break;
    }
  }

  for (const pattern of FORBIDDEN_DIR_PATTERNS) {
    if (pattern.test(file)) {
      console.error(`${RED}✖ FEHLER:${RESET} Persönliche Datei '${file}' darf NIEMALS in Git gelangen (Datenschutz)!`);
      hasError = true;
      break;
    }
  }
}

// 3. Diff-Inhaltsprüfung auf gestagte Zeilen (+...)
let diffOutput = "";
try {
  diffOutput = execSync("git diff --cached -U0", { encoding: "utf8" });
} catch {
  // Ignorieren falls kein Diff vorhanden
}

if (diffOutput) {
  const SECRET_PATTERNS = [
    { name: "Anthropic Claude API-Key", regex: /^\+[^\n]*(sk-ant-[a-zA-Z0-9_\-]{20,})/m },
    { name: "OpenAI API-Key", regex: /^\+[^\n]*(sk-(proj-)?[a-zA-Z0-9_\-]{20,})/m },
    { name: "Google AI / Gemini API-Key", regex: /^\+[^\n]*(AIzaSy[a-zA-Z0-9_\-]{33})/m },
    { name: "Vercel Blob Token", regex: /^\+[^\n]*(vercel_blob_rw_[a-zA-Z0-9_\-]{20,})/m },
    { name: "PostgreSQL Connection String mit Zugangsdaten", regex: /^\+[^\n]*(postgres(?:ql)?:\/\/[a-zA-Z0-9_\.\-]+:[^@\s]+@[a-zA-Z0-9_\.\-]+\/)/m },
    { name: "GitHub Personal Access Token", regex: /^\+[^\n]*(ghp_[a-zA-Z0-9]{36})/m },
    { name: "GitHub Fine-Grained Token", regex: /^\+[^\n]*(github_pat_[a-zA-Z0-9_]{22,})/m },
    { name: "Slack Token", regex: /^\+[^\n]*(xox[baprs]-[0-9]{10,}-[a-zA-Z0-9]{10,})/m },
    { name: "Private RSA/SSH Key", regex: /^\+[^\n]*-----BEGIN[ A-Z0-9_\-]*PRIVATE KEY-----/m },
  ];

  for (const { name, regex } of SECRET_PATTERNS) {
    const match = diffOutput.match(regex);
    if (match) {
      console.error(`${RED}✖ FEHLER:${RESET} Potenzieller ${name} im gestagten Code gefunden:`);
      console.error(`   ${match[0].trim().slice(0, 80)}...`);
      console.error(`${YELLOW}   Bitte entferne den Key und nutze stattdessen eine Umgebungsvariable.${RESET}`);
      hasError = true;
    }
  }
}

if (hasError) {
  console.error(`\n${RED}⛔ COMMIT ABGEBROCHEN:${RESET} Sensible Daten oder Secrets entdeckt.`);
  console.error(`Entferne die Datei mit: ${YELLOW}git restore --staged <datei>${RESET}`);
  console.error(`In begründeten Ausnahmefällen: ${YELLOW}git commit --no-verify${RESET}\n`);
  process.exit(1);
}

console.log(`${GREEN}✔ Pre-commit Sicherheitsprüfung erfolgreich (keine Secrets oder verbotenen .env-Dateien gefunden).${RESET}`);
process.exit(0);
