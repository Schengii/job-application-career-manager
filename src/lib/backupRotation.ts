// -----------------------------------------------------------------------------
// Backup-Rotations- & Revisions-Manager
// -----------------------------------------------------------------------------
import type { BackupData } from "./backup";

export interface RotatedBackupEntry {
  id: string;
  timestamp: string; // ISO String
  label: string;
  sizeBytes: number;
  data: BackupData;
}

const STORAGE_KEY = "career_backup_rotation";
const MAX_ROTATION_COUNT = 5;

export function getRotatedBackups(): RotatedBackupEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRotatedBackup(
  data: BackupData,
  customLabel?: string
): RotatedBackupEntry[] {
  const current = getRotatedBackups();
  const timestamp = new Date().toISOString();
  const dateStr = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const jsonStr = JSON.stringify(data);
  const sizeBytes = new Blob([jsonStr]).size;

  const newEntry: RotatedBackupEntry = {
    id: `backup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp,
    label: customLabel || `Sicherung vom ${dateStr}`,
    sizeBytes,
    data,
  };

  // Behalte die neuesten 5 Backups
  const updated = [newEntry, ...current].slice(0, MAX_ROTATION_COUNT);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Wenn localStorage voll ist, reduziere auf 3 Backups
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 3)));
      } catch {
        // Ignore
      }
    }
  }

  return updated;
}

export function deleteRotatedBackup(id: string): RotatedBackupEntry[] {
  const current = getRotatedBackups();
  const updated = current.filter((b) => b.id !== id);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  }
  return updated;
}

export function formatBackupSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
