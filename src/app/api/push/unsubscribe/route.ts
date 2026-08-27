// -----------------------------------------------------------------------------
// POST /api/push/unsubscribe -> entfernt eine Browser-Push-Subscription
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushUnsubscribeSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/apiUtils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = pushUnsubscribeSchema.parse(body);

    // deleteMany statt delete: kein Fehler, falls die Subscription bereits
    // entfernt wurde (z.B. automatisch durch sendPushToSubscription() nach
    // einem 404/410 vom Push-Dienst, siehe src/lib/pushNotifications.ts).
    await prisma.pushSubscription.deleteMany({ where: { endpoint: data.endpoint } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
