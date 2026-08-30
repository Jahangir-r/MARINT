import * as turf from "@turf/turf";
import type { FeatureCollection, Point, LineString, Polygon } from "geojson";
import type { DetectionData, MarintEvent, TrackPoint, Vessel, VesselCurrent } from "../types";

const DETECTION_KINDS = ["sar_detection", "optical_detection"];

// Short-horizon dead-reckoning from a vessel's current course/speed — used
// both for the dashed extrapolated-path preview and for the subtle live
// marker drift. Deliberately conservative: null (no projection) unless AIS
// is actually active with a known course and the vessel is genuinely
// underway, so a moored, dark, or drifting-with-no-heading vessel is never
// extrapolated into a misleading projected line.
export function projectForward(current: VesselCurrent | null | undefined, minutesForward: number): [number, number] | null {
  if (!current || !current.ais_active || current.cog === null || current.sog < 1 || minutesForward <= 0) return null;
  const distanceKm = current.sog * 1.852 * (minutesForward / 60);
  if (distanceKm < 0.05) return null;
  const dest = turf.destination([current.lon, current.lat], distanceKm, current.cog, { units: "kilometers" });
  return dest.geometry.coordinates as [number, number];
}

// A short, subtle dashed projection from the vessel's last confirmed
// position — visually distinct (dashed/low-opacity, styled in MapView) from
// the solid confirmed track, and capped short so it reads as a situational-
// awareness cue, never a long-range prediction.
export function extrapolatedPathGeoJSON(vessel: Vessel, horizonMinutes = 20): FeatureCollection<LineString> {
  const c = vessel.current;
  const dest = projectForward(c, horizonMinutes);
  if (!c || !dest) return { type: "FeatureCollection", features: [] };
  return {
    type: "FeatureCollection",
    features: [{ type: "Feature", geometry: { type: "LineString", coordinates: [[c.lon, c.lat], dest] }, properties: {} }],
  };
}

export function vesselsGeoJSON(vessels: Vessel[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: vessels
      .filter((v) => v.current)
      .map((v) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [v.current!.lon, v.current!.lat] },
        properties: {
          id: v.id,
          name: v.name,
          category: v.category,
          risk_band: v.risk_band,
          heading: v.current!.heading ?? v.current!.cog ?? 0,
          ais_active: v.current!.ais_active,
          scenario: v.scenario,
        },
      })),
  };
}

export function trackLineGeoJSON(points: TrackPoint[] | undefined): FeatureCollection<LineString> {
  if (!points || points.length < 2) return { type: "FeatureCollection", features: [] };
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "LineString", coordinates: points.map((p) => [p.lon, p.lat]) },
        properties: {},
      },
    ],
  };
}

export function trackPointsGeoJSON(points: TrackPoint[] | undefined): FeatureCollection<Point> {
  if (!points) return { type: "FeatureCollection", features: [] };
  return {
    type: "FeatureCollection",
    features: points.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lon, p.lat] },
      properties: { ts: p.ts, sog: p.sog, nav_status: p.nav_status },
    })),
  };
}

export function detectionsGeoJSON(events: MarintEvent[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: events
      .filter((e) => DETECTION_KINDS.includes(e.kind))
      .map((e) => {
        const data = e.data as unknown as DetectionData;
        return {
          type: "Feature",
          geometry: { type: "Point", coordinates: [data.position.lon, data.position.lat] },
          properties: {
            event_id: e.id,
            vessel_id: e.vessel_id,
            sensor_type: data.sensor_type,
            estimated_length_m: data.estimated_length_m,
            confidence: data.confidence,
            ts: e.ts,
          },
        };
      }),
  };
}

export function footprintsGeoJSON(events: MarintEvent[]): FeatureCollection<Polygon> {
  return {
    type: "FeatureCollection",
    features: events
      .filter((e) => DETECTION_KINDS.includes(e.kind))
      .map((e) => {
        const data = e.data as unknown as DetectionData;
        return {
          type: "Feature",
          geometry: data.footprint,
          properties: { event_id: e.id, vessel_id: e.vessel_id, sensor_type: data.sensor_type },
        };
      }),
  };
}

export function haloGeoJSON(vessels: Vessel[], vesselId: string | null): FeatureCollection<Point> {
  if (!vesselId) return { type: "FeatureCollection", features: [] };
  const v = vessels.find((v) => v.id === vesselId);
  if (!v?.current) return { type: "FeatureCollection", features: [] };
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [v.current.lon, v.current.lat] },
        properties: { risk_band: v.risk_band },
      },
    ],
  };
}

export function predictedPathGeoJSON(events: MarintEvent[], vesselId: string): FeatureCollection<LineString> {
  const gap = events.find((e) => e.vessel_id === vesselId && e.kind === "ais_gap");
  const det = events.find((e) => e.vessel_id === vesselId && e.kind === "sar_detection");
  if (!gap || !det) return { type: "FeatureCollection", features: [] };
  const gapData = gap.data as { last_position: { lat: number; lon: number } };
  const detData = det.data as { position: { lat: number; lon: number } };
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [gapData.last_position.lon, gapData.last_position.lat],
            [detData.position.lon, detData.position.lat],
          ],
        },
        properties: {},
      },
    ],
  };
}

export function shipToShipPointGeoJSON(events: MarintEvent[]): FeatureCollection<Point> {
  const ev = events.find((e) => e.kind === "ship_to_ship_start");
  if (!ev) return { type: "FeatureCollection", features: [] };
  const data = ev.data as { location: { lat: number; lon: number } };
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [data.location.lon, data.location.lat] },
        properties: { event_id: ev.id },
      },
    ],
  };
}
