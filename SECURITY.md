# Sicherheit & Datenschutz (Security Policy)

Die Sicherheit persönlicher Bewerbungsdaten und die Integrität des Systems haben höchste Priorität.

---

## 🔒 Sicherheitsarchitektur im Überblick

1. **At-Rest-Verschlüsselung (AES-256-GCM)**:
   - Sensible Werte wie KI-API-Keys und IMAP-Passwörter werden niemals im Klartext in der PostgreSQL-Datenbank abgelegt.
   - Die Ver- und Entschlüsselung erfolgt server-seitig via `src/lib/core/secretCrypto.ts`.
   - Bei Backups oder API-Responses werden Secrets unkenntlich gemacht bzw. nie übertragen.

2. **SSRF-Schutz (Server-Side Request Forgery)**:
   - Externe URLs (z. B. im Job-Scraper) werden vor dem Abruf durch `src/lib/core/ssrfGuard.ts` geprüft.
   - Private IP-Bereiche (RFC 1918, RFC 4193), Loopback (`127.0.0.1`, `localhost`) und Cloud-Metadaten-Endpunkte (`169.254.169.254`) werden rigoros blockiert.

3. **MIME-Type & Upload-Schutz**:
   - Dateiuploads unter `/api/documents/upload` prüfen Dateiendung und MIME-Typ gegen eine strikte Whitelist (`PDF`, `PNG`, `JPEG`, `WEBP`).
   - Gefährliche Dateitypen (`HTML`, `SVG`, Skripte) werden verworfen.

4. **Passwort-Schutz & Rate-Limiting**:
   - Für Deployments außerhalb von `localhost` schützt `middleware.ts` die gesamte Anwendung per HTTP-Basic-Auth (`APP_PASSWORD`).
   - Passwortvergleiche erfolgen zeitsicher (`timingSafeEqual`) gegen Seitenkanal-Timingangriffe.
   - Ein Lockout-Mechanismus (`src/lib/core/rateLimiter.ts`) schützt vor Brute-Force-Angriffen.

5. **Automatischer Git Pre-Commit Hook**:
   - Skript `.githooks/pre-commit` (ausgeführt via `scripts/check-secrets.mjs`) fängt versehentlich gestagte `.env`-Dateien, private Bewerbungsunterlagen und API-Keys (`sk-`, `sk-ant-`, `ghp_`, Private Keys etc.) automatisch vor jedem `git commit` ab.
   - Manuell aufrufbar über `npm run security:check`.

---

## 🛡️ Datenschutz für Bewerbungsunterlagen

Echte persönliche Dokumente (Lebensläufe, Zeugnisse, Anschreiben) verbleiben strikt lokal und sind durch `.gitignore` und `.claudeignore` geschützt:
- Ordner `Bewerbungsunterlagen final/`
- Ordner `public/uploads/*`
- Datei `.encryption-key`
- Datei `.vapid-keys.json`
- Datei `.ai-usage.json`
- Datei `.env`

---

## 🚨 Sicherheitslücken melden

Falls du eine potenzielle Sicherheitslücke entdeckst:
1. Öffne **kein** öffentliches GitHub-Issue mit Details.
2. Kontaktiere den Repository-Inhaber vertraulich oder erstelle ein privates Security Advisory auf GitHub.
