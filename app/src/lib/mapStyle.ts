import type { Map as MLMap, StyleSpecification } from "maplibre-gl";
import type { Theme } from "./theme";

// Theme-sensitive base-map colors, kept in one table so buildBaseStyle()
// (initial load) and applyMapTheme() (live toggle while the map is already
// mounted) can never drift out of sync with each other.
const MAP_COLORS = {
  dark: {
    bg: "#060f1a",
    worldLandFill: "#152c46",
    worldLandOutline: "#2c5578",
    countryBorders: "#1f3550",
    coastline: "#2fa7d6",
    cityDot: "#4c6b85",
    cityText: "#6f8ba3",
    labelHalo: "#060f1a",
    portDot: "#8fd9ff",
    portStroke: "#060f1a",
    portText: "#c9e6f7",
    restrictedHalo: "#060f1a",
  },
  light: {
    bg: "#e9f1f7",
    worldLandFill: "#c7d9e6",
    worldLandOutline: "#9ab3c7",
    countryBorders: "#a9c2d4",
    coastline: "#1d5e8a",
    cityDot: "#5b7d95",
    cityText: "#3d5b73",
    labelHalo: "#e9f1f7",
    portDot: "#1d5e8a",
    portStroke: "#e9f1f7",
    portText: "#0f3a57",
    restrictedHalo: "#e9f1f7",
  },
} as const;

// Layer id -> [paint property, MAP_COLORS key] pairs, used both to build the
// initial style and to live-patch an already-mounted map via
// setPaintProperty() when the user toggles theme mid-session.
const THEMED_PAINT: [string, string, keyof (typeof MAP_COLORS)["dark"]][] = [
  ["bg", "background-color", "bg"],
  ["world-land-fill", "fill-color", "worldLandFill"],
  ["world-land-outline", "line-color", "worldLandOutline"],
  ["land-fill", "fill-color", "worldLandFill"],
  ["country-borders", "line-color", "countryBorders"],
  ["coastline", "line-color", "coastline"],
  ["restricted-label", "text-halo-color", "restrictedHalo"],
  ["city-points", "circle-color", "cityDot"],
  ["city-labels", "text-color", "cityText"],
  ["city-labels", "text-halo-color", "labelHalo"],
  ["city-points-az-1", "circle-color", "cityDot"],
  ["city-labels-az-1", "text-color", "cityText"],
  ["city-labels-az-1", "text-halo-color", "labelHalo"],
  ["city-points-az-2", "circle-color", "cityDot"],
  ["city-labels-az-2", "text-color", "cityText"],
  ["city-labels-az-2", "text-halo-color", "labelHalo"],
  ["city-points-az-3", "circle-color", "cityDot"],
  ["city-labels-az-3", "text-color", "cityText"],
  ["city-labels-az-3", "text-halo-color", "labelHalo"],
  ["port-points", "circle-color", "portDot"],
  ["port-points", "circle-stroke-color", "portStroke"],
  ["port-labels", "text-color", "portText"],
  ["port-labels", "text-halo-color", "labelHalo"],
];

/** Applies MAP_COLORS[theme] to an already-mounted map's base layers, for a
 * live theme toggle without a full setStyle() (which would discard every
 * imperatively-added vessel/track/detection source). */
export function applyMapTheme(map: MLMap, theme: Theme) {
  const colors = MAP_COLORS[theme];
  for (const [layerId, prop, key] of THEMED_PAINT) {
    if (map.getLayer(layerId)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (map.setPaintProperty as any)(layerId, prop, colors[key]);
    }
  }
}

// Fully self-contained MapLibre style: no external tile provider, no API key.
// Base layers (ocean/land/coastline/country borders/cities) are rendered
// directly from the processed Natural Earth GeoJSON shipped in /data/geo.
// Dynamic layers (vessels, tracks, detections, ports) are added imperatively
// in MapView and kept in sync with app state via setData().
export function buildBaseStyle(theme: Theme = "dark"): StyleSpecification {
  const c = MAP_COLORS[theme];
  return {
    version: 8,
    // Self-hosted glyph set (Noto Sans Regular, ranges 0-511 — covers Latin +
    // Latin Extended-A/B, all we need for Caspian place names) so the demo
    // never depends on an external font server being reachable.
    glyphs: "/fonts/{fontstack}/{range}.pbf",
    sources: {
      "world-land": { type: "geojson", data: "/data/geo/world_land.geojson" },
      "caspian-land": { type: "geojson", data: "/data/geo/caspian_land.geojson" },
      "caspian-coastline": { type: "geojson", data: "/data/geo/caspian_coastline.geojson" },
      "caspian-countries": { type: "geojson", data: "/data/geo/caspian_countries.geojson" },
      "caspian-cities": { type: "geojson", data: "/data/geo/caspian_major_cities.geojson" },
      "caspian-ports": { type: "geojson", data: "/data/geo/caspian_ports.geojson" },
      "radar-zones": { type: "geojson", data: "/data/geo/radar_zones.geojson" },
      "restricted-areas": { type: "geojson", data: "/data/geo/restricted_areas.geojson" },
    },
    layers: [
      { id: "bg", type: "background", paint: { "background-color": c.bg } },
      {
        // Simplified world landmass (Natural Earth 1:110m) — always present,
        // always fully opaque, so panning/zooming out from the Caspian never
        // hits an empty void. Constant opacity is deliberate: fading this
        // out with zoom while land-fill (below) fades in at a *different*
        // rate is exactly what produced the old "rectangular seam" bug —
        // outside the small Caspian bbox this layer was semi-transparent
        // (blended with the background, reading pale/washed-out) while
        // inside the bbox land-fill was fully opaque (pure, saturated
        // color), so the bbox edge itself became a visible brightness
        // discontinuity. Both layers now hold flat full opacity, so there
        // is nothing for that edge to show up against.
        id: "world-land-fill",
        type: "fill",
        source: "world-land",
        paint: { "fill-color": c.worldLandFill, "fill-opacity": 1 },
      },
      {
        id: "world-land-outline",
        type: "line",
        source: "world-land",
        paint: {
          "line-color": c.worldLandOutline,
          "line-width": 0.8,
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 2, 0.9, 6, 0.5, 8, 0.2],
        },
      },
      {
        // Higher-resolution land (Natural Earth 1:10m, clipped to the
        // Caspian bbox) drawn on top of world-land-fill in the exact same
        // color — its only job is to sharpen the coastline precisely where
        // it overlaps world-land-fill's coarser edge; being the same solid
        // color and same full opacity, it cannot itself create a visible
        // boundary. No fill-outline-color: this layer's polygons were
        // clipped to a bounding box, so an outline would trace that
        // synthetic clip edge as a visible rectangle — the real coastline
        // is drawn separately from unclipped-shape coastline data below.
        id: "land-fill",
        type: "fill",
        source: "caspian-land",
        paint: { "fill-color": c.worldLandFill, "fill-opacity": 1 },
      },
      {
        // Country polygons were clipped to the regional bbox, so their
        // boundary line includes a synthetic straight clip edge in addition
        // to the real international borders. Faded out across the whole
        // zoom range where a Caspian-wide (not vessel-level) view is likely
        // — world zoom-out AND the wider "whole sea" framing used by the
        // homepage's cinematic map — so that clip edge never reads as a
        // rectangle; only once zoomed in close to a specific area do the
        // real border segments dominate what's on screen.
        id: "country-borders",
        type: "line",
        source: "caspian-countries",
        paint: {
          "line-color": c.countryBorders,
          "line-width": 1,
          "line-dasharray": [2, 2],
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0, 4, 0, 7, 1],
        },
      },
      {
        id: "coastline",
        type: "line",
        source: "caspian-coastline",
        paint: { "line-color": c.coastline, "line-width": 1.1, "line-opacity": 0.55 },
      },
      {
        // Illustrative coastal radar coverage rings — off by default, an
        // operational-feel overlay rather than a claim of real sensor data.
        id: "radar-fill",
        type: "fill",
        source: "radar-zones",
        layout: { visibility: "none" },
        paint: { "fill-color": "#2fa7d6", "fill-opacity": 0.05 },
      },
      {
        id: "radar-outline",
        type: "line",
        source: "radar-zones",
        layout: { visibility: "none" },
        paint: { "line-color": "#2fa7d6", "line-width": 1, "line-opacity": 0.35, "line-dasharray": [1, 2] },
      },
      {
        id: "restricted-fill",
        type: "fill",
        source: "restricted-areas",
        paint: { "fill-color": "#e0824c", "fill-opacity": 0.08 },
      },
      {
        id: "restricted-outline",
        type: "line",
        source: "restricted-areas",
        paint: { "line-color": "#e0824c", "line-width": 1.3, "line-opacity": 0.6, "line-dasharray": [3, 2] },
      },
      {
        id: "restricted-label",
        type: "symbol",
        source: "restricted-areas",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 10,
          "text-font": ["Noto Sans Regular"],
          "text-transform": "uppercase",
          "text-letter-spacing": 0.04,
          "symbol-placement": "point",
        },
        paint: { "text-color": "#e0824c", "text-halo-color": c.restrictedHalo, "text-halo-width": 1.2, "text-opacity": 0.75 },
      },
      // Non-Azerbaijan cities (Kazakhstan/Turkmenistan/Iran/Russia/Armenia) keep
      // their original, unmodified population-threshold behavior — this pass
      // only changes how Azerbaijani settlements are selected and revealed.
      // Azerbaijani features are explicitly excluded here (rather than relying
      // on them simply failing the population check) because most of the
      // expanded 79-city Azerbaijan dataset intentionally has no fabricated
      // population figure (null), which these numeric comparisons can't
      // evaluate against.
      {
        id: "city-points",
        type: "circle",
        source: "caspian-cities",
        // Ports and coastal cities frequently share a real-world name (Baku,
        // Astrakhan, Atyrau, Makhachkala, Turkmenbashi) — the port layer
        // already marks and labels those, so the city layer excludes them
        // here to avoid rendering the same name twice at the same spot.
        filter: [
          "all",
          ["!=", ["get", "iso_a3"], "AZE"],
          [">=", ["get", "population"], 40000],
          ["!", ["in", ["get", "name"], ["literal", ["Baku", "Astrakhan", "Atyrau", "Makhachkala", "Türkmenbaşy"]]]],
        ],
        paint: { "circle-radius": 2, "circle-color": c.cityDot },
      },
      {
        id: "city-labels",
        type: "symbol",
        source: "caspian-cities",
        filter: [
          "all",
          ["!=", ["get", "iso_a3"], "AZE"],
          [">=", ["get", "population"], 40000],
          ["!", ["in", ["get", "name"], ["literal", ["Baku", "Astrakhan", "Atyrau", "Makhachkala", "Türkmenbaşy"]]]],
        ],
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-font": ["Noto Sans Regular"],
          "text-offset": [0, 1.1],
          "text-anchor": "top",
        },
        paint: { "text-color": c.cityText, "text-halo-color": c.labelHalo, "text-halo-width": 1.2 },
      },
      // Azerbaijan settlement label hierarchy — the authoritative 79-city
      // dataset is intentionally NOT all rendered at once (that would bury
      // the map in labels); instead each city carries a label_rank (1 = major/
      // national, 2 = regional/district center, 3 = smaller official city),
      // and each rank gets its own point+label layer pair gated by a
      // layer-level `minzoom`. A real per-layer minzoom (not a paint-level
      // opacity trick) is used deliberately: it removes the symbols from
      // MapLibre's collision index entirely below their reveal zoom, rather
      // than leaving them present-but-invisible and still competing for
      // collision space against symbols that *are* visible. Zoom thresholds
      // are anchored to camera values already meaningful elsewhere in this
      // app: 6.5/8.5 are the exact zoom levels MapView.tsx flies to when
      // focusing a single/clustered vessel (see flyTo calls), i.e. "regional"
      // and "local" already have a concrete meaning in MARINT's own camera
      // language, not an arbitrary new number. Baku is excluded by name for
      // the same reason as above (already labeled by the ports layer).
      {
        id: "city-points-az-1",
        type: "circle",
        source: "caspian-cities",
        filter: ["all", ["==", ["get", "iso_a3"], "AZE"], ["==", ["get", "label_rank"], 1], ["!=", ["get", "name"], "Baku"]],
        paint: { "circle-radius": 2, "circle-color": c.cityDot },
      },
      {
        id: "city-labels-az-1",
        type: "symbol",
        source: "caspian-cities",
        filter: ["all", ["==", ["get", "iso_a3"], "AZE"], ["==", ["get", "label_rank"], 1], ["!=", ["get", "name"], "Baku"]],
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-font": ["Noto Sans Regular"],
          "text-offset": [0, 1.1],
          "text-anchor": "top",
        },
        paint: { "text-color": c.cityText, "text-halo-color": c.labelHalo, "text-halo-width": 1.2 },
      },
      {
        id: "city-points-az-2",
        type: "circle",
        source: "caspian-cities",
        minzoom: 6.5,
        filter: ["all", ["==", ["get", "iso_a3"], "AZE"], ["==", ["get", "label_rank"], 2]],
        paint: { "circle-radius": 2, "circle-color": c.cityDot },
      },
      {
        id: "city-labels-az-2",
        type: "symbol",
        source: "caspian-cities",
        minzoom: 6.5,
        filter: ["all", ["==", ["get", "iso_a3"], "AZE"], ["==", ["get", "label_rank"], 2]],
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-font": ["Noto Sans Regular"],
          "text-offset": [0, 1.1],
          "text-anchor": "top",
        },
        paint: { "text-color": c.cityText, "text-halo-color": c.labelHalo, "text-halo-width": 1.2 },
      },
      {
        id: "city-points-az-3",
        type: "circle",
        source: "caspian-cities",
        minzoom: 8,
        filter: ["all", ["==", ["get", "iso_a3"], "AZE"], ["==", ["get", "label_rank"], 3]],
        paint: { "circle-radius": 2, "circle-color": c.cityDot },
      },
      {
        id: "city-labels-az-3",
        type: "symbol",
        source: "caspian-cities",
        minzoom: 8,
        filter: ["all", ["==", ["get", "iso_a3"], "AZE"], ["==", ["get", "label_rank"], 3]],
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-font": ["Noto Sans Regular"],
          "text-offset": [0, 1.1],
          "text-anchor": "top",
        },
        paint: { "text-color": c.cityText, "text-halo-color": c.labelHalo, "text-halo-width": 1.2 },
      },
      {
        id: "port-points",
        type: "circle",
        source: "caspian-ports",
        paint: {
          "circle-radius": ["match", ["get", "kind"], "major", 4, 2.5],
          "circle-color": c.portDot,
          "circle-stroke-color": c.portStroke,
          "circle-stroke-width": 1.5,
        },
      },
      {
        id: "port-labels",
        type: "symbol",
        source: "caspian-ports",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 12,
          "text-font": ["Noto Sans Regular"],
          "text-offset": [0, -1.2],
          "text-anchor": "bottom",
          "text-letter-spacing": 0.02,
        },
        paint: { "text-color": c.portText, "text-halo-color": c.labelHalo, "text-halo-width": 1.4 },
      },
    ],
  } as unknown as StyleSpecification;
}
