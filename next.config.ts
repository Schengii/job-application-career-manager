import type { NextConfig } from "next";

// -----------------------------------------------------------------------------
// Globale Security-Headers (siehe Next.js-Leitfaden "Content Security Policy",
// node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md,
// Abschnitt "Without Nonces").
// -----------------------------------------------------------------------------
// Bewusst OHNE Nonce-basierte CSP: Ein Nonce müsste pro Request in `proxy.ts`
// erzeugt werden, was laut Next.js-Doku ALLE Seiten auf dynamisches Rendering
// zwingt (kein Static Rendering/ISR/CDN-Caching mehr — siehe "Static vs
// Dynamic Rendering with CSP" im o.g. Leitfaden). Für diese primär lokal
// genutzte Einzelnutzer-App überwiegt der Performance-/Einfachheits-Vorteil
// von Static Rendering den zusätzlichen Schutz, den ein strikteres
// `script-src` ohne 'unsafe-inline' böte — `script-src`/`style-src` brauchen
// deshalb 'unsafe-inline' (u.a. für die von React Server Components
// injizierten Inline-Hydration-Scripts). Die übrigen Direktiven (v.a.
// `frame-ancestors 'none'` gegen Clickjacking, `object-src 'none'`,
// `form-action 'self'`) greifen unabhängig davon vollständig.
// -----------------------------------------------------------------------------
const isDev = process.env.NODE_ENV === "development";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  connect-src 'self';
  worker-src 'self';
  manifest-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  frame-src 'self';
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspHeader },
  // `frame-ancestors 'none'` oben deckt moderne Browser bereits ab;
  // `X-Frame-Options` bleibt als Fallback für ältere Browser, die CSP
  // ignorieren, ohne Zusatzkosten.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Kamera/Standort werden von keinem Feature benötigt; Mikrofon nur für die
  // eigene Spracherkennung im Mock-Interview (voice-interview-runner.tsx) —
  // dort bewusst nur für die eigene Origin erlaubt, nicht für eingebettete
  // Dritt-Inhalte.
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
  // Nur wirksam über HTTPS (z.B. Vercel-Hosting) — Browser ignorieren HSTS
  // auf einfachem HTTP (lokaler Dev-Betrieb), daher unbedenklich immer gesetzt.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        // Hochgeladene Bewerbungsunterlagen (`/api/documents/upload`) landen
        // unter `/public/uploads/` und werden von Next.js als statische
        // Dateien ausgeliefert. `DocumentPreviewModal` zeigt PDFs/Bilder
        // bewusst inline per <iframe>/<img> an — ein
        // `Content-Disposition: attachment` würde diese Inline-Vorschau
        // brechen (Browser laden die Datei dann als Download statt sie zu
        // rendern) und wird daher NICHT gesetzt. Der eigentliche Schutz
        // gegen aktiven Code in Uploads ist die MIME-/Endungs-Allowlist beim
        // Upload selbst (siehe src/app/api/documents/upload/route.ts), die
        // z.B. `.html`/`.svg`/`.js`-Dateien von vornherein ablehnt —
        // `X-Content-Type-Options: nosniff` oben greift bereits global,
        // diese Regel bleibt nur als Dokumentation der Absicht stehen.
        source: "/uploads/:path*",
        headers: [{ key: "X-Content-Type-Options", value: "nosniff" }],
      },
    ];
  },
};

export default nextConfig;
