"use client";

// -----------------------------------------------------------------------------
// JSON-Resume Import & Export Modal Component
// -----------------------------------------------------------------------------
import { useState } from "react";
import { Download, Upload, FileCode, Check, AlertCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { apiPost } from "@/lib/api";

interface JsonResumeModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export function JsonResumeModal({ open, onClose, onImported }: JsonResumeModalProps) {
  const toast = useToast();
  const [jsonText, setJsonText] = useState("");
  const [loading, setLoading] = useState(false);

  function handleDownload() {
    window.open("/api/resume/json", "_blank");
    toast.success("JSON-Resume Download gestartet!");
  }

  async function handleImport() {
    if (!jsonText.trim()) {
      toast.warning("Bitte füge JSON-Resume Code ein.");
      return;
    }

    setLoading(true);
    try {
      const parsed = JSON.parse(jsonText);
      await apiPost("/api/resume/json", parsed);
      toast.success("JSON-Resume erfolgreich importiert!");
      setJsonText("");
      onImported();
      onClose();
    } catch (e) {
      toast.error(`Import fehlgeschlagen: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-primary" /> JSON-Resume (Open Source Standard)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-xs text-muted-foreground">
            Das <strong>JSON-Resume</strong> Format (<em>schema.json</em>) ist der weltweite Standard für maschinenlesbare Entwickler-Lebensläufe. Du kannst dein Profil als standardisiertes JSON exportieren oder bestehende Daten importieren.
          </p>

          <div className="flex gap-3">
            <Button onClick={handleDownload} variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2 text-primary" /> Aktuelles Profil als JSON exportieren
            </Button>
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <label className="text-xs font-semibold text-foreground">
              JSON-Resume importieren (Copy & Paste)
            </label>
            <Textarea
              rows={8}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='{\n  "basics": {\n    "name": "Alexander Schepp",\n    "label": "Fachinformatiker für Anwendungsentwicklung"\n  }\n}'
              className="font-mono text-xs"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
              <Button onClick={handleImport} disabled={loading || !jsonText.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Upload className="h-4 w-4 mr-1.5" />}
                Importieren & Profil aktualisieren
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
