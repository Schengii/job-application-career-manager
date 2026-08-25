import { Tags, Code2, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type SkillSuccessRate = {
  skill: string;
  total: number;
  interviewCount: number;
  interviewRate: number;
  offerCount: number;
  offerRate: number;
};

function SkillSuccessRateList({ data, emptyHint }: { data: SkillSuccessRate[]; emptyHint: string }) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-xs text-muted-foreground">{emptyHint}</p>;
  }

  // Nur die Top 8, damit die Liste auf beiden Auflösungen übersichtlich bleibt.
  const top = data.slice(0, 8);

  return (
    <div className="space-y-2.5">
      {top.map((item) => (
        <div key={item.skill} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground truncate max-w-[60%]">{item.skill}</span>
            <span className="text-muted-foreground">
              <span className="font-semibold text-primary">{item.interviewRate}%</span> Einladungsquote ·{" "}
              {item.total} {item.total === 1 ? "Bewerbung" : "Bewerbungen"}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-border/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{ width: `${Math.max(4, item.interviewRate)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkillSuccessRatesCard({
  tagData,
  techStackData,
}: {
  tagData: SkillSuccessRate[];
  techStackData: SkillSuccessRate[];
}) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" /> Erfolgsquote nach Tag & Tech-Stack
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 space-y-6">
        <div>
          <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Tags className="h-3.5 w-3.5" /> Nach Bewerbungs-Tag
          </h4>
          <SkillSuccessRateList
            data={tagData}
            emptyHint="Vergib Tags an deinen Bewerbungen (z. B. #Remote, #Prio1), um hier Auswertungen zu sehen."
          />
        </div>

        <div>
          <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Code2 className="h-3.5 w-3.5" /> Nach Tech-Stack der Stellenanzeige
          </h4>
          <SkillSuccessRateList
            data={techStackData}
            emptyHint="Verknüpfe Bewerbungen mit einer Stellenanzeige inkl. Tech-Stack, um hier Auswertungen zu sehen."
          />
        </div>

        <p className="rounded-lg border border-border/80 bg-surface-hover/50 p-3 text-[11px] leading-relaxed text-muted-foreground">
          Nur Tags/Skills mit mindestens 2 Bewerbungen werden angezeigt, um zufällige Ausreißer bei kleinen
          Stichproben zu vermeiden.
        </p>
      </CardContent>
    </Card>
  );
}
