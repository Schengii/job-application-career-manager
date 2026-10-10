import { describe, expect, it } from "vitest";
import { generateQrSvg, createPortfolioQrCode } from "./qrCodeGenerator";

describe("qrCodeGenerator", () => {
  it("erzeugt ein valides SVG mit Finder-Mustern", () => {
    const svg = generateQrSvg("https://example.com", { size: 120 });
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain('viewBox="0 0 120 120"');
    expect(svg).toContain("<rect");
  });

  it("erzeugt korrekte Portfolio-URL und SVG", () => {
    const { url, svg } = createPortfolioQrCode("https://app.test", "secret-token-123");
    expect(url).toBe("https://app.test/portfolio/secret-token-123");
    expect(svg).toContain("<svg");
    expect(svg).toContain("Digital Developer Portfolio");
  });
});
