import { AlertCircle } from "lucide-react";

type RejectionItem = {
  reason: string;
  count: number;
  pct: number;
};

export function RejectionReasonsChart({ data }: { data: RejectionItem[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground">
        Bisher sind keine Absagegründe dokumentiert.
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-4">
      <div className="space-y-2.5">
        {data.map((item) => {
          const widthPct = Math.max(8, Math.round((item.count / maxCount) * 100));

          return (
            <div key={item.reason} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground truncate max-w-[75%]">{item.reason}</span>
                <span className="text-muted-foreground font-semibold">
                  {item.count} {item.count === 1 ? "Bewerbung" : "Bewerbungen"} ({item.pct}%)
                </span>
              </div>

              <div className="h-2.5 w-full overflow-hidden rounded-full bg-border/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-border/80 bg-surface-hover/50 p-3 text-xs leading-relaxed text-muted-foreground flex items-start gap-2.5">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
        <div>
          <strong className="text-foreground">Strategie-Tipp:</strong> Wenn Absagen sich auf bestimmte Tech-Stacks oder Gehaltsvorstellungen konzentrieren, passe gezielt die Keyword-Hervorhebung im Anschreiben-Generator oder deine Gehaltsspanne an.
        </div>
      </div>
    </div>
  );
}
