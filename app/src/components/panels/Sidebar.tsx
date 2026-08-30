import { useMemo, useState } from "react";
import clsx from "clsx";
import { useMarintStore } from "../../lib/store";
import { countryName, formatTimeAgo, riskBandColor } from "../../lib/format";
import { vesselAtTime } from "../../lib/playback";
import type { Vessel } from "../../types";

type Tab = "vessels" | "alerts";

const RISK_ORDER: Record<string, number> = { critical: 0, elevated: 1, watch: 2, low: 3 };

export default function Sidebar() {
  const [tab, setTab] = useState<Tab>("alerts");
  const vessels = useMarintStore((s) => s.vessels);
  const tracks = useMarintStore((s) => s.tracks);
  const rawEvents = useMarintStore((s) => s.events);
  const demoNow = useMarintStore((s) => s.demoNow);
  const effectiveTimeMs = useMarintStore((s) => s.effectiveTimeMs());
  const selectedVesselId = useMarintStore((s) => s.selectedVesselId);
  const selectVessel = useMarintStore((s) => s.selectVessel);

  // Risk badges, sort order, and the alerts list all reflect only what
  // MARINT would have known at the current playback (or live) time.
  const timeVessels = useMemo(
    () => vessels.map((v) => vesselAtTime(v, tracks[v.id], rawEvents, effectiveTimeMs)),
    [vessels, tracks, rawEvents, effectiveTimeMs]
  );
  const events = useMemo(() => rawEvents.filter((e) => new Date(e.ts).getTime() <= effectiveTimeMs), [rawEvents, effectiveTimeMs]);

  const sortedVessels = useMemo(
    () => [...timeVessels].sort((a, b) => (RISK_ORDER[a.risk_band] ?? 9) - (RISK_ORDER[b.risk_band] ?? 9) || b.risk_score - a.risk_score),
    [timeVessels]
  );

  const alerts = useMemo(
    () => [...events].filter((e) => e.severity).sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()),
    [events]
  );

  return (
    <aside className="w-[320px] shrink-0 border-r border-hairline bg-surface-1 flex flex-col">
      <div className="flex gap-1 border-b border-hairline text-sm p-2 bg-surface-2/60">
        <button
          onClick={() => setTab("alerts")}
          className={clsx(
            "flex-1 py-2 rounded-lg font-medium transition-colors",
            tab === "alerts" ? "bg-surface-1 text-ink shadow-sm" : "text-ink/45 hover:text-ink/70"
          )}
        >
          Alerts <span className="text-ink/35">({alerts.length})</span>
        </button>
        <button
          onClick={() => setTab("vessels")}
          className={clsx(
            "flex-1 py-2 rounded-lg font-medium transition-colors",
            tab === "vessels" ? "bg-surface-1 text-ink shadow-sm" : "text-ink/45 hover:text-ink/70"
          )}
        >
          Vessels <span className="text-ink/35">({vessels.length})</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "vessels" &&
          sortedVessels.map((v) => <VesselRow key={v.id} v={v} active={v.id === selectedVesselId} onClick={() => selectVessel(v.id)} />)}

        {tab === "alerts" &&
          alerts.map((e) => {
            const v = timeVessels.find((v) => v.id === e.vessel_id);
            return (
              <button
                key={e.id}
                onClick={() => selectVessel(e.vessel_id)}
                className={clsx(
                  "w-full text-left px-4 py-3 border-b border-hairline/60 hover:bg-ink/[0.03]",
                  e.vessel_id === selectedVesselId && "bg-ink/[0.05]"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: riskBandColor(e.severity ?? "low") }} />
                  <span className="text-[13px] font-medium text-ink/90 flex-1 truncate">{e.title}</span>
                </div>
                <div className="text-[11px] text-ink/40 flex items-center gap-1.5">
                  <span>{v?.name ?? "—"}</span>
                  <span>·</span>
                  <span>{demoNow ? formatTimeAgo(e.ts, demoNow) : ""}</span>
                </div>
              </button>
            );
          })}
        {tab === "alerts" && alerts.length === 0 && (
          <div className="p-4 text-sm text-ink/40">No alerts in the current window.</div>
        )}
      </div>
    </aside>
  );
}

function VesselRow({ v, active, onClick }: { v: Vessel; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx("w-full text-left px-4 py-2.5 border-b border-hairline/60 hover:bg-ink/[0.03] flex items-center gap-3", active && "bg-ink/[0.05]")}
    >
      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: riskBandColor(v.risk_band) }} />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-ink/90 truncate">{v.name}</div>
        <div className="text-[11px] text-ink/40 truncate">
          {v.type_label} · {countryName(v.flag)}
        </div>
      </div>
      <div className="text-[11px] text-ink/50 shrink-0">{v.current ? `${v.current.sog.toFixed(1)} kn` : "—"}</div>
    </button>
  );
}
