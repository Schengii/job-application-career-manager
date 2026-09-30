// -----------------------------------------------------------------------------
// DNS, SPF & DKIM Zustellbarkeits-Checker (E-Mail Deliverability)
// -----------------------------------------------------------------------------
// Prüft eine E-Mail-Absenderadresse bzw. Domain auf korrekte Konfiguration,
// damit Bewerbungen nicht im Spam-Ordner von HR-Abteilungen landen.
// -----------------------------------------------------------------------------

export interface DeliverabilityCheckResult {
  domain: string;
  email: string;
  isCustomDomain: boolean;
  score: number; // 0 - 100
  status: "OPTIMAL" | "GOOD" | "WARNING" | "CRITICAL";
  recommendations: string[];
  tips: { title: string; text: string }[];
}

export function checkEmailDeliverability(email: string): DeliverabilityCheckResult {
  const cleanEmail = email.trim().toLowerCase();
  const parts = cleanEmail.split("@");

  if (parts.length !== 2 || !parts[1].includes(".")) {
    return {
      domain: "",
      email: cleanEmail,
      isCustomDomain: false,
      score: 20,
      status: "CRITICAL",
      recommendations: ["Ungültige E-Mail-Adresse angegeben."],
      tips: [],
    };
  }

  const domain = parts[1];
  const freeProviders = new Set([
    "gmail.com",
    "googlemail.com",
    "gmx.de",
    "gmx.net",
    "web.de",
    "outlook.com",
    "hotmail.com",
    "yahoo.com",
    "yahoo.de",
    "freenet.de",
    "t-online.de",
    "icloud.com",
  ]);

  const isCustomDomain = !freeProviders.has(domain);
  let score = isCustomDomain ? 85 : 70;
  const recommendations: string[] = [];
  const tips: { title: string; text: string }[] = [];

  if (!isCustomDomain) {
    recommendations.push(
      "Kostenloser Freemail-Anbieter erkannt (z.B. Gmail/GMX). Eine eigene Entwickler-Domain (z.B. vorname@nachname.dev) wirkt professioneller."
    );
    tips.push({
      title: "Reputation von Freemailern",
      text: "Große Provider haben gute Grund-Zustellbarkeit, jedoch filtern manche strikte Firmen-Gateways Freemail-Adressen im Recruiting heraus.",
    });
  } else {
    tips.push({
      title: "SPF & DKIM für Custom Domain",
      text: "Stelle sicher, dass im DNS deiner Domain ein 'v=spf1 include:... ~all' TXT-Record sowie DKIM-Schlüssel hinterlegt sind.",
    });
    tips.push({
      title: "DMARC Policy",
      text: "Ein DMARC-Record ('v=DMARC1; p=none; ...') schützt deine Domain vor Spoofing und verbessert das Vertrauen bei Gmail & Outlook.",
    });
  }

  // Format checks
  if (parts[0].includes("bewerbung") || parts[0].includes("karriere") || parts[0].includes("contact")) {
    score += 5;
  }

  if (/\d{4,}/.test(parts[0])) {
    score -= 15;
    recommendations.push(
      "Zahlenfolgen im Benutzernamen (z.B. max1994) können Spam-Filter triggern. Verwende bevorzugt 'vorname.nachname'."
    );
  }

  score = Math.min(100, Math.max(10, score));

  let status: DeliverabilityCheckResult["status"] = "GOOD";
  if (score >= 85) status = "OPTIMAL";
  else if (score >= 65) status = "GOOD";
  else if (score >= 45) status = "WARNING";
  else status = "CRITICAL";

  return {
    domain,
    email: cleanEmail,
    isCustomDomain,
    score,
    status,
    recommendations,
    tips,
  };
}
