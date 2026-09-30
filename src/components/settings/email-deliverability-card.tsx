"use client";

import { useState } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle2, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { checkEmailDeliverability, type DeliverabilityCheckResult } from "@/lib/email/deliverabilityChecker";

export function EmailDeliverabilityCard({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [email, setEmail] = useState(defaultEmail || "bewerber@example.com");
  const [result, setResult] = useState<DeliverabilityCheckResult>(() => checkEmailDeliverability(defaultEmail || "bewerber@example.com"));

  function handleCheck() {
    setResult(checkEmailDeliverability(email));
  }

  const scoreColor =
    result.score >= 80
      ? "text-emerald-600 dark:text-emerald-400"
      : result.score >= 60
      ? "text-amber-600 dark:text-amber-400"
      : "text-rose-600 dark:text-rose-400";

  const progressBg =
    result.score >= 80
      ? "bg-emerald-500"
      : result.score >= 60
      ? "bg-amber-500"
      : "bg-rose-500";

  return (
    <Card className="border border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-indigo-500" />
          E-Mail Zustellbarkeit & Spam-Check (SPF, DKIM, Reputation)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Prüfe deine Absenderadresse auf Domain-Reputation und Spamfilter-Kriterien für HR-Postfächer.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="z.B. vorname@nachname.dev"
              className="pl-8 text-xs"
            />
          </div>
          <Button type="button" onClick={handleCheck} size="sm">
            Prüfen
          </Button>
        </div>

        {/* Score Display */}
        <div className="rounded-lg border border-border/60 bg-surface-hover/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Zustellbarkeits-Score</span>
            <span className={`text-lg font-bold ${scoreColor}`}>{result.score} / 100</span>
          </div>

          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${progressBg} transition-all duration-500`}
              style={{ width: `${result.score}%` }}
            />
          </div>

          {result.recommendations.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {result.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          )}

          {result.tips.length > 0 && (
            <div className="pt-2 border-t border-border/40 space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Empfehlungen für höchste Trefferquote
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {result.tips.map((tip, idx) => (
                  <div key={idx} className="rounded p-2 bg-surface text-xs border border-border/50">
                    <span className="font-semibold text-foreground block mb-0.5 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      {tip.title}
                    </span>
                    <p className="text-[11px] text-muted-foreground">{tip.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
