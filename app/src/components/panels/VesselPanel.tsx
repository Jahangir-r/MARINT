import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { useMarintStore } from "../../lib/store";
import { countryName, formatClock, formatCoord, formatDateTime, formatDeg, formatTimeAgo, riskBandColor } from "../../lib/format";
import { trackUpToTime, vesselAtTime } from "../../lib/playback";
import EventTimeline from "./EventTimeline";
import FlagIcon from "../common/FlagIcon";
import AiCopilot from "../investigation/AiCopilot";

type Tab = "overview" | "ais" | "history" | "events" | "copilot";
// Mobile bottom-sheet only: COMPACT is an identity-preview card (no tabs --
// name/flag/risk/photo-thumbnail/speed-course-status), EXPANDED is the full
// analytical workspace (hero, quick stats, tabs). Kept as plain vh-equivalent
// fractions of window.innerHeight, recomputed on demand -- this sheet is a
// static overlay (not GSAP-scroll-jacked), so it has none of the dvh/
// ScrollTrigger desync problem the homepage pinned scenes have, and can
// safely use dvh directly.
const COMPACT_SHEET_VH = 30;
const EXPANDED_SHEET_VH = 78;

export default function VesselPanel() {
  const selectedVesselId = useMarintStore((s) => s.selectedVesselId);
  const rawVessel = useMarintStore((s) => s.vesselById(s.selectedVesselId ?? ""));
  const rawTrack = useMarintStore((s) => (s.selectedVesselId ? s.tracks[s.selectedVesselId] : undefined));
  const rawEvents = useMarintStore((s) => s.events);
  const eventsForVessel = useMarintStore((s) => s.eventsForVessel);
  const demoNow = useMarintStore((s) => s.demoNow);
  const effectiveTimeMs = useMarintStore((s) => s.effectiveTimeMs());
  const isLive = useMarintStore((s) => s.isLive());
  const selectVessel = useMarintStore((s) => s.selectVessel);
  const mapInstance = useMarintStore((s) => s.mapInstance);
  const [tab, setTab] = useState<Tab>("overview");
  // Mobile bottom-sheet only: starts COMPACT (identity preview, map stays
  // mostly visible) and only reveals the full tabbed workspace once
  // EXPANDED. Reset to compact + Overview whenever a different vessel is
  // selected -- carrying over a previous vessel's expanded/tab state reads
  // as a stale/broken sheet, not a preserved preference.
  const [sheetState, setSheetState] = useState<"compact" | "expanded">("compact");

  // Everything shown here — position, risk, AIS state, track, events — is
  // derived at the current playback (or live) time, never the vessel's
  // final/latest state, so scrubbing backward genuinely shows the past.
  const vessel = useMemo(
    () => (rawVessel ? vesselAtTime(rawVessel, rawTrack, rawEvents, effectiveTimeMs) : undefined),
    [rawVessel, rawTrack, rawEvents, effectiveTimeMs]
  );
  const track = useMemo(() => trackUpToTime(rawTrack, effectiveTimeMs), [rawTrack, effectiveTimeMs]);
  const vesselEvents = useMemo(
    () => (selectedVesselId ? eventsForVessel(selectedVesselId).filter((e) => new Date(e.ts).getTime() <= effectiveTimeMs) : []),
    [selectedVesselId, eventsForVessel, effectiveTimeMs]
  );

  // A newly-selected vessel always opens on Overview, compact — carrying
  // over a previous vessel's "History" tab or expanded sheet reads as a
  // stale/broken state, not a preserved preference.
  useEffect(() => {
    setTab("overview");
    setSheetState("compact");
  }, [selectedVesselId]);

  // Keep the selected vessel's marker visible above the mobile sheet by
  // padding the map's bottom edge to match whatever the sheet currently
  // occupies -- desktop has no bottom sheet, so this is fully gated off
  // there. Resets to 0 as soon as nothing is selected (sheet closed).
  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth >= 1024 || !mapInstance) return;
    const vh = window.innerHeight;
    const paddingVh = !selectedVesselId ? 0 : sheetState === "expanded" ? EXPANDED_SHEET_VH : COMPACT_SHEET_VH;
    mapInstance.easeTo({ padding: { top: 0, bottom: Math.round((vh * paddingVh) / 100), left: 0, right: 0 }, duration: 250 });
  }, [mapInstance, selectedVesselId, sheetState]);

  if (!vessel || !selectedVesselId) return null;
  const c = vessel.current;

  const header = (
    <div className="p-4 border-b border-hairline shrink-0">
      {!isLive && (
        <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan mb-2">
          As of {formatDateTime(new Date(effectiveTimeMs).toISOString())}
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-ink/40 mb-0.5">{vessel.type_label}</div>
          <h2 className="text-lg font-semibold text-ink truncate">{vessel.name}</h2>
          <div className="text-[12px] text-ink/50 mt-0.5 flex items-center gap-1.5">
            <FlagIcon country={vessel.flag} className="h-2.5 w-4" />
            {countryName(vessel.flag)} flagged
          </div>
        </div>
        <button onClick={() => selectVessel(null)} className="text-ink/40 hover:text-ink text-lg leading-none px-1">×</button>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span
          className="text-[11px] font-medium px-2 py-1 rounded-md"
          style={{ background: `${riskBandColor(vessel.risk_band)}22`, color: riskBandColor(vessel.risk_band) }}
        >
          {vessel.risk_band_label} risk · {vessel.risk_score}/100
        </span>
        {c && !c.ais_active && (
          <span className="text-[11px] font-medium px-2 py-1 rounded-md bg-status-dark-vessel/15 text-status-dark-vessel">AIS inactive</span>
        )}
      </div>
      {vessel.scenario && (
        <Link
          to={`/investigation/${vessel.id}`}
          className="mt-3 flex items-center justify-center gap-1.5 w-full text-[12.5px] font-medium py-2 rounded-full bg-cyan text-navy-deep hover:bg-cyan-light transition-colors shadow-sm"
        >
          Open Investigation →
        </Link>
      )}
    </div>
  );

  const hero = (
    <div className="h-40 sm:h-44 shrink-0 bg-surface-2 border-b border-hairline relative overflow-hidden">
      {vessel.image ? (
        <>
          <img
            src={`/ships/${vessel.image}`}
            alt={vessel.name}
            className={clsx("h-full w-full object-cover transition-all", c && !c.ais_active && "grayscale-[70%] brightness-[0.55] scale-[1.03]")}
          />
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-surface-2/95 to-transparent pointer-events-none" />
          {c && !c.ais_active && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-surface-2/25">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-status-dark-vessel bg-surface-0/70 px-2.5 py-1 rounded">
                AIS inactive
              </span>
              <span className="text-[10.5px] text-ink/70 bg-surface-0/60 px-2 py-0.5 rounded">Showing last known identity</span>
            </div>
          )}
        </>
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/70">Identity unconfirmed</span>
          <span className="text-[10.5px] text-ink/40">No confirmed visual identity — see satellite evidence</span>
        </div>
      )}
    </div>
  );

  const quickStats = c && (
    <div className="grid grid-cols-3 gap-px bg-hairline border-b border-hairline text-center shrink-0">
      <Stat label="Speed" value={`${c.sog.toFixed(1)} kn`} />
      <Stat label="Course" value={formatDeg(c.cog)} />
      <Stat label="Status" value={c.nav_status} small />
    </div>
  );

  const TAB_LIST = ["overview", "ais", "history", "events", "copilot"] as Tab[];
  const tabLabel = (t: Tab) => (t === "ais" ? "AIS" : t === "copilot" ? "Co-Pilot" : t);

  // Desktop — unchanged even-width pill row.
  const tabBar = (
    <div className="flex gap-1 border-b border-hairline text-[12px] shrink-0 p-1.5 bg-surface-2/60">
      {TAB_LIST.map((t) => (
        <button
          key={t}
          onClick={() => setTab(t)}
          className={clsx(
            "flex-1 py-1.5 rounded-lg capitalize font-medium transition-colors",
            tab === t ? "bg-surface-1 text-ink shadow-sm" : "text-ink/40 hover:text-ink/70"
          )}
        >
          {tabLabel(t)}
        </button>
      ))}
    </div>
  );

  // Mobile — natural-width, horizontally-scrollable pills instead of forced
  // equal stretch (5 labels stretched across ~360px read as cramped), each
  // with a generous ~44px touch target and touch-action: manipulation so a
  // tap registers immediately rather than waiting to see if it's the start
  // of a scroll/zoom gesture.
  const mobileTabBar = (
    <div className="flex gap-1.5 border-b border-hairline text-[12px] shrink-0 p-2 bg-surface-2/60 overflow-x-auto">
      {TAB_LIST.map((t) => (
        <button
          key={t}
          onClick={() => setTab(t)}
          style={{ touchAction: "manipulation" }}
          className={clsx(
            "shrink-0 px-3.5 min-h-[38px] rounded-lg capitalize font-medium transition-colors whitespace-nowrap",
            tab === t ? "bg-surface-1 text-ink shadow-sm" : "text-ink/50 active:bg-ink/5"
          )}
        >
          {tabLabel(t)}
        </button>
      ))}
    </div>
  );

  const tabContent = (
    <div className="flex-1 overflow-y-auto overscroll-contain p-4 text-[13px]">
      {tab === "overview" && (
        <div className="space-y-5">
          <FieldGrid
            fields={[
              ["IMO", vessel.imo],
              ["MMSI", vessel.mmsi],
              ["Callsign", vessel.callsign],
              ["Length", `${vessel.length} m`],
              ["Beam", `${vessel.beam} m`],
              ["Flag", <span className="flex items-center gap-1.5"><FlagIcon country={vessel.flag} className="h-2.5 w-4" />{countryName(vessel.flag)}</span>],
              ["Origin", vessel.origin],
              ["Destination", vessel.destination],
              ["Last update", c && demoNow ? formatTimeAgo(c.ts, demoNow) : "—"],
            ]}
          />
          <div>
            <div className="text-[11px] uppercase tracking-wider text-ink/40 mb-2">Risk score breakdown</div>
            <div className="space-y-1.5">
              {vessel.risk_factors.map((f) => (
                <div key={f.code} className="flex items-center justify-between rounded-md bg-surface-2 px-2.5 py-1.5">
                  <span className="text-ink/70">{f.label}</span>
                  <span className={clsx("font-mono text-xs", f.delta > 5 ? "text-status-warning" : "text-ink/50")}>
                    +{f.delta}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between px-2.5 pt-1 font-medium">
                <span className="text-ink/80">Total</span>
                <span style={{ color: riskBandColor(vessel.risk_band) }}>{vessel.risk_score} / 100</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "ais" && c && (
        <div className="space-y-5">
          <FieldGrid
            fields={[
              ["Position", formatCoord(c.lat, c.lon)],
              ["Speed over ground", `${c.sog.toFixed(1)} kn`],
              ["Course over ground", formatDeg(c.cog)],
              ["Heading", formatDeg(c.heading)],
              ["Navigation status", c.nav_status],
              ["AIS transmission", c.ais_active ? "Active" : "Inactive — see Events"],
              ["Last report", `${formatDateTime(c.ts)} (${demoNow ? formatTimeAgo(c.ts, demoNow) : ""})`],
            ]}
          />
          <p className="text-ink/40 text-[12px] leading-relaxed">
            AIS source: terrestrial / satellite AIS (simulated). MMSI {vessel.mmsi} · Callsign {vessel.callsign}.
          </p>
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-4">
          {track && track.length > 1 ? (
            <>
              <FieldGrid
                fields={[
                  ["Track points", String(track.length)],
                  ["First position", formatClock(track[0].ts) + " · " + formatCoord(track[0].lat, track[0].lon)],
                  ["Latest position", formatClock(track[track.length - 1].ts) + " · " + formatCoord(track[track.length - 1].lat, track[track.length - 1].lon)],
                ]}
              />
              <p className="text-ink/40 text-[12px] leading-relaxed">
                Route history is rendered as a track line on the operational map for the selected vessel, from {vessel.origin} toward {vessel.destination}.
              </p>
            </>
          ) : (
            <p className="text-ink/40">No track history available in the current window.</p>
          )}
        </div>
      )}

      {tab === "events" && <EventTimeline events={vesselEvents} />}

      {tab === "copilot" && (
        <AiCopilot key={vessel.id} vessel={vessel} events={vesselEvents} track={track} showQuickActions={false} asOfTime={new Date(effectiveTimeMs).toISOString()} />
      )}
    </div>
  );

  return (
    <>
      {/* Desktop — unchanged right-hand panel */}
      <aside className="hidden lg:flex w-[380px] shrink-0 border-l border-hairline bg-surface-1 flex-col overflow-hidden">
        {header}
        {hero}
        {quickStats}
        {tabBar}
        {tabContent}
      </aside>

      {/* Mobile — bottom sheet, map stays visible above it. Anchored just
          above the collapsed mobile timeline bar (56px + safe area) rather
          than flush to the viewport bottom, so the timeline stays reachable
          — otherwise this sheet's higher stacking order blocks its clicks. */}
      <div
        className="lg:hidden fixed inset-x-0 z-30 flex flex-col"
        style={{ bottom: "calc(56px + env(safe-area-inset-bottom))" }}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="bg-surface-1 border border-hairline rounded-t-2xl flex flex-col overflow-hidden mx-auto w-full transition-[height] duration-300 ease-out"
          style={{ height: sheetState === "expanded" ? `${EXPANDED_SHEET_VH}dvh` : `${COMPACT_SHEET_VH}dvh`, boxShadow: "var(--shadow-soft)" }}
        >
          {sheetState === "compact" ? (
            <>
              <button
                onClick={() => setSheetState("expanded")}
                aria-label="Expand vessel details"
                style={{ touchAction: "manipulation" }}
                className="flex justify-center pt-2 pb-1.5 shrink-0 w-full"
              >
                <span className="h-1 w-10 rounded-full bg-ink/20" />
              </button>

              {/* Identity preview — no tabs, no full hero. A small
                  right-aligned photo thumbnail (not a full-width hero image)
                  is enough to confirm identity at a glance while the map
                  stays the dominant element on screen. */}
              <div className="flex items-start gap-3 px-4 pb-3 min-h-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] uppercase tracking-wider text-ink/40">{vessel.type_label}</span>
                    {c && !c.ais_active && (
                      <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-status-dark-vessel/15 text-status-dark-vessel">
                        AIS inactive
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-semibold text-ink truncate mt-0.5">{vessel.name}</h2>
                  <div className="flex items-center gap-1.5 text-[11px] text-ink/50 mt-1">
                    <FlagIcon country={vessel.flag} className="h-2.5 w-4" />
                    {countryName(vessel.flag)}
                  </div>
                  <span
                    className="inline-block mt-1.5 text-[10.5px] font-medium px-2 py-0.5 rounded-md"
                    style={{ background: `${riskBandColor(vessel.risk_band)}22`, color: riskBandColor(vessel.risk_band) }}
                  >
                    {vessel.risk_band_label} risk · {vessel.risk_score}/100
                  </span>
                </div>
                <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-surface-2 relative">
                  {vessel.image ? (
                    <img
                      src={`/ships/${vessel.image}`}
                      alt={vessel.name}
                      className={clsx("h-full w-full object-cover", c && !c.ais_active && "grayscale-[70%] brightness-[0.6]")}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-center px-1">
                      <span className="text-[8px] text-ink/40 leading-tight">No image</span>
                    </div>
                  )}
                </div>
                <button onClick={() => selectVessel(null)} className="text-ink/40 hover:text-ink text-lg leading-none shrink-0">×</button>
              </div>

              {quickStats}

              <button
                onClick={() => setSheetState("expanded")}
                style={{ touchAction: "manipulation" }}
                className="w-full text-center text-[12px] font-medium text-cyan py-2 border-t border-hairline shrink-0"
              >
                More details ▾
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setSheetState("compact")}
                aria-label="Collapse vessel details"
                style={{ touchAction: "manipulation" }}
                className="flex justify-center pt-2 pb-1.5 shrink-0 w-full"
              >
                <span className="h-1 w-10 rounded-full bg-ink/20" />
              </button>
              {header}
              {hero}
              {quickStats}
              {mobileTabBar}
              {tabContent}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="bg-surface-1 py-2.5 px-1">
      <div className={clsx("font-semibold text-ink", small ? "text-[11px] truncate px-1" : "text-sm")}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-ink/35 mt-0.5">{label}</div>
    </div>
  );
}

function FieldGrid({ fields }: { fields: [string, string | React.ReactNode][] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
      {fields.map(([label, value]) => (
        <div key={label}>
          <div className="text-[10px] uppercase tracking-wider text-ink/35">{label}</div>
          <div className="text-ink/85 mt-0.5 break-words">{value}</div>
        </div>
      ))}
    </div>
  );
}
