"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { apiPost } from "@/lib/core/api";
import { ApplicationDetail } from "@/types";
import { Mail, Send, Paperclip } from "lucide-react";

interface SendApplicationEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: ApplicationDetail;
  senderName?: string;
  senderEmail?: string;
  onSent?: () => void;
}

export function SendApplicationEmailModal({
  open,
  onOpenChange,
  application,
  senderName = "Alexander Schepp",
  senderEmail,
  onSent,
}: SendApplicationEmailModalProps) {
  const toast = useToast();
  const defaultRecipient = application.company.contactEmail || "";
  const defaultSubject = `Bewerbung als ${application.position} – ${senderName}`;
  const defaultBody =
    application.coverLetter?.content ||
    `Sehr geehrte Damen und Herren,\n\nanbei sende ich Ihnen meine vollständigen Bewerbungsunterlagen als ${application.position}.\n\nMit freundlichen Grüßen\n${senderName}${senderEmail ? `\n${senderEmail}` : ""}`;

  const [recipient, setRecipient] = useState(defaultRecipient);
  const [subject, setSubject] = useState(defaultSubject);
  const [bodyText, setBodyText] = useState(defaultBody);
  const [attachPdf, setAttachPdf] = useState(true);
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!recipient.trim() || !recipient.includes("@")) {
      toast.error("Bitte eine gültige Empfänger-E-Mail-Adresse angeben.");
      return;
    }

    setSending(true);
    try {
      await apiPost(`/api/applications/${application.id}/send-email`, {
        recipient: recipient.trim(),
        subject: subject.trim(),
        bodyText: bodyText.trim(),
        attachPdfPackage: attachPdf,
        includeCoverSheet: true,
      });

      toast.success("Bewerbung wurde erfolgreich per E-Mail versendet!");
      onOpenChange(false);
      onSent?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "E-Mail-Versand fehlgeschlagen.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-border">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Mail className="h-5 w-5 text-sky-500" /> Bewerbung direkt per E-Mail versenden
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Versendet das Anschreiben mit integriertem PDF-Mappen-Anhang direkt über deinen konfigurierten SMTP-Server.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Empfänger (E-Mail des Unternehmens):
            </label>
            <Input
              type="email"
              placeholder="z.B. karriere@unternehmen.de"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Betreff:</label>
            <Input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-xs font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">E-Mail-Text:</label>
            <Textarea
              rows={8}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="text-xs font-mono leading-relaxed resize-y"
            />
          </div>

          {/* Anhang-Optionen */}
          <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={attachPdf}
                onChange={(e) => setAttachPdf(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary h-4 w-4"
              />
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5 text-primary" />
                Vollständige Bewerbungsmappe (PDF) automatisch generieren und anhängen
              </span>
            </label>
            {attachPdf && (
              <p className="text-[11px] text-muted-foreground pl-6">
                Enthält Deckblatt, DIN 5008 Anschreiben, Lebenslauf und alle für diese Bewerbung aktivierten Zeugnisse.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSend}
            disabled={sending}
            className="shadow-sm"
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            {sending ? "Sende E-Mail …" : "Jetzt versenden"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
