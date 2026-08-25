// -----------------------------------------------------------------------------
// Bewerbungs-Aufwand & ROI-Tracker (Return on Time Invested Engine)
// -----------------------------------------------------------------------------
// Berechnet die Zeiteffizienz der Jobsuche: Wie viele Stunden wurden für Recherche,
// Anschreiben und Vorbereitung investiert und welche Kanäle/Portale liefern
// den höchsten Ertrag (Interviews & Angebote) pro investierter Zeiteinheit?
// -----------------------------------------------------------------------------
import { ApplicationListItem } from "@/types";

export interface ChannelRoiMetric {
  channel: string;
  totalApplications: number;
  totalTimeMinutes: number;
  totalTimeHours: number;
  interviewsCount: number;
  offersCount: number;
  interviewRate: number; // in %
  rotiScore: number; // Interviews pro 10 Stunden Aufwand
  minutesPerInterview: number | null; // Durchschnittliche Minuten bis zum Interview
}

export interface RoiAnalyticsResult {
  totalTimeInvestedMinutes: number;
  totalTimeInvestedHours: number;
  avgMinutesPerApplication: number;
  channelMetrics: ChannelRoiMetric[];
  topPerformingChannel: string | null;
  timeSinkChannel: string | null;
  strategicTips: string[];
}

export function calculateRoiAnalytics(applications: ApplicationListItem[]): RoiAnalyticsResult {
  if (!applications || applications.length === 0) {
    return {
      totalTimeInvestedMinutes: 0,
      totalTimeInvestedHours: 0,
      avgMinutesPerApplication: 0,
      channelMetrics: [],
      topPerformingChannel: null,
      timeSinkChannel: null,
      strategicTips: ["Erfasse bei deinen Bewerbungen den investierten Zeitaufwand, um die Kanal-Effizienz zu analysieren."],
    };
  }

  const channelMap = new Map<
    string,
    { count: number; minutes: number; interviews: number; offers: number }
  >();

  let totalMinutes = 0;

  for (const app of applications) {
    const channel = app.source || "Unbekannt";
    const minutes = app.timeSpentMinutes || 30; // Fallback: 30 Min Standard-Aufwand pro Bewerbung
    totalMinutes += minutes;

    const isInterview = app.status === "INTERVIEW" || app.status === "OFFER";
    const isOffer = app.status === "OFFER";

    const current = channelMap.get(channel) || { count: 0, minutes: 0, interviews: 0, offers: 0 };
    current.count += 1;
    current.minutes += minutes;
    if (isInterview) current.interviews += 1;
    if (isOffer) current.offers += 1;
    channelMap.set(channel, current);
  }

  const channelMetrics: ChannelRoiMetric[] = Array.from(channelMap.entries()).map(([channel, data]) => {
    const totalHours = Math.round((data.minutes / 60) * 10) / 10;
    const interviewRate = data.count > 0 ? Math.round((data.interviews / data.count) * 100) : 0;
    const rotiScore = totalHours > 0 ? Math.round((data.interviews / (totalHours / 10)) * 10) / 10 : data.interviews * 10;
    const minutesPerInterview = data.interviews > 0 ? Math.round(data.minutes / data.interviews) : null;

    return {
      channel,
      totalApplications: data.count,
      totalTimeMinutes: data.minutes,
      totalTimeHours: totalHours,
      interviewsCount: data.interviews,
      offersCount: data.offers,
      interviewRate,
      rotiScore,
      minutesPerInterview,
    };
  });

  // Sortiere nach bestem ROTI-Score (Interviews pro 10 Stunden)
  channelMetrics.sort((a, b) => b.rotiScore - a.rotiScore);

  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const avgMinutes = Math.round(totalMinutes / applications.length);

  const topPerforming = channelMetrics.find((c) => c.interviewsCount > 0)?.channel || null;
  const timeSink = channelMetrics.find((c) => c.totalTimeHours >= 2 && c.interviewsCount === 0)?.channel || null;

  const strategicTips: string[] = [];
  if (topPerforming) {
    strategicTips.push(`Kanal '${topPerforming}' hat deinen höchsten ROI – fokussiere 50% deiner wöchentlichen Bewerbungszeit hier.`);
  }
  if (timeSink) {
    strategicTips.push(`Auf '${timeSink}' hast du viel Zeit ohne Interview-Ertrag investiert. Optimiere dein Anschreiben oder reduziere den Zeitaufwand.`);
  }
  if (avgMinutes > 60) {
    strategicTips.push("Du benötigst über 60 Minuten pro Bewerbung. Nutze die KI-Anschreiben-Vorlagen und den URL-Clipper für schnellere Zyklen.");
  } else {
    strategicTips.push("Deine durchschnittliche Erfassungs- und Vorbereitungszeit ist effizient strukturiert.");
  }

  return {
    totalTimeInvestedMinutes: totalMinutes,
    totalTimeInvestedHours: totalHours,
    avgMinutesPerApplication: avgMinutes,
    channelMetrics,
    topPerformingChannel: topPerforming,
    timeSinkChannel: timeSink,
    strategicTips,
  };
}
