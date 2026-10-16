# Umsetzungsplan: Job Application & Career Manager

## 1. Ist-Zustand
Fullstack Next.js 16 (App Router, Turbopack, React 19) mit Neon PostgreSQL über Prisma 7 (Neon-HTTP-Adapter).
TypeScript-Typüberprüfung und Next.js-Produktions-Build (`npm run build`) sowie ESLint (`npm run lint`) sind fehlerfrei (0 Fehler).
Die Vitest-Suite umfasst 603 Tests: 456 Unit-Tests laufen offline grün, 126 DB-Tests scheitern mangels erreichbarer Neon-Verbindung.
Zerstörerische Tests (`resetDb`) fallen bei lokalem Lauf ohne `TEST_DATABASE_URL` potenziell auf die Entwicklungsdatenbank zurück.
Kritische Sicherheitslücken existieren bei ungeschütztem Webhook-Fetch (SSRF), Dateipfadauflösung (Path Traversal) und SMTP-Backup.
Accessibility weist Lücken bei Icon-Buttons und Eingabefeldern ohne Screenreader-Labels auf.
Die Codebasis ist modular aufgebaut (12 Submodule unter `src/lib/`), jedoch existieren Dokumentationsabweichungen zu SQLite-Altlasten.
CI überspringt die gesamte Testsuite, wenn `TEST_DATABASE_URL` nicht hinterlegt ist, statt Unit-Tests auszuführen.
Performance ist gut, zeigt aber Optimierungspotenzial durch fehlendes Code-Splitting auf der Analytics-Übersicht.

## 2. Maßnahmen

### Phase 1: Sicherheit & Test-Integrität
- [x] M01 | SSRF-Schutz für Webhook-Test-Endpunkt | P1 | S | src/app/api/settings/webhooks/test/route.ts, src/lib/settings/webhookNotifier.ts | src/lib/settings/webhookNotifier.ts:70 | Fertig wenn: webhookUrl vor dem Fetch über assertSafeUrl validiert wird und private/interne IP-Adressen mit HTTP 400 abgewiesen werden.
- [x] M02 | Path-Traversal-Schutz beim PDF-Merging absichern | P1 | S | src/lib/documents/pdfMerge.ts | src/lib/documents/pdfMerge.ts:199-201 | Fertig wenn: relative Pfade mit path.resolve aufgelöst und verifiziert werden, dass sie strikt innerhalb des public-Verzeichnisses liegen.
- [x] M03 | Path-Traversal-Schutz beim ZIP-Export absichern | P1 | S | src/lib/documents/zipPackage.ts | src/lib/documents/zipPackage.ts:86-88 | Fertig wenn: relative Dokumentpfade geprüft werden und Zugriffe außerhalb von public mit Fehler abgefangen werden.
- [x] M04 | SMTP-Passwort aus Backup-Export ausschließen | P1 | S | src/lib/settings/backup.ts | src/lib/settings/backup.ts:43 | Fertig wenn: smtpPassword im Destructuring herausgefiltert wird und im exportierten Backup-JSON niemals erscheint.
- [x] M05 | Schutz vor versehentlichem Reset der Entwicklungsdatenbank bei Tests | P1 | S | vitest.config.mts, src/test/dbTestUtils.ts | vitest.config.mts:26 | Fertig wenn: vitest.config.mts bei fehlendem TEST_DATABASE_URL nicht auf DATABASE_URL zurückfällt und destructive Tests ohne dedizierte Test-DB abbrechen.
- [x] M06 | Saubere Trennung von Unit- und DB-Integrationstests | P1 | M | package.json, src/lib/settings/backup.test.ts, src/lib/settings/pushNotifications.test.ts, src/lib/settings/serverBackupRotation.test.ts | package.json:19 | Fertig wenn: npm run test:unit ohne externe Datenbankverbindung 100% grün durchläuft.
- [x] M07 | CI-Pipeline führt Unit-Tests auch ohne Neon-Secret aus | P1 | S | .github/workflows/ci.yml | .github/workflows/ci.yml:68-73 | Fertig wenn: CI bei leerem TEST_DATABASE_URL npm run test:unit ausführt statt alle Tests zu überspringen.

### Phase 2: Barrierefreiheit & funktionale Korrektheit
- [x] M08 | Accessible Name für Schließen-Button in DialogContent ergänzen | P2 | S | src/components/ui/dialog.tsx | src/components/ui/dialog.tsx:82-88 | Fertig wenn: der Close-Button aria-label="Schließen" besitzt und von Screenreadern erkannt wird.
- [x] M09 | Accessible Name für Modal-Close-Buttons in Feature-Komponenten ergänzen | P2 | M | src/components/calendar/calendar-feed-modal.tsx, src/components/applications/follow-up-email-modal.tsx, src/components/applications/application-pdf-package-modal.tsx, src/components/jobs/job-text-parser-modal.tsx, src/components/jobs/job-comparison-modal.tsx, src/components/jobs/job-alert-modal.tsx | src/components/calendar/calendar-feed-modal.tsx:57 | Fertig wenn: alle modalen Schließen-Buttons mit aria-label="Schließen" ausgestattet sind.
- [x] M10 | Barrierefreie Labels für Such- und Filterleiste in Excel-Tabelle | P2 | S | src/components/excel/excel-grid-table.tsx | src/components/excel/excel-grid-table.tsx:623-635 | Fertig wenn: Suchfeld aria-label="Tabelle durchsuchen" und der Reset-Button aria-label="Suche zurücksetzen" besitzt.
- [x] M11 | Tastaturkürzel-Button in Sidebar barrierefrei zugänglich machen | P2 | S | src/components/sidebar.tsx | src/components/sidebar.tsx:142-145 | Fertig wenn: der Button neben title auch ein aussagekräftiges aria-label="Tastaturkürzel anzeigen" enthält.
- [x] M12 | Zod-Validierung für Dateipfade und URLs bei Dokumenten | P2 | S | src/lib/core/validation.ts | src/lib/core/validation.ts:107 | Fertig wenn: documentSchema Dateipfade validiert und Traversal-Muster (../) abweist.
- [x] M13 | Rückgabetyp und Semantik von /api/export/pdf korrigieren | P2 | S | src/app/api/export/pdf/route.ts | src/app/api/export/pdf/route.ts:19-29 | Fertig wenn: die Route entweder valides PDF via pdf-lib liefert oder semantisch sauber dokumentiert und typisiert ist.

### Phase 3: Codequalität, Architektur & Performance
- [x] M14 | Einheitliche Typisierung für Web Speech API ohne any-Casts | P2 | S | src/components/interview/mock-interview-modal.tsx, src/components/interview/salary-negotiation-trainer.tsx, src/components/interview/question-note-editor.tsx, src/types/index.ts | src/components/interview/mock-interview-modal.tsx:55 | Fertig wenn: window as any durch die zentrale WindowWithSpeechRecognition-Schnittstelle ersetzt ist und keine any-Typen verbleiben.
- [ ] M15 | Typsicherer Response-Body bei ZIP-Backup-Download | P3 | S | src/app/api/backup/zip/route.ts | src/app/api/backup/zip/route.ts:43 | Fertig wenn: zipBuffer as unknown as BodyInit durch new Uint8Array(zipBuffer) ersetzt wurde.
- [ ] M16 | Entflechtung der doppelten commuteCalculator-Dateinamen | P3 | S | src/lib/jobs/commuteCalculator.ts, src/lib/salary/commuteCalculator.ts | src/lib/jobs/commuteCalculator.ts:28 | Fertig wenn: der Job-Pendelrechner in commuteRadar.ts umbenannt und Verwechslung mit dem Gehaltsrechner ausgeschlossen ist.
- [ ] M17 | Dynamic Imports für rechenintensive Karten der Analytics-Seite | P3 | M | src/app/analytics/page.tsx | src/app/analytics/page.tsx:10-32 | Fertig wenn: sekundäre Rechnerkarten per next/dynamic lazy geladen werden und das initiale JS-Bundle der Analytics-Route sinkt.

### Phase 4: Developer Experience & Dokumentation
- [ ] M18 | Fehlende Prisma-Skripte in package.json ergänzen | P3 | S | package.json | package.json:12-26 | Fertig wenn: db:push, db:generate und db:studio als npm-Skripte definiert und ausführbar sind.
- [ ] M19 | Doku-Aktualisierung: SQLite-Altlasten bereinigen | P3 | S | GEMINI.md, SECURITY.md, CONTRIBUTING.md, src/test/dbTestUtils.ts | GEMINI.md:43 | Fertig wenn: alle veralteten Referenzen auf SQLite/dev.db durch PostgreSQL/Neon ersetzt sind.
- [ ] M20 | Modulübersicht und Dateinamen in Leitfäden synchronisieren | P3 | S | AGENTS.md, GEMINI.md, CLAUDE.md | AGENTS.md:21 | Fertig wenn: die 4 fehlenden Module (analytics, career, companies, portfolio) ergänzt und veraltete Dateinamen korrigiert sind.

### Optional (Ideen ohne direkten Defektbeleg)
- [ ] OPT-1 | Virtualisierung für sehr große Tabellen in der Excel-Ansicht | P3 | L | src/components/excel/excel-grid-table.tsx | | Fertig wenn: Tabellen mit > 500 Zeilen flüssig mit DOM-Recycling gerendert werden.
- [ ] OPT-2 | Automatischer Offline-Fallback mit Mock-DB für Integrationstests | P3 | M | vitest.config.mts | | Fertig wenn: Integrationstests bei Offline-Status automatisch eine In-Memory-Mock-Schicht nutzen.

## 3. Vorgehen je Phase

### Phase 1: Sicherheit & Test-Integrität
1. **Reihenfolge:** M04 -> M01 -> M02 -> M03 -> M05 -> M06 -> M07.
2. **Test nach Phase:**
   - `npm run test:unit` muss 100% grün sein (inklusive der isolierten Settings-Tests).
   - Manueller Test: Aufruf von `POST /api/settings/webhooks/test` mit `http://127.0.0.1` muss mit HTTP 400 abgewiesen werden.
   - `git diff` prüfen, um sicherzustellen, dass keine Tests Daten aus `.env` löschen können.
3. **Rollback:** `git checkout HEAD -- <dateien>` für betroffene Dateien; keine Schema-Änderung in dieser Phase nötig.

### Phase 2: Barrierefreiheit & funktionale Korrektheit
1. **Reihenfolge:** M08 -> M09 -> M10 -> M11 -> M12 -> M13.
2. **Test nach Phase:**
   - `npm run build` und `npm run lint` ausführen.
   - Testen der Dialoge und Tabellen mit Tastaturnavigation (Tab, Shift+Tab, Escape) und Screenreader-Prüfung.
   - Unit-Tests für `documentSchema` mit Traversal-Strings ausführen.
3. **Rollback:** Revert der UI-Komponenten und Schema-Validierung über Git.

### Phase 3: Codequalität, Architektur & Performance
1. **Reihenfolge:** M14 -> M15 -> M16 -> M17.
2. **Test nach Phase:**
   - `npm run lint` und `npm run build` zur Verifizierung von Typen und Bundle-Generierung.
   - Prüfung der Importe nach Umbenennung von `commuteCalculator.ts` zu `commuteRadar.ts`.
3. **Rollback:** Rückbenennung der Datei und Revert der Import-Pfade.

### Phase 4: Developer Experience & Dokumentation
1. **Reihenfolge:** M18 -> M19 -> M20.
2. **Test nach Phase:**
   - Ausführen von `npm run db:generate -- --help` zur Bestätigung der Skripte.
   - Vollständiger Check aller Markdown-Dateien auf korrekte Links und Konsistenz.
3. **Rollback:** Markdown-Dateien via Git zurücksetzen.

## 4. Risiken und offene Fragen
- **Risiko R1 (Neon-Abhängigkeit bei vollen Integrationstests):** Integrationstests benötigen für `@prisma/adapter-neon` eine aktive Netzwerkverbindung zu einer PostgreSQL-Instanz. Ohne `TEST_DATABASE_URL` können vollwertige DB-Tests lokal nicht laufen.
- **Risiko R2 (Vercel-Blob vs. Lokaler Speicher):** Datei-Uploads nutzen in Produktion Vercel Blob, lokal Fallback-Pfade in `public/`. Absicherungen gegen Path Traversal müssen beide Umgebungen fehlerfrei unterstützen.
- **Offene Frage Q1:** Soll `/api/export/pdf` zukünftig serverseitig ein echtes Binär-PDF über `pdf-lib` rendern oder der Endpunkt formal in `/api/export/print-html` umbenannt werden?
