// -----------------------------------------------------------------------------
// Discord & Slack Webhook Notifier
// -----------------------------------------------------------------------------
// Sendet Status-Updates (z. B. Einladung zum Vorstellungsgespräch, Absage, Zusage)
// automatisch an einen konfigurierten Discord- oder Slack-Webhook-Channel.
// -----------------------------------------------------------------------------

export interface WebhookNotificationPayload {
  title: string;
  description: string;
  companyName: string;
  position: string;
  status: string;
  nextStep?: string | null;
  meetingUrl?: string | null;
}

export async function sendWebhookNotification(
  webhookUrl: string | null | undefined,
  payload: WebhookNotificationPayload
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith("http")) {
    return false;
  }

  const isDiscord = webhookUrl.includes("discord.com") || webhookUrl.includes("discordapp.com");

  try {
    let body: Record<string, unknown>;

    if (isDiscord) {
      const colorMap: Record<string, number> = {
        INTERVIEW: 0x38bdf8, // Sky Blue
        OFFER: 0x22c55e, // Emerald Green
        REJECTED: 0xef4444, // Red
        TALENT_POOL: 0xa855f7, // Purple
        SENT: 0xeab308, // Yellow
      };

      body = {
        username: "Career Manager Bot",
        embeds: [
          {
            title: payload.title,
            description: payload.description,
            color: colorMap[payload.status] || 0x6366f1,
            fields: [
              { name: "Unternehmen", value: payload.companyName, inline: true },
              { name: "Position", value: payload.position, inline: true },
              { name: "Status", value: payload.status, inline: true },
              ...(payload.nextStep
                ? [{ name: "Nächster Schritt", value: payload.nextStep, inline: false }]
                : []),
              ...(payload.meetingUrl
                ? [{ name: "Meeting Link", value: payload.meetingUrl, inline: false }]
                : []),
            ],
            footer: { text: "Job Application & Career Manager" },
            timestamp: new Date().toISOString(),
          },
        ],
      };
    } else {
      // Standard Slack Incoming Webhook Format
      body = {
        text: `*${payload.title}*\n${payload.description}\n*Firma:* ${payload.companyName} | *Stelle:* ${payload.position} | *Status:* ${payload.status}`,
      };
    }

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return res.ok;
  } catch (error) {
    console.error("Fehler beim Senden der Webhook-Benachrichtigung:", error);
    return false;
  }
}
