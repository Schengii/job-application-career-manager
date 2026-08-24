"use client";

// -----------------------------------------------------------------------------
// Liniendiagramm "Bewerbungen pro Monat": eine Kennzahl über Zeit (sequentiell,
// ein Farbton), mit Crosshair + Tooltip beim Hover. Reines inline-SVG, keine
// externe Chart-Bibliothek nötig.
// -----------------------------------------------------------------------------
import { useId, useRef, useState } from "react";

type Point = { label: string; count: number };

const WIDTH = 600;
const HEIGHT = 200;
const PADDING = { top: 16, right: 16, bottom: 28, left: 16 };

export function TrendChart({ data }: { data: Point[] }) {
  const titleId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const points = data.map((d, i) => {
    const x = PADDING.left + (data.length > 1 ? (i / (data.length - 1)) * innerWidth : innerWidth / 2);
    const y = PADDING.top + innerHeight - (d.count / maxCount) * innerHeight;
    return { ...d, x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? 0} ${PADDING.top + innerHeight} L ${points[0]?.x ?? 0} ${PADDING.top + innerHeight} Z`;

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || points.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const relX = (e.clientX - rect.left) * scaleX;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  const active = hoverIndex !== null ? points[hoverIndex] : null;
  // Gitterlinien bei 0 / 50% / 100% der maximalen Höhe (dezent, im Hintergrund)
  const gridLines = [0, 0.5, 1].map((f) => PADDING.top + innerHeight * (1 - f));

  return (
    <div role="img" aria-labelledby={titleId} className="relative">
      <span id={titleId} className="sr-only">
        Anzahl neuer Bewerbungen pro Monat, letzte sechs Monate
      </span>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {gridLines.map((y, i) => (
          <line key={i} x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y} y2={y} stroke="var(--color-border)" strokeWidth={1} />
        ))}

        <path d={areaPath} fill="var(--color-primary)" opacity={0.12} stroke="none" />
        <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hoverIndex === i ? 5 : 3.5}
            fill="var(--color-surface)"
            stroke="var(--color-primary)"
            strokeWidth={2}
          />
        ))}

        {hoverIndex !== null && (
          <line
            x1={points[hoverIndex].x}
            x2={points[hoverIndex].x}
            y1={PADDING.top}
            y2={PADDING.top + innerHeight}
            stroke="var(--color-muted-foreground)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        {points.map((p, i) => (
          <text key={i} x={p.x} y={HEIGHT - 8} textAnchor="middle" fontSize={11} fill="var(--color-muted-foreground)">
            {p.label}
          </text>
        ))}
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs shadow-lg"
          style={{
            left: `${(active.x / WIDTH) * 100}%`,
            top: `${(active.y / HEIGHT) * 100}%`,
          }}
        >
          <p className="font-semibold text-foreground">{active.count} Bewerbung(en)</p>
          <p className="text-muted-foreground">{active.label}</p>
        </div>
      )}
    </div>
  );
}
