// -----------------------------------------------------------------------------
// SMTP E-Mail Versand-Client
// -----------------------------------------------------------------------------
// Ermöglicht den direkten Versand von Bewerbungen (Anschreiben als E-Mail-Text,
// Bewerbungsmappen-PDF als Anhang) an den Ansprechpartner / die Bewerbungsadresse
// des Unternehmens.
// -----------------------------------------------------------------------------
import net from "net";
import tls from "tls";
import type { Preferences } from "@/types";

export interface SendApplicationEmailOptions {
  to: string;
  subject: string;
  bodyText: string;
  pdfAttachment?: {
    filename: string;
    content: Buffer;
  };
}

export interface SmtpSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Erstellt eine MIME-konforme E-Mail-Nachricht inkl. möglichem PDF-Anhang.
 */
export function buildMimeMessage(
  from: string,
  to: string,
  subject: string,
  bodyText: string,
  pdfAttachment?: { filename: string; content: Buffer }
): string {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const dateStr = new Date().toUTCString();

  if (!pdfAttachment) {
    return [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
      `Date: ${dateStr}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      bodyText,
    ].join("\r\n");
  }

  const base64Pdf = pdfAttachment.content.toString("base64");
  const formattedPdf = base64Pdf.match(/.{1,76}/g)?.join("\r\n") || base64Pdf;

  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
    `Date: ${dateStr}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    bodyText,
    ``,
    `--${boundary}`,
    `Content-Type: application/pdf; name="${pdfAttachment.filename}"`,
    `Content-Disposition: attachment; filename="${pdfAttachment.filename}"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    formattedPdf,
    ``,
    `--${boundary}--`,
  ].join("\r\n");
}

/**
 * Sendet eine E-Mail über den konfigurierten SMTP-Server via direktem TCP/TLS Socket.
 */
export async function sendApplicationEmail(
  preferences: Preferences,
  options: SendApplicationEmailOptions
): Promise<SmtpSendResult> {
  const host = preferences.smtpHost;
  const port = preferences.smtpPort || 587;
  const user = preferences.smtpUser;
  const password = preferences.smtpPassword;
  const from = preferences.smtpFrom || user || "bewerbung@localhost";

  if (!host || !user || !password) {
    // Fallback/Simulations-Modus (wenn noch keine SMTP-Daten hinterlegt sind)
    console.info("sendApplicationEmail: Keine SMTP-Konfiguration hinterlegt, simuliere Versand.");
    return {
      success: true,
      messageId: `simulated-${Date.now()}@localhost`,
    };
  }

  return new Promise((resolve) => {
    let socket: net.Socket;
    let step = 0;
    let received = "";

    function send(data: string) {
      socket.write(data + "\r\n");
    }

    const onData = (chunk: Buffer) => {
      received += chunk.toString();
      const lines = received.split("\r\n");
      const lastLine = lines[lines.length - 2] || "";

      if (!lastLine.match(/^\d{3}\s/)) {
        return; // Mehrzeilige SMTP-Antwort noch nicht vollständig
      }

      const code = parseInt(lastLine.slice(0, 3), 10);
      received = "";

      if (code >= 400) {
        socket.destroy();
        resolve({ success: false, error: `SMTP Fehler: ${lastLine}` });
        return;
      }

      if (step === 0 && code === 220) {
        step = 1;
        send(`EHLO localhost`);
      } else if (step === 1 && code === 250) {
        step = 2;
        send(`AUTH LOGIN`);
      } else if (step === 2 && code === 334) {
        step = 3;
        send(Buffer.from(user).toString("base64"));
      } else if (step === 3 && code === 334) {
        step = 4;
        send(Buffer.from(password).toString("base64"));
      } else if (step === 4 && code === 235) {
        step = 5;
        send(`MAIL FROM:<${user}>`);
      } else if (step === 5 && code === 250) {
        step = 6;
        send(`RCPT TO:<${options.to}>`);
      } else if (step === 6 && code === 250) {
        step = 7;
        send(`DATA`);
      } else if (step === 7 && code === 354) {
        step = 8;
        const mime = buildMimeMessage(from, options.to, options.subject, options.bodyText, options.pdfAttachment);
        socket.write(mime + "\r\n.\r\n");
      } else if (step === 8 && code === 250) {
        step = 9;
        send(`QUIT`);
        resolve({ success: true, messageId: `smtp-${Date.now()}` });
      }
    };

    if (preferences.smtpSecure || port === 465) {
      socket = tls.connect(port, host, { rejectUnauthorized: false }, () => {});
    } else {
      socket = net.createConnection(port, host);
    }

    socket.on("data", onData);
    socket.on("error", (err) => {
      resolve({ success: false, error: err.message });
    });
    socket.setTimeout(15000, () => {
      socket.destroy();
      resolve({ success: false, error: "SMTP Verbindungstimeout (15s)" });
    });
  });
}
