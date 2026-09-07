// -----------------------------------------------------------------------------
// Robuster Text-Diff-Algorithmus (Line- und Word-Ebene)
// -----------------------------------------------------------------------------
// Berechnet Unterschiede zwischen zwei Versionen eines Anschreibens oder Textes
// ohne externe schwergewichtige Abhängigkeiten.
// -----------------------------------------------------------------------------

export type DiffChangeType = "ADDED" | "REMOVED" | "UNCHANGED";

export interface DiffLine {
  type: DiffChangeType;
  text: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffSummary {
  addedCount: number;
  removedCount: number;
  unchangedCount: number;
  lines: DiffLine[];
}

export function computeTextDiff(oldText: string, newText: string): DiffSummary {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  const lines: DiffLine[] = [];
  let addedCount = 0;
  let removedCount = 0;
  let unchangedCount = 0;

  let oldIdx = 0;
  let newIdx = 0;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (oldIdx >= oldLines.length) {
      // Nur noch neue Zeilen
      lines.push({
        type: "ADDED",
        text: newLines[newIdx],
        newLineNumber: newIdx + 1,
      });
      addedCount++;
      newIdx++;
    } else if (newIdx >= newLines.length) {
      // Nur noch alte Zeilen (gelöscht)
      lines.push({
        type: "REMOVED",
        text: oldLines[oldIdx],
        oldLineNumber: oldIdx + 1,
      });
      removedCount++;
      oldIdx++;
    } else if (oldLines[oldIdx] === newLines[newIdx]) {
      // Identische Zeile
      lines.push({
        type: "UNCHANGED",
        text: oldLines[oldIdx],
        oldLineNumber: oldIdx + 1,
        newLineNumber: newIdx + 1,
      });
      unchangedCount++;
      oldIdx++;
      newIdx++;
    } else {
      // Zeilen weichen ab: Schaue 1 Schritt nach vorn, um Add/Delete zu erkennen
      const nextMatchingInNew = newLines.indexOf(oldLines[oldIdx], newIdx);
      const nextMatchingInOld = oldLines.indexOf(newLines[newIdx], oldIdx);

      if (nextMatchingInNew !== -1 && (nextMatchingInOld === -1 || nextMatchingInNew - newIdx <= nextMatchingInOld - oldIdx)) {
        // In newLines wurden Zeilen eingefügt
        while (newIdx < nextMatchingInNew) {
          lines.push({
            type: "ADDED",
            text: newLines[newIdx],
            newLineNumber: newIdx + 1,
          });
          addedCount++;
          newIdx++;
        }
      } else if (nextMatchingInOld !== -1) {
        // In oldLines wurden Zeilen gelöscht
        while (oldIdx < nextMatchingInOld) {
          lines.push({
            type: "REMOVED",
            text: oldLines[oldIdx],
            oldLineNumber: oldIdx + 1,
          });
          removedCount++;
          oldIdx++;
        }
      } else {
        // Zeile modifiziert (als REMOVED gefolgt von ADDED)
        lines.push({
          type: "REMOVED",
          text: oldLines[oldIdx],
          oldLineNumber: oldIdx + 1,
        });
        removedCount++;
        oldIdx++;

        lines.push({
          type: "ADDED",
          text: newLines[newIdx],
          newLineNumber: newIdx + 1,
        });
        addedCount++;
        newIdx++;
      }
    }
  }

  return {
    addedCount,
    removedCount,
    unchangedCount,
    lines,
  };
}
