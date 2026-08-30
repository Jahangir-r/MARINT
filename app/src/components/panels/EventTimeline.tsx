import { useMarintStore } from "../../lib/store";
import { formatClock, riskBandColor } from "../../lib/format";
import type { MarintEvent } from "../../types";

export default function EventTimeline({ events }: { events: MarintEvent[] }) {
  const vesselById = useMarintStore((s) => s.vesselById);
  if (events.length === 0) return <p className="text-ink/40">No recorded events for this vessel.</p>;

  const sorted = [...events].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  return (
    <div className="relative pl-4">
      <div className="absolute left-[5px] top-1 bottom-1 w-px bg-hairline" />
      <div className="space-y-4">
        {sorted.map((e) => {
          const related = e.related_vessel_id ? vesselById(e.related_vessel_id) : undefined;
          return (
            <div key={e.id} className="relative">
              <span
                className="absolute -left-4 top-1 h-2.5 w-2.5 rounded-full border-2 border-surface-1"
                style={{ background: e.severity ? riskBandColor(e.severity) : "#4c6b85" }}
              />
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-ink/85 font-medium">{e.title}</span>
                <span className="text-ink/35 text-[11px] shrink-0 font-mono">{formatClock(e.ts)}</span>
              </div>
              <p className="text-ink/50 text-[12px] mt-0.5 leading-relaxed">{e.description}</p>
              {related && <p className="text-ink/35 text-[11px] mt-0.5">Related vessel: {related.name}</p>}
              <EventEvidence event={e} />
              <EventActions event={e} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventEvidence({ event }: { event: MarintEvent }) {
  const d = event.data as Record<string, unknown>;
  if (!d || Object.keys(d).length === 0) return null;

  if (event.kind === "sar_detection" || event.kind === "optical_detection") {
    const data = d as { estimated_length_m: number; estimated_heading_deg: number; confidence: number; source: string; sensor_type: string; detected_targets: number };
    return (
      <div className="mt-2 grid grid-cols-3 gap-2 rounded-md bg-surface-2 p-2 text-[11px]">
        <Ev label="Est. length" value={`${data.estimated_length_m} m`} />
        <Ev label="Est. heading" value={`${Math.round(data.estimated_heading_deg)}°`} />
        <Ev label="Confidence" value={`${Math.round(data.confidence * 100)}%`} />
        <div className="col-span-3 text-ink/35">{data.source}</div>
      </div>
    );
  }
  if (event.kind === "correlation_failed") {
    const data = d as { ais_match_confidence: number };
    return (
      <div className="mt-2 rounded-md bg-surface-2 p-2 text-[11px]">
        <Ev label="AIS match confidence" value={`${Math.round(data.ais_match_confidence * 100)}%`} bar={data.ais_match_confidence} />
      </div>
    );
  }
  if (event.kind === "ais_position_jump") {
    const data = d as { implied_speed_kn: number };
    return (
      <div className="mt-2 rounded-md bg-surface-2 p-2 text-[11px]">
        <Ev label="Implied speed" value={`${data.implied_speed_kn} kn`} />
      </div>
    );
  }
  if (event.kind === "loitering_detected") {
    const data = d as { duration_hours: number; avg_speed_kn: number };
    return (
      <div className="mt-2 grid grid-cols-2 gap-2 rounded-md bg-surface-2 p-2 text-[11px]">
        <Ev label="Duration" value={`${data.duration_hours} h`} />
        <Ev label="Avg. speed" value={`${data.avg_speed_kn} kn`} />
      </div>
    );
  }
  if (event.kind === "route_deviation") {
    const data = d as { expected_destination: string; deviation_bearing_change_deg: number };
    return (
      <div className="mt-2 grid grid-cols-2 gap-2 rounded-md bg-surface-2 p-2 text-[11px]">
        <Ev label="Expected destination" value={data.expected_destination} />
        <Ev label="Bearing change" value={`${data.deviation_bearing_change_deg}°`} />
      </div>
    );
  }
  if (event.kind === "restricted_area_entry") {
    const data = d as { zone_name: string };
    return (
      <div className="mt-2 rounded-md bg-surface-2 p-2 text-[11px]">
        <Ev label="Zone" value={data.zone_name} />
      </div>
    );
  }
  if (event.kind === "ship_to_ship_end") {
    const data = d as { duration_hours: number };
    return (
      <div className="mt-2 rounded-md bg-surface-2 p-2 text-[11px]">
        <Ev label="Duration in close proximity" value={`${data.duration_hours} h`} />
      </div>
    );
  }
  return null;
}

function EventActions({ event }: { event: MarintEvent }) {
  const revealDetection = useMarintStore((s) => s.revealDetection);
  const primaryDetectionEvent = useMarintStore((s) => s.primaryDetectionEvent);

  if (event.kind === "sar_detection" || event.kind === "optical_detection") {
    return (
      <button
        onClick={() => revealDetection(event.id, event.vessel_id)}
        className="mt-2 text-[11px] text-cyan hover:text-cyan-light font-medium"
      >
        View footprint on map →
      </button>
    );
  }
  if (event.kind === "dark_vessel_alert") {
    return (
      <button
        onClick={() => {
          const det = primaryDetectionEvent(event.vessel_id);
          if (det) revealDetection(det.id, event.vessel_id);
        }}
        className="mt-2 text-[11px] text-cyan hover:text-cyan-light font-medium"
      >
        View supporting evidence →
      </button>
    );
  }
  return null;
}

function Ev({ label, value, bar }: { label: string; value: string; bar?: number }) {
  return (
    <div>
      <div className="text-ink/35 uppercase tracking-wider text-[10px]">{label}</div>
      <div className="text-ink/80 mt-0.5">{value}</div>
      {bar !== undefined && (
        <div className="h-1 w-full bg-hairline rounded-full mt-1 overflow-hidden">
          <div className="h-full bg-status-dark-vessel" style={{ width: `${bar * 100}%` }} />
        </div>
      )}
    </div>
  );
}
