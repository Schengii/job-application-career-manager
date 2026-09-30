import { NextResponse } from "next/server";
import { sendWebhookNotification } from "@/lib/settings/webhookNotifier";

export async function POST(req: Request) {
  try {
    const { type, webhookUrl } = await req.json();

    if (!webhookUrl || typeof webhookUrl !== "string") {
      return NextResponse.json({ error: "Gültige Webhook-URL erforderlich." }, { status: 400 });
    }

    const ok = await sendWebhookNotification(webhookUrl, {
      title: "🔔 Test-Benachrichtigung von Job Application Manager",
      description: `Deine ${type === "discord" ? "Discord" : "Slack"}-Webhook-Integration funktioniert einwandfrei! ✅`,
      companyName: "Career Manager Test",
      position: "Senior Frontend Engineer",
      status: "INTERVIEW",
      nextStep: "Erfolgreicher Integrationstest",
    });

    if (!ok) {
      return NextResponse.json({ error: "Webhook konnte nicht erfolgreich ausgelöst werden." }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fehler beim Testen des Webhooks." },
      { status: 500 }
    );
  }
}
