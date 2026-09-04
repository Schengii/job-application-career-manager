import { useMemo, useState } from "react";
import useSWR from "swr";
import { Printer, Check, Copy } from "lucide-react";
import type { ApplicationDetail, PreferencesWithProfile } from "@/types";
import { fetcher } from "@/lib/core/api";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { generateInterviewDossierHtml } from "@/lib/interview/interviewDossier";
import { useToast } from "@/components/ui/toast";

export function InterviewDossierModal({
  open,
  onClose,
  application,
}: {
  open: boolean;
  onClose: () => void;
  application: ApplicationDetail;
}) {
  const { data: preferences } = useSWR<PreferencesWithProfile>("/api/preferences", fetcher);
  const toast = useToast();

  const [includeEmployerQuestions, setIncludeEmployerQuestions] = useState(true);
  const [includeSalaryLevers, setIncludeSalaryLevers] = useState(true);
  const [includeChecklist, setIncludeChecklist] = useState(true);
  const [copied, setCopied] = useState(false);

  const dossierHtml = useMemo(() => {
    return generateInterviewDossierHtml(application, preferences, {
      includeEmployerQuestions,
      includeSalaryLevers,
      includeChecklist,
    });
  }, [application, preferences, includeEmployerQuestions, includeSalaryLevers, includeChecklist]);

  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(dossierHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  async function handleCopyHtml() {
    try {
      await navigator.clipboard.writeText(dossierHtml);
      setCopied(true);
      toast.success("Dossier-HTML in Zwischenablage kopiert!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kopieren fehlgeschlagen.");
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Interview-Dossier & Spickzettel"
      className="w-[min(900px,94vw)]"
    >
      <div className="flex flex-col gap-4">
        {/* Schnelloptionen */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-hover/40 p-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
              <input
                type="checkbox"
                checked={includeChecklist}
                onChange={(e) => setIncludeChecklist(e.target.checked)}
                className="rounded border-border"
              />
              <span>Checkliste einbinden</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
              <input
                type="checkbox"
                checked={includeEmployerQuestions}
                onChange={(e) => setIncludeEmployerQuestions(e.target.checked)}
                className="rounded border-border"
              />
              <span>Gegenfragen einbinden</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
              <input
                type="checkbox"
                checked={includeSalaryLevers}
                onChange={(e) => setIncludeSalaryLevers(e.target.checked)}
                className="rounded border-border"
              />
              <span>Gehaltsargumente einbinden</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleCopyHtml}>
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? "Kopiert!" : "HTML kopieren"}</span>
            </Button>
            <Button size="sm" onClick={handlePrint} className="card-hover-effect">
              <Printer className="h-4 w-4" />
              <span>Drucken / Als PDF</span>
            </Button>
          </div>
        </div>

        {/* Live-Vorschau im iframe */}
        <div className="h-[520px] w-full overflow-hidden rounded-lg border border-border bg-white shadow-inner">
          <iframe
            srcDoc={dossierHtml}
            title="Interview Dossier Vorschau"
            className="h-full w-full border-0 bg-white"
          />
        </div>
      </div>
    </Dialog>
  );
}
