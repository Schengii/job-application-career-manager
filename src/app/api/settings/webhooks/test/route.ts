import { NextResponse } from "next/server";
import { sendWebhookNotification } from "@/lib/settings/webhookNotifier";
import { UnsafeUrlError } from "@/lib/core/ssrfGuard";
import { webhookTestSchema } from "@/lib/core/validation";

export async function POST(req: Request) {
  try {
    const parsed = webhookTestSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Gültige Webhook-URL erforderlich." }, { status: 400 });
    }
    const { type, webhookUrl } = parsed.data;

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
    if (error instanceof UnsafeUrlError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fehler beim Testen des Webhooks." },
      { status: 500 }
    );
  }
}
