// -----------------------------------------------------------------------------
// E-Mail-Outbox & .eml-Export (MIME RFC 822)
// -----------------------------------------------------------------------------
// Ermöglicht den 1-Klick-Export versandfertiger .eml-Dateien. Moderne E-Mail-Clients
// (Microsoft Outlook, Mozilla Thunderbird, Apple Mail) öffnen .eml-Dateien direkt
// im Verfassen-Fenster mit allen vorausgefüllten Daten.
// -----------------------------------------------------------------------------

export type EmlOptions = {
  to?: string | null;
  from?: string | null;
  subject: string;
  body: string;
  date?: Date;
};

export function generateEmlString(options: EmlOptions): string {
  const {
    to = "",
    from = "",
    subject,
    body,
    date = new Date(),
  } = options;

  const dateStr = date.toUTCString();

  const lines = [
    `MIME-Version: 1.0`,
    `Date: ${dateStr}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`,
    from ? `From: ${from}` : `From: Bewerber <bewerbung@example.com>`,
    to ? `To: ${to}` : `To:`,
    `Content-Type: text/plain; charset=UTF-8; format=flowed`,
    `Content-Transfer-Encoding: 8bit`,
    `X-Unsent: 1`, // Teilt Outlook/Thunderbird mit, dass dies ein noch ungesendeter Entwurf ist!
    ``,
    body,
  ];

  return lines.join("\r\n");
}

export function downloadEmlFile(filename: string, emlContent: string) {
  if (typeof window === "undefined") return;

  const blob = new Blob([emlContent], { type: "message/rfc822;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".eml") ? filename : `${filename}.eml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
