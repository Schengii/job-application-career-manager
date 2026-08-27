// -----------------------------------------------------------------------------
// GET /api/push/vapid-public-key -> öffentlicher VAPID-Key für den Browser
// -----------------------------------------------------------------------------
// Wird vom Frontend (src/lib/pushClient.ts) benötigt, um
// `pushManager.subscribe({ applicationServerKey })` aufzurufen — der Public
// Key ist unkritisch und darf offen ausgeliefert werden (Gegenstück zum
// privaten Key, der nur serverseitig in src/lib/vapidKeys.ts verwendet wird).
// -----------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { getVapidKeys } from "@/lib/vapidKeys";
import { handleApiError } from "@/lib/apiUtils";

export async function GET() {
  try {
    const { publicKey } = getVapidKeys();
    return NextResponse.json({ publicKey });
  } catch (error) {
    return handleApiError(error);
  }
}
