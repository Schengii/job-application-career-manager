"use client";

import { useState } from "react";
import { MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { apiPost } from "@/lib/core/api";

export function WebhooksCard() {
  const toast = useToast();
  const [discordUrl, setDiscordUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("DISCORD_WEBHOOK_URL") || "";
    }
    return "";
  });
  const [slackUrl, setSlackUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("SLACK_WEBHOOK_URL") || "";
    }
    return "";
  });
  const [testing, setTesting] = useState(false);

  function handleSave() {
    if (typeof window !== "undefined") {
      localStorage.setItem("DISCORD_WEBHOOK_URL", discordUrl.trim());
      localStorage.setItem("SLACK_WEBHOOK_URL", slackUrl.trim());
      toast.success("Webhook-URLs lokal gespeichert!");
    }
  }

  async function handleTestWebhook(type: "discord" | "slack") {
    const url = type === "discord" ? discordUrl.trim() : slackUrl.trim();
    if (!url) {
      toast.error(`Bitte trage zuerst eine gültige ${type === "discord" ? "Discord" : "Slack"} Webhook-URL ein.`);
      return;
    }

    setTesting(true);
    try {
      await apiPost("/api/settings/webhooks/test", {
        type,
        webhookUrl: url,
      });
      toast.success(`Test-Benachrichtigung erfolgreich an ${type === "discord" ? "Discord" : "Slack"} gesendet!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Senden der Test-Benachrichtigung fehlgeschlagen.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card className="border border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <MessageSquare className="h-5 w-5 text-indigo-500" />
          Discord & Slack Webhooks
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Erhalte automatische Echtzeit-Benachrichtigungen in deinen Discord-Server oder Slack-Channel bei Statusänderungen (z. B. Einladung zum Vorstellungsgespräch, Zusage, Follow-up).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Discord */}
          <div className="space-y-2 rounded-lg border border-border/60 p-3.5 bg-surface-hover/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#5865F2]" />
                Discord Webhook URL
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={testing || !discordUrl}
                onClick={() => handleTestWebhook("discord")}
                className="h-7 text-xs px-2"
              >
                <Send className="h-3 w-3 mr-1" />
                Testen
              </Button>
            </div>
            <Input
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              value={discordUrl}
              onChange={(e) => setDiscordUrl(e.target.value)}
              className="text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Server-Einstellungen &rarr; Integrationen &rarr; Webhooks
            </p>
          </div>

          {/* Slack */}
          <div className="space-y-2 rounded-lg border border-border/60 p-3.5 bg-surface-hover/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#4A154B]" />
                Slack Incoming Webhook URL
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={testing || !slackUrl}
                onClick={() => handleTestWebhook("slack")}
                className="h-7 text-xs px-2"
              >
                <Send className="h-3 w-3 mr-1" />
                Testen
              </Button>
            </div>
            <Input
              type="url"
              placeholder="https://hooks.slack.com/services/..."
              value={slackUrl}
              onChange={(e) => setSlackUrl(e.target.value)}
              className="text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Slack App &rarr; Incoming Webhooks &rarr; Webhook URL kopieren
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Wird automatisch bei Statuswechseln im Kanban & Bewerbungsdetail ausgelöst.
          </div>
          <Button type="button" onClick={handleSave} size="sm">
            Webhook-Einstellungen sichern
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
