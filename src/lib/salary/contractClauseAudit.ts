// -----------------------------------------------------------------------------
// IT-Arbeitsvertrags- & Klausel-Prüfer (Status OFFER)
// -----------------------------------------------------------------------------
// Prüft typische Fallstricke in deutschen IT-Arbeitsverträgen nach BAG-Rechtsprechung
// und liefert diplomatische Nachverhandlungs-Skripte für Bewerber.
// -----------------------------------------------------------------------------

export type ClauseSeverity = "CRITICAL" | "WARNING" | "RECOMMENDED" | "OK";

export interface ContractClauseCheckItem {
  id: string;
  category: "WORKING_HOURS" | "REMOTE_WORK" | "PROBATION" | "IP_RIGHTS" | "BENEFITS" | "HARDWARE";
  title: string;
  description: string;
  legalContext: string;
  redFlagPattern: string;
  recommendedClause: string;
  status: "UNCHECKED" | "PASSED" | "FAILED" | "NOT_APPLICABLE";
  negotiationScript: string;
}

export const IT_CONTRACT_CLAUSES: ContractClauseCheckItem[] = [
  {
    id: "overtime_blanket",
    category: "WORKING_HOURS",
    title: "Pauschale Überstundenabgeltung",
    description: "Prüfe, ob Überstunden ohne Obergrenze mit dem Festgehalt abgegolten sein sollen.",
    legalContext: "Nach BAG (§ 307 BGB) ist die Klausel 'Überstunden sind mit dem Gehalt abgegolten' bei Nicht-Leitenden Angestellten unwirksam. Es muss eine konkrete Höchstgrenze (z. B. max. 10 Std./Monat) genannt sein.",
    redFlagPattern: "„Erforderliche Überstunden sind mit dem monatlichen Bruttogehalt vollständig abgegolten.“",
    recommendedClause: "„Überstunden werden auf einem Arbeitszeitkonto erfasst und durch Freizeitausgleich oder Vergütung ausgeglichen (max. 10 Std./Monat abgegolten).“",
    status: "UNCHECKED",
    negotiationScript: "„Bezüglich § X (Überstunden): Da mir eine transparente Zeiterfassung und gesunde Work-Life-Balance wichtig sind, schlage ich vor, die Abgeltung auf maximal 10 Stunden pro Monat zu begrenzen bzw. ein Arbeitszeitkonto zu vereinbaren.“",
  },
  {
    id: "remote_work_entitlement",
    category: "REMOTE_WORK",
    title: "Vertraglicher Anspruch auf Home-Office",
    description: "Prüfe, ob der vereinbarte Home-Office-Anteil fest im Vertrag verankert ist oder unter Freiwilligkeitsvorbehalt steht.",
    legalContext: "Reine mündliche Zusagen oder 'nach billigem Ermessen' können einseitig widerrufen werden. Ein fester Anspruch (z. B. 2–3 Tage/Woche oder 100% Remote) schützt vor plötzlichen Büro-Rückrufen.",
    redFlagPattern: "„Der Arbeitgeber kann dem Arbeitnehmer nach eigenem Ermessen mobiles Arbeiten gestatten. Ein Rechtsanspruch besteht nicht.“",
    recommendedClause: "„Der Arbeitnehmer ist berechtigt, bis zu X Tage pro Woche im Home-Office / mobil innerhalb Deutschlands tätig zu sein.“",
    status: "UNCHECKED",
    negotiationScript: "„In unserem Gespräch hatten wir über X Tage Home-Office gesprochen. Im vorliegenden Entwurf ist dies jedoch als jederzeit widerruflicher Vorbehalt formuliert. Können wir die vereinbarten X Tage Home-Office als festen Bestandteil aufnehmen?“",
  },
  {
    id: "ip_open_source",
    category: "IP_RIGHTS",
    title: "Geistiges Eigentum & Private Open-Source-Projekte",
    description: "Prüfe, ob die Abtretung von Urheberrechten übermäßige private Nebenprojekte beschneidet.",
    legalContext: "Klauseln dürfen nur Arbeitsergebnisse umfassen, die während der Arbeitszeit oder im Rahmen der betrieblichen Aufgaben entstehen (§ 69b UrhG). Private Hobby-Repositories müssen frei bleiben.",
    redFlagPattern: "„Alle vom Arbeitnehmer während der Dauer des Arbeitsverhältnisses geschaffenen Werke und Erfindungen gehen vollumfänglich auf das Unternehmen über.“",
    recommendedClause: "„Betrifft ausschließlich Software und Erfindungen, die in Erfüllung der vertraglichen Dienstaufgaben für das Unternehmen geschaffen wurden.“",
    status: "UNCHECKED",
    negotiationScript: "„Ich beteilige mich in meiner Freizeit gelegentlich an Open-Source-Projekten. Bitte stellen wir im Vertrag klar, dass sich die Rechteübertragung ausschließlich auf Entwicklungen bezieht, die im Rahmen meiner Aufgaben für das Unternehmen entstehen.“",
  },
  {
    id: "equipment_os_choice",
    category: "HARDWARE",
    title: "Entwickler-Hardware & Betriebssystem-Wahl",
    description: "Prüfe, ob adäquate Entwickler-Hardware (z. B. MacBook Pro / modernes Linux-Notebook) und Bildschirme zugesichert sind.",
    legalContext: "Ohne Spezifikation besteht nur Anspruch auf Standard-Office-Hardware, was bei anspruchsvollen Frontend-Builds (Next.js/Turbopack) die Produktivität bremst.",
    redFlagPattern: "Keine Erwähnung der Hardware-Ausstattung oder strikte Restriktionen ohne Admin-Rechte.",
    recommendedClause: "„Der Arbeitgeber stellt ein modernes Arbeitsgerät nach Wahl (macOS/Linux) sowie angemessenes Peripherie-Equipment für das Home-Office zur Verfügung.“",
    status: "UNCHECKED",
    negotiationScript: "„Für meine tägliche Arbeit mit modernem React und Next.js ist eine leistungsfähige Entwicklungsumgebung essenziell. Können wir kurz abstimmen, welche Hard- und Software-Ausstattung für die Stelle vorgesehen ist?“",
  },
  {
    id: "education_budget",
    category: "BENEFITS",
    title: "Weiterbildungsbudget & Konferenz-Tage",
    description: "Prüfe, ob ein festes jährliches Lernbudget oder freie Konferenztage vereinbart sind.",
    legalContext: "Als Fachinformatiker für Anwendungsentwicklung entwickelt sich der Web-Stack rasant weiter. Ein garantiertes Weiterbildungsbudget sichert die kontinuierliche Qualifikation.",
    redFlagPattern: "Keine Weiterbildungsvereinbarung oder überlange Rückzahlungsklauseln bei Ausscheiden (mehr als 2 Jahre Bindung).",
    recommendedClause: "„Dem Arbeitnehmer steht ein jährliches Weiterbildungsbudget von 1.500 € sowie 3 Tage für Konferenzen oder Fachschulungen zur Verfügung.“",
    status: "UNCHECKED",
    negotiationScript: "„Da mir fachliche Weiterbildung (z. B. Next.js-, React- oder TypeScript-Konferenzen) sehr am Herzen liegt: Besteht die Möglichkeit, ein jährliches Fortbildungsbudget von X € im Vertrag festzuhalten?“",
  },
  {
    id: "non_compete",
    category: "IP_RIGHTS",
    title: "Nachvertragliches Wettbewerbsverbot",
    description: "Prüfe, ob dir nach dem Ausscheiden untersagt wird, für Wettbewerber tätig zu sein.",
    legalContext: "Ein nachvertragliches Wettbewerbsverbot ist nach § 74 Abs. 2 HGB NUR wirksam, wenn das Unternehmen eine gesetzliche Karenzentschädigung von mindestens 50% des letzten Gehalts zahlt. Ohne Karenzentschädigung ist die Klausel nichtig!",
    redFlagPattern: "„Der Arbeitnehmer verpflichtet sich, nach Beendigung für 12 Monate nicht für ein Konkurrenzunternehmen tätig zu sein.“ (ohne Karenzentschädigung)",
    recommendedClause: "Entfall des nachvertraglichen Wettbewerbsverbots oder explizite Karenzentschädigung nach § 74 HGB.",
    status: "UNCHECKED",
    negotiationScript: "„Bezüglich des Wettbewerbsverbots in § Y: Da hier keine Karenzentschädigung nach § 74 HGB vorgesehen ist, schlage ich vor, die Klausel ersatzlos zu streichen, um beidseitige Rechtsklarheit zu schaffen.“",
  },
];

export interface ContractAuditResult {
  safetyScore: number; // 0 - 100
  totalChecks: number;
  passedCount: number;
  failedCount: number;
  uncheckedCount: number;
  items: ContractClauseCheckItem[];
}

export function evaluateContractClauses(
  items: ContractClauseCheckItem[]
): ContractAuditResult {
  const total = items.length;
  const passedCount = items.filter((i) => i.status === "PASSED").length;
  const failedCount = items.filter((i) => i.status === "FAILED").length;
  const uncheckedCount = items.filter((i) => i.status === "UNCHECKED").length;

  // Score-Berechnung: Passed = 100%, Failed = 0%, Unchecked = 50%
  const score = total > 0
    ? Math.round(((passedCount * 100 + uncheckedCount * 40) / (total * 100)) * 100)
    : 100;

  return {
    safetyScore: Math.max(0, Math.min(100, score)),
    totalChecks: total,
    passedCount,
    failedCount,
    uncheckedCount,
    items,
  };
}
