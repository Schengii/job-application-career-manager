// -----------------------------------------------------------------------------
// Browser-seitiger Web-Push-Client: Berechtigung anfragen, beim Service
// Worker (public/sw.js) für Push registrieren/abmelden, Subscription an
// /api/push/subscribe|unsubscribe melden.
// -----------------------------------------------------------------------------
import { apiPost, fetcher } from "./api";

/** Standard-Snippet zur Umwandlung eines URL-safe-Base64 VAPID-Keys in ein Uint8Array (Push-API-Anforderung). */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

/** Liefert die aktuell aktive Push-Subscription dieses Browsers, falls vorhanden. */
export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

/**
 * Fragt (falls nötig) die Benachrichtigungs-Berechtigung an, abonniert Push
 * beim Service Worker und meldet die Subscription an den Server. Wirft bei
 * Ablehnung/fehlender Unterstützung einen Error mit nutzerverständlicher
 * Meldung — der Aufrufer (push-notifications-card.tsx) fängt das ab und
 * zeigt einen Toast.
 */
export async function subscribeToPush(): Promise<void> {
  if (!isPushSupported()) {
    throw new Error("Push-Benachrichtigungen werden von diesem Browser nicht unterstützt.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Berechtigung für Benachrichtigungen wurde nicht erteilt.");
  }

  const { publicKey } = await fetcher<{ publicKey: string }>("/api/push/vapid-public-key");
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    // Die DOM-Typen von `applicationServerKey` verlangen einen strikten
    // `ArrayBufferView<ArrayBuffer>` (kein `SharedArrayBuffer`); zur Laufzeit
    // akzeptiert die Push-API jedes BufferSource-kompatible TypedArray.
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });

  await apiPost("/api/push/subscribe", subscription.toJSON());
}

/** Meldet die Subscription beim Server ab und beendet sie im Browser. */
export async function unsubscribeFromPush(): Promise<void> {
  const subscription = await getExistingSubscription();
  if (!subscription) return;

  await apiPost("/api/push/unsubscribe", { endpoint: subscription.endpoint });
  await subscription.unsubscribe();
}
