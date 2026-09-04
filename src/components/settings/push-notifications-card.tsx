"use client";

// -----------------------------------------------------------------------------
// Web-Push-Benachrichtigungen: Berechtigung anfragen & abonnieren/abmelden.
// -----------------------------------------------------------------------------
import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { isPushSupported, getExistingSubscription, subscribeToPush, unsubscribeFromPush } from "@/lib/settings/pushClient";

type Status = "checking" | "unsupported" | "subscribed" | "unsubscribed";

export function PushNotificationsCard() {
  const toast = useToast();
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function checkStatus() {
      if (!isPushSupported()) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      const existing = await getExistingSubscription();
      if (!cancelled) setStatus(existing ? "subscribed" : "unsubscribed");
    }
    checkStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubscribe() {
    setBusy(true);
    try {
      await subscribeToPush();
      setStatus("subscribed");
      toast.success("Push-Benachrichtigungen aktiviert!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Aktivierung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnsubscribe() {
    setBusy(true);
    try {
      await unsubscribeFromPush();
      setStatus("unsubscribed");
      toast.success("Push-Benachrichtigungen deaktiviert.");
    } catch {
      toast.error("Deaktivieren fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-border bg-surface shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <BellRing className="h-5 w-5 text-violet-500" /> Push-Benachrichtigungen
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Erhalte Desktop-Benachrichtigungen für Absagen, Zusagen, Interview-Einladungen und anstehende Termine —
          auch wenn das Dashboard gerade nicht im Vordergrund ist (der Server muss dafür laufen).
        </p>
      </CardHeader>
      <CardContent>
        {status === "checking" && <p className="text-xs text-muted-foreground">Prüfe Berechtigung …</p>}

        {status === "unsupported" && (
          <p className="text-xs text-muted-foreground">
            Dieser Browser unterstützt keine Web-Push-Benachrichtigungen.
          </p>
        )}

        {status === "unsubscribed" && (
          <Button size="sm" onClick={handleSubscribe} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Bell className="h-4 w-4 mr-1.5" />}
            Push-Benachrichtigungen aktivieren
          </Button>
        )}

        {status === "subscribed" && (
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-xs text-success font-medium">
              <BellRing className="h-3.5 w-3.5" /> Aktiv für diesen Browser.
            </p>
            <Button size="sm" variant="outline" onClick={handleUnsubscribe} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <BellOff className="h-4 w-4 mr-1.5" />}
              Deaktivieren
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
