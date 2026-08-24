// -----------------------------------------------------------------------------
// Side-by-Side Stellenvergleich & Match-Analyse Engine
// -----------------------------------------------------------------------------

export interface JobComparisonItem {
  id: string;
  title: string;
  companyName: string;
  location: string;
  remote: boolean;
  salaryInfo: string;
  matchScore: number;
  techStack: string;
  description: string;
  portalSource: string;
}

export interface JobComparisonResult {
  jobA: JobComparisonItem;
  jobB: JobComparisonItem;
  commonTech: string[];
  uniqueTechA: string[];
  uniqueTechB: string[];
  salaryDiff: {
    winner: "A" | "B" | "EQUAL";
    note: string;
  };
  scoreDiff: {
    winner: "A" | "B" | "EQUAL";
    diffPercent: number;
  };
  recommendation: string;
}

function parseSalaryAvg(salaryStr: string): number {
  if (!salaryStr) return 0;
  const numbers = salaryStr.match(/\d[\d.]*/g);
  if (!numbers || numbers.length === 0) return 0;
  const parsed = numbers.map((n) => parseInt(n.replace(/\./g, ""), 10)).filter((n) => !isNaN(n));
  if (parsed.length === 0) return 0;
  return parsed.reduce((sum, val) => sum + val, 0) / parsed.length;
}

export function compareJobs(jobA: JobComparisonItem, jobB: JobComparisonItem): JobComparisonResult {
  const stackA = (jobA.techStack || "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const stackB = (jobB.techStack || "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const setA = new Set(stackA);
  const setB = new Set(stackB);

  const commonTech = stackA.filter((t) => setB.has(t));
  const uniqueTechA = stackA.filter((t) => !setB.has(t));
  const uniqueTechB = stackB.filter((t) => !setA.has(t));

  // Gehaltsvergleich
  const avgA = parseSalaryAvg(jobA.salaryInfo);
  const avgB = parseSalaryAvg(jobB.salaryInfo);

  let salaryWinner: "A" | "B" | "EQUAL" = "EQUAL";
  let salaryNote = "Beide Angebote bewegen sich in einem ähnlichen Gehaltsrahmen.";

  if (avgA > avgB + 1000) {
    salaryWinner = "A";
    salaryNote = `${jobA.companyName} bietet ca. ${(avgA - avgB).toLocaleString("de-DE")} € mehr Gehaltspotenzial.`;
  } else if (avgB > avgA + 1000) {
    salaryWinner = "B";
    salaryNote = `${jobB.companyName} bietet ca. ${(avgB - avgA).toLocaleString("de-DE")} € mehr Gehaltspotenzial.`;
  }

  // Score Vergleich
  const scoreA = jobA.matchScore || 0;
  const scoreB = jobB.matchScore || 0;
  const diffPercent = Math.abs(scoreA - scoreB);

  let scoreWinner: "A" | "B" | "EQUAL" = "EQUAL";
  if (scoreA > scoreB) scoreWinner = "A";
  else if (scoreB > scoreA) scoreWinner = "B";

  // Empfehlung
  let recommendation = "";
  if (scoreWinner === "A" && (salaryWinner === "A" || salaryWinner === "EQUAL")) {
    recommendation = `Stelle A (${jobA.companyName}) ist der Gesamtfavorit mit höherem Match-Score (${scoreA}% vs. ${scoreB}%) und starkem Angebot.`;
  } else if (scoreWinner === "B" && (salaryWinner === "B" || salaryWinner === "EQUAL")) {
    recommendation = `Stelle B (${jobB.companyName}) ist der Gesamtfavorit mit höherem Match-Score (${scoreB}% vs. ${scoreA}%) und starkem Angebot.`;
  } else if (jobA.remote && !jobB.remote) {
    recommendation = `${jobA.companyName} punktet mit 100% Remote-Arbeitsmodell, während ${jobB.companyName} auf Vor-Ort-Zusammenarbeit setzt.`;
  } else {
    recommendation = `Beide Stellen bieten hervorragende Perspektiven. Entscheide nach bevorzugtem Tech-Stack (${commonTech.join(", ") || "Frontend-Fokus"}).`;
  }

  return {
    jobA,
    jobB,
    commonTech,
    uniqueTechA,
    uniqueTechB,
    salaryDiff: {
      winner: salaryWinner,
      note: salaryNote,
    },
    scoreDiff: {
      winner: scoreWinner,
      diffPercent,
    },
    recommendation,
  };
}
