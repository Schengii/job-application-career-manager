// -----------------------------------------------------------------------------
// Statische Barrierefreiheits-Prüfung: Buttons, die nur ein Icon enthalten,
// brauchen einen zugänglichen Namen (aria-label, aria-labelledby oder title) —
// sonst kündigt ein Screenreader nur "Schaltfläche" an.
//
// Heuristik auf Quelltext-Ebene (kein Rendering): erkennt <button>/<Button>,
// deren Inhalt ausschließlich aus selbstschließenden Komponenten (Icons) und
// Kommentaren besteht. Dynamisch befüllte Buttons (z. B. {children}) werden
// bewusst nicht geprüft.
// -----------------------------------------------------------------------------
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const SRC_DIR = path.resolve(__dirname, "..");

function collectTsxFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "generated" || entry.name === "node_modules") continue;
      collectTsxFiles(full, out);
    } else if (entry.name.endsWith(".tsx") && !/\.test\./.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

// `=>` muss in den Attributen erlaubt sein (onClick={() => ...}), sonst bricht das Muster dort ab.
const BUTTON_PATTERN = /<(button|Button)\b((?:=>|[^>])*?)>([\s\S]*?)<\/\1>/g;
const ICON_PATTERN = /<[A-Z][A-Za-z0-9]*\b[^>]*\/>/g;

/** Findet Icon-only-Buttons ohne zugänglichen Namen und gibt `datei:zeile` zurück. */
export function findUnlabelledIconButtons(source: string, file: string): string[] {
  const findings: string[] = [];
  for (const match of source.matchAll(BUTTON_PATTERN)) {
    const [, , attrs, inner] = match;
    const withoutIconsAndComments = inner.replace(ICON_PATTERN, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "").trim();
    if (withoutIconsAndComments !== "") continue; // enthält Text/Ausdrücke
    if (!inner.match(ICON_PATTERN)) continue; // gar kein Icon
    if (/aria-label|aria-labelledby|\btitle=/.test(attrs)) continue;
    const line = source.slice(0, match.index).split("\n").length;
    findings.push(`${path.relative(SRC_DIR, file)}:${line}`);
  }
  return findings;
}

describe("findUnlabelledIconButtons (Heuristik)", () => {
  it("erkennt einen Icon-Button ohne Beschriftung", () => {
    const src = `<button type="button" onClick={() => close()}>\n  <X className="h-4 w-4" />\n</button>`;
    expect(findUnlabelledIconButtons(src, "x.tsx")).toHaveLength(1);
  });

  it("akzeptiert aria-label, title und sichtbaren Text", () => {
    expect(findUnlabelledIconButtons(`<button aria-label="Schließen"><X /></button>`, "x.tsx")).toEqual([]);
    expect(findUnlabelledIconButtons(`<Button title="Löschen"><Trash2 className="h-3" /></Button>`, "x.tsx")).toEqual([]);
    expect(findUnlabelledIconButtons(`<button><X className="h-3" /> Schließen</button>`, "x.tsx")).toEqual([]);
  });

  it("ignoriert Buttons ohne Icon und dynamische Inhalte", () => {
    expect(findUnlabelledIconButtons(`<button>{children}</button>`, "x.tsx")).toEqual([]);
    expect(findUnlabelledIconButtons(`<button>OK</button>`, "x.tsx")).toEqual([]);
  });
});

describe("Barrierefreiheit: Icon-Buttons", () => {
  it("jeder Button, der nur ein Icon enthält, hat einen zugänglichen Namen", () => {
    const findings = collectTsxFiles(SRC_DIR).flatMap((file) =>
      findUnlabelledIconButtons(fs.readFileSync(file, "utf8"), file),
    );
    expect(findings, `Icon-Buttons ohne aria-label/title:\n${findings.join("\n")}`).toEqual([]);
  });
});
