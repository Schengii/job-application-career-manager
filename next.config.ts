import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hochgeladene Bewerbungsunterlagen (`/api/documents/upload`) landen unter
  // `/public/uploads/` und werden von Next.js als statische Dateien
  // ausgeliefert. `DocumentPreviewModal` zeigt PDFs/Bilder bewusst inline per
  // <iframe>/<img> an — ein `Content-Disposition: attachment` würde diese
  // Inline-Vorschau brechen (Browser laden die Datei dann als Download statt
  // sie zu rendern) und wird daher NICHT gesetzt. `X-Content-Type-Options:
  // nosniff` allein ist trotzdem sinnvoll: Es verhindert, dass der Browser
  // den vom Server deklarierten Content-Type ignoriert und die Datei anhand
  // des Inhalts als etwas anderes interpretiert. Der eigentliche Schutz
  // gegen aktiven Code in Uploads ist die MIME-/Endungs-Allowlist beim
  // Upload selbst (siehe src/app/api/documents/upload/route.ts), die z. B.
  // `.html`/`.svg`/`.js`-Dateien von vornherein ablehnt.
  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [{ key: "X-Content-Type-Options", value: "nosniff" }],
      },
    ];
  },
};

export default nextConfig;
