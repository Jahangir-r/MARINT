export default function MapLegend() {
  const risk = [
    { color: "#2fa7d6", label: "Normal traffic" },
    { color: "#e0a530", label: "Watch" },
    { color: "#e07a3f", label: "Elevated risk" },
  ];
  const detections = [
    { color: "#b754e0", label: "SAR detection" },
    { color: "#39c2a0", label: "Optical detection" },
  ];
  const zones = [
    { color: "#e0824c", label: "Restricted area" },
    { color: "#2fa7d6", label: "Radar coverage" },
  ];
  return (
    <div className="absolute bottom-20 left-3 z-10 bg-surface-1/95 border border-hairline rounded-xl px-3 py-2" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex flex-col gap-1.5">
        {risk.map((it) => (
          <div key={it.label} className="flex items-center gap-2 text-[11px] text-ink/60">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: it.color }} />
            {it.label}
          </div>
        ))}
        <div className="h-px bg-hairline my-0.5" />
        {detections.map((it) => (
          <div key={it.label} className="flex items-center gap-2 text-[11px] text-ink/60">
            <span className="h-2 w-2 rotate-45 shrink-0" style={{ background: it.color }} />
            {it.label}
          </div>
        ))}
        <div className="h-px bg-hairline my-0.5" />
        {zones.map((it) => (
          <div key={it.label} className="flex items-center gap-2 text-[11px] text-ink/60">
            <span className="h-2 w-2 rounded-[2px] border shrink-0" style={{ borderColor: it.color, background: `${it.color}22` }} />
            {it.label}
          </div>
        ))}
      </div>
    </div>
  );
}
