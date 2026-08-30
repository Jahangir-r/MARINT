import { useMarintStore } from "../../lib/store";
import { formatDateTime } from "../../lib/format";
import SatelliteChip from "./SatelliteChip";
import type { DetectionData, MarintEvent } from "../../types";

export default function SatelliteEvidence({ events }: { events: MarintEvent[] }) {
  const revealDetection = useMarintStore((s) => s.revealDetection);
  const detections = events.filter((e) => e.kind === "sar_detection" || e.kind === "optical_detection");
  if (detections.length === 0) return null;

  return (
    <section>
      <h2 className="text-[11px] uppercase tracking-wider text-ink/40 mb-2.5">Satellite observations</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {detections.map((e) => {
          const d = e.data as unknown as DetectionData;
          const isSar = d.sensor_type === "SAR";
          return (
            <div key={e.id} className="bg-surface-1 border border-hairline rounded-lg overflow-hidden">
              <SatelliteChip sensorType={d.sensor_type} headingDeg={d.estimated_heading_deg} lengthM={d.estimated_length_m} seedKey={e.id} />
              <div className="p-3 text-[12px] space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium" style={{ color: isSar ? "#c98ae8" : "#39c2a0" }}>
                    {d.sensor_type} detection
                  </span>
                  <span className="text-ink/35 text-[10.5px] font-mono shrink-0">{formatDateTime(e.ts)}</span>
                </div>
                <div className="text-ink/45 text-[11px] leading-snug">{d.source}</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1">
                  <Field label="Confidence" value={`${Math.round(d.confidence * 100)}%`} />
                  <Field label="Est. length" value={`${d.estimated_length_m} m`} />
                  <Field label="Est. heading" value={`${Math.round(d.estimated_heading_deg)}°`} />
                  <Field label="Targets" value={String(d.detected_targets)} />
                </div>
              </div>
              <button
                onClick={() => revealDetection(e.id, e.vessel_id)}
                className="w-full text-[11px] font-medium text-cyan hover:text-cyan-light py-2 border-t border-hairline hover:bg-ink/[0.03] transition-colors"
              >
                View footprint on map →
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-ink/35 uppercase tracking-wider text-[9.5px]">{label}</div>
      <div className="text-ink/80">{value}</div>
    </div>
  );
}
