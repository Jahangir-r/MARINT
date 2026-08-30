import { useState } from "react";

const RISK = [
  { color: "#2fa7d6", label: "Normal traffic" },
  { color: "#e0a530", label: "Watch" },
  { color: "#e07a3f", label: "Elevated risk" },
];
const DETECTIONS = [
  { color: "#b754e0", label: "SAR detection" },
  { color: "#39c2a0", label: "Optical detection" },
];
const ZONES = [
  { color: "#e0824c", label: "Restricted area" },
  { color: "#2fa7d6", label: "Radar coverage" },
];

function LegendRows() {
  return (
    <div className="flex flex-col gap-1.5">
      {RISK.map((it) => (
        <div key={it.label} className="flex items-center gap-2 text-[11px] text-ink/60">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: it.color }} />
          {it.label}
        </div>
      ))}
      <div className="h-px bg-hairline my-0.5" />
      {DETECTIONS.map((it) => (
        <div key={it.label} className="flex items-center gap-2 text-[11px] text-ink/60">
          <span className="h-2 w-2 rotate-45 shrink-0" style={{ background: it.color }} />
          {it.label}
        </div>
      ))}
      <div className="h-px bg-hairline my-0.5" />
      {ZONES.map((it) => (
        <div key={it.label} className="flex items-center gap-2 text-[11px] text-ink/60">
          <span className="h-2 w-2 rounded-[2px] border shrink-0" style={{ borderColor: it.color, background: `${it.color}22` }} />
          {it.label}
        </div>
      ))}
    </div>
  );
}

export default function MapLegend() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop — unchanged, always visible */}
      <div className="hidden lg:block absolute bottom-20 left-3 z-10 bg-surface-1/95 border border-hairline rounded-xl px-3 py-2" style={{ boxShadow: "var(--shadow-card)" }}>
        <LegendRows />
      </div>

      {/* Mobile — collapsed behind an info button, positioned above the
          Sidebar's Alerts/Vessels trigger (clear of both it and the
          top-left map-controls stack). */}
      <div className="lg:hidden absolute bottom-28 left-3 z-10">
        {open && (
          <div className="absolute bottom-[calc(100%+8px)] left-0 bg-surface-1 border border-hairline rounded-xl px-3 py-2.5 z-20" style={{ boxShadow: "var(--shadow-soft)" }}>
            <LegendRows />
          </div>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Map legend"
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-surface-1/95 border border-hairline text-ink/60 text-[13px] font-semibold"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          i
        </button>
      </div>
    </>
  );
}
