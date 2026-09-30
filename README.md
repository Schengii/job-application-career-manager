# Job Application & Career Manager

Eine vollständige, moderne Fullstack-Web-Anwendung zur professionellen Steuerung der gesamten Jobsuche als **Fachinformatiker für
Anwendungsentwicklung** (Schwerpunkt Frontend: TypeScript, JavaScript, CSS, React, Next.js – Region
Bonn/Dortmund/Remote). Alle Daten – Unternehmen, Stellenangebote, Bewerbungen, Präferenzen,
Dokumente, Historie, generierte Anschreiben, Interview-Dossiers, Lebensläufe und Recruiter-Portfolios – werden in einer PostgreSQL-Datenbank (Neon Serverless) via Prisma 7 gespeichert.

**Live-Demo:** [job-application-career-manager.vercel.app](https://job-application-career-manager.vercel.app)

---

## 🚀 Features im Überblick

### 1. 🧩 Browser-Erweiterung: Career Manager Clipper (Manifest V3)
- **1-Klick Web-Clipper für Chrome, Edge & Brave**:
  - Auf StepStone, Indeed, LinkedIn oder Firmen-Karriereseiten mit einem Klick alle relevanten Daten erfassen.
  - Automatisches Auslesen von `schema.org/JobPosting` JSON-LD Metadaten und OpenGraph-Tags.
  - Extrahiert Jobtitel, Arbeitgeber, Standort, Remote-Status und geforderten Tech-Stack direkt im DOM.
- **Integrierter 1-Klick Download in den Einstellungen (`/settings`)**:
  - Die Erweiterung kann als fertiges `.zip`-Archiv direkt aus der App heruntergeladen und entpackt im Browser geladen werden.
  - Kommuniziert 100% lokal mit der Dashboard-REST-API (`localhost:3000/api/jobs`).

---

### 2. 💬 KI-Gehaltsverhandlungs-Coach & Roleplay-Simulator (`/interview-prep`)
- **Interaktives Verhandlungs-Roleplay gegen verschiedene HR-Personas**:
  - Wähle aus realistischen Szenarien: *Einstiegsangebot unter Erwartung*, *Verhandlung mit vorliegendem Gegenangebot (BATNA)* oder *Benefits & Sachbezüge verhandeln*.
  - Trainiere gegen verschiedene Gesprächspartner: *Head of People & Culture*, *Lead Architect / Engineering Manager* oder *Geschäftsführung*.
- **Taktische Live-Analyse & Dynamische Gegenangebote**:
  - Erkennt Value Framing (Verankerung von Praxisprojekten und Tech-Skills wie React 19/TypeScript).
  - Bewertet den Einsatz von Alternativen (BATNA) und nicht-monetären Kompromissen (Home-Office, Weiterbildung, Deutschlandticket).
  - Schließt mit einer detaillierten **Taktik-Scorecard (0–100%)** ab.

---

### 3. ⏱️ Bewerbungs-Aufwand & ROI-Tracker (`/analytics` & Bewerbungsdetails)
- **Return on Time Invested (ROTI-Score)**:
  - Erfassung der investierten Zeit (Recherche, Anschreiben-Erstellung, Vorbereitung) pro Bewerbung mit Schnell-Buttons (+15m, +30m, +1h).
  - Ermittelt die Kanal-Effizienz: Welche Jobportale (LinkedIn, StepStone, Get in IT, Direktbewerbung) liefern die meisten Vorstellungsgespräche pro 10 investierten Stunden?
  - Identifiziert Zeitfresser (*Time Sinks*) und gibt konkrete Empfehlungen zur Optimierung des wöchentlichen Zeitbudgets.

---

### 4. 🖨️ High-Fidelity PDF Export Generator (`/api/export/pdf`)
- **Druckfertige DIN A4 Dokumente**:
  - Konvertiert Anschreiben (DIN 5008), Lebensläufe und Interview-Dossiers in standardisierte, druck- und PDF-fertige Dokumente.
  - CSS Paged Media `@page` Regeln für pixelgenaue Seitenumbrüche und Vektor-Qualität.

---

### 5. 🔍 Echte Live-Jobsuche & Multi-Portal Scraper (`/jobs`)
- **Bundesagentur für Arbeit & Arbeitnow API Live-Suche**:
  - Direkte Abfrage von echten Stellenangeboten in Echtzeit nach Beruf, PLZ und Suchradius mit Match-Score.
  - 1-Klick Übernahme in den Bewerbungstrichter oder als Favorit.
- **Multi-Portal URL-Scraper**:
  - Beliebige Stellenanzeigen-URL einfügen und Details automatisch parsen lassen.

---

### 6. 🎙️ Voice-First KI-Interview Simulator mit Audio Dialog (`/interview-prep`)
- **Vollwertiger Sprachdialog mit Audio TTS & STT**:
  - Der KI-Interviewer liest Fragen natürlich vor (`SpeechSynthesis`). Eigene Antworten werden über die Web Speech API in Echtzeit transkribiert.
- **Rhetorik- & Füllwort-Analyse**:
  - Erkennt Füllwörter (*"äh", "quasi", "sozusagen"*) und misst Sprechtempo (WPM).
- **Dynamische KI-Follow-ups & Kontextbezogene Nachfragen**:
  - Generiert situative Nachfragen auf Tech-Lead-Niveau über konfigurierte KI-Provider (OpenAI, Anthropic, OpenRouter, Ollama) oder intelligente Offline-Heuristik mit direktem Audio-Vorlesen und Zielstellen-Bezug.

---

### 7. 📄 ATS-optimierter CV-Builder & JSON-Resume Standard (`/cv-designer`)
- **ATS Compatibility Scorecard (`AtsScoreCard`)**:
  - Live-Audit auf Maschinenlesbarkeit für Recruiter-Systeme (Workday, Greenhouse, Personio).
- **Layout „ATS Minimal (Einspaltig)“**:
  - DIN A4 druckoptimiert, einspaltig, frei von Tabellenstrukturen.
- **JSON-Resume Standard Import & Export (`/api/resume/json`)**:
  - 100% kompatibel zum weltweiten Open-Source-Standard `resume.json`.

---

### 8. 🌐 Digitales Recruiter-Portfolio One-Pager (`/portfolio/[token]`)
- **Schreibgeschützter Showcase für Personaler**:
  - Teilen eines ansprechend gestalteten Profil-One-Pagers per individuellem Geheimlink (60 Tage gültig).
  - Präsentiert Werdegang, Top-Projekte mit Live-Links, Tech-Stack-Badges und Kontaktdaten.
  - Mit Live-Besucherzähler (Views) auf dem Dashboard.

---

### 9. 📊 Skill-Gap Matrix & Total Compensation Calculator (`/analytics`)
- **Skill-Gap Matrix**:
  - Gleicht Markt-Nachfrage mit dem eigenen Tech-Stack ab und generiert eine priorisierte Lern-Roadmap.
- **Total Compensation & Benefit-Rechner**:
  - Berechnet Gesamtvergütung inklusive bAV, ÖPNV, Home-Office und ermittelt den **effektiven Stundenlohn** inklusive automatischem **Verhandlungs-E-Mail-Skript**.

---

### 10. 📬 E-Mail Auto-Sync & Smart IMAP Inbox (`/api/email-sync` & Einstellungen)
- **Echter automatischer E-Mail-Abgleich für Bewerbungsrückmeldungen** (`src/lib/email/imapClient.ts`, via `imapflow`/`mailparser`):
  - Verbindet sich per IMAP/TLS mit dem konfigurierten Postfach, matched Absender/Betreff mit bestehenden Bewerbungen und schlägt Statusübergänge vor — der Statuswechsel selbst bleibt bewusst ein manueller 1-Klick-Schritt.
  - IMAP-Passwort verschlüsselt at-rest (AES-256-GCM, wie der KI-API-Key), nie im Klartext an den Client zurückgegeben.
  - Ohne hinterlegte Zugangsdaten (oder bei einem Verbindungsfehler) arbeitet die App transparent mit simulierten Beispiel-E-Mails weiter — nie ein Hard-Fail für den Nutzer.

---

### 11. 🔔 Echte Web-Push-Benachrichtigungen & Hintergrund-Automatisierung (Einstellungen → „Automatisierung & Push")
- **Browser-Push für Absagen, Zusagen, Interview-Einladungen und fällige Termine** (`src/lib/settings/pushNotifications.ts`, Standard Web Push API + VAPID): Kommt auch an, wenn das Dashboard gerade nicht im Vordergrund ist, solange der Server läuft.
- **In-Process Hintergrund-Scheduler** (`src/lib/settings/scheduler.ts`, gestartet über `src/instrumentation.ts`): läuft alle 15 Minuten automatisch, solange der Server aktiv ist — synct bei aktiviertem IMAP neue E-Mails und verschickt fällige Push-Benachrichtigungen. Standardmäßig aktiv, in den Einstellungen abschaltbar.

---

### 12. 🗂️ Bewerbungs- & Unternehmens-Management
- **Dashboard mit Live-Metriken & Wochenziel-Tracker**: KPI-Kacheln, tägliche Streak 🔥 und Meilensteine.
- **Interaktive Excel-Tabelle (`/excel-view`)**: Inline-Editing im Tabellen-Grid mit Tastatur-Navigation, serverseitig paginiertem Nachladen und Batch-Speichern.
- **Server-paginierte Tabellenansicht** (`/applications`): Kanban-Board bleibt bewusst vollständig geladen (Spalten-Übersicht), die Tabellen-/Excel-Ansicht lädt und filtert dagegen serverseitig seitenweise — bleibt auch bei vielen hundert Bewerbungen performant.
- **Tastaturbedienbares Kanban-Board**: jede Karte hat einen fokussierbaren „Status ändern"-Button mit zugänglichem Menü (inkl. `aria-live`-Ankündigung) als vollwertige Alternative zum Maus-Drag&Drop.
- **Unternehmens-Duplikat-Erkennung**: warnt beim Anlegen vor ähnlich benannten, bereits existierenden Unternehmen (normalisierter Namensvergleich inkl. Rechtsform-Suffixen), statt sie unbemerkt zu duplizieren.
- **Stapelverarbeitung (Batch Action Bar)**: Mehrere Bewerbungen gleichzeitig selektieren, taggen, exportieren oder löschen.
- **Live-Abonnierbarer Kalender-Feed (`/api/calendar/feed.ics`)**: Automatische iCal-Kalendersynchronisation für Apple/Google/Outlook mit Video-Meeting-Links.

---

### 13. 🔔 Wöchentlicher Erinnerungs-Digest & Anschreiben-Textbaustein-Bibliothek
- **Wöchentlicher Erinnerungs-Digest** (`src/lib/email/digest.ts`, Einstellungen → Automatisierung & Push): fasst überfällige
  Termine, anstehende Gespräche, empfohlene Nachfassaktionen und neue Status-Rückmeldungen zu EINER zusammenfassenden
  Push-Benachrichtigung pro Woche zusammen — ergänzend zu den sofortigen Einzelbenachrichtigungen. Läuft im 15-Minuten-
  Scheduler-Tick mit, verschickt aber dank `Preferences.lastDigestSentAt` höchstens einmal alle 7 Tage; einzeln abschaltbar.
- **Anschreiben-Textbaustein-Bibliothek** (`/api/snippets`, Einstellungen → Profil & Präferenzen): frei benennbare,
  unternehmensunabhängige Absätze (z. B. „Remote-Absatz“, „Standard-Schlussabsatz“), die im Anschreiben-Panel jeder
  Bewerbung per 1-Klick eingefügt werden können — ergänzt `Company.letterTemplate` (auf genau einen Einleitungssatz
  PRO Unternehmen beschränkt) um mehrfach wiederverwendbare Bausteine für beliebige Stellen im Anschreiben.

---

### 14. 🤖 Hybrid-KI-Anbindung (Anschreiben-Polishing & Interview-Feedback)
- **Vier wählbare Provider** (Einstellungen → KI-Provider, s. `src/lib/settings/aiService.ts`): **OpenAI** (GPT-4o/-mini), **Anthropic** (Claude), **OpenRouter** (Universal-Router für zahlreiche Modelle) sowie **Ollama** für vollständig lokale, kostenlose Modelle auf `localhost:11434` — Ollama benötigt dabei bewusst keinen API-Key.
- **100% Offline-Fallback**: Ohne konfigurierten Provider (oder bei einem fehlgeschlagenen Request) arbeitet die App transparent mit einer lokalen Heuristik weiter — nie ein Hard-Fail für den Nutzer.
- **API-Key verschlüsselt at-rest** (`src/lib/core/secretCrypto.ts`, AES-256-GCM): Der Key wird nie im Klartext an den Client zurückgegeben und auch in der SQLite-Datei nicht im Klartext abgelegt.

---

### 15. 🗂️ Visuelle Bewerbungsmappen-Zusammenstellung & PDF-Merge (`/api/applications/[id]/pdf-package`)
- **Interaktiver Bewerbungsmappen-Builder (`ApplicationPdfPackageModal`)**:
  - Fasst Premium-Deckblatt, DIN 5008 Anschreiben, Lebenslauf und alle angehängten PDF-Zeugnisse oder hochauflösenden Scans zu **einer einzigen, versandfertigen Gesamt-PDF** zusammen.
  - Dokument-Reihenfolge mit 1 Klick per Auf-/Ab-Buttons sortieren und Dokumente flexibel an- oder abwählen.
  - **Live-Dateigrößen-Schätzung**: Überwacht den MB-Umfang mit automatischer `sharp`-Bildkompression und A4-Anpassung (< 5 MB für Portale wie Workday/Personio).

---

### 16. 🎯 KI Requirement-Matching & Pitch-Tailoring (`src/lib/applications/requirementTailoring.ts`)
- **Automatischer "Gap-to-Pitch"-Abgleich**:
  - Scannt Stellenanzeigen auf geforderte Kern-Technologien und gleicht sie mit dem Bewerberprofil und realen Referenzprojekten ab.
  - Hebt erfüllte Anforderungen mit konkreten Projektnachweisen hervor und identifiziert fehlende Kenntnisse.
  - **1-Klick-Absatz-Generator**: Formuliert maßgeschneiderte Argumentations-Absätze und fügt sie direkt in das Anschreiben oder die Zwischenablage ein.

---

### 17. 📧 Smart Multi-Szenario Nachfass-Assistent (`src/lib/applications/followUp.ts`)
- **Vier spezialisierte Nachfass-Vorlagen**:
  - *1. Freundliche Nachfrage* (7–14 Tage nach Versand ohne Rückmeldung).
  - *2. Dankes-E-Mail & Re-Pitch* (24–48h nach Vorstellungsgespräch oder Screening).
  - *3. Status-Check nach Coding Challenge* (4–7 Tage nach Aufgaben-Abgabe).
  - *4. Wertschätzende Feedback-Anfrage* (1–3 Tage nach einer Absage).
- **Historien-Integration**: Speichert die Nachfass-Aktion per 1-Klick direkt als Interaktions-Eintrag in der Bewerbungshistorie.

---

### 18. ⚡ Tech- & Coding-Challenge Quiz-Simulator (`/interview-prep`)
- **Interaktiver Fachfragen-Trainer für moderne Web-Entwickler**:
  - Praxisnahe Multiple-Choice-Fragen und Code-Snippets zu **React 19** (`useActionState`, RSC-Boundaries), **TypeScript 5+** (`satisfies`, Discriminated Unions, `never`-Checks) und **Web Performance / CSS** (Event Loop, INP Core Web Vital, Tailwind v4).
  - Sofortige detaillierte Code-Erklärungen, Key-Takeaways für das Bewerbungsgespräch und Scorecards nach Fachbereich.

---

### 19. 📊 Funnel-Benchmarking & KI-Erfolgsdiagnose (`/analytics`)
- **Bewerbungstrichter-Vergleich mit Marktdurchschnittswerten**:
  - Vergleicht eigene Konversionsraten (*Gesendet ➔ Interview ➔ Angebot*) mit realen Branchen-Benchmarks für Frontend-Entwickler.
  - **Automatisierte Pipeline-Diagnose**: Gibt datengestützte Tipps (z. B. bei schwacher Einladungsquote: CV ATS-Optimierung; bei schwachem Abschluss: Tech-Quiz & Interview-Training).

---

### 20. ⌨️ Command Palette Quick Actions & Optimistic Kanban Board
- **Erweiterte Schnellsuche via `Strg+K / ⌘K` (`CommandPalette`)**: Multi-Token-Volltextsuche (Position, Firma, Tech-Stack, Notizen, Stadt), Filter-Pills für Gruppen (Alle, Bewerbungen, Firmen, Jobs, Aktionen), Pfeiltasten-Navigation mit Auto-Scroll.
- **Optimistisches Kanban-Board**: 0ms Status-Umschaltung bei Drag & Drop und Kontextmenü mit automatischer Fehlerabsicherung und Rollback.
- **Modern Two-Column Layout im CV-Designer**: Stilvolle zweispaltige Vorlage mit dunkler Tech-Sidebar und übersichtlicher Werdegangs-Timeline.

---

### 21. 🎙️ Persönliche Interview-Notizen & Sprach-Diktat (`/interview-prep`)
- **Individuelle Formulierungen pro Fachfrage (`QuestionNoteEditor`)**:
  - Speichert eigene Formulierungen und Anekdoten zu Projekten (z. B. *electroCheck-ai*) direkt an jeder Fachfrage.
  - **Echtzeit-Sprachdiktat (Speech-to-Text)**: Mit einem Klick auf *„Diktieren 🎙️“* die eigene Antwort frei einsprechen (Web Speech API).
  - Lokale Auto-Save-Persistierung mit visueller Speicherbestätigung.

---

### 22. 📋 Druckbarer 2-Seiten-Interview-Vorbereitungs-Spickzettel (`src/lib/interview/interviewCheatsheet.ts`)
- **Kompakter DIN A4 Spickzettel**:
  - Fasst 2-Minuten-Selbstpräsentations-Pitch, vorbereitete Fachfragen inkl. persönlicher Notizen und 3 strategische Gegenfragen an das Entwickler-Team zusammen.
  - Mit 1 Klick über *„Spickzettel drucken“* als optimierte DIN A4 PDF ausdrucken oder auf dem Smartphone/Tablet mitnehmen.

---

### 23. 🔍 Smart Recruiter- & Ansprechpartner-Erkennung im Career Manager Clipper
- **Automatische Extraktion von Kontaktdaten (`public/extension/content.js`)**:
  - Erkennt Personaler, Talent Acquisition Manager, Recruiting-E-Mails und Telefonnummern direkt im DOM von Stellenanzeigen.
  - Überträgt Ansprechpartner und Recruiter-E-Mail automatisch in die Unternehmensdatenbank beim 1-Klick-Import.

---

### 24. 📱 PWA Offline-First Caching-Upgrade (`public/sw.js`)
- **Service Worker V2 mit erweiterten Routen**:
  - Cacht `/interview-prep`, `/cv-designer`, `/applications` und `/companies` für unterbrechungsfreie Nutzung auch ohne Internetverbindung (z. B. im Zug vor einem Vor-Ort-Gespräch).

---

### 25. 🌍 Multi-Währungs- & Relocation-Rechner (`/analytics`)
- **Kaufkraftparität & Währungsumrechnung (`src/lib/salary/currencyRelocation.ts`)**:
  - Berechnet für internationale oder überregionale Angebote (USD, CHF, GBP, EUR) das reale Kaufkraft-Äquivalent bezogen auf die Heimatregion Bonn/Köln.
  - Berücksichtigt Lebenshaltungskosten-Indizes (z. B. Zürich +75%, London +45%, München +30%) und geschätzte Nettoquoten (z. B. Schweizer Quellensteuer ~20%, US W-8BEN Contractor, Steuerklasse 1).
  - Gibt datengestützte KI-Empfehlungen zur tatsächlichen Rentabilität von Umzug oder US-Remote-Verträgen.

---

### 26. 📄 Intelligenter Dokumenten- & Zeugnis-Parser (`src/lib/documents/documentParser.ts`)
- **Automatische Zertifikats- & Noten-Analyse**:
  - Analysiert hochgeladene PDF-Dokumente und schlägt automatisch passende Kategorien (`CERTIFICATE`, `REFERENCE`, `RESUME`) vor.
  - Erkennt IHK-Abschlusszeugnisse, Weiterbildungs-Zertifikate, Ausbildungsnoten und extrahiert nachgewiesene Tech-Skills (z. B. React, TypeScript, SQL, Scrum).

---

### 27. 🏷️ Sub-Status- & Sub-Phasen-Badges im Kanban-Board
- **Erweiterte Kanban-Visualisierung**:
  - Zeigt Sub-Phasen (z. B. `#Tech-Challenge`, `#2. Interview`, `#Follow-Up`) direkt als kompakte Badges auf den Karten an.
  - Hebt anstehende Fälligkeits- und Interview-Termine (`📅 DD.MM.YYYY`) farblich hervor.

---

### 28. 💻 Interaktiver Coding-Challenge Canvas & Sandbox (`/interview-prep`)
- **Live-Code-Editor & Test-Runner (`src/lib/interview/codingChallenges.ts`)**:
  - Praxisnahe Frontend-Coding-Aufgaben (Debounce-Hooks, GroupBy-Transformationen, Gehalts-Formatierer, Virtual-List-Windowing).
  - Sichere Sandbox-Ausführung im Browser mit Test-Case-Validierung, Diff-Ausgabe, Tipps und Musterlösungen.

---

### 29. 🕸️ Firmen- & Recruiter-Netzwerk-Graph (`/companies`)
- **Interaktiver Standort- & Beziehungs-Graph (`CompanyNetworkGraph`)**:
  - Visualisiert Unternehmens-Cluster nach Regionen (Rheinland, Ruhrgebiet, Remote/Tech-Zentren).
  - Hebt Firmen mit bekannten Ansprechpartnern, offenen Vorstellungsgesprächen und aktiven Bewerbungen hervor.

---

### 30. ⏰ Smart Follow-Up Snooze & Schnelle Wiedervorlage (`/api/applications/[id]/snooze`)
- **1-Klick-Wiedervorlage (`FollowUpSnoozeButtons`)**:
  - Schnell-Verschieben des nächsten Handlungsschritts (`+3 Tage`, `+1 Woche`, `+2 Wochen`) mit sofortiger Historien-Protokollierung.

---

### 31. 🎙️ Interaktiver Mock-Interview Audio-Recorder & Waveform-Player
- **Audio-Selbstcheck (`AudioInterviewRecorder`, `src/lib/interview/audioRecorder.ts`)**:
  - Audio-Aufnahme über das Mikrofon (MediaRecorder API) zur Selbstüberprüfung von Betonung und Antworttempo.
  - Interaktiver Waveform-Player mit Fortschrittsbalken, Reset-Funktion und direktem Download (`.webm`).

---

### 32. ✉️ Gehaltsverhandlungs- & E-Mail-Generator (`src/lib/salary/offerNegotiationGenerator.ts`)
- **Professionelle Gegenangebote & Verhandlungsschreiben**:
  - Generiert diplomatische und durchsetzungsstarke E-Mails für Fixgehalts-Anpassungen, Remote-Konditionen, Konkurrenzangebote und Sign-on-Boni.
  - Enthält praxiserprobte Verhandlungstipps und 1-Klick-Kopierfunktion.

---

### 33. 🧭 Persönliche Skill-Roadmap & Lernziel-Tracker (`/analytics`)
- **Meilenstein-Tracking (`SkillRoadmapTracker`, `src/lib/interview/skillRoadmap.ts`)**:
  - Strukturierte Lernziele für Fachinformatiker Anwendungsentwicklung (React 19, TypeScript, Testing, Cloud/DevOps).
  - Fortschrittsberechnung in Prozent, Marktrelevanz-Indikatoren und Verknüpfung zu Coding-Challenges.

---

### 34. 📅 Interaktiver Interview- & Termin-Kalender (`/calendar`)
- **Monats- & Agenda-Ansicht (`InteractiveCalendar`)**:
  - Extrahiert automatisch alle Termine aus dem Feld „Nächster Schritt & Datum" jeder Bewerbung, farblich unterschieden nach Interview/Coding-Challenge/Nachfassen.
  - Jede Kalenderkarte verlinkt direkt zurück zur betroffenen Bewerbung.
- **Live-Kalender-Abonnement**: Ein-Klick-Zugriff auf dieselbe abonnierbare `.ics`-Feed-URL wie in den Einstellungen (siehe Feature 12), direkt aus der Kalenderansicht heraus kopierbar.

---

### 35. 🚩 Arbeitgeber-Audit & Benefit-Scanner (`src/lib/jobs/jobRedFlags.ts`)
- **Automatische Muster-Erkennung in Stellenanzeigen**:
  - Scannt Beschreibung, Anforderungsprofil und Gehaltsangabe jeder Stellenanzeige nach bekannten Warnsignal-Formulierungen (z. B. „Wir sind eine Familie", unbezahlter Probearbeitstag, veraltete Tech-Stacks) und positiven Signalen (100% Remote, Weiterbildungsbudget, moderner Tech-Stack, transparente Gehaltsangabe).
  - Zeigt einen Attraktivitäts-Score sowie passende Gegenfragen fürs Vorstellungsgespräch direkt auf der Jobkarte in `/jobs`.

---

### 36. 💶 Vermittlungsbudget-Rechner (§ 44 SGB III, `/analytics`)
- **Automatische Erstattungsberechnung**:
  - Berechnet den Erstattungsanspruch für Bewerbungskosten (pauschal je Bewerbung) und das verbleibende Jahresbudget aus den erfassten Bewerbungen.
  - 1-Klick-Generierung eines unterschriftsreifen Antragsformulars inkl. vollständiger Nachweistabelle für Agentur für Arbeit / Jobcenter.

---

### 37. 📋 Nachweis von Eigenbemühungen (§ 38 / § 159 SGB III, `/applications`)
- **Amtlicher DIN A4 Monatsnachweis (`EigenbemuehungenModal`)**:
  - Filtert alle Bewerbungen mit Datum im gewählten Monat und stellt sie als druck- und downloadfertigen Nachweis für Arbeitsagentur oder Jobcenter zusammen — inkl. hinterlegter Kundennummer/BG-Nr. und 1-Klick-HTML-/PDF-Download.

---

### 38. ⭐ STAR-Methoden Antwort-Audit (`/interview-prep`)
- **Automatisierte STAR-Analyse eigener Interview-Antworten (`src/lib/interview/starAudit.ts`)**:
  - Bewertet jede hinterlegte Antwort separat nach den vier STAR-Dimensionen (Situation, Task, Action, Result) mit Score und konkretem Optimierungspotenzial.
  - Schlägt eine optimierte Muster-Formulierung vor, die sich mit 1 Klick in die Zwischenablage kopieren lässt.

---

### 39. 🩺 System-Diagnose & Status-Dashboard (Einstellungen)
- **Live-Statusprüfung aller technischen Teilsysteme (`SystemHealthCard`, `/api/health`)**:
  - Zeigt auf einen Blick, ob Neon-Datenbankverbindung, Web-Push (VAPID), konfigurierter KI-Provider und Hintergrund-Scheduler funktionsfähig sind — inkl. des letzten Scheduler-Fehlers, falls vorhanden.

---

### 40. 💰 KI-Kosten-/Token-Tracking & Monatslimit (Einstellungen)
- **Automatisches Nutzungsprotokoll (`src/lib/settings/aiUsageTracker.ts`)**:
  - Protokolliert Provider, Modell sowie Prompt-/Completion-Tokens jedes tatsächlich ausgeführten KI-Requests (Anschreiben-Politur, Interview-Bewertung, Einleitungssatz-Generierung) und schätzt die Kosten anhand einer hinterlegten Preistabelle für OpenAI-/Anthropic-Modelle.
  - Aufschlüsselung nach Provider, Tabelle der letzten 20 Requests, jederzeit zurücksetzbar.
- **Optionales monatliches Kostenlimit (`src/lib/settings/aiBudget.ts`)**:
  - Frei wählbare USD-Warnschwelle mit Live-Anzeige der bisherigen Kosten des laufenden Kalendermonats — bewusst nur eine Warnung, KI-Funktionen werden nicht gesperrt.

---

### 41. ⚖️ Angebots-Vergleichsmatrix & Decision-Scoring (`/analytics`)
- **Objektive Nutzenwertanalyse bei vorliegenden Vertragsangeboten (`src/lib/salary/offerComparison.ts`)**:
  - Vergleicht mehrere vorliegende Arbeitsverträge anhand flexibel gewichteter Kriterien (Gehalt/Bonus, Work-Life & Remote, Tech-Stack & Weiterbildung, Kultur & Zusatzleistungen).
  - Berechnet Teil-Scores (0–100%) sowie einen gewichteten Gesamt-Decision-Score mit automatischer Best-Offer-Empfehlung.

---

### 42. 📱 Mobile Interview-Day Quick-Sheet (`/applications/[id]` & `/calendar`)
- **Kompakte Unterwegs-Ansicht für den Tag des Gesprächs (`src/lib/interview/interviewDaySheet.ts`)**:
  - Schneller 1-Klick-Zugriff direkt vor Ort oder im Zug: Route via Google Maps starten, Ansprechpartner per Fingertipp anrufen, Video-Meeting öffnen.
  - Zeigt auf einen Blick die wichtigsten 6 Tech-Skills der Stelle, maßgeschneiderte Gegenfragen an das Team und persönliche Vorbereitungsnotizen.

---

### 43. 🎯 CV Auto-Tailoring & Stellen-Re-Ranking (`/cv-designer`)
- **1-Klick-Anpassung des Lebenslaufs auf eine Ziel-Bewerbung (`src/lib/documents/cvTailoring.ts`)**:
  - Gleicht das Anforderungsprofil und den Tech-Stack einer ausgewählten Bewerbung mit dem eigenen Profil ab.
  - Sortiert relevante Tech-Skills automatisch an die erste Stelle und priorisiert Projekte mit passendem Tech-Stack ganz oben.
  - Live Keyword-Match-Score und druckfertiger Export als abgestimmter Lebenslauf.

---

### 44. 🏢 Unternehmens-Kultur-Check & Vorbereitungs-Checkliste (`/companies/[id]`)
- **Strukturierter Recherche-Leitfaden (`src/lib/companies/companyPrep.ts`)**:
  - Interaktive Vorbereitungs-Checkliste (Website/News, Kununu-Mitarbeiterbewertungen, Testen eigener Demos, Fragen an das Team).
  - Speichert Kununu-Score, Kultur-Notizen und bietet 1-Klick-Schnelllinks zur Firmenrecherche.

---

### 45. 📦 1-Klick Komplettsicherung als ZIP-Archiv (`/settings` → Backup & `/api/backup/zip`)
- **Vollständiges portables ZIP-Backup (`JSZip`)**:
  - Exportiert mit einem Klick alle Anwendungsdaten (Bewerbungen, Firmen, Historie, Dokumenten-Metadaten) inklusive Info-README in eine handliche `.zip`-Datei.
  - Vollständiger 1-Klick Restore von ZIP-Archiven mit Zod-Validierung und automatischer Snapshot-Sicherheit.

---

### 46. 🚗 Pendelzeit-, Fahrtkosten- & Remote-Netto-Rechner (`/analytics`)
- **Echte Mobilitäts- und Stundenlohnanalyse (`src/lib/salary/commuteCalculator.ts`)**:
  - Berechnet für Angebote in der Region Rheinland/NRW (Bonn, Köln, Düsseldorf, Ruhrgebiet) oder Remote die realen Mobilitätskosten (PKW-Sprit & Verschleiß vs. Deutschlandticket).
  - Ermittelt den tatsächlichen monatlichen Zeitverlust im Pendelverkehr und das reale Netto nach Mobilitätskosten.
  - Berechnet den **effektiven Stundenlohn** bezogen auf Arbeitszeit plus Reisezeit inklusive automatischer Handlungsempfehlung für Gehalts- und Home-Office-Verhandlungen.

---

### 47. 🎯 Interaktiver Multi-Stage Interview-Phasen-Tracker (`/applications/[id]`)
- **Visuelle Pipeline für Bewerbungs-Etappen (`InterviewStageTracker`, `src/lib/applications/interviewStages.ts`)**:
  - Visualisiert auf jeder Bewerbungsdetailseite die 5 Kernstufen des Einstellungsprozesses (*1. HR Screening ➔ 2. Coding Challenge ➔ 3. Tech Deep Dive ➔ 4. Final Round ➔ 5. Vertragsangebot*).
  - Ermöglicht 1-Klick-Aktualisierung der Phase, zeigt typische Zeitfenster (z. B. 20–30 Min. vs. 2–4 Std. Challenge) und den aktuellen Fortschritt an.

---

### 48. ❓ Eigene Interviewfragen & Real-World Fragen-Katalog (`/interview-prep`)
- **Individuelle Fragensammlung (`CustomQuestionModal`, `src/lib/interview/customQuestionStorage.ts`)**:
  - Ermöglicht das Festhalten und Trainieren realer Fragen aus Vorstellungsgesprächen mit individueller Antwort, Kategorie, Keywords und Praxistipps.
  - Wird nahtlos in den bestehenden Fragenkatalog, das Spickzettel-Drucksystem und den Vorbereitungs-Fortschritt integriert.

---

### 49. ✉️ Direkter E-Mail-Versand von Bewerbungsmappen (`/api/applications/[id]/send-email`)
- **Direktversand via SMTP mit generiertem Mappen-Anhang (`SendApplicationEmailModal`, `src/lib/email/smtpClient.ts`)**:
  - Versendet fertige Bewerbungen inkl. Anschreiben und auf Knopfdruck generierter PDF-Gesamtmappe direkt aus der App an Arbeitgeber.
  - Protokolliert die Aktion sofort als E-Mail-Interaktion in der Historie und aktualisiert den Status bei Entwürfen automatisch auf `SENT`.

---

### 50. 🔍 Dubletten-Prüfung & Tastaturkürzel in der Browser-Extension (`public/extension`)
- **Smart Duplicate Warning & Shortcut `Alt+C`**:
  - Erkennt beim Öffnen des Popups auf StepStone, Indeed oder LinkedIn sofort, ob das Unternehmen bereits in der Datenbank existiert, und warnt vor versehentlichen Mehrfachbewerbungen.
  - Tastaturkürzel `Alt+C` öffnet den Web-Clipper blitzschnell ohne Maus-Klick.

---

### 51. 🤝 Talent-Pool & On-Hold Status mit Reaktivierungs-Timer (`/applications`)
- **Status `TALENT_POOL` mit automatischem 90-Tage-Follow-Up (`src/lib/applications/followUp.ts`)**:
  - Eigener Status für Bewerbungen, die im Unternehmens-Talent-Pool geparkt wurden.
  - Berechnet nach 90 Tagen automatisch einen fälligen Reaktivierungs-Reminder und bietet eine maßgeschneiderte E-Mail-Vorlage zur Wiederaufnahme des Kontakts.

---

### 52. 📈 Anschreiben-Tonalität & Stil-Effizienz-Analyse (`/analytics`)
- **Stil-Effizienz-Matrix (`ToneEfficiencyCard`, `src/lib/applications/toneSuccessRates.ts`)**:
  - Wertet aus, welche Anschreiben-Tonalität (`MODERN`, `CLASSIC`, `STARTUP`, `DETAILED`) prozentual die höchste Einladungs- und Zusagequote erzielt.
  - Schärft die Bewerbungsstrategie datenbasiert nach Arbeitgebersegment.

---

### 53. 📄 Dynamische Lebenslauf-Abschnitts-Reihenfolge (`/cv-designer`)
- **Freie Sektions-Reihenfolge (`CvSection`, `src/lib/documents/cvGenerator.ts`)**:
  - Erlaubt das beliebige Umordnen von *Kurzprofil*, *Ausbildung & Werdegang*, *Praxisprojekte* und *Tech-Stack* per Auf-/Ab-Buttons in der Sidebar.
  - Passt die Druckansicht und den PDF-Export in Echtzeit an.

---

### 54. 📅 1-Klick .ICS Einzel-Kalenderexport (`/applications/[id]`)
- **Direktdownload für Kalender-Apps (`src/lib/settings/ical.ts`)**:
  - Neuer Button *„Termin (.ics)“* im Kopf jeder Bewerbung lädt ein Einzel-Event mit Datum, Gesprächspartner, Adresse und Video-Meeting-Link herunter und öffnet es direkt in Apple Kalender, Google Kalender oder Outlook.

---

### 55. 🔔 Discord & Slack Webhook-Integration (`/settings` & `/api/settings/webhooks/test`)
- **Echtzeit-Push in Team- & Private-Channels (`src/lib/settings/webhookNotifier.ts`)**:
  - Informiert bei Statuswechseln (z. B. Einladung zum Vorstellungsgespräch, Angebot, Talent-Pool) unmittelbar über angebundene Discord- oder Slack-Webhooks.
  - Inklusive Farbcodes, Metadaten (Firma, Position, Interviewlink) und interaktivem Test-Button in den Einstellungen.

---

### 56. 💡 Automatische Tag-Vorschläge (`src/lib/applications/autoTagging.ts`)
- **1-Klick Tag-Generator im Bewerbungsformular**:
  - Analysiert Position, verknüpften Tech-Stack, Remote-Status und Arbeitsort und schlägt per Knopfdruck relevante Tags vor (z. B. `#Frontend`, `#Remote`, `#Nextjs`, `#TypeScript`, `#High-Salary`).

---

### 57. 📊 Historischer Gehaltstrend & Marktwert-Entwicklung (`/analytics`)
- **Zeitreihen-Aggregator (`SalaryHistoryCard`, `src/lib/salary/salaryHistoryTracker.ts`)**:
  - Visualisiert die Gehaltsentwicklung der letzten 6 Monate anhand von Zielgehältern, Angeboten und Notizen.
  - Zeigt Durchschnitts-, Minimal- und Maximalgehälter für den eigenen Marktwert im Zeitverlauf.

---

### 58. 📑 Steuerbericht & Werbungskosten-Rechner (`/analytics`)
- **Finanzamt-konforme Bewerbungskosten-Aufstellung (`TaxExpenseReportCard`, `src/lib/salary/taxReportCalculator.ts`)**:
  - Erfasst Fahrtkosten zu Vorstellungsgesprächen nach Entfernungskilometern (0,30 €/km), Pauschalen für Bewerbungen, Bewerbungsfotos und Fachzertifikate.
  - Mit 1-Klick CSV-Export (`steuerbericht-werbungskosten-YYYY.csv`) als fertige Anlage für die Einkommensteuererklärung (§ 9 EStG).

---

### 59. 🛡️ E-Mail Zustellbarkeits- & Spam-Checker (`/settings`)
- **Deliverability-Audit für Bewerber-E-Mails (`EmailDeliverabilityCard`, `src/lib/email/deliverabilityChecker.ts`)**:
  - Prüft Absenderadressen und Domains auf Score, Reputation bei HR-Mail-Gateways, SPF/DKIM/DMARC-Best-Practices und Spam-Muster.
  - Hilft sicherzustellen, dass ausgehende Bewerbungsmails zuverlässig im Posteingang des Recruiters landen.

---

### 60. 🎙️ Post-Interview Sprachmemo- & Feedback-Audit (`/interview-prep`)
- **Voice-Transkription & Stärken/Schwächen-Audit (`InterviewFeedbackCard`, `src/lib/interview/interviewAudioFeedback.ts`)**:
  - Direkt nach dem Gespräch per Web Speech API Sprachnotizen frei einsprechen oder Notizen erfassen.
  - Automatische Identifikation von positiven Signalen, Wissenslücken, besprochenen Tech-Themen und maßgeschneiderter Dankes-E-Mail-Follow-up-Strategie.

---

### 61. ⚖️ Anschreiben A/B-Split-Testing & Varianten-Vergleich (`/cv-designer`)
- **Stil- & Schwerpunktvergleich nebeneinander (`CoverLetterAbCard`, `src/lib/documents/coverLetterAbTesting.ts`)**:
  - Generiert für dieselbe Stelle zwei alternative Entwürfe: *Variante A* (Architektur & Tech-Exzellenz) vs. *Variante B* (Produkt-Impact & agiler Teamplayer).
  - Erlaubt die direkte Gegenüberstellung und 1-Klick-Übernahme in die Bewerbungsmappe.

---

### 62. 🔗 LinkedIn & XING Profil-Import (`/settings` &rarr; Profil & Präferenzen)
- **1-Klick Profil-Übernahme (`src/lib/documents/socialProfileParser.ts`)**:
  - Parst LinkedIn-JSON-Exporte oder Profil-Texte und überträgt Name, Zielrolle, Tech-Skills und Werdegang automatisch in die Karrierepräferenzen.

---

### 63. 📜 IT-Zertifikate & Ablauf-Erinnerungen (`/settings` &rarr; Ausbildung & Werdegang)
- **Zertifikats-Lebenszyklus-Manager (`CertificationTrackerCard`, `src/lib/documents/certificationTracker.ts`)**:
  - Verwalte IHK-Abschlüsse, AWS-, Azure- oder Scrum-Zertifikate mit automatischer 90-Tage Ablaufwarnung (`EXPIRING_SOON`) zur rechtzeitigen Rezertifizierung.

---

### 64. 🗺️ 1-Klick Routen- & ÖPNV-Fahrplanauskunft (`/applications/[id]`)
- **Direktverknüpfung zu Google Maps & Deutscher Bahn (`CompanyInfoCard`)**:
  - Neuer Schnellzugriff auf vorbereitete Google-Maps-Routen (Auto/Fahrrad) und DB-Reiseauskunft direkt unter der Firmenadresse für Vor-Ort-Interviews.

---

### 65. 🤝 KI-Verhandlungs- & Gegenangebots-Assistent (`/analytics`)
- **Taktische Gehalts-Nachverhandlung & Gegenangebot-Berechnung (`CounterOfferAssistantCard`, `src/lib/salary/counterOfferGenerator.ts`)**:
  - Analysiert Angebote im Vergleich zum Wunschgehalt und bewertet Verhandlungsspielräume (Direktannahme vs. Nachverhandlung).
  - Berechnet psychologisch fundierte Gegenangebots-Beträge und liefert konkrete Verhandlungshebel (z. B. automatischer Gehaltssprung nach der Probezeit, Zusatz-Remote-Tage, jährliches Weiterbildungsbudget, variable Boni).
  - Formuliert per 1-Klick eine professionelle, wertschätzende Gegenangebots-E-Mail zur direkten Übernahme.

---

### 66. 📄 Druckbares DIN-A4 Praxis-Projektportfolio (`/cv-designer`)
- **Visuelles Developer-Showcase & Projektmappe (`src/lib/documents/portfolioPdfGenerator.ts`)**:
  - Generiert per 1-Klick ein druckfertiges DIN-A4 Projektportfolio der hinterlegten Praxis- und GitHub-Projekte.
  - Mit sauberem typografischem A4-Layout, Projektbeschreibungen, Tech-Badges, Rollenbezeichnungen und Live-Links zur optimalen Ergänzung des Lebenslaufs.

---

### 67. 🎤 Interaktiver 60-Sekunden Elevator-Pitch Generator (`/interview-prep`)
- **Strukturierte Eröffnungs-Präsentation (`ElevatorPitchCard`, `src/lib/interview/elevatorPitchGenerator.ts`)**:
  - Maßgeschneiderter Generator für die klassische Eröffnungsfrage *„Erzählen Sie kurz etwas über sich!“* mit Zeitabschätzung (60–90s Sprechdauer).
  - 4 optimierte Schwerpunkte: *Frontend & UI/UX Spezialist*, *Fullstack & Pragmatiker*, *Fachinformatiker & Praxiserprobt*, *Code-Qualität, Testing & Performance*.
  - 4-Stufen-Struktur (*Hook & Eröffnung*, *Kern-Story*, *Praxis-Beweis*, *Unternehmens-Motivation*) inkl. Praxistipps und 1-Klick-Kopierfunktion.

---

### 68. ⭐ Glassdoor- & Kununu-Kombinations-Audit (`/companies/[id]`)
- **Erweitertes Arbeitgeber-Kultur- & Reputations-Audit (`CompanyPrepCard`)**:
  - Schnellsuch-Integration für Kununu- und Glassdoor-Bewertungen direkt im Firmenprofil.
  - Dedizierte Score-Felder für Kununu (1.0–5.0) und Glassdoor (1.0–5.0) zur vergleichenden Gegenüberstellung von Mitarbeiterzufriedenheit und Unternehmenskultur.

---

### 69. ⏰ Akute Interview-Countdown-Erinnerung (60–90 Min. Vorwarnzeit)
- **High-Priority Termin-Alerts (`src/lib/applications/notifications.ts`)**:
  - Erkennt anstehende Gesprächstermine am selben Tag innerhalb der nächsten 90 Minuten.
  - Sendet eine akute High-Priority-Benachrichtigung mit Minutencountdown, um Spickzettel, Notizen und Video-Link rechtzeitig bereitzuhalten.

---

## 🛠️ Tech-Stack

| Bereich    | Technologie                                                              |
| ---------- | ------------------------------------------------------------------------- |
| Frontend   | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4 |
| Backend    | Next.js Route Handler (REST-API unter `/api/*`), Zod-Validierung          |
| Datenbank  | **Neon PostgreSQL** (Serverless) via Prisma 7 ORM (Adapter: `PrismaNeonHttp`) |
| Datei-Upload | **Vercel Blob** für persistente Datei-Uploads in Production             |
| Hosting    | **Vercel** (Serverless Functions, Vercel Cron für Hintergrund-Jobs)      |
| State      | SWR (clientseitiges Caching + automatische Revalidierung)                 |
| E-Mail     | `imapflow` + `mailparser` für echten IMAP/TLS-Postfachabruf              |
| Push       | Web Push API + VAPID (`web-push`), Hintergrund-Scheduler via `src/instrumentation.ts` (lokal) / Vercel Cron (Production) |
| Audio      | Web Speech API (SpeechSynthesis für TTS & webkitSpeechRecognition für STT)|
| Extension  | Chrome/Edge Manifest V3 (Content Script, Popup UI, Background Worker)    |
| Testing    | Vitest (Unit-/API-Integrationstests) + Playwright E2E-Tests              |
| CI/CD      | GitHub Actions (`.github/workflows/ci.yml`) für automatisierte Test- & Build-Pipelines |

---

## 📁 Projektstruktur

```text
├── e2e/                         # Playwright End-to-End-Tests (Kernflows: Bewerbung anlegen,
│                                 # Unternehmen verwalten, Kalender, Notifications, Job-Filter, …)
├── prisma/                      # Prisma 7 SQLite Schema, Migrationen & Test-Fixtures
│   ├── schema.prisma            # Datenmodelle (Company, JobPosting, Application, Preferences)
│   └── seed.ts                  # Realistische Test- & Beispieldaten
├── public/
│   ├── extension/               # Browser-Erweiterung Manifest V3 (manifest.json, popup.html, content.js)
│   └── manifest.webmanifest     # PWA Web-App-Manifest
├── scripts/                     # Einmalige Hilfsskripte (z. B. Import bestehender Bewerbungslisten)
├── src/
│   ├── app/                     # Next.js 16 App Router
│   │   ├── (routes)/            # Analytics, Applications, Calendar, Companies, CV-Designer, Jobs, Portfolio, Settings
│   │   └── api/                 # REST API Endpoints mit Zod-Validierung (Export, Extension, Jobs, Portfolio, Resume)
│   ├── components/              # Modulare React 19 Komponenten
│   │   ├── analytics/           # ROI-Tracker, Skill-Gap Matrix, Total Compensation, Gehalts-Analysen
│   │   ├── applications/        # Kanban-Board, Detailformulare, Time-Tracker & Dokumenten-Panel
│   │   ├── calendar/            # Interaktiver Termin-Kalender & Abo-Modal
│   │   ├── cv/                  # ATS-Scorecard, JSON-Resume Modal & Druckvorschau
│   │   ├── interview/           # Gehaltsverhandlungs-Coach, Voice Simulator, STAR-Audit & Dossier-Druck
│   │   ├── jobs/                # Live-Jobsuche Modal, URL-Scraper Card, Job-Vergleich, Alerts & Red-Flags-Scanner
│   │   ├── settings/            # Browser-Extension Card, Portfolio-Share Manager, E-Mail Sync, System-Health, KI-Nutzung
│   │   └── ui/                  # Wiederverwendbare Basiskomponenten (Button, Card, Dialog, Form, Toast)
│   ├── lib/                     # Domänenlogik, nach Feature-Bereich sortiert (analog zu components/)
│   │   ├── core/                # Generische Infrastruktur: API-Client, Validierung, Rate-Limiting, Security-Guards
│   │   ├── applications/        # Bewerbungsliste/Kanban/Status: Query, Filter, Notifications, Follow-up-Tracking
│   │   ├── jobs/                # Jobsuche & Matching: Portale, Parser, Red-Flags-Scanner, Live-Suche
│   │   ├── salary/              # Gehalt/Vergütung: Benchmark, Relocation, Verhandlung, Vermittlungsbudget
│   │   ├── interview/           # Interview-Vorbereitung: Fragenkatalog, Quiz, Coding-Challenges, STAR-Audit
│   │   ├── documents/           # Anschreiben/CV/Exporte: Generator, PDF-/ZIP-Export, JSON-Resume, ATS-Check
│   │   ├── email/               # E-Mail-Sync/Inbox: IMAP-Client, Response-Parser, .eml-Export, Digest
│   │   └── settings/            # Backup, Scheduler, KI-Provider & -Kosten-Tracking, Push, Präferenzen
│   ├── test/                     # Test-Helfer (DB-Reset, SQLite Test-Setup)
│   └── types/                    # TypeScript Typdefinitionen & Prisma Model-Re-Exporte
├── Dockerfile                    # Mehrstufiger Produktions-Build für Self-Hosting
└── docker-compose.yml            # Lokaler Self-Hosting-Betrieb (Bind-Mounts für DB/Uploads/Backups)
```

---

## ⚡ Schnellstart & Setup

Voraussetzung: **Node.js ≥ 20** + eine **Neon PostgreSQL**-Datenbank (kostenloser Tier ausreichend).

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. .env aus Vorlage anlegen und Neon-Connection-String eintragen
cp .env.example .env
# DATABASE_URL und DIRECT_URL aus dem Neon-Dashboard eintragen

# 3. Prisma-Client generieren
npx prisma generate

# 4. Schema auf Neon deployen
npx prisma db push

# 5. Beispieldaten laden (optional)
npx prisma db seed

# 6. Entwicklungsserver starten
npm run dev
```

Die Anwendung läuft anschließend unter **http://localhost:3000**.

### ☁️ Vercel Deployment

```bash
# Vercel CLI installieren
npm i -g vercel

# Projekt verlinken & deployen
vercel link
vercel env add DATABASE_URL production   # Neon Pooler-URL
vercel env add DIRECT_URL production     # Neon Direct-URL (für Migrationen)
vercel --prod
```

Für automatische Push-Notifications zusätzlich `VAPID_PUBLIC_KEY` und `VAPID_PRIVATE_KEY` setzen.
Für Datei-Uploads `BLOB_READ_WRITE_TOKEN` aus dem Vercel Blob Store eintragen.

---

## 🧪 Nützliche Befehle

| Befehl                  | Zweck                                                                   |
| ----------------------- | ----------------------------------------------------------------------- |
| `npm run dev`           | Entwicklungsserver (Turbopack) starten                                  |
| `npm run build`         | Produktions-Build erstellen (inkl. TypeScript-Check)                    |
| `npm run lint`          | ESLint ausführen                                                        |
| `npm run test`          | Testsuite (Vitest) einmalig ausführen                                   |
| `npm run test:e2e`      | E2E-Tests (Playwright) ausführen                                        |
| `npm run test:watch`    | Testsuite im Watch-Modus ausführen                                      |
| `npx prisma studio`     | Datenbank-Inhalte im Browser ansehen/bearbeiten                         |
| `npx prisma db push`    | Schema-Änderungen auf Neon PostgreSQL anwenden                          |
| `npx prisma generate`   | Prisma-Client nach Schema-Änderung neu generieren                       |
| `vercel env pull`       | Production-Umgebungsvariablen lokal in `.env.local` ziehen              |
| `vercel --prod`         | Production-Deploy auf Vercel anstoßen                                   |

---

## 🔒 Sicherheit

Die App ist primär für den lokalen Einzelnutzer-Betrieb (`localhost`) konzipiert, unterstützt aber
bewusst auch Hosting darüber hinaus (z. B. Vercel oder eigenes Docker-Self-Hosting, siehe oben) —
siehe `middleware.ts`/`APP_PASSWORD`. Folgende Schutzmaßnahmen greifen dabei zusätzlich:

| Bereich | Schutzmaßnahme |
| --- | --- |
| URL-Scraper (`/jobs/scrape-url`) | SSRF-Schutz (`src/lib/core/ssrfGuard.ts`): DNS-Auflösung + IP-Prüfung gegen private/interne Netzwerke (inkl. Cloud-Metadaten-Endpunkte) für die Ziel-URL UND jeden Redirect-Hop, plus Content-Type-/Größen-Limit der Antwort. |
| Datei-Upload (`/api/documents/upload`) | Allowlist statt Denylist für MIME-Type + Dateiendung (`src/lib/core/constants.ts`) — verhindert das Hochladen aktiver Inhalte (`.html`, `.svg`, `.js`, …), die unter `/uploads/` sonst als gespeichertes XSS ausführbar wären. |
| KI-API-Key & IMAP-Passwort (Einstellungen) | At-Rest-Verschlüsselung (AES-256-GCM, `src/lib/core/secretCrypto.ts`) statt Klartext in der SQLite-Datei; beide werden zusätzlich nie im Klartext an den Client zurückgegeben und nie in Backup-Exporte mit aufgenommen. |
| Stapel-Löschung & Restore | Automatischer JSON-Snapshot vor jeder unwiderruflichen Aktion (`src/lib/settings/serverBackupRotation.ts`, rotierend unter `./backups/`). |
| Passwortabgleich (`middleware.ts`) | Konstante-Zeit-Vergleich (`timingSafeEqual`) gegen Timing-Angriffe. |
| Brute-Force auf `APP_PASSWORD` (`middleware.ts`) | Rate-Limiting mit Lockout pro Client (`src/lib/core/rateLimiter.ts`): Nach 10 Fehlversuchen in 15 Minuten wird die IP für 15 Minuten mit `429 Too Many Requests` gesperrt, statt weitere Versuche zuzulassen. |
| Missbrauch kostenpflichtiger/externer Routen (`/api/ai`, `/api/jobs/live-search`, `/api/jobs/scrape-url`) | Eigenständiges Rate-Limiting pro Route (`src/lib/core/apiRateLimit.ts`): begrenzt Aufrufe pro Client-IP (15–20 pro 10 Minuten), damit weder unnötige KI-Provider-Kosten entstehen noch die Route als Proxy zum Fluten externer Server missbraucht werden kann. |
| `xlsx`-Abhängigkeit (Excel-Import, `/excel-view`) | Bezug direkt vom offiziellen SheetJS-CDN (`https://cdn.sheetjs.com/...`) statt der veralteten npm-Registry-Version — behebt zwei bekannte High-Severity-CVEs (Prototype Pollution, ReDoS) beim Parsen hochgeladener `.xlsx`-Dateien (die npm-Registry-Version wird von SheetJS wegen eines Namensraum-Streits nicht mehr aktuell gehalten). |

Details und Begründungen stehen jeweils als Kommentar direkt am Code.

`npm audit` ist aktuell frei von bekannten Schwachstellen (0 findings). Ein einzelner verbleibender
Kandidat (`deepmerge-ts` < 8.0.0, transitiv über Prisma's CLI-Konfigurationslader `@prisma/config`)
ist über einen `overrides`-Eintrag in `package.json` auf eine gepatchte Version angehoben — Prisma
selbst hat diese Abhängigkeit in keiner stabilen 7.x-Version bisher aktualisiert (nur im experimentellen
8.0.0-Release-Candidate, der bewusst nicht eingesetzt wird, da diese App auf der Prisma-7-Client-Architektur
aufbaut, siehe `AGENTS.md`).
