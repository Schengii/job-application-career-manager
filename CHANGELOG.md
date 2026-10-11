# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt hält sich an [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-10-11

### Hinzugefügt

#### 🧩 Browser-Erweiterung & Erfassung
- **Career Manager Clipper (Manifest V3)**: 1-Klick Web-Clipper für Chromium-Browser (Chrome, Edge, Brave) zum Extrahieren von Stellenanzeigen direkt aus LinkedIn, StepStone, Indeed und Unternehmensseiten via `schema.org/JobPosting` & OpenGraph.
- **Direkter ZIP-Export**: Browser-Extension kann direkt über die Einstellungen (`/settings`) als ZIP-Archiv für den lokalen Entwicklermodus geladen werden.
- **Multi-Portal URL-Scraper**: Automatisches Auslesen externer Stellenanzeigen mit SSRF-Schutz und HTML-Parsing.

#### 🎙️ KI-Simulation & Interview-Vorbereitung
- **Voice-First KI-Interview Simulator**: Vollständiger Audio-Dialog mittels Web Speech API (SpeechSynthesis TTS & webkitSpeechRecognition STT) inklusive Sprechtempo- und Füllwort-Analyse.
- **KI-Gehaltsverhandlungs-Coach**: Interaktives Verhandlungs-Roleplay gegen verschiedene HR-Personas mit BATNA-Bewertung und Taktik-Scorecard.
- **STAR-Audit & Dossier-Druck**: Strukturierte Vorbereitung auf verhaltensbezogene Interviewfragen mit DIN A4 Dossier-Export.

#### 📄 Dokumenten-Management & Bewerbungsmappe
- **High-Fidelity PDF Export**: DIN 5008 konforme Anschreiben und druckoptimierte Lebensläufe via CSS Paged Media.
- **ATS-optimierter CV-Designer**: Einspaltiges Minimal-Layout, Live-Audit auf ATS-Kompatibilität und Unterstützung des `resume.json` Standards.
- **Bewerbungsmappen-Builder**: Interaktive Zusammenstellung und Zusammenführung von Deckblatt, Anschreiben, Lebenslauf und Zeugnissen in eine einzige, komprimierte Gesamt-PDF (< 5 MB).
- **Textbaustein-Bibliothek**: Wiederverwendbare Absätze für Anschreiben (z. B. Remote-Erfahrung, Gehalt, Kündigungsfrist).

#### 📊 Analysen & Bewerbungsmanagement
- **Bewerbungs-Aufwand & ROTI-Tracker**: Return on Time Invested (ROTI) Score zur Identifikation zeiteffizienter Bewerbungskanäle.
- **Skill-Gap Matrix & Total Compensation Calculator**: Abgleich geforderter Markt-Skills mit dem eigenen Stack sowie genauer Effektiv-Stundenlohn-Rechner.
- **Interaktives Kanban-Board & Excel-View**: Tastaturbedienbares Kanban-Board mit Live-Screenreader-Feedback und paginierte Excel-Grid-Ansicht für Massenbearbeitung.
- **Digitales Recruiter-Portfolio One-Pager**: Schreibgeschützter Showcase für Personalverantwortliche mit temporärem Zugriffs-Token.
- **iCal Kalender-Feed**: Synchronisation anstehender Bewerbungsgespräche mit externen Kalendern (Google, Apple, Outlook).

#### 📬 Automatisierung & Benachrichtigungen
- **IMAP E-Mail Auto-Sync**: Postfachabgleich via IMAP/TLS mit automatischer Absendererkennung und Statusvorschlägen.
- **Web-Push Benachrichtigungen**: Standard Web Push API mit VAPID-Schlüsseln für Interview-Erinnerungen und Status-Updates.
- **In-Process Hintergrund-Scheduler**: Regelmäßiger Check (15-Minuten-Intervall) für anstehende Aufgaben, E-Mails und wöchentlichen Reminder-Digest.

#### 🔒 Sicherheit & Architektur
- **Next.js 16 (App Router) & React 19**: Modernste Web-Architektur mit Turbopack und TypeScript im Strict-Mode.
- **Prisma 7 mit better-sqlite3 Driver Adapter**: Performante relationale SQLite-Persistenz im WAL-Modus.
- **Sicherheits-Infrastruktur**:
  - SSRF-Guard gegen DNS-Rebinding und interne IP-Abfragen bei URL-Imports.
  - Strenges MIME-Type Whitelisting für Uploads.
  - At-Rest-Verschlüsselung (AES-256-GCM) für KI-API-Keys und IMAP-Passwörter.
  - Optionale HTTP-Basic-Auth mit Timing-Angriffsschutz und IP-basiertem Rate-Limiting.
- **Testabdeckung**:
  - Über 490 Vitest Unit- und Komponenten-Tests.
  - 15 Playwright End-to-End Testflows gegen isolierte SQLite-Instanz.
  - Docker Multi-Stage Build & GitHub Actions CI-Pipeline.
