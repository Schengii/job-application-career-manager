"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  RotateCcw,
  Award,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Building2,
  Mic,
  MicOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SCENARIOS,
  NegotiationScenario,
  NegotiationMessage,
  NegotiationEvaluation,
  generateNegotiationStep,
  evaluateNegotiationPerformance,
} from "@/lib/salaryNegotiationEngine";

export function SalaryNegotiationTrainer() {
  const [selectedScenario, setSelectedScenario] = useState<NegotiationScenario>(SCENARIOS[0]);
  const [messages, setMessages] = useState<NegotiationMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [evaluation, setEvaluation] = useState<NegotiationEvaluation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialisiere Szenario
  useEffect(() => {
    resetSession(selectedScenario);
  }, [selectedScenario]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function resetSession(scenario: NegotiationScenario) {
    setEvaluation(null);
    setUserInput("");
    setMessages([
      {
        id: "msg-0",
        sender: "AI",
        text: scenario.initialMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        currentOfferAmount: scenario.initialOffer,
      },
    ]);
  }

  function handleSend() {
    if (!userInput.trim() || evaluation) return;

    const userMsg: NegotiationMessage = {
      id: `msg-${Date.now()}`,
      sender: "USER",
      text: userInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setUserInput("");

    // Berechne KI-Antwort
    setTimeout(() => {
      const step = generateNegotiationStep(selectedScenario, newHistory, userMsg.text);
      const aiMsg: NegotiationMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: "AI",
        text: step.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        tacticalTip: step.tacticalTip,
        currentOfferAmount: step.newOffer,
      };

      const updatedHistory = [...newHistory, aiMsg];
      setMessages(updatedHistory);

      // Nach 3 Runden Verhandlung abschließen & bewerten
      if (updatedHistory.filter((m) => m.sender === "USER").length >= 3) {
        const evalResult = evaluateNegotiationPerformance(selectedScenario, updatedHistory);
        setEvaluation(evalResult);
      }
    }, 600);
  }

  // Web Speech API Spracheingabe
  function toggleListening() {
    if (typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Spracherkennung wird in diesem Browser nicht unterstützt (bitte Chrome oder Edge nutzen).");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "de-DE";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch {
      setIsListening(false);
    }
  }

  const currentOffer =
    messages.filter((m) => m.sender === "AI" && m.currentOfferAmount).slice(-1)[0]?.currentOfferAmount ||
    selectedScenario.initialOffer;

  return (
    <div className="space-y-6">
      {/* Szenario-Auswahl */}
      <div className="grid gap-3 sm:grid-cols-3">
        {SCENARIOS.map((sc) => (
          <button
            key={sc.id}
            type="button"
            onClick={() => setSelectedScenario(sc)}
            className={`rounded-xl border p-4 text-left transition-all ${
              selectedScenario.id === sc.id
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border bg-surface hover:bg-surface-hover/60"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary">{sc.personaTitle}</span>
              <Badge color="blue" className="text-[10px]">
                Ziel: {sc.targetSalary.toLocaleString("de-DE")} €
              </Badge>
            </div>
            <h4 className="mt-1.5 text-sm font-bold text-foreground">{sc.title}</h4>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{sc.description}</p>
          </button>
        ))}
      </div>

      {/* Haupt-Trainer Card */}
      <Card className="border-border">
        <CardHeader className="border-b border-border bg-surface/50 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{selectedScenario.personaName}</CardTitle>
                <p className="text-xs text-muted-foreground">{selectedScenario.personaTitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-border bg-surface px-3 py-1.5 text-right">
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Aktuelles Angebot</span>
                <span className="text-sm font-bold text-primary">{currentOffer.toLocaleString("de-DE")} €</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => resetSession(selectedScenario)} className="gap-1.5 text-xs">
                <RotateCcw className="h-3.5 w-3.5" />
                Neustart
              </Button>
            </div>
          </div>

          {/* Fokus-Hebel */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Empfohlene Hebel:</span>
            {selectedScenario.focusLevers.map((lever) => (
              <span key={lever} className="rounded bg-surface-hover px-2 py-0.5 text-[11px] text-primary">
                {lever}
              </span>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Chat Stream */}
          <div className="scroll-thin max-h-[420px] min-h-[300px] space-y-4 overflow-y-auto pr-2">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.sender === "USER" ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                  {m.sender === "USER" ? (
                    <>
                      <span>Du (Bewerber)</span>
                      <span>• {m.timestamp}</span>
                    </>
                  ) : (
                    <>
                      <span>{selectedScenario.personaName}</span>
                      <span>• {m.timestamp}</span>
                    </>
                  )}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                    m.sender === "USER"
                      ? "bg-primary text-primary-foreground rounded-tr-sm shadow-md"
                      : "border border-border bg-surface text-foreground rounded-tl-sm shadow-sm"
                  }`}
                >
                  {m.text}
                </div>

                {/* Taktischer Coach-Tipp */}
                {m.tacticalTip && (
                  <div className="mt-2 flex max-w-[85%] items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs text-amber-600 dark:text-amber-400 animate-fade-in">
                    <Lightbulb className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                    <span>
                      <strong>Taktik-Feedback:</strong> {m.tacticalTip}
                    </span>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Scorecard-Abschlussbericht */}
          {evaluation && (
            <div className="rounded-2xl border border-success/30 bg-success/5 p-5 animate-fade-in">
              <div className="flex items-center justify-between border-b border-success/20 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="h-6 w-6 text-success" />
                  <div>
                    <h4 className="text-base font-bold text-foreground">Verhandlungsergebnis: {evaluation.rating}</h4>
                    <p className="text-xs text-muted-foreground">{evaluation.summary}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] uppercase text-muted-foreground">Taktik-Score</span>
                  <span className="text-xl font-black text-success">{evaluation.overallScore} / 100</span>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
                <div>
                  <h5 className="font-semibold text-foreground flex items-center gap-1.5 text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Stärken & Hebel:
                  </h5>
                  <ul className="mt-1.5 space-y-1 text-muted-foreground list-disc list-inside">
                    {evaluation.strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold text-foreground flex items-center gap-1.5 text-amber-500">
                    <AlertTriangle className="h-3.5 w-3.5" /> Optimierungspotenziale:
                  </h5>
                  <ul className="mt-1.5 space-y-1 text-muted-foreground list-disc list-inside">
                    {evaluation.improvements.map((i, idx) => (
                      <li key={idx}>{i}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button size="sm" onClick={() => resetSession(selectedScenario)} className="gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Weiteres Szenario trainieren
                </Button>
              </div>
            </div>
          )}

          {/* Eingabe-Leiste */}
          {!evaluation && (
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant={isListening ? "danger" : "outline"}
                size="icon"
                onClick={toggleListening}
                title={isListening ? "Aufnahme stoppen" : "Antwort per Sprache einsprechen"}
              >
                {isListening ? <MicOff className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
              </Button>

              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Formuliere dein Gegenangebot oder deine Argumente..."
                className="flex-1 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <Button onClick={handleSend} disabled={!userInput.trim()} className="gap-1.5 shrink-0">
                <Send className="h-4 w-4" />
                Senden
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
