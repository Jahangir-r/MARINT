import { AttributionControl, config, Map as MLMap, NavigationControl, type ExpressionSpecification, type GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";

// MapLibre's own worker-URL auto-detection is unreliable once bundled by
// Rollup for production (the worker chunk either doesn't get emitted, or its
// internal relative import of maplibre-gl-shared.mjs 404s and silently kills
// the worker — no visible error, the map just never renders anything past
// the background layer). Both files are vendored as static assets in
// public/maplibre/ (copied from node_modules/maplibre-gl/dist/) so they load
// from a stable, unhashed path in dev and production alike. Re-copy them if
// maplibre-gl is ever upgraded.
config.WORKER_URL = "/maplibre/maplibre-gl-worker.mjs";
import { useMarintStore } from "../../lib/store";
import { applyMapTheme, buildBaseStyle } from "../../lib/mapStyle";
import { useTheme } from "../../lib/theme";
import { detectionDiamondIcon, ringIcon, vesselArrowIcon } from "../../lib/mapIcons";
import {
  detectionsGeoJSON,
  extrapolatedPathGeoJSON,
  footprintsGeoJSON,
  haloGeoJSON,
  predictedPathGeoJSON,
  projectForward,
  shipToShipPointGeoJSON,
  trackLineGeoJSON,
  vesselsGeoJSON,
} from "../../lib/mapData";
import { currentVoyageSegment, vesselAtTime } from "../../lib/playback";
import * as turf from "@turf/turf";
import { CASPIAN_CENTER, CASPIAN_ZOOM } from "../../lib/mapConstants";

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const vessels = useMarintStore((s) => s.vessels);
  const rawEvents = useMarintStore((s) => s.events);
  const tracks = useMarintStore((s) => s.tracks);
  const effectiveTimeMs = useMarintStore((s) => s.effectiveTimeMs());
  const isLive = useMarintStore((s) => s.isLive());
  const selectedVesselId = useMarintStore((s) => s.selectedVesselId);
  const hoveredVesselId = useMarintStore((s) => s.hoveredVesselId);
  const selectedDetectionEventId = useMarintStore((s) => s.selectedDetectionEventId);
  const layers = useMarintStore((s) => s.layers);
  const selectVessel = useMarintStore((s) => s.selectVessel);
  const hoverVessel = useMarintStore((s) => s.hoverVessel);
  const selectDetection = useMarintStore((s) => s.selectDetection);
  const setMapInstance = useMarintStore((s) => s.setMapInstance);
  const [theme] = useTheme();
  const themeRef = useRef(theme);
  themeRef.current = theme;

  // Playback-adjusted view of the fleet: positions interpolated to the
  // current playback (or live) time, risk recomputed from only the events
  // known by then, and detections/footprints that haven't happened yet at
  // that time simply not shown — the map always reflects "what MARINT knew
  // at time T", never future evidence.
  const events = useMemo(() => rawEvents.filter((e) => new Date(e.ts).getTime() <= effectiveTimeMs), [rawEvents, effectiveTimeMs]);

  // LIVE mode has no ticking clock of its own — demoNow is a fixed baked-in
  // instant, so without this every marker would sit frozen forever. This
  // advances a small simulated-time offset, driven by (accelerated) real
  // time and capped so a long-open tab doesn't drift into an unrealistic
  // distance, purely for rendering — dead-reckoned from each vessel's own
  // last confirmed course/speed, never touching the actual timeline/risk/
  // alerts/evidence logic above, which all stay pinned to the exact
  // effectiveTimeMs instant. The accelerated rate (rather than true 1:1) is
  // deliberate: at a real vessel's actual speed, one real second of drift is
  // sub-pixel on a Caspian-wide view — imperceptible, not "alive". This
  // still stays well within realistic AIS-report cadence (a few simulated
  // minutes of drift over the course of a session), just compressed enough
  // to actually be seen.
  const LIVE_DRIFT_RATE = 6; // 1 real second -> 6 simulated seconds
  const LIVE_DRIFT_CAP_MIN = 20;
  const [liveDriftMs, setLiveDriftMs] = useState(0);
  useEffect(() => {
    if (!isLive) {
      setLiveDriftMs(0);
      return;
    }
    const startedAt = performance.now();
    const id = setInterval(() => {
      const simulatedMs = (performance.now() - startedAt) * LIVE_DRIFT_RATE;
      setLiveDriftMs(Math.min(simulatedMs, LIVE_DRIFT_CAP_MIN * 60000));
    }, 1000);
    return () => clearInterval(id);
  }, [isLive]);

  const timeVessels = useMemo(() => {
    const base = vessels.map((v) => vesselAtTime(v, tracks[v.id], rawEvents, effectiveTimeMs));
    if (!isLive || liveDriftMs <= 0) return base;
    const driftMinutes = liveDriftMs / 60000;
    return base.map((v) => {
      const dest = projectForward(v.current, driftMinutes);
      if (!v.current || !dest) return v;
      return { ...v, current: { ...v.current, lon: dest[0], lat: dest[1] } };
    });
  }, [vessels, tracks, rawEvents, effectiveTimeMs, isLive, liveDriftMs]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new MLMap({
      container: containerRef.current,
      style: buildBaseStyle(themeRef.current),
      center: CASPIAN_CENTER,
      zoom: CASPIAN_ZOOM,
      minZoom: 1.4,
      maxZoom: 12,
      attributionControl: false,
    });
    mapRef.current = map;
    map.on("error", (e) => console.error("Map error:", e.error?.message));
    map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new AttributionControl({ compact: true, customAttribution: "Geographic data © Natural Earth (public domain)" }), "bottom-right");

    map.on("load", () => {
      map.addImage("vessel-arrow", vesselArrowIcon(), { sdf: true });
      map.addImage("detection-diamond", detectionDiamondIcon(), { sdf: true });
      map.addImage("ring", ringIcon(), { sdf: true });

      map.addSource("vessels", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("selected-track", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("predicted-path", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("extrapolated-path", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("detections", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("footprints", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("ship-to-ship", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("halo-selected", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("halo-hover", { type: "geojson", data: { type: "FeatureCollection", features: [] } });

      map.addLayer({
        id: "predicted-path-line",
        type: "line",
        source: "predicted-path",
        paint: { "line-color": "#b754e0", "line-width": 1.6, "line-dasharray": [1, 1.6] },
      });
      map.addLayer({
        id: "selected-track-line",
        type: "line",
        source: "selected-track",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#2fa7d6", "line-width": 2.2, "line-opacity": 0.85 },
      });
      // Short-horizon dead-reckoning preview — visually subordinate to the
      // confirmed track (thinner, dashed, lower opacity) so it can never be
      // mistaken for actual traveled route.
      map.addLayer({
        id: "extrapolated-path-line",
        type: "line",
        source: "extrapolated-path",
        layout: { "line-cap": "round" },
        paint: { "line-color": "#2fa7d6", "line-width": 1.4, "line-opacity": 0.45, "line-dasharray": [1, 1.6] },
      });
      const footprintColor: ExpressionSpecification = [
        "match", ["get", "sensor_type"],
        "SAR", "#b754e0",
        "Optical", "#39c2a0",
        "#b754e0",
      ];
      map.addLayer({
        id: "footprint-fill",
        type: "fill",
        source: "footprints",
        paint: { "fill-color": footprintColor, "fill-opacity": 0.1 },
      });
      map.addLayer({
        id: "footprint-outline",
        type: "line",
        source: "footprints",
        paint: { "line-color": footprintColor, "line-width": 1, "line-opacity": 0.55, "line-dasharray": [3, 2] },
      });
      map.addLayer({
        id: "footprint-selected-outline",
        type: "line",
        source: "footprints",
        filter: ["==", ["get", "event_id"], "__none__"],
        paint: { "line-color": footprintColor, "line-width": 2.2, "line-opacity": 0.95 },
      });
      map.addLayer({
        id: "ship-to-ship-ring",
        type: "symbol",
        source: "ship-to-ship",
        layout: { "icon-image": "ring", "icon-size": 1.6, "icon-allow-overlap": true },
        paint: { "icon-color": "#e0a530" },
      });
      map.addLayer({
        id: "detection-points",
        type: "symbol",
        source: "detections",
        layout: { "icon-image": "detection-diamond", "icon-size": 0.9, "icon-allow-overlap": true, "icon-ignore-placement": true },
        paint: {
          "icon-color": ["match", ["get", "sensor_type"], "SAR", "#b754e0", "Optical", "#39c2a0", "#b754e0"],
        },
      });
      map.addLayer({
        id: "halo-selected",
        type: "circle",
        source: "halo-selected",
        paint: {
          "circle-radius": 13,
          "circle-color": "transparent",
          "circle-stroke-width": 2,
          "circle-stroke-color": [
            "match", ["get", "risk_band"],
            "elevated", "#e07a3f", "critical", "#e0483f", "watch", "#e0a530",
            "#2fa7d6",
          ],
          "circle-stroke-opacity": 0.9,
        },
      });
      map.addLayer({
        id: "halo-hover",
        type: "circle",
        source: "halo-hover",
        paint: { "circle-radius": 9, "circle-color": "transparent", "circle-stroke-width": 1.4, "circle-stroke-color": themeRef.current === "light" ? "#0f3a57" : "#ffffff", "circle-stroke-opacity": 0.55 },
      });
      map.addLayer({
        id: "vessel-points",
        type: "symbol",
        source: "vessels",
        layout: {
          "icon-image": "vessel-arrow",
          "icon-size": ["interpolate", ["linear"], ["zoom"], 4, 0.62, 8, 1.05],
          "icon-rotate": ["get", "heading"],
          "icon-rotation-alignment": "map",
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
        paint: {
          // Risk-driven color, matching the legend exactly: normal traffic reads
          // as one calm color so a minority of flagged vessels actually stand out.
          "icon-color": [
            "match", ["get", "risk_band"],
            "critical", "#e0483f",
            "elevated", "#e07a3f",
            "watch", "#e0a530",
            "#2fa7d6",
          ],
          "icon-opacity": ["case", ["==", ["get", "ais_active"], false], 0.4, 1],
        },
      });

      map.on("click", "vessel-points", (e) => {
        const f = e.features?.[0];
        if (f) selectVessel(f.properties?.id ?? null);
      });
      map.on("click", "detection-points", (e) => {
        const f = e.features?.[0];
        const vesselId = f?.properties?.vessel_id;
        const eventId = f?.properties?.event_id;
        if (vesselId && eventId) {
          selectVessel(vesselId);
          selectDetection(eventId);
        }
      });
      map.on("click", (e) => {
        const hits = map.queryRenderedFeatures(e.point, { layers: ["vessel-points", "detection-points"] });
        if (hits.length === 0) {
          selectVessel(null);
          selectDetection(null);
        }
      });
      map.on("mouseenter", "vessel-points", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const f = e.features?.[0];
        if (f) hoverVessel(f.properties?.id ?? null);
      });
      map.on("mouseleave", "vessel-points", () => {
        map.getCanvas().style.cursor = "";
        hoverVessel(null);
      });
      map.on("mouseenter", "detection-points", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "detection-points", () => { map.getCanvas().style.cursor = ""; });

      map.resize();
      setMapReady(true);
      setMapInstance(map);
    });

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      setMapReady(false);
      setMapInstance(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    applyMapTheme(map, theme);
    if (map.getLayer("halo-hover")) map.setPaintProperty("halo-hover", "circle-stroke-color", theme === "light" ? "#0f3a57" : "#ffffff");
  }, [theme, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    (map.getSource("vessels") as GeoJSONSource | undefined)?.setData(vesselsGeoJSON(timeVessels));
    (map.getSource("detections") as GeoJSONSource | undefined)?.setData(detectionsGeoJSON(events));
    (map.getSource("footprints") as GeoJSONSource | undefined)?.setData(footprintsGeoJSON(events));
    (map.getSource("ship-to-ship") as GeoJSONSource | undefined)?.setData(shipToShipPointGeoJSON(events));
  }, [timeVessels, events, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    (map.getSource("halo-hover") as GeoJSONSource | undefined)?.setData(haloGeoJSON(timeVessels, hoveredVesselId));
  }, [hoveredVesselId, timeVessels, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const trackSrc = map.getSource("selected-track") as GeoJSONSource | undefined;
    const predictedSrc = map.getSource("predicted-path") as GeoJSONSource | undefined;
    const extrapolatedSrc = map.getSource("extrapolated-path") as GeoJSONSource | undefined;
    const haloSrc = map.getSource("halo-selected") as GeoJSONSource | undefined;
    if (!selectedVesselId) {
      trackSrc?.setData({ type: "FeatureCollection", features: [] });
      predictedSrc?.setData({ type: "FeatureCollection", features: [] });
      extrapolatedSrc?.setData({ type: "FeatureCollection", features: [] });
      haloSrc?.setData({ type: "FeatureCollection", features: [] });
      return;
    }
    // The selected vessel's trail shows only its CURRENT voyage — from the
    // most recent departure up to the current playback time — never the
    // future, and never a previously-completed port-to-port leg stitched
    // onto the new one (which used to read as a fake back-and-forth route).
    trackSrc?.setData(trackLineGeoJSON(currentVoyageSegment(tracks[selectedVesselId], effectiveTimeMs)));
    predictedSrc?.setData(predictedPathGeoJSON(events, selectedVesselId));
    const selectedVessel = timeVessels.find((v) => v.id === selectedVesselId);
    extrapolatedSrc?.setData(selectedVessel ? extrapolatedPathGeoJSON(selectedVessel) : { type: "FeatureCollection", features: [] });
    haloSrc?.setData(haloGeoJSON(timeVessels, selectedVesselId));
  }, [selectedVesselId, tracks, events, timeVessels, effectiveTimeMs, mapReady]);

  // Camera recentring is deliberately its own effect, keyed only on the
  // *selection* changing — not on effectiveTimeMs, or every playback tick
  // (200ms during Play) would retrigger a 700ms flyTo and the camera would
  // never stop fighting itself while scrubbing.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !selectedVesselId || selectedDetectionEventId) return;
    const vessel = timeVessels.find((v) => v.id === selectedVesselId);
    if (vessel?.current) {
      map.flyTo({ center: [vessel.current.lon, vessel.current.lat], zoom: Math.max(map.getZoom(), 6.5), duration: 700 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVesselId, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (map.getLayer("footprint-selected-outline")) {
      map.setFilter("footprint-selected-outline", ["==", ["get", "event_id"], selectedDetectionEventId ?? "__none__"]);
    }
    if (!selectedDetectionEventId) return;
    const ev = events.find((e) => e.id === selectedDetectionEventId);
    const footprint = (ev?.data as { footprint?: { coordinates: number[][][] } } | undefined)?.footprint;
    if (footprint) {
      const centroid = turf.centroid(turf.polygon(footprint.coordinates)).geometry.coordinates as [number, number];
      map.flyTo({ center: centroid, zoom: Math.max(map.getZoom(), 8.5), duration: 800 });
    }
  }, [selectedDetectionEventId, events, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const vis = (v: boolean) => (v ? "visible" : "none");
    if (map.getLayer("selected-track-line")) map.setLayoutProperty("selected-track-line", "visibility", vis(layers.tracks));
    if (map.getLayer("predicted-path-line")) map.setLayoutProperty("predicted-path-line", "visibility", vis(layers.tracks));
    if (map.getLayer("extrapolated-path-line")) map.setLayoutProperty("extrapolated-path-line", "visibility", vis(layers.tracks));
    if (map.getLayer("detection-points")) map.setLayoutProperty("detection-points", "visibility", vis(layers.detections));
    if (map.getLayer("footprint-fill")) map.setLayoutProperty("footprint-fill", "visibility", vis(layers.detections));
    if (map.getLayer("footprint-outline")) map.setLayoutProperty("footprint-outline", "visibility", vis(layers.detections));
    if (map.getLayer("footprint-selected-outline")) map.setLayoutProperty("footprint-selected-outline", "visibility", vis(layers.detections));
    if (map.getLayer("ship-to-ship-ring")) map.setLayoutProperty("ship-to-ship-ring", "visibility", vis(layers.detections));
    if (map.getLayer("port-points")) map.setLayoutProperty("port-points", "visibility", vis(layers.ports));
    if (map.getLayer("port-labels")) map.setLayoutProperty("port-labels", "visibility", vis(layers.ports));
    if (map.getLayer("city-points")) map.setLayoutProperty("city-points", "visibility", vis(layers.cities));
    if (map.getLayer("city-labels")) map.setLayoutProperty("city-labels", "visibility", vis(layers.cities));
    if (map.getLayer("radar-fill")) map.setLayoutProperty("radar-fill", "visibility", vis(layers.radar));
    if (map.getLayer("radar-outline")) map.setLayoutProperty("radar-outline", "visibility", vis(layers.radar));
    if (map.getLayer("restricted-fill")) map.setLayoutProperty("restricted-fill", "visibility", vis(layers.restricted));
    if (map.getLayer("restricted-outline")) map.setLayoutProperty("restricted-outline", "visibility", vis(layers.restricted));
    if (map.getLayer("restricted-label")) map.setLayoutProperty("restricted-label", "visibility", vis(layers.restricted));
  }, [layers, mapReady]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
