import * as turf from "@turf/turf";
import clsx from "clsx";
import { useMarintStore } from "../../lib/store";
import type { CorrelationDecision } from "../../lib/store";
import { formatCoord, formatDateTime } from "../../lib/format";
import type { DetectionData, MarintEvent, Vessel } from "../../types";

export default function CorrelationReview({ vessel, events }: { vessel: Vessel; events: MarintEvent[] }) {
  const decision = useMarintStore((s) => s.correlationDecisions[vessel.id]);
  const setCorrelationDecision = useMarintStore((s) => s.setCorrelationDecision);
  const revealDetection = useMarintStore((s) => s.revealDetection);

  const detectionEvent = events.find((e) => e.kind === "sar_detection" || e.kind === "optical_detection");
  const correlationEvent = events.find((e) => e.kind === "correlation_failed");
  if (!detectionEvent) return null;

  const d = detectionEvent.data as unknown as DetectionData;
  const aisPos = vessel.current ? { lat: vessel.current.lat, lon: vessel.current.lon } : null;
  const matchConfidence = correlationEvent
    ? (correlationEvent.data as { ais_match_confidence: number }).ais_match_confidence
    : 0.92;
  const status =
    matchConfidence < 0.5 ? { label: "Uncorrelated — no AIS match", color: "#e8794c" } :
    matchConfidence < 0.75 ? { label: "Partial match", color: "#e0b34c" } :
    { label: "Matched", color: "#39c2a0" };

  const distanceKm = aisPos
    ? turf.distance(turf.point([aisPos.lon, aisPos.lat]), turf.point([d.position.lon, d.position.lat]), { units: "kilometers" })
    : null;

  return (
    <section>
      <h2 className="text-[11px] uppercase tracking-wider text-ink/40 mb-2.5">Correlation review</h2>
      <div className="bg-surface-1 border border-hairline rounded-lg p-4 space-y-3.5 text-[12px]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium px-2 py-1 rounded-md" style={{ background: `${status.color}22`, color: status.color }}>
            {status.label}
          </span>
          <span className="text-ink/40 text-[11px]">{Math.round(matchConfidence * 100)}% AIS match confidence</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-ink/35 uppercase tracking-wider text-[10px]">Last AIS position</div>
            {aisPos ? (
              <>
                <div className="text-ink/85 mt-0.5">{formatCoord(aisPos.lat, aisPos.lon)}</div>
                <div className="text-ink/35 text-[10.5px]">{vessel.current ? formatDateTime(vessel.current.ts) : ""}</div>
              </>
            ) : (
              <div className="text-ink/50 mt-0.5">No active AIS</div>
            )}
          </div>
          <div>
            <div className="text-ink/35 uppercase tracking-wider text-[10px]">{d.sensor_type} detection</div>
            <div className="text-ink/85 mt-0.5">{formatCoord(d.position.lat, d.position.lon)}</div>
            <div className="text-ink/35 text-[10.5px]">{formatDateTime(detectionEvent.ts)}</div>
          </div>
        </div>

        {distanceKm !== null && (
          <div className="text-[11px] text-ink/50">Offset from predicted AIS position: ~{distanceKm.toFixed(1)} km</div>
        )}

        <button onClick={() => revealDetection(detectionEvent.id, vessel.id)} className="text-cyan hover:text-cyan-light text-[11px] font-medium">
          View on map →
        </button>

        <div className="pt-3 border-t border-hairline">
          <div className="text-ink/35 uppercase tracking-wider text-[10px] mb-2">Analyst decision</div>
          <div className="flex gap-1.5">
            <DecisionButton active={decision === "confirmed"} activeColor="#39c2a0" onClick={() => setCorrelationDecision(vessel.id, "confirmed")}>
              Confirm correlation
            </DecisionButton>
            <DecisionButton active={decision === "rejected"} activeColor="#e8794c" onClick={() => setCorrelationDecision(vessel.id, "rejected")}>
              Reject correlation
            </DecisionButton>
            <DecisionButton active={decision === "needs_review"} activeColor="#e0b34c" onClick={() => setCorrelationDecision(vessel.id, "needs_review")}>
              Needs review
            </DecisionButton>
          </div>
          {decision && <DecisionNote decision={decision} />}
        </div>
      </div>
    </section>
  );
}

function DecisionNote({ decision }: { decision: CorrelationDecision }) {
  const text =
    decision === "confirmed" ? "Analyst confirmed this detection as the flagged vessel." :
    decision === "rejected" ? "Analyst rejected this correlation — likely a different vessel." :
    "Flagged for further review — not yet resolved.";
  return <div className="text-ink/40 text-[11px] mt-2 leading-relaxed">{text} Saved locally to this workstation.</div>;
}

function DecisionButton({
  active, activeColor, onClick, children,
}: { active: boolean; activeColor: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex-1 text-[10.5px] font-medium px-2 py-1.5 rounded-md border transition-colors leading-tight",
        !active && "border-hairline text-ink/50"
      )}
      style={active ? { background: `${activeColor}22`, color: activeColor, borderColor: `${activeColor}55` } : undefined}
    >
      {children}
    </button>
  );
}
