import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Job Application & Career Manager",
    short_name: "Career Manager",
    description:
      "All-in-One Bewerbungs- und Karriere-Dashboard für Fachinformatiker Anwendungsentwicklung (Frontend)",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#4f46e5",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
