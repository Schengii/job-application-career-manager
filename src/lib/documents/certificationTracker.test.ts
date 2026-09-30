import { describe, it, expect } from "vitest";
import {
  evaluateCertificationStatus,
  getExpiringCertifications,
  type CertificationItem,
} from "./certificationTracker";

describe("certificationTracker", () => {
  const refDate = new Date("2026-04-01T00:00:00Z");

  it("identifies lifetime certifications correctly", () => {
    const cert = evaluateCertificationStatus(
      {
        id: "1",
        name: "Fachinformatiker Anwendungsentwicklung",
        issuer: "IHK Köln",
        issueDate: "2024-06-30",
        expiryDate: null,
      },
      refDate
    );

    expect(cert.status).toBe("LIFETIME");
    expect(cert.daysUntilExpiry).toBeNull();
  });

  it("detects certifications expiring within 90 days", () => {
    const cert = evaluateCertificationStatus(
      {
        id: "2",
        name: "AWS Certified Developer Associate",
        issuer: "Amazon Web Services",
        issueDate: "2023-05-15",
        expiryDate: "2026-05-15", // 44 days from April 1
      },
      refDate
    );

    expect(cert.status).toBe("EXPIRING_SOON");
    expect(cert.daysUntilExpiry).toBe(44);
  });

  it("marks expired certifications correctly", () => {
    const cert = evaluateCertificationStatus(
      {
        id: "3",
        name: "Professional Scrum Master I",
        issuer: "Scrum.org",
        issueDate: "2022-01-01",
        expiryDate: "2025-12-31",
      },
      refDate
    );

    expect(cert.status).toBe("EXPIRED");
    expect(cert.daysUntilExpiry).toBeLessThan(0);
  });

  it("filters list of soon-to-expire certifications", () => {
    const certs: CertificationItem[] = [
      {
        id: "1",
        name: "AWS Certified",
        issuer: "AWS",
        issueDate: "2023-05-15",
        expiryDate: "2026-05-15",
        status: "EXPIRING_SOON",
        daysUntilExpiry: 44,
      },
      {
        id: "2",
        name: "IHK Zeugnis",
        issuer: "IHK",
        issueDate: "2024-06-30",
        status: "LIFETIME",
        daysUntilExpiry: null,
      },
    ];

    const expiring = getExpiringCertifications(certs);
    expect(expiring.length).toBe(1);
    expect(expiring[0].name).toBe("AWS Certified");
  });
});
