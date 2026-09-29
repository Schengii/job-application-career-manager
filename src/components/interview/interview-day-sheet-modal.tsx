"use client";

// -----------------------------------------------------------------------------
// Mobile Interview-Day Quick-Sheet Modal (Unterwegs- & Schnellzugriffs-Modus)
// -----------------------------------------------------------------------------
import {
  MapPin,
  Phone,
  Mail,
  Video,
  HelpCircle,
  Sparkles,
  Navigation,
  FileText,
  Clock,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InterviewDayData } from "@/lib/interview/interviewDaySheet";
import { formatDate } from "@/lib/core/utils";

export function InterviewDaySheetModal({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: InterviewDayData | null;
}) {
  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md w-[95vw] p-0 overflow-hidden border-border/80 bg-surface shadow-2xl rounded-2xl">
        {/* Header mit Firmenbranding */}
        <div className="bg-gradient-to-r from-primary to-indigo-600 p-5 text-white">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white/80 uppercase tracking-wider mb-1">
            <Sparkles className="h-3.5 w-3.5" /> Interview-Day Quick-Sheet
          </div>
          <h2 className="text-xl font-bold leading-snug">{data.companyName}</h2>
          <p className="text-xs text-white/90 mt-0.5">{data.position}</p>
          {data.nextStepDate && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-medium backdrop-blur-xs">
              <Clock className="h-3 w-3" /> Termin: {formatDate(data.nextStepDate)}
            </div>
          )}
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto scroll-thin text-xs">
          {/* 1. Primäre Schnellzugriffs-Aktionen (Große Touch-Targets) */}
          <div className="grid grid-cols-2 gap-2.5">
            {data.meetingUrl ? (
              <a
                href={data.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 transition-colors shadow-xs"
              >
                <Video className="h-4 w-4" /> Video-Meeting beitreten
              </a>
            ) : null}

            {data.mapsNavigationUrl ? (
              <a
                href={data.mapsNavigationUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold p-2.5 transition-colors shadow-xs text-center"
              >
                <Navigation className="h-4 w-4" /> Route via Maps
              </a>
            ) : (
              <div className="flex items-center justify-center gap-1 rounded-xl bg-surface-hover/60 p-2.5 text-muted-foreground border border-dashed border-border text-center">
                <MapPin className="h-3.5 w-3.5" /> Kein Ort hinterlegt
              </div>
            )}

            {data.contactPhone ? (
              <a
                href={`tel:${data.contactPhone}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold p-2.5 transition-colors shadow-xs text-center"
              >
                <Phone className="h-4 w-4" /> Anrufen
              </a>
            ) : (
              <div className="flex items-center justify-center gap-1 rounded-xl bg-surface-hover/60 p-2.5 text-muted-foreground border border-dashed border-border text-center">
                <Phone className="h-3.5 w-3.5" /> Keine Tel. Nr.
              </div>
            )}
          </div>

          {/* 2. Ansprechpartner & Adresse */}
          <div className="rounded-xl border border-border bg-surface-hover/30 p-3.5 space-y-2">
            <span className="font-bold text-foreground text-[11px] uppercase tracking-wider block">
              Kontaktdaten & Adresse
            </span>
            {data.contactName && (
              <p className="font-semibold text-foreground">
                Ansprechpartner: <span className="text-primary">{data.contactName}</span>
              </p>
            )}
            {data.fullAddress && (
              <p className="text-muted-foreground flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <span>{data.fullAddress}</span>
              </p>
            )}
            {data.contactEmail && (
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <a href={`mailto:${data.contactEmail}`} className="text-primary hover:underline">
                  {data.contactEmail}
                </a>
              </p>
            )}
          </div>

          {/* 3. Wichtigste Tech-Skills der Stelle */}
          <div className="rounded-xl border border-border bg-surface-hover/30 p-3.5 space-y-2">
            <span className="font-bold text-foreground text-[11px] uppercase tracking-wider block">
              Kern-Skills für dieses Gespräch
            </span>
            <div className="flex flex-wrap gap-1.5">
              {data.topTechSkills.map((tech) => (
                <span
                  key={tech}
                  className="rounded-md border border-primary/20 bg-primary-soft/40 px-2 py-0.5 text-[11px] font-semibold text-primary"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* 4. Deine wichtigsten 4 Gegenfragen an das Team */}
          <div className="rounded-xl border border-border bg-surface-hover/30 p-3.5 space-y-2">
            <span className="font-bold text-foreground text-[11px] uppercase tracking-wider flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5 text-primary" /> Smarte Gegenfragen für dich
            </span>
            <ul className="space-y-1.5 text-muted-foreground">
              {data.keyQuestionsToAsk.map((q, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">›</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 5. Eigene Notizen & Vorbereitung */}
          {data.notes && (
            <div className="rounded-xl border border-border bg-surface-hover/30 p-3.5 space-y-1.5">
              <span className="font-bold text-foreground text-[11px] uppercase tracking-wider flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Deine Gesprächsnotizen
              </span>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{data.notes}</p>
            </div>
          )}
        </div>

        <div className="border-t border-border p-3 bg-surface-hover/40 flex justify-end">
          <Button size="sm" variant="outline" onClick={onClose} className="text-xs">
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
