import { describe, it, expect } from "vitest";
import { assertPublicHttpUrl, isPrivateOrReservedIp, UnsafeUrlError } from "@/lib/core/ssrfGuard";

describe("ssrfGuard", () => {
  describe("isPrivateOrReservedIp", () => {
    it("erkennt private/reservierte IPv4-Bereiche", () => {
      expect(isPrivateOrReservedIp("127.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIp("10.0.0.5")).toBe(true);
      expect(isPrivateOrReservedIp("172.16.0.1")).toBe(true);
      expect(isPrivateOrReservedIp("172.31.255.255")).toBe(true);
      expect(isPrivateOrReservedIp("192.168.1.1")).toBe(true);
      expect(isPrivateOrReservedIp("169.254.169.254")).toBe(true); // Cloud-Metadaten (AWS/GCP/Azure)
      expect(isPrivateOrReservedIp("0.0.0.0")).toBe(true);
    });

    it("erkennt private/reservierte IPv6-Bereiche", () => {
      expect(isPrivateOrReservedIp("::1")).toBe(true);
      expect(isPrivateOrReservedIp("fe80::1")).toBe(true);
      expect(isPrivateOrReservedIp("fc00::1")).toBe(true);
      expect(isPrivateOrReservedIp("::ffff:127.0.0.1")).toBe(true);
    });

    it("lässt öffentliche Adressen zu", () => {
      expect(isPrivateOrReservedIp("93.184.216.34")).toBe(false); // example.com
      expect(isPrivateOrReservedIp("8.8.8.8")).toBe(false);
      expect(isPrivateOrReservedIp("2606:2800:220:1:248:1893:25c8:1946")).toBe(false);
    });
  });

  describe("assertPublicHttpUrl", () => {
    it("lehnt localhost und IP-Literale in privaten Bereichen ab", async () => {
      await expect(assertPublicHttpUrl("http://localhost:3000/api/preferences")).rejects.toThrow(UnsafeUrlError);
      await expect(assertPublicHttpUrl("http://127.0.0.1/")).rejects.toThrow(UnsafeUrlError);
      await expect(assertPublicHttpUrl("http://169.254.169.254/latest/meta-data/")).rejects.toThrow(UnsafeUrlError);
      await expect(assertPublicHttpUrl("http://192.168.1.1/")).rejects.toThrow(UnsafeUrlError);
    });

    it("lehnt nicht-http(s) Protokolle ab", async () => {
      await expect(assertPublicHttpUrl("file:///etc/passwd")).rejects.toThrow(UnsafeUrlError);
      await expect(assertPublicHttpUrl("ftp://example.com/")).rejects.toThrow(UnsafeUrlError);
    });

    it("lehnt ungültige URLs ab", async () => {
      await expect(assertPublicHttpUrl("not-a-url")).rejects.toThrow(UnsafeUrlError);
    });

    it("erlaubt eine gültige öffentliche http(s)-URL mit IP-Literal", async () => {
      const parsed = await assertPublicHttpUrl("https://93.184.216.34/karriere");
      expect(parsed.hostname).toBe("93.184.216.34");
    });
  });
});
