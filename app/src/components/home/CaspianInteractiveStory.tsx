import { useEffect, useRef, useState } from "react";
import { Map as MLMap } from "maplibre-gl";
import type { GeoJSONSource } from "maplibre-gl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ensureGsap, prefersReducedMotion } from "./motion/gsapSetup";
import { pinnedScrollTrigger, sectionHeightVh } from "./motion/pinConfig";
import { useMarintStore } from "../../lib/store";
import { applyMapTheme, buildBaseStyle } from "../../lib/mapStyle";
import { vesselArrowIcon, detectionDiamondIcon } from "../../lib/mapIcons";
import { footprintsGeoJSON } from "../../lib/mapData";
import { CASPIAN_CENTER } from "../../lib/mapConstants";
import SatelliteChip from "../investigation/SatelliteChip";
import { useTheme } from "../../lib/theme";
import type { DetectionData, TrackPoint } from "../../types";

const PIN_VH = 380;
const VESSEL_ID = "mv-001"; // Serdar — the dark-vessel scenario, real generated data

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
/** Index-interpolated point along a track — cheap and adequate at 15-minute
 * sample spacing, no need for great-circle interpolation here. */
function pointAtFraction(points: TrackPoint[], frac: number): [number, number] {
  const f = Math.max(0, Math.min(1, frac));
  const idx = f * (points.length - 1);
  const i0 = Math.floor(idx);
  const i1 = Math.min(points.length - 1, i0 + 1);
  const t = idx - i0;
  return [lerp(points[i0].lon, points[i1].lon, t), lerp(points[i0].lat, points[i1].lat, t)];
}
function partialTrackCoords(points: TrackPoint[], frac: number): [number, number][] {
  const count = Math.max(2, Math.round(points.length * Math.max(0, Math.min(1, frac))));
  return points.slice(0, count).map((p) => [p.lon, p.lat] as [number, number]);
}

export default function CaspianInteractiveStory() {
  const scopeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const timelineBuilt = useRef(false);

  const load = useMarintStore((s) => s.load);
  const loading = useMarintStore((s) => s.loading);
  const vessel = useMarintStore((s) => s.vesselById(VESSEL_ID));
  const track = useMarintStore((s) => s.tracks[VESSEL_ID]);
  const allEvents = useMarintStore((s) => s.events);
  const [theme] = useTheme();
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    load();
  }, [load]);

  // Map initialization — independent of data readiness, since the container
  // div always exists on mount. Interactive controls are disabled: the
  // camera is entirely scroll-driven, not user-pannable, for this cinematic
  // sequence (the real operational map elsewhere stays fully interactive).
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new MLMap({
      container: containerRef.current,
      style: buildBaseStyle(themeRef.current),
      center: CASPIAN_CENTER,
      zoom: 4.6,
      pitch: 0,
      bearing: 0,
      interactive: false,
      attributionControl: false,
    });
    mapRef.current = map;
    map.on("load", () => {
      map.addImage("cine-vessel", vesselArrowIcon(), { sdf: true });
      map.addImage("cine-diamond", detectionDiamondIcon(), { sdf: true });
      map.addSource("cine-track", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("cine-vessel-point", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("cine-footprint", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("cine-detection", { type: "geojson", data: { type: "FeatureCollection", features: [] } });

      map.addLayer({
        id: "cine-track-line",
        type: "line",
        source: "cine-track",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#2fa7d6", "line-width": 2.6, "line-opacity": 0.9 },
      });
      map.addLayer({
        id: "cine-footprint-fill",
        type: "fill",
        source: "cine-footprint",
        paint: { "fill-color": "#b754e0", "fill-opacity": 0 },
      });
      map.addLayer({
        id: "cine-footprint-outline",
        type: "line",
        source: "cine-footprint",
        paint: { "line-color": "#b754e0", "line-width": 1.4, "line-opacity": 0, "line-dasharray": [3, 2] },
      });
      map.addLayer({
        id: "cine-detection-point",
        type: "symbol",
        source: "cine-detection",
        layout: { "icon-image": "cine-diamond", "icon-size": 0, "icon-allow-overlap": true },
        paint: { "icon-color": "#b754e0", "icon-opacity": 0 },
      });
      map.addLayer({
        id: "cine-vessel-marker",
        type: "symbol",
        source: "cine-vessel-point",
        layout: { "icon-image": "cine-vessel", "icon-size": 0, "icon-rotate": ["get", "heading"], "icon-rotation-alignment": "map", "icon-allow-overlap": true },
        paint: { "icon-color": "#2fa7d6", "icon-opacity": 0 },
      });

      // This section sits far down a long scroll-driven page; the container
      // div's layout isn't always settled to its final full-bleed size at
      // the exact moment MapLibre reads it during construction, which
      // otherwise leaves the canvas permanently sized to whatever small/
      // collapsed box it saw first — the classic "boxed map" symptom, just
      // from a canvas-sizing cause instead of a data/CSS one this time.
      map.resize();
      setMapReady(true);
    });
    const resizeObserver = new ResizeObserver(() => map.resize());
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  // Live theme switch — repaints the base-layer colors in place via
  // setPaintProperty() (same mechanism as the operational MapView), never
  // recreating the map. This is deliberately its own effect, independent of
  // the pinned GSAP timeline effect below, so toggling theme mid-scroll
  // can't touch the camera, the scroll-driven sources, or the scenario
  // sequence's progress in any way.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    applyMapTheme(map, theme);
  }, [theme, mapReady]);

  // The GSAP timeline needs BOTH the map (async 'load' event) and the
  // vessel/track data (async fetch) — neither is available at first-render
  // layout-effect time, so this is a plain effect gated on both readiness
  // flags rather than the useScrollScene() hook (which only ever runs once,
  // synchronously, on mount — the exact race that silently skipped
  // GlobalScale's ScrollTrigger creation earlier in this pass).
  useEffect(() => {
    const map = mapRef.current;
    const scope = scopeRef.current;
    if (!mapReady || !map || !scope || !vessel || !track || track.length < 2 || timelineBuilt.current) return;
    timelineBuilt.current = true;

    const pinEl = scope.querySelector<HTMLElement>("[data-pin-inner]");
    const aisLostLabel = scope.querySelector<HTMLElement>("[data-ais-lost]");
    const satCards = scope.querySelector<HTMLElement>("[data-sat-cards]");
    const correlationResult = scope.querySelector<HTMLElement>("[data-correlation-result]");
    const eyebrow = scope.querySelector<HTMLElement>("[data-eyebrow]");
    if (!pinEl) return;

    const vesselEvents = allEvents.filter((e) => e.vessel_id === VESSEL_ID);
    const departureEvent = vesselEvents.find((e) => e.kind === "departure");
    const gapEvent = vesselEvents.find((e) => e.kind === "ais_gap");
    const sarEvent = vesselEvents.find((e) => e.kind === "sar_detection");
    const gapTime = gapEvent ? new Date(gapEvent.ts).getTime() : null;
    // The vessel's full track now spans several days of prior history (for
    // the Operations timeline) — this short cinematic sequence must only
    // ever see the scripted recent scenario window (departure -> AIS gap),
    // never the multi-day history before it.
    const scenarioStartMs = departureEvent ? new Date(departureEvent.ts).getTime() : new Date(track[0].ts).getTime();
    const confirmedTrack = track.filter((p) => {
      const t = new Date(p.ts).getTime();
      return t >= scenarioStartMs && (gapTime === null || t <= gapTime);
    });
    const sarPos: [number, number] | null = sarEvent ? [(sarEvent.data as unknown as DetectionData).position.lon, (sarEvent.data as unknown as DetectionData).position.lat] : null;
    const startPos: [number, number] = confirmedTrack.length > 0 ? [confirmedTrack[0].lon, confirmedTrack[0].lat] : [track[0].lon, track[0].lat];
    const focusPos = sarPos ?? startPos;

    ensureGsap();
    const ctx = gsap.context(() => {
      if (!map) return;
      if (prefersReducedMotion()) {
        map.jumpTo({ center: focusPos, zoom: 8.5, pitch: 40, bearing: 0 });
        (map.getSource("cine-track") as GeoJSONSource)?.setData({ type: "Feature", geometry: { type: "LineString", coordinates: confirmedTrack.map((p) => [p.lon, p.lat]) }, properties: {} } as never);
        map.setPaintProperty("cine-track-line", "line-opacity", 0.9);
        if (sarEvent) {
          (map.getSource("cine-footprint") as GeoJSONSource)?.setData(footprintsGeoJSON(vesselEvents) as never);
          map.setPaintProperty("cine-footprint-fill", "fill-opacity", 0.12);
          map.setPaintProperty("cine-footprint-outline", "line-opacity", 0.6);
          map.setLayoutProperty("cine-detection-point", "icon-size", 0.9);
          map.setPaintProperty("cine-detection-point", "icon-opacity", 1);
        }
        gsap.set(eyebrow, { opacity: 1 });
        gsap.set(aisLostLabel, { opacity: 1 });
        gsap.set(satCards, { opacity: 1 });
        gsap.set(correlationResult, { opacity: 1 });
        return;
      }

      gsap.set(eyebrow, { opacity: 0 });
      gsap.set(aisLostLabel, { opacity: 0 });
      gsap.set(satCards, { opacity: 0, y: 20 });
      gsap.set(correlationResult, { opacity: 0, y: 10 });
      map.jumpTo({ center: CASPIAN_CENTER, zoom: 4.6, pitch: 0, bearing: 0 });

      // ScrollTrigger/GSAP revert (on unmount, e.g. navigating to /operations)
      // snaps every tweened value back toward its pre-animation state, which
      // fires these onUpdate callbacks one more time — after the map-init
      // effect's cleanup has already called map.remove() and nulled
      // mapRef.current. Reading mapRef.current fresh (instead of closing
      // over the `map` local) and bailing when it's gone turns that into a
      // no-op instead of an uncaught "Cannot read properties of undefined"
      // that used to crash the whole app with no error boundary above it.
      const withMap = (fn: (m: MLMap) => void) => () => {
        const m = mapRef.current;
        if (m) fn(m);
      };

      const cam = { lon: CASPIAN_CENTER[0], lat: CASPIAN_CENTER[1], zoom: 4.6, pitch: 0, bearing: 0 };
      const applyCam = withMap((m) => {
        m.jumpTo({ center: [cam.lon, cam.lat], zoom: cam.zoom, pitch: cam.pitch, bearing: cam.bearing });
      });

      const tl = gsap.timeline({
        scrollTrigger: pinnedScrollTrigger(scope, pinEl),
        defaults: { ease: "none" },
      });

      // 0–15%: Caspian overview holds; 15–30%: 2D -> 3D pitch.
      tl.fromTo(eyebrow, { opacity: 0 }, { opacity: 1, duration: 0.08 }, 0.02)
        .to(cam, { pitch: 48, duration: 0.15, onUpdate: applyCam }, 0.15)
        // 30–45%: approach the detection region.
        .to(cam, { lon: focusPos[0], lat: focusPos[1], zoom: 7.2, bearing: -10, duration: 0.15, onUpdate: applyCam }, 0.3)
        // 45–55%: vessel marker appears at the start of its known track, camera tightens further.
        .call(() => {
          (map.getSource("cine-vessel-point") as GeoJSONSource)?.setData({
            type: "FeatureCollection",
            features: [{ type: "Feature", geometry: { type: "Point", coordinates: startPos }, properties: { heading: confirmedTrack[1]?.cog ?? 0 } }],
          } as never);
        }, undefined, 0.45)
        .to(cam, { zoom: 8.4, duration: 0.1, onUpdate: applyCam }, 0.45);

      // Vessel icon fade-in, driven directly on the map's paint/layout
      // properties (a plain JS proxy object stands in for a DOM target).
      const vesselOpacity = { v: 0 };
      tl.to(vesselOpacity, {
        v: 1, duration: 0.08,
        onUpdate: withMap((m) => {
          m.setLayoutProperty("cine-vessel-marker", "icon-size", 0.85 * vesselOpacity.v);
          m.setPaintProperty("cine-vessel-marker", "icon-opacity", vesselOpacity.v);
        }),
      }, 0.46);

      // 55–65%: progressive track reveal, marker rides along it.
      const trackState = { f: 0 };
      tl.to(trackState, {
        f: 1, duration: 0.1,
        onUpdate: withMap((m) => {
          const coords = partialTrackCoords(confirmedTrack, trackState.f);
          (m.getSource("cine-track") as GeoJSONSource)?.setData({ type: "Feature", geometry: { type: "LineString", coordinates: coords }, properties: {} } as never);
          const pos = pointAtFraction(confirmedTrack, trackState.f);
          (m.getSource("cine-vessel-point") as GeoJSONSource)?.setData({
            type: "FeatureCollection",
            features: [{ type: "Feature", geometry: { type: "Point", coordinates: pos }, properties: { heading: confirmedTrack[Math.floor(trackState.f * (confirmedTrack.length - 1))]?.cog ?? 0 } }],
          } as never);
        }),
      }, 0.55);

      // 65–72%: AIS loss — marker dims, label appears.
      const dim = { v: 1 };
      tl.to(dim, {
        v: 0.35, duration: 0.07,
        onUpdate: withMap((m) => m.setPaintProperty("cine-vessel-marker", "icon-opacity", dim.v)),
      }, 0.65)
        .fromTo(aisLostLabel, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.07 }, 0.66);

      // 72–82%: SAR footprint sweeps in + detection point.
      if (sarEvent) {
        (map.getSource("cine-footprint") as GeoJSONSource)?.setData(footprintsGeoJSON(vesselEvents) as never);
        (map.getSource("cine-detection") as GeoJSONSource)?.setData(footprintDetectionPoint(sarPos!) as never);
        const foot = { o: 0 };
        tl.to(foot, {
          o: 1, duration: 0.1,
          onUpdate: withMap((m) => {
            m.setPaintProperty("cine-footprint-fill", "fill-opacity", 0.14 * foot.o);
            m.setPaintProperty("cine-footprint-outline", "line-opacity", 0.7 * foot.o);
            m.setLayoutProperty("cine-detection-point", "icon-size", 0.9 * foot.o);
            m.setPaintProperty("cine-detection-point", "icon-opacity", foot.o);
          }),
        }, 0.72);
        // Camera deliberately does NOT push in further here — it holds at
        // the wider framing reached earlier (zoom 8.4 / pitch 48) for the
        // rest of the sequence instead of tightening again for the SAR
        // reveal, so the slide settles sooner instead of extending the
        // "final approach" with another zoom step.
      }

      // 82–90%: satellite evidence cards appear and stay — the sequence
      // resolves here through the correlation result, not a photograph.
      tl.fromTo(satCards, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.08 }, 0.82);

      // 90–100%: the correlation result itself is the closing beat.
      tl.fromTo(correlationResult, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.1 }, 0.9);
    }, scope);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [mapReady, vessel, track, allEvents]);

  const vesselEvents = allEvents.filter((e) => e.vessel_id === VESSEL_ID);
  const sarEvent = vesselEvents.find((e) => e.kind === "sar_detection");
  const opticalEvent = vesselEvents.find((e) => e.kind === "optical_detection");
  const correlationEvent = vesselEvents.find((e) => e.kind === "correlation_failed");
  const matchConfidence = correlationEvent
    ? Math.round((correlationEvent.data as { ais_match_confidence: number }).ais_match_confidence * 100)
    : null;

  return (
    <section ref={scopeRef} className="relative bg-home-bg" style={{ height: sectionHeightVh(PIN_VH) }}>
      <div data-pin-inner className="relative h-dvh min-h-[640px] overflow-hidden">
        <div ref={containerRef} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-home-bg/55 via-transparent to-home-bg/70" />

        <p data-eyebrow className="absolute top-14 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.3em] text-cyan/70 pointer-events-none">
          Caspian Sea — live operational demonstration
        </p>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-home-ink/30 text-sm pointer-events-none">Loading Caspian data…</div>
        )}

        <div data-ais-lost className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[140%] pointer-events-none">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-status-dark-vessel bg-home-bg/80 px-3 py-1.5 rounded-md border border-status-dark-vessel/30">
            AIS signal lost
          </span>
        </div>

        {vessel && (
          <div data-sat-cards className="absolute inset-x-0 bottom-36 sm:bottom-24 md:bottom-28 flex justify-center gap-2.5 sm:gap-4 px-6 pointer-events-none">
            {opticalEvent && (
              <div className="w-28 sm:w-40 md:w-52 bg-surface-1/95 border border-hairline rounded-lg overflow-hidden shadow-2xl">
                <SatelliteChip
                  sensorType="Optical"
                  headingDeg={(opticalEvent.data as unknown as DetectionData).estimated_heading_deg}
                  lengthM={(opticalEvent.data as unknown as DetectionData).estimated_length_m}
                  seedKey={opticalEvent.id}
                  className="h-16 sm:h-20 md:h-28 w-full"
                />
                <div className="p-1.5 sm:p-2 text-[9px] sm:text-[10.5px] text-home-ink/60 truncate">Optical corroboration</div>
              </div>
            )}
            {sarEvent && (
              <div className="w-28 sm:w-40 md:w-52 bg-surface-1/95 border border-hairline rounded-lg overflow-hidden shadow-2xl">
                <SatelliteChip
                  sensorType="SAR"
                  headingDeg={(sarEvent.data as unknown as DetectionData).estimated_heading_deg}
                  lengthM={(sarEvent.data as unknown as DetectionData).estimated_length_m}
                  seedKey={sarEvent.id}
                  className="h-16 sm:h-20 md:h-28 w-full"
                />
                <div className="p-1.5 sm:p-2 text-[9px] sm:text-[10.5px] text-home-ink/60 truncate">SAR detection</div>
              </div>
            )}
          </div>
        )}

        {vessel && (
          <div data-correlation-result className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-1.5 sm:gap-2 px-6 pointer-events-none">
            <span className="text-[9.5px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-status-dark-vessel bg-home-bg/85 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md border border-status-dark-vessel/30 text-center">
              Possible dark vessel{matchConfidence !== null ? ` — ${matchConfidence}% AIS match` : ""}
            </span>
            <span className="text-home-ink/45 text-[10.5px] sm:text-[12px] text-center">MARINT connects the evidence, even when AIS goes dark.</span>
          </div>
        )}
      </div>
    </section>
  );
}

function footprintDetectionPoint(pos: [number, number]) {
  return {
    type: "FeatureCollection",
    features: [{ type: "Feature", geometry: { type: "Point", coordinates: pos }, properties: {} }],
  };
}
