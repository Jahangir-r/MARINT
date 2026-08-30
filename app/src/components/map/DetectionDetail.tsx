import { useMarintStore } from "../../lib/store";
import { formatDateTime } from "../../lib/format";
import SatelliteChip from "../investigation/SatelliteChip";
import type { DetectionData } from "../../types";

export default function DetectionDetail() {
  const eventId = useMarintStore((s) => s.selectedDetectionEventId);
  const event = useMarintStore((s) => s.events.find((e) => e.id === eventId));
  const vessel = useMarintStore((s) => (event ? s.vesselById(event.vessel_id) : undefined));
  const selectDetection = useMarintStore((s) => s.selectDetection);
  const effectiveTimeMs = useMarintStore((s) => s.effectiveTimeMs());

  // Never show a detection that, at the current playback time, hasn't
  // actually been acquired yet — scrubbing backward past it should close it.
  if (!event || new Date(event.ts).getTime() > effectiveTimeMs) return null;
  const d = event.data as unknown as DetectionData;
  const isSar = d.sensor_type === "SAR";

  return (
    <div className="absolute top-20 right-3 z-10 w-72 bg-surface-1/95 border border-hairline rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-soft)" }}>
      <div
        className="px-3.5 py-2.5 flex items-center justify-between border-b border-hairline"
        style={{ background: isSar ? "rgba(183,84,224,0.12)" : "rgba(57,194,160,0.12)" }}
      >
        <span className="text-[12px] font-medium" style={{ color: isSar ? "#c98ae8" : "#39c2a0" }}>
          {d.sensor_type} Detection
        </span>
        <button onClick={() => selectDetection(null)} className="text-ink/40 hover:text-ink text-sm leading-none">×</button>
      </div>
      <SatelliteChip sensorType={d.sensor_type} headingDeg={d.estimated_heading_deg} lengthM={d.estimated_length_m} seedKey={event.id} className="h-24 w-full rounded-none border-0 border-b border-hairline" />
      <div className="p-3.5 space-y-2.5 text-[12px]">
        {vessel && <div className="text-ink/70">Associated vessel: <span className="text-ink/90 font-medium">{vessel.name}</span></div>}
        <Row label="Source" value={d.source} />
        <Row label="Acquisition time" value={formatDateTime(event.ts)} />
        <Row label="Sensor type" value={d.sensor_type} />
        <Row label="Confidence" value={`${Math.round(d.confidence * 100)}%`} />
        <Row label="Detected targets" value={String(d.detected_targets)} />
        <Row label="Est. object length" value={`${d.estimated_length_m} m`} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-ink/40 uppercase tracking-wider text-[10px]">{label}</span>
      <span className="text-ink/85 text-right">{value}</span>
    </div>
  );
}
