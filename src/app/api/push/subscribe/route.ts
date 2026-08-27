// -----------------------------------------------------------------------------
// POST /api/push/subscribe -> registriert eine Browser-Push-Subscription
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushSubscribeSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/apiUtils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = pushSubscribeSchema.parse(body);

    // upsert statt create: derselbe Browser kann sich mehrfach anmelden
    // (z.B. nach einem Berechtigungs-Reset), der Endpoint bleibt dabei der
    // eindeutige Schlüssel (siehe @@unique in prisma/schema.prisma).
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      update: { p256dh: data.keys.p256dh, auth: data.keys.auth },
      create: {
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        userAgent: request.headers.get("user-agent"),
      },
    });

    return NextResponse.json({ success: true, id: subscription.id });
  } catch (error) {
    return handleApiError(error);
  }
}
