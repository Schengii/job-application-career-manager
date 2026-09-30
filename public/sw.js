// -----------------------------------------------------------------------------
// Service Worker für Offline-Caching und PWA-Installation
// -----------------------------------------------------------------------------
const CACHE_NAME = "career-manager-v3";
const STATIC_ASSETS = [
  "/",
  "/interview-prep",
  "/cv-designer",
  "/applications",
  "/companies",
  "/analytics",
  "/calendar",
  "/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Für API-Aufrufe Netzwerk bevorzugen
  if (event.request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// -----------------------------------------------------------------------------
// Web-Push-Benachrichtigungen (src/lib/pushNotifications.ts sendet das
// Payload als JSON-String mit { title, body, url, tag }, siehe dort).
// -----------------------------------------------------------------------------
self.addEventListener("push", (event) => {
  let data = { title: "Bewerbungs-Update", body: "" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // Payload war kein JSON — Fallback-Text oben bleibt bestehen.
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: data.tag,
      data: { url: data.url || "/" },
    })
  );
});

// Klick auf eine Push-Benachrichtigung öffnet (oder fokussiert) die
// zugehörige Bewerbung, statt nur die Benachrichtigung zu schließen.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
