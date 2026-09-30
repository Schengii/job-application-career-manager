"use client";

import { MessageSquare, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ToneSuccessRate } from "@/lib/applications/toneSuccessRates";

export function ToneEfficiencyCard({ data }: { data: ToneSuccessRate[] }) {
  if (!data || data.length === 0) return null;

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <MessageSquare className="h-5 w-5 text-primary" />
          Anschreiben-Tonalität & Stil-Effizienz
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Auswertung nach bevorzugtem Anschreiben-Stil der kontaktierten Unternehmen (Modern, Klassisch, Startup, Detailliert).
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-1">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.map((item) => (
            <div
              key={item.tone}
              className="rounded-xl border border-border bg-surface-hover/30 p-3.5 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Stil
                </span>
                <h4 className="text-xs font-bold text-foreground mt-0.5 line-clamp-1">
                  {item.label}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {item.total} Bewerbung(en)
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Einladungsquote</span>
                  <span className="text-sm font-bold text-primary flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" /> {item.interviewRate}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block">Zusagen</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {item.offerCount}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
