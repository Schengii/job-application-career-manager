// -----------------------------------------------------------------------------
// Zertifikats- & Skill-Erneuerungs-Tracker (Ablaufdatum & Refresh-Reminder)
// -----------------------------------------------------------------------------
// Verwaltet IT-Zertifizierungen (z. B. AWS, Azure, Scrum Master, IHK, ITIL)
// und berechnet, welche Zertifikate in den nächsten 90 Tagen ablaufen oder
// erneuert werden sollten.
// -----------------------------------------------------------------------------

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string; // z.B. "Amazon Web Services", "Scrum.org", "IHK"
  issueDate: string; // YYYY-MM-DD
  expiryDate?: string | null; // YYYY-MM-DD oder null (lebenslang)
  credentialUrl?: string | null;
  status: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "LIFETIME";
  daysUntilExpiry?: number | null;
}

export function evaluateCertificationStatus(
  cert: Omit<CertificationItem, "status" | "daysUntilExpiry">,
  referenceDate: Date = new Date()
): CertificationItem {
  if (!cert.expiryDate) {
    return {
      ...cert,
      status: "LIFETIME",
      daysUntilExpiry: null,
    };
  }

  const expiry = new Date(cert.expiryDate);
  if (isNaN(expiry.getTime())) {
    return {
      ...cert,
      status: "LIFETIME",
      daysUntilExpiry: null,
    };
  }

  const diffMs = expiry.getTime() - referenceDate.getTime();
  const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let status: CertificationItem["status"] = "ACTIVE";
  if (daysUntilExpiry < 0) {
    status = "EXPIRED";
  } else if (daysUntilExpiry <= 90) {
    status = "EXPIRING_SOON";
  }

  return {
    ...cert,
    status,
    daysUntilExpiry,
  };
}

export function getExpiringCertifications(
  certs: CertificationItem[],
  daysThreshold = 90
): CertificationItem[] {
  return certs.filter(
    (c) =>
      c.status === "EXPIRING_SOON" ||
      (c.daysUntilExpiry !== null &&
        c.daysUntilExpiry !== undefined &&
        c.daysUntilExpiry >= 0 &&
        c.daysUntilExpiry <= daysThreshold)
  );
}
