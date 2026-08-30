import type { MarintEvent, RiskFactor, TrackPoint, Vessel, VesselCurrent } from "../types";

/** Interpolated (or held) vessel state at an arbitrary playback time. */
export function stateAtTime(track: TrackPoint[] | undefined, timeMs: number): VesselCurrent | null {
  if (!track || track.length === 0) return null;
  const firstMs = new Date(track[0].ts).getTime();
  const lastMs = new Date(track[track.length - 1].ts).getTime();

  if (timeMs <= firstMs) return toCurrent(track[0]);
  if (timeMs >= lastMs) return toCurrent(track[track.length - 1]);

  let lo = 0, hi = track.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (new Date(track[mid].ts).getTime() <= timeMs) lo = mid;
    else hi = mid;
  }
  const a = track[lo], b = track[hi];
  const aMs = new Date(a.ts).getTime(), bMs = new Date(b.ts).getTime();
  const f = bMs === aMs ? 0 : (timeMs - aMs) / (bMs - aMs);
  return {
    lat: a.lat + (b.lat - a.lat) * f,
    lon: a.lon + (b.lon - a.lon) * f,
    sog: a.sog + (b.sog - a.sog) * f,
    cog: a.cog ?? b.cog,
    heading: a.heading ?? b.heading,
    nav_status: a.nav_status,
    ts: new Date(timeMs).toISOString(),
    ais_active: true,
  };
}
function toCurrent(p: TrackPoint): VesselCurrent {
  return { lat: p.lat, lon: p.lon, sog: p.sog, cog: p.cog, heading: p.heading, nav_status: p.nav_status, ts: p.ts, ais_active: true };
}

/** The vessel's track up to (and including an interpolated point at)
 * timeMs — never the future portion. */
export function trackUpToTime(track: TrackPoint[] | undefined, timeMs: number): TrackPoint[] {
  if (!track || track.length === 0) return [];
  const known = track.filter((p) => new Date(p.ts).getTime() <= timeMs);
  const last = known[known.length - 1];
  if (last && new Date(last.ts).getTime() === timeMs) return known;
  const interpolated = stateAtTime(track, timeMs);
  if (!interpolated) return known;
  return [...known, { ts: interpolated.ts, lat: interpolated.lat, lon: interpolated.lon, sog: interpolated.sog, cog: interpolated.cog, heading: interpolated.heading, nav_status: interpolated.nav_status }];
}

// Never show more than this much trail for a vessel that never has a clean
// "departure" transition in view (a continuously-looping tug/patrol/fishing
// vessel) — a full multi-day loop history is still visual clutter even
// though it isn't a land crossing or a port-to-port zig-zag.
const MAX_VOYAGE_LOOKBACK_MS = 24 * 3600000;

/** The vessel's CURRENT voyage only — from its most recent departure (the
 * last Moored -> underway transition at or before timeMs) up to timeMs.
 * A completed port-to-port leg is deliberately dropped the moment the next
 * voyage begins, so the map never shows two different legs stitched into
 * one line (which reads as a fake back-and-forth route) — history isn't
 * lost, it's just not accumulated into the live "current route" display.
 */
export function currentVoyageSegment(track: TrackPoint[] | undefined, timeMs: number): TrackPoint[] {
  const upToTime = trackUpToTime(track, timeMs);
  if (upToTime.length === 0) return upToTime;
  let startIdx = 0;
  for (let i = upToTime.length - 1; i > 0; i--) {
    if (upToTime[i - 1].nav_status === "Moored" && upToTime[i].nav_status !== "Moored") {
      startIdx = i - 1;
      break;
    }
  }
  const cutoffMs = timeMs - MAX_VOYAGE_LOOKBACK_MS;
  while (startIdx < upToTime.length - 1 && new Date(upToTime[startIdx].ts).getTime() < cutoffMs) startIdx++;
  return upToTime.slice(startIdx);
}

/** Whether AIS is transmitting at timeMs: true unless this vessel's track
 * ends (an AIS gap, not just "ran out of samples") before timeMs and its
 * scenario is the dark-vessel one — every other track is kept moored/
 * sampled through to the window end, so this only ever fires for that case. */
export function aisActiveAtTime(vessel: Vessel, track: TrackPoint[] | undefined, timeMs: number): boolean {
  if (!track || track.length === 0) return false;
  const lastMs = new Date(track[track.length - 1].ts).getTime();
  if (timeMs <= lastMs) return true;
  return vessel.scenario !== "dark_vessel";
}

// Mirrors FACTORS in _tools/data/generate.mjs — keep deltas/labels in sync.
const FACTORS: Record<string, { label: string; delta: number }> = {
  baseline: { label: "Baseline operational uncertainty", delta: 5 },
  ais_gap: { label: "AIS transmission gap", delta: 25 },
  sar_uncorrelated: { label: "Uncorrelated satellite (SAR) detection", delta: 20 },
  optical_corroboration: { label: "Optical corroboration of uncorrelated SAR detection", delta: 15 },
  ais_position_jump: { label: "Impossible position jump between AIS reports", delta: 24 },
  ship_to_ship: { label: "Possible ship-to-ship activity", delta: 14 },
  loitering: { label: "Prolonged offshore loitering away from normal traffic patterns", delta: 18 },
  route_deviation: { label: "Unexpected deviation from expected route corridor", delta: 20 },
  restricted_area: { label: "Activity inside a designated restricted/protected zone", delta: 16 },
};
// Event kind -> the risk factor it contributes, once it has occurred.
const EVENT_KIND_TO_FACTOR: Record<string, string> = {
  ais_gap: "ais_gap",
  correlation_failed: "sar_uncorrelated",
  optical_detection: "optical_corroboration",
  ais_position_jump: "ais_position_jump",
  ship_to_ship_start: "ship_to_ship",
  loitering_detected: "loitering",
  route_deviation: "route_deviation",
  restricted_area_entry: "restricted_area",
};
function riskBandOf(score: number): { code: Vessel["risk_band"]; label: string } {
  if (score >= 70) return { code: "critical", label: "Critical" };
  if (score >= 45) return { code: "elevated", label: "Elevated" };
  if (score >= 15) return { code: "watch", label: "Watch" };
  return { code: "low", label: "Low" };
}

export interface RiskAtTime {
  risk_score: number;
  risk_band: Vessel["risk_band"];
  risk_band_label: string;
  risk_factors: RiskFactor[];
}
/** Recomputes risk from only the events that have happened by timeMs — the
 * same accumulation generate.mjs uses for the final score, just replayed up
 * to an arbitrary point instead of to the end of the window. */
export function riskAtTime(vesselId: string, allEvents: MarintEvent[], timeMs: number): RiskAtTime {
  const codes = new Set<string>();
  for (const e of allEvents) {
    if (e.vessel_id !== vesselId && e.related_vessel_id !== vesselId) continue;
    if (new Date(e.ts).getTime() > timeMs) continue;
    const code = EVENT_KIND_TO_FACTOR[e.kind];
    if (code) codes.add(code);
  }
  const factors: RiskFactor[] = ["baseline", ...codes].map((code) => ({ code, ...FACTORS[code] }));
  const score = Math.max(0, Math.min(100, factors.reduce((s, f) => s + f.delta, 0)));
  const band = riskBandOf(score);
  return { risk_score: score, risk_band: band.code, risk_band_label: band.label, risk_factors: factors };
}

/** A vessel snapshot as it would have appeared at timeMs — same shape as
 * Vessel, with current/risk fields replaced by their time-derived values. */
export function vesselAtTime(vessel: Vessel, track: TrackPoint[] | undefined, allEvents: MarintEvent[], timeMs: number): Vessel {
  const state = stateAtTime(track, timeMs);
  const risk = riskAtTime(vessel.id, allEvents, timeMs);
  return {
    ...vessel,
    ...risk,
    current: state ? { ...state, ais_active: aisActiveAtTime(vessel, track, timeMs) } : null,
  };
}
