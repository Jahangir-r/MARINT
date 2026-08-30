import { useMemo } from "react";
import { useMarintStore } from "../../lib/store";

export default function MapStats() {
  const vessels = useMarintStore((s) => s.vessels);
  const events = useMarintStore((s) => s.events);

  const stats = useMemo(() => {
    const alerts = events.filter((e) => e.severity);
    const dark = vessels.filter((v) => v.scenario === "dark_vessel").length;
    const watchOrAbove = vessels.filter((v) => v.risk_band !== "low").length;
    return { total: vessels.length, alerts: alerts.length, dark, watchOrAbove };
  }, [vessels, events]);

  return (
    <div className="absolute top-3 right-3 z-10 flex gap-2">
      <StatTile value={stats.total} label="Vessels tracked" accent="#2fa7d6" icon={<VesselGlyph />} />
      <StatTile value={stats.alerts} label="Active alerts" accent="#e0a530" icon={<BellGlyph />} />
      <StatTile value={stats.dark} label="Possible dark vessels" accent="#b754e0" icon={<GhostGlyph />} />
      <StatTile value={stats.watchOrAbove} label="Flagged for review" accent="#e07a3f" icon={<FlagGlyph />} />
    </div>
  );
}

function StatTile({ value, label, accent, icon }: { value: number; label: string; accent: string; icon: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-2.5 bg-surface-1/95 border border-hairline rounded-xl pl-2.5 pr-3.5 py-2 min-w-[150px]"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <span className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${accent}1f`, color: accent }}>
        {icon}
      </span>
      <div>
        <div className="text-lg font-semibold leading-none text-ink">{value}</div>
        <div className="text-[10px] uppercase tracking-wider text-ink/40 mt-1">{label}</div>
      </div>
    </div>
  );
}

function VesselGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 16.5 12 20l9-3.5-2-6.5H5l-2 6.5Z" />
      <path d="M8 10V5h5l3 5" />
    </svg>
  );
}
function BellGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 16v-5a6 6 0 1 0-12 0v5l-1.5 2.5h15L18 16Z" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}
function GhostGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12a10 10 0 0 1 20 0" />
      <path d="M2 12v-1M22 12v-1" />
      <path d="M6 12h.01M12 12h.01M18 12h.01" />
    </svg>
  );
}
function FlagGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 21V4" />
      <path d="M5 4h13l-3 4 3 4H5" />
    </svg>
  );
}
