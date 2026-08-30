import { create } from "zustand";
import type { Map as MLMap } from "maplibre-gl";
import type { EventsFile, MarintEvent, PortsFile, Port, TracksFile, TrackPoint, Vessel, VesselsFile } from "../types";

export type CorrelationDecision = "confirmed" | "rejected" | "needs_review";

interface MarintState {
  loading: boolean;
  error: string | null;
  vessels: Vessel[];
  tracks: Record<string, TrackPoint[]>;
  events: MarintEvent[];
  ports: Port[];
  acgField: { lon: number; lat: number; name: string } | null;
  demoNow: string | null;
  demoWindowStart: string | null;
  playbackTime: string | null; // null = LIVE (effective time is demoNow)
  playing: boolean;
  playbackSpeed: number;
  selectedVesselId: string | null;
  hoveredVesselId: string | null;
  selectedDetectionEventId: string | null;
  layers: {
    tracks: boolean;
    detections: boolean;
    ports: boolean;
    cities: boolean;
    radar: boolean;
    restricted: boolean;
  };
  mapInstance: MLMap | null;
  correlationDecisions: Record<string, CorrelationDecision>;
  setMapInstance: (map: MLMap | null) => void;
  setCorrelationDecision: (vesselId: string, decision: CorrelationDecision) => void;
  load: () => Promise<void>;
  selectVessel: (id: string | null) => void;
  hoverVessel: (id: string | null) => void;
  toggleLayer: (key: keyof MarintState["layers"]) => void;
  eventsForVessel: (id: string) => MarintEvent[];
  vesselById: (id: string) => Vessel | undefined;
  selectDetection: (eventId: string | null) => void;
  revealDetection: (eventId: string, vesselId: string) => void;
  primaryDetectionEvent: (vesselId: string) => MarintEvent | undefined;
  effectiveTimeMs: () => number;
  isLive: () => boolean;
  visibleEvents: () => MarintEvent[];
  setPlaybackTime: (iso: string | null) => void;
  stepPlayback: (deltaMinutes: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  play: () => void;
  pause: () => void;
  goLive: () => void;
}

export const useMarintStore = create<MarintState>((set, get) => ({
  loading: true,
  error: null,
  vessels: [],
  tracks: {},
  events: [],
  ports: [],
  acgField: null,
  demoNow: null,
  demoWindowStart: null,
  playbackTime: null,
  playing: false,
  playbackSpeed: 1,
  selectedVesselId: null,
  hoveredVesselId: null,
  selectedDetectionEventId: null,
  layers: { tracks: true, detections: true, ports: true, cities: true, radar: false, restricted: true },
  mapInstance: null,
  correlationDecisions: loadCorrelationDecisions(),

  load: async () => {
    try {
      const [vesselsRes, tracksRes, eventsRes, portsRes] = await Promise.all([
        fetch("/data/vessels.json"),
        fetch("/data/tracks.json"),
        fetch("/data/events.json"),
        fetch("/data/ports.json"),
      ]);
      const vesselsFile: VesselsFile = await vesselsRes.json();
      const tracksFile: TracksFile = await tracksRes.json();
      const eventsFile: EventsFile = await eventsRes.json();
      const portsFile: PortsFile = await portsRes.json();
      set({
        loading: false,
        vessels: vesselsFile.vessels,
        tracks: tracksFile.tracks,
        events: eventsFile.events,
        ports: portsFile.ports,
        acgField: portsFile.acg_field,
        demoNow: vesselsFile.window.end,
        demoWindowStart: vesselsFile.window.start,
      });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : "Failed to load MARINT data" });
    }
  },

  selectVessel: (id) => set({ selectedVesselId: id, selectedDetectionEventId: null }),
  hoverVessel: (id) => set({ hoveredVesselId: id }),
  toggleLayer: (key) => set((s) => ({ layers: { ...s.layers, [key]: !s.layers[key] } })),
  eventsForVessel: (id) => get().events.filter((e) => e.vessel_id === id || e.related_vessel_id === id),
  vesselById: (id) => get().vessels.find((v) => v.id === id),
  selectDetection: (eventId) => set({ selectedDetectionEventId: eventId }),
  revealDetection: (eventId, vesselId) => set({ selectedVesselId: vesselId, selectedDetectionEventId: eventId }),
  primaryDetectionEvent: (vesselId) =>
    get().events.find((e) => e.vessel_id === vesselId && e.kind === "sar_detection") ??
    get().events.find((e) => e.vessel_id === vesselId && e.kind === "optical_detection"),
  setMapInstance: (map) => set({ mapInstance: map }),
  setCorrelationDecision: (vesselId, decision) =>
    set((s) => {
      const next = { ...s.correlationDecisions, [vesselId]: decision };
      saveCorrelationDecisions(next);
      return { correlationDecisions: next };
    }),

  effectiveTimeMs: () => {
    const s = get();
    if (s.playbackTime) return new Date(s.playbackTime).getTime();
    return s.demoNow ? new Date(s.demoNow).getTime() : Date.now();
  },
  isLive: () => get().playbackTime === null,
  visibleEvents: () => {
    const t = get().effectiveTimeMs();
    return get().events.filter((e) => new Date(e.ts).getTime() <= t);
  },
  setPlaybackTime: (iso) => {
    stopPlaybackLoop();
    set({ playbackTime: iso, playing: false });
  },
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  stepPlayback: (deltaMinutes) => {
    const s = get();
    const minMs = s.demoWindowStart ? new Date(s.demoWindowStart).getTime() : -Infinity;
    const maxMs = s.demoNow ? new Date(s.demoNow).getTime() : Infinity;
    const nextMs = Math.min(maxMs, Math.max(minMs, s.effectiveTimeMs() + deltaMinutes * 60000));
    stopPlaybackLoop();
    set({ playbackTime: nextMs >= maxMs ? null : new Date(nextMs).toISOString(), playing: false });
  },
  play: () => {
    if (get().playing) return;
    set({ playing: true });
    let lastTick = performance.now();
    playbackIntervalId = setInterval(() => {
      const tick = performance.now();
      const dtRealMs = tick - lastTick;
      lastTick = tick;
      const s = get();
      if (!s.playing) return;
      const maxMs = s.demoNow ? new Date(s.demoNow).getTime() : Date.now();
      // 1x = one simulated minute per real second — a full traverse of a
      // multi-hour scenario window takes tens of seconds, not real hours.
      const nextMs = s.effectiveTimeMs() + dtRealMs * s.playbackSpeed * 60;
      if (nextMs >= maxMs) {
        stopPlaybackLoop();
        set({ playbackTime: null, playing: false });
        return;
      }
      set({ playbackTime: new Date(nextMs).toISOString() });
    }, 200);
  },
  pause: () => {
    stopPlaybackLoop();
    set({ playing: false });
  },
  goLive: () => {
    stopPlaybackLoop();
    set({ playbackTime: null, playing: false });
  },
}));

let playbackIntervalId: ReturnType<typeof setInterval> | null = null;
function stopPlaybackLoop() {
  if (playbackIntervalId) {
    clearInterval(playbackIntervalId);
    playbackIntervalId = null;
  }
}

const CORRELATION_KEY = "marint.correlationDecisions";
function loadCorrelationDecisions(): Record<string, CorrelationDecision> {
  try {
    return JSON.parse(localStorage.getItem(CORRELATION_KEY) ?? "{}");
  } catch {
    return {};
  }
}
function saveCorrelationDecisions(decisions: Record<string, CorrelationDecision>) {
  try {
    localStorage.setItem(CORRELATION_KEY, JSON.stringify(decisions));
  } catch {
    // localStorage unavailable — decisions simply won't persist across reloads
  }
}
