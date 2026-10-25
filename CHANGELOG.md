# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt hält sich an [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Behoben & Gehärtet (Security)
- **Fail-closed auf Vercel**: Ohne `APP_PASSWORD` liefert `middleware.ts` auf Vercel 503 statt die App öffentlich auszuliefern. Cron-Tick, Portfolio-Tracking und Recruiter-Ansicht sind per `isPublicPath` ausgenommen (sichern sich selbst ab).
- Zod-Validierung für `/api/portfolio/token` (POST) und `/api/settings/webhooks/test`.

### Geändert
- **Auto-Backups in der Datenbank**: Neues Modell `BackupSnapshot` ersetzt die Ablage unter `./backups/` (auf Vercel nicht beschreibbar). Nach dem Update `npx prisma db push` ausführen.
- `/api/metrics` nutzt ein `groupBy` statt sieben einzelner `count()`-Abfragen.

- Kontinuierliche Verbesserungen an KI-Prompts und Prompt-Chains für Interview- und Anschreiben-Generierung.
- Performance-Optimierungen für Client-seitiges Caching mit SWR.

---

## [0.4.0] - 2026-10-16

### Behoben & Gehärtet (Security)
- **SSRF-Schutz für Webhook-Tests**: `/api/settings/webhooks/test` und `webhookNotifier.ts` validieren Ziel-URLs mit `assertPublicHttpUrl` und verwenden `safeFetchFollowingRedirects` (blockiert private IP-Bereiche, RFC 1918, RFC 4193 und Metadaten-Endpunkte).
- **Path-Traversal-Schutz im Dokumentenversand**: `pdfMerge.ts` und `zipPackage.ts` prüfen Dateipfade strikt gegen das Upload-Verzeichnis und verhindern SSRF bei Remote-URLs.
- **Geheimnisschutz in Backups**: `smtpPassword` wird in `src/lib/settings/backup.ts` zuverlässig vor dem JSON-Export herausgefiltert.
- **Validierung von Dateipfaden**: `safeFileUrlSchema` in `src/lib/core/validation.ts` weist Traversal-Muster (`..`, `\`) rigoros ab.
- **Schutz der Entwicklungsdatenbank**: `resetDb` in `src/test/dbTestUtils.ts` bricht bei fehlendem `TEST_DATABASE_URL` sicher ab; `vitest.config.mts` nutzt keine Standard-Entwicklungs-DB mehr für API-Tests.

### Barrierefreiheit (a11y)
- **Accessible Names für Dialoge**: `aria-label="Schließen"` in `DialogClose` (`src/components/ui/dialog.tsx`) sowie in 6 Feature-Modalkomponenten (`CalendarFeedModal`, `FollowUpEmailModal`, `ApplicationPdfPackageModal`, `JobTextParserModal`, `JobComparisonModal`, `JobAlertModal`).
- **Screenreader-Labels in Excel-View**: Accessible Labels für Suche und Filter-Reset im `ExcelGridTable`.
- **Accessible Tooltips & Shortcuts**: Tastaturkürzel-Trigger in `sidebar.tsx` mit aussagekräftigem `aria-label` versehen.

### Performance & Codequalität
- **Lazy Loading im Analytics-Dashboard**: Sekundäre Rechnerkarten (`OfferComparisonMatrix`, `TotalCompensationCard`, `RoiTrackerCard`, `CurrencyRelocationCalculator`, `SkillRoadmapTracker`, `VermittlungsbudgetCard`, `ContractCheckerCard`, `NoticePeriodCalculatorCard`, `CommuteCalculatorCard`, `TaxExpenseReportCard`, `CounterOfferAssistantCard`) per `next/dynamic` mit Skeleton-Fallback ausgelagert.
- **Entflechtung von commuteCalculator**: Pendel-Radar im Jobs-Bereich in `src/lib/jobs/commuteRadar.ts` umbenannt, um Namenskollisionen mit dem Gehaltsrechner zu eliminieren.
- **Typensicherheit Web Speech API**: Zentrale Typdefinitionen (`WindowWithSpeechRecognition`, `SpeechRecognitionLike`, `SpeechRecognitionEventLike`) in `src/types/index.ts` integriert und alle `any`-Casts in Interview-Komponenten entfernt.
- **Typsicherer Response-Body**: Direkte Blob-Verwendung für ZIP-Downloads in `src/app/api/backup/zip/route.ts`.
- **Bereinigung toter Artefakte**: Veraltetes SQLite-Schema-Dump `prisma/test-schema.sql` und ungenutzte UI-/Hilfsexporte entfernt.

### Developer Experience & Dokumentation
- **Prisma-Skripte in package.json**: `npm run db:push`, `npm run db:generate`, `npm run db:studio` ergänzt.
- **Bereinigung von SQLite-Altlasten**: Leitfäden und Dokumente (`GEMINI.md`, `SECURITY.md`, `CONTRIBUTING.md`, `README.md`) auf Neon PostgreSQL harmonisiert.
- **Vollständige Modulübersicht**: Alle 12 Domänen-Module (`analytics`, `career`, `companies`, `portfolio` etc.) und aktuelle Dateinamen in `AGENTS.md`, `GEMINI.md` und `CLAUDE.md` synchronisiert.

---

## [0.3.0] - 2026-10-11

### Hinzugefügt
- **Neon PostgreSQL & Prisma Serverless Adapter**:
  - Vollständige Migration auf Neon PostgreSQL über `@prisma/adapter-neon` (`PrismaNeonHttp`).
  - Unterstützung für Serverless Functions via HTTP-Transport ohne persistente WebSocket-Verbindungen.
  - Dual-Connection-Setup mit `DATABASE_URL` (Connection Pooler für Runtime-Queries) und `DIRECT_URL` (Direct Connection für DDL / `prisma db push`).
- **Vercel Cloud Deployment & Blob Storage**:
  - Konfiguration für produktives Hosting auf Vercel (`vercel.json`).
  - Integration von `@vercel/blob` für persistente Datei-Uploads in der Cloud.
  - Vercel Serverless Cron Job (`/api/cron/tick`) mit `CRON_SECRET`-Absicherung für tägliche Hintergrundaufgaben.
  - Vercel Build-Optimierung: `ignoreCommand` zum Überspringen unnötiger Builds auf Dependabot-Branches.
- **Multi-Agent & Tooling-Governance**:
  - Spezifische Agent-Leitfäden für Claude ([CLAUDE.md](CLAUDE.md)) und Google Gemini / Antigravity ([GEMINI.md](GEMINI.md)).
  - Ignore-Dateien ([.claudeignore](.claudeignore) und [.geminiignore](.geminiignore)) zum Schutz sensibler Daten und Schonung des KI-Kontextfensters.
  - Standardisierte Universal-Agent-Regeln in [AGENTS.md](AGENTS.md) mit Next.js 16 Leitplanken.
- **Sicherheits-Infrastruktur & Pre-Commit Hook**:
  - Git Pre-Commit Hook ([.githooks/pre-commit](.githooks/pre-commit) & `scripts/check-secrets.mjs`) blockiert versehentlich gestagte `.env`-Dateien, echte API-Keys (`sk-`, `ghp_`) und private Bewerbungsunterlagen.
  - Manueller Sicherheits-Audit via `npm run security:check`.
  - Plattformübergreifende Zeilenenden-Normalisierung via [.gitattributes](.gitattributes).
- **GitHub Collaboration Templates**:
  - Issue-Vorlagen für Bug-Reports und Feature-Requests unter `.github/ISSUE_TEMPLATE/`.
  - Pull-Request-Template mit Test- und Sicherheits-Checkliste ([.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md)).
  - Dependabot-Konfiguration für automatische Dependency-Updates.

### Geändert
- Prisma-Schema von `sqlite` auf `postgresql` umgestellt.
- CI-Pipeline (`.github/workflows/ci.yml`) für PostgreSQL-Builds und isolierte Testläufe mit `TEST_DATABASE_URL` angepasst.
- Dokumentation ([README.md](README.md), [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md)) vollständig auf PostgreSQL und Vercel aktualisiert.

---

## [0.2.0] - 2026-10-11

### Hinzugefügt
- **🧩 Browser-Erweiterung: Career Manager Clipper (Manifest V3)**:
  - 1-Klick Web-Clipper für Chromium-Browser (Chrome, Edge, Brave) zur automatischen Erfassung von Stellenangeboten aus LinkedIn, StepStone, Indeed und Unternehmensseiten.
  - Extraktion von `schema.org/JobPosting` JSON-LD und OpenGraph-Tags direkt im DOM.
  - 1-Klick ZIP-Download der gepackten Erweiterung aus den Einstellungen (`/settings`).
- **🎙️ KI-Simulation & Verhandlungs-Coach (`/interview-prep`)**:
  - Interaktives Gehaltsverhandlungs-Roleplay gegen verschiedene HR-Personas (Head of People, Engineering Manager, Geschäftsführung).
  - Taktische Live-Analyse: BATNA-Bewertung, Value Framing und Scorecard (0–100%).
  - STAR-Audit zur methodischen Vorbereitung auf verhaltensbezogene Fragen mit DIN A4 Dossier-Export.
  - Voice-First Audio-Dialog mittels Web Speech API (SpeechSynthesis TTS & SpeechRecognition STT).
- **📄 Mappen-Builder & Dokumenten-Management**:
  - High-Fidelity PDF Export Generator nach DIN 5008 für Anschreiben und druckoptimierte Lebensläufe via CSS Paged Media.
  - ATS-optimierter CV-Designer mit Einspalten-Layout und `resume.json` Export.
  - Bewerbungsmappen-Builder zur Zusammenführung von Deckblatt, Anschreiben, Lebenslauf und Zeugnissen in ein Dokument (< 5 MB).
- **📊 ROTI-Tracker & Erweiterte Analytics**:
  - Return on Time Invested (ROTI) Score zur Analyse zeiteffizienter Bewerbungskanäle.
  - Skill-Gap Matrix und Total Compensation Rechner.
  - Response-Heatmap zur Ermittlung optimaler Absendezeiten.

---

## [0.1.0] - 2026-10-11

### Hinzugefügt
- **Kernanwendung & Dashboard**:
  - Next.js 16 Fullstack-Anwendung mit App Router, React 19, TypeScript im Strict-Mode und Tailwind CSS v4.
  - Interaktives Kanban-Board mit Spalten für Entwurf, Beworben, Interview, Angebot und Absage.
  - Detailformulare für Bewerbungen und Unternehmensprofile mit SWR-Datenbindung.
  - Alternative paginierte Tabellen- und Grid-Ansicht für Massenbearbeitung.
- **REST-API & Validierung**:
  - Vollständige Zod-Validierung aller API-Routen unter `/api/**`.
  - Schutz vor SSRF bei externen URL-Abrufen via `src/lib/core/ssrfGuard.ts`.
  - Rate-Limiter und HTTP-Basic-Auth in `middleware.ts`.
  - AES-256-GCM At-Rest-Verschlüsselung für API-Keys und IMAP-Passwörter.
- **Automatisierung & Kalender**:
  - IMAP E-Mail Auto-Sync mit intelligenter Status-Vorschlags-Engine.
  - Web-Push Benachrichtigungen (VAPID) für anstehende Termine.
  - iCal Kalender-Feed für Apple Calendar, Google Calendar und Outlook.
- **Qualitätssicherung**:
  - Vitest Unit- und Komponenten-Testsuite.
  - Playwright E2E-Tests für Kern-Workflows.
