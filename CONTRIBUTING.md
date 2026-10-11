# Beitragen zum Job Application & Career Manager

Vielen Dank für dein Interesse, das Projekt weiterzuentwickeln! Dieses Dokument beschreibt die Richtlinien für die Zusammenarbeit im Team sowie mit KI-Assistenten (Claude, Gemini, Copilot).

---

## 🛠️ Lokale Entwicklungsumgebung

### Voraussetzungen
- **Node.js**: Version ≥ 20 (empfohlen: Node 20 LTS oder 22 LTS)
- **npm**: Version ≥ 10
- **Git**

### Schnelleinrichtung
```bash
# 1. Repository klonen & Abhängigkeiten installieren
git clone <repo-url>
cd Bewerbungs-Dashboard
npm install

# 2. Lokale Umgebungskonfiguration anlegen
cp .env.example .env

# 3. SQLite Datenbank initialisieren & Schema pushen
npx prisma db push

# 4. Optionale Beispieldaten laden
npx prisma db seed

# 5. Entwicklungsserver starten
npm run dev
```

---

## 🤖 Zusammenarbeit mit KI-Assistenten (Claude & Gemini)

Beim Arbeiten mit KI-Werkzeugen (z. B. **Claude Code**, **Google Gemini**, **Cursor**, **Antigravity**) sind folgende Konfigurationsdateien im Repository hinterlegt:
- **`CLAUDE.md`**: Spezifische Richtlinien für Claude Code (Befehle, Architekturüberblick, Do's & Don'ts).
- **`GEMINI.md`**: Spezifische Richtlinien für Google Gemini und die Antigravity-IDE.
- **`AGENTS.md`**: Universelle Agenten-Anweisungen inklusive Next.js 16 Regeln.
- **`.claudeignore`**: Schützt sensible Daten, Datenbanken und Build-Ordner vor unbedachter Indizierung durch LLMs.

### 🔒 Wichtigste Datenschutz-Regel:
Prüfe vor jedem Commit, dass keine echten Bewerbungsunterlagen (aus `Bewerbungsunterlagen final/` oder `public/uploads/`) oder API-Keys (aus `.env` oder `.encryption-key`) in die Git-Historie gelangen.

---

## 🧪 Qualitätssicherung & Tests

Jeder Pull Request muss vor dem Merge folgende Checks bestehen:

```bash
# 1. Linter prüfen (muss 0 Fehler haben)
npm run lint

# 2. Vitest Testsuite ausführen (alle Tests müssen grün sein)
npm run test

# 3. Sicherheits- & Secret-Check ausführen
npm run security:check

# 4. Produktions-Build testen
npm run build

# 5. Optional: Playwright End-to-End Tests ausführen
npm run test:e2e
```

---

## 📝 Git Commit Konventionen

Wir orientieren uns an [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Neues Feature (z. B. `feat: CSV-Export für Gehaltstabelle hinzugefügt`)
- `fix:` Fehlerbehebung (z. B. `fix: SSRF-Validierung für Redirects korrigiert`)
- `docs:` Dokumentation (z. B. `docs: Vercel Deployment-Anleitung ergänzt`)
- `test:` Tests hinzugefügt oder aktualisiert
- `refactor:` Code-Umbau ohne Verhaltensänderung
- `chore:` Wartungsarbeiten, Dependencies oder Tooling-Konfigurationen
