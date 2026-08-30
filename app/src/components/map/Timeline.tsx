import { useMemo, useState } from "react";
import clsx from "clsx";
import { useMarintStore } from "../../lib/store";
import { formatClock, formatDateTime } from "../../lib/format";
import type { MarintEvent } from "../../types";

const SPEEDS = [1, 2, 4, 8, 16];

// Height of the mobile collapsed bar — other mobile-only floating controls
// (Sidebar's Alerts/Vessels trigger) are positioned relative to this so
// nothing overlaps it.
const MOBILE_TIMELINE_H = 56;

const MARKER_STYLE: Record<string, { label: string; color: string }> = {
  ais_gap: { label: "AIS Loss", color: "#e0a530" },
  sar_detection: { label: "SAR Detection", color: "#b754e0" },
  optical_detection: { label: "Optical Detection", color: "#39c2a0" },
  ship_to_ship_start: { label: "Ship-to-Ship", color: "#e0a530" },
  route_deviation: { label: "Route Deviation", color: "#e0a530" },
  loitering_detected: { label: "Loitering", color: "#e0a530" },
  ais_position_jump: { label: "AIS Anomaly", color: "#e0a530" },
  restricted_area_entry: { label: "Restricted Area", color: "#e0a530" },
  dark_vessel_alert: { label: "Alert", color: "#e0483f" },
};
function markerFor(e: MarintEvent) {
  return MARKER_STYLE[e.kind] ?? (e.severity ? { label: "Alert", color: "#e0483f" } : null);
}

// UTC-labeled <input type="datetime-local"> value/parse — the demo dataset
// is entirely UTC ("Z" timestamps everywhere else in the app), so this
// treats the picker's wall-clock value as UTC directly rather than the
// viewer's local timezone, keeping it consistent with formatClock/formatDateTime.
function toLocalInputValue(ms: number): string {
  return new Date(ms).toISOString().slice(0, 16);
}
function fromLocalInputValue(v: string): number {
  return new Date(v + ":00.000Z").getTime();
}

export default function Timeline() {
  const events = useMarintStore((s) => s.events);
  const selectedVesselId = useMarintStore((s) => s.selectedVesselId);
  const selectVessel = useMarintStore((s) => s.selectVessel);
  const demoNow = useMarintStore((s) => s.demoNow);
  const demoWindowStart = useMarintStore((s) => s.demoWindowStart);
  const playing = useMarintStore((s) => s.playing);
  const playbackSpeed = useMarintStore((s) => s.playbackSpeed);
  const isLive = useMarintStore((s) => s.isLive());
  const effectiveTimeMs = useMarintStore((s) => s.effectiveTimeMs());
  const setPlaybackTime = useMarintStore((s) => s.setPlaybackTime);
  const stepPlayback = useMarintStore((s) => s.stepPlayback);
  const setPlaybackSpeed = useMarintStore((s) => s.setPlaybackSpeed);
  const play = useMarintStore((s) => s.play);
  const pause = useMarintStore((s) => s.pause);
  const goLive = useMarintStore((s) => s.goLive);

  const [hoverEvent, setHoverEvent] = useState<MarintEvent | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const minMs = demoWindowStart ? new Date(demoWindowStart).getTime() : 0;
  const maxMs = demoNow ? new Date(demoNow).getTime() : 0;
  const span = Math.max(1, maxMs - minMs);
  const progressPct = Math.min(100, Math.max(0, ((effectiveTimeMs - minMs) / span) * 100));

  const markers = useMemo(
    () =>
      events
        .map((e) => ({ e, style: markerFor(e) }))
        .filter((m): m is { e: MarintEvent; style: { label: string; color: string } } => !!m.style),
    [events]
  );

  if (!demoNow || !demoWindowStart) return null;

  const scrubber = (
    <div className="relative flex-1 min-w-[160px] h-7 flex items-center">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div className="h-full bg-cyan/50" style={{ width: `${progressPct}%` }} />
      </div>
      {markers.map(({ e, style }) => {
        const pct = Math.min(100, Math.max(0, ((new Date(e.ts).getTime() - minMs) / span) * 100));
        const emphasized = selectedVesselId && (e.vessel_id === selectedVesselId || e.related_vessel_id === selectedVesselId);
        return (
          <button
            key={e.id}
            onMouseEnter={() => setHoverEvent(e)}
            onMouseLeave={() => setHoverEvent((cur) => (cur?.id === e.id ? null : cur))}
            onClick={() => {
              setPlaybackTime(e.ts);
              selectVessel(e.vessel_id);
            }}
            title={`${style.label} — ${e.title} (${formatClock(e.ts)})`}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-navy-deep/40 transition-transform hover:scale-125"
            style={{
              left: `${pct}%`,
              width: emphasized ? 10 : 7,
              height: emphasized ? 10 : 7,
              background: style.color,
              boxShadow: emphasized ? `0 0 0 2px ${style.color}55` : undefined,
            }}
          />
        );
      })}
      <input
        type="range"
        min={minMs}
        max={maxMs}
        step={60000}
        value={effectiveTimeMs}
        onChange={(e) => {
          const ms = Number(e.target.value);
          setPlaybackTime(ms >= maxMs ? null : new Date(ms).toISOString());
        }}
        className="relative w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-surface-0 [&::-webkit-slider-thumb]:shadow"
      />
    </div>
  );

  const liveButton = (
    <button
      onClick={goLive}
      className={clsx(
        "shrink-0 text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-md border transition-colors",
        isLive ? "bg-status-normal/15 text-status-normal border-status-normal/30" : "text-ink/50 border-hairline hover:text-ink hover:border-ink/25"
      )}
    >
      ● Live
    </button>
  );

  const datePicker = (
    <input
      type="datetime-local"
      value={toLocalInputValue(effectiveTimeMs)}
      min={toLocalInputValue(minMs)}
      max={toLocalInputValue(maxMs)}
      onChange={(e) => {
        if (!e.target.value) return;
        const ms = Math.min(maxMs, Math.max(minMs, fromLocalInputValue(e.target.value)));
        setPlaybackTime(ms >= maxMs ? null : new Date(ms).toISOString());
      }}
      className="shrink-0 bg-surface-2 border border-hairline rounded-md px-2 py-1 text-[11px] text-ink outline-none focus:border-cyan/50"
    />
  );

  const transport = (
    <div className="flex items-center gap-1 shrink-0">
      <button
        onClick={() => stepPlayback(-15)}
        title="Back 15 minutes"
        className="h-7 w-7 flex items-center justify-center rounded-md text-ink/60 hover:text-ink hover:bg-ink/5 transition-colors"
      >
        ⏮
      </button>
      <button
        onClick={() => (playing ? pause() : play())}
        title={playing ? "Pause" : "Play"}
        className="h-7 w-7 flex items-center justify-center rounded-md bg-cyan/15 text-cyan hover:bg-cyan/25 transition-colors"
      >
        {playing ? "⏸" : "▶"}
      </button>
      <button
        onClick={() => stepPlayback(15)}
        title="Forward 15 minutes"
        className="h-7 w-7 flex items-center justify-center rounded-md text-ink/60 hover:text-ink hover:bg-ink/5 transition-colors"
      >
        ⏭
      </button>
    </div>
  );

  const speedPicker = (
    <div className="flex items-center gap-0.5 shrink-0 bg-surface-2 border border-hairline rounded-md p-0.5">
      {SPEEDS.map((sp) => (
        <button
          key={sp}
          onClick={() => setPlaybackSpeed(sp)}
          className={clsx(
            "text-[10.5px] px-1.5 py-1 rounded transition-colors",
            playbackSpeed === sp ? "bg-cyan/20 text-cyan font-medium" : "text-ink/45 hover:text-ink/70"
          )}
        >
          {sp}×
        </button>
      ))}
    </div>
  );

  return (
    <>
      {/* Desktop — unchanged full bar */}
      <div
        className="hidden lg:flex absolute left-3 right-20 bottom-3 z-10 bg-surface-1/95 border border-hairline rounded-xl px-3.5 py-3 flex-wrap items-center gap-x-3 gap-y-2"
        style={{ boxShadow: "var(--shadow-soft)" }}
      >
        <div className="flex items-center gap-1.5 shrink-0 min-w-[168px]">
          {isLive ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-status-normal animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink/80">Live</span>
            </>
          ) : (
            <div className="leading-tight">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan">Historical playback</div>
              <div className="text-[11px] text-ink/60 font-mono">{formatDateTime(new Date(effectiveTimeMs).toISOString())}</div>
            </div>
          )}
        </div>
        {datePicker}
        {transport}
        {speedPicker}
        {scrubber}
        {liveButton}
        {hoverEvent && (
          <div className="basis-full text-[11px] text-ink/50 px-1 -mt-1">
            {hoverEvent.title} — {formatDateTime(hoverEvent.ts)}
          </div>
        )}
      </div>

      {/* Mobile — collapsed bar */}
      <div
        className="lg:hidden fixed inset-x-3 z-20 bg-surface-1/95 border border-hairline rounded-xl px-3 flex items-center gap-2"
        style={{ bottom: "env(safe-area-inset-bottom)", height: MOBILE_TIMELINE_H, boxShadow: "var(--shadow-soft)" }}
      >
        {isLive ? (
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-status-normal animate-pulse" />
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink/80">Live</span>
          </span>
        ) : (
          <span className="text-[10.5px] text-ink/70 font-mono truncate shrink-0 max-w-[110px]">
            {formatDateTime(new Date(effectiveTimeMs).toISOString())}
          </span>
        )}
        <button
          onClick={() => (playing ? pause() : play())}
          className="h-7 w-7 flex items-center justify-center rounded-md bg-cyan/15 text-cyan shrink-0"
        >
          {playing ? "⏸" : "▶"}
        </button>
        <div className="flex-1" />
        {!isLive && (
          <button onClick={goLive} className="text-[10px] font-semibold uppercase tracking-wider text-status-normal shrink-0 px-1.5">
            ● Live
          </button>
        )}
        <button
          onClick={() => setMobileExpanded((v) => !v)}
          aria-label={mobileExpanded ? "Collapse timeline" : "Expand timeline"}
          className="h-7 w-7 flex items-center justify-center rounded-md text-ink/60 hover:text-ink shrink-0"
        >
          {mobileExpanded ? "▾" : "▴"}
        </button>
      </div>

      {/* Mobile — expanded controls. z-40 (above the vessel/alerts bottom
          sheets, both z-30) so expanding the timeline stays usable even
          while one of those sheets is also open, instead of rendering
          invisibly underneath it. */}
      {mobileExpanded && (
        <div
          className="lg:hidden fixed inset-x-3 z-40 bg-surface-1 border border-hairline rounded-xl p-3 flex flex-col gap-2.5"
          style={{ bottom: `calc(${MOBILE_TIMELINE_H}px + env(safe-area-inset-bottom) + 8px)`, boxShadow: "var(--shadow-soft)" }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            {datePicker}
            {transport}
          </div>
          <div className="flex items-center gap-2">{speedPicker}</div>
          <div className="flex items-center gap-2">{scrubber}</div>
          {hoverEvent && (
            <div className="text-[11px] text-ink/50">
              {hoverEvent.title} — {formatDateTime(hoverEvent.ts)}
            </div>
          )}
        </div>
      )}
    </>
  );
}
