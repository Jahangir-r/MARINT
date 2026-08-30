import { useState } from "react";
import clsx from "clsx";
import { useMarintStore } from "../../lib/store";
import { CASPIAN_CENTER, CASPIAN_ZOOM } from "../../lib/mapConstants";

const TOGGLES: { key: "tracks" | "detections" | "ports" | "cities" | "radar" | "restricted"; label: string }[] = [
  { key: "tracks", label: "Tracks" },
  { key: "detections", label: "Detections" },
  { key: "ports", label: "Ports" },
  { key: "cities", label: "Cities" },
  { key: "radar", label: "Radar coverage" },
  { key: "restricted", label: "Restricted areas" },
];

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 2 8l10 5 10-5-10-5Z" />
      <path d="M2 13l10 5 10-5" />
    </svg>
  );
}

export default function MapControls() {
  const layers = useMarintStore((s) => s.layers);
  const toggleLayer = useMarintStore((s) => s.toggleLayer);
  const mapInstance = useMarintStore((s) => s.mapInstance);
  const [is3D, setIs3D] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);

  function recenter() {
    mapInstance?.easeTo({ center: CASPIAN_CENTER, zoom: CASPIAN_ZOOM, pitch: mapInstance.getPitch(), bearing: 0, duration: 900 });
  }

  function toggleView() {
    const next = !is3D;
    setIs3D(next);
    mapInstance?.easeTo({ pitch: next ? 55 : 0, bearing: next ? -12 : 0, duration: 700 });
  }

  return (
    <>
      {/* Desktop — unchanged */}
      <div className="hidden lg:flex absolute top-3 left-3 z-10 flex-col gap-2">
        <div className="flex flex-col gap-1 bg-surface-1/95 border border-hairline rounded-xl p-1.5" style={{ boxShadow: "var(--shadow-card)" }}>
          {TOGGLES.map((t) => (
            <button
              key={t.key}
              onClick={() => toggleLayer(t.key)}
              className={clsx(
                "text-[11px] px-2.5 py-1.5 rounded-lg text-left transition-colors whitespace-nowrap",
                layers[t.key] ? "bg-cyan/15 text-cyan" : "text-ink/45 hover:text-ink/75"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex bg-surface-1/95 border border-hairline rounded-xl p-1 gap-0.5" style={{ boxShadow: "var(--shadow-card)" }}>
          <button
            onClick={() => is3D && toggleView()}
            className={clsx("flex-1 text-[11px] px-2.5 py-1.5 rounded-lg transition-colors", !is3D ? "bg-cyan/15 text-cyan" : "text-ink/45 hover:text-ink/75")}
          >
            2D
          </button>
          <button
            onClick={() => !is3D && toggleView()}
            className={clsx("flex-1 text-[11px] px-2.5 py-1.5 rounded-lg transition-colors", is3D ? "bg-cyan/15 text-cyan" : "text-ink/45 hover:text-ink/75")}
          >
            3D
          </button>
        </div>

        <button
          onClick={recenter}
          className="text-[11px] px-2.5 py-1.5 rounded-xl bg-surface-1/95 border border-hairline text-ink/60 hover:text-cyan transition-colors text-left"
          style={{ boxShadow: "var(--shadow-card)" }}
          title="Recenter on the Caspian Sea"
        >
          ⟲ Recenter · Caspian
        </button>
      </div>

      {/* Mobile — only the essentials, layer toggles collapsed behind a popover */}
      <div className="lg:hidden absolute top-3 left-3 z-10 flex flex-col gap-2">
        <div className="flex bg-surface-1/95 border border-hairline rounded-xl p-1 gap-0.5" style={{ boxShadow: "var(--shadow-card)" }}>
          <button
            onClick={() => is3D && toggleView()}
            className={clsx("px-2.5 py-1.5 rounded-lg text-[11px] transition-colors", !is3D ? "bg-cyan/15 text-cyan" : "text-ink/45")}
          >
            2D
          </button>
          <button
            onClick={() => !is3D && toggleView()}
            className={clsx("px-2.5 py-1.5 rounded-lg text-[11px] transition-colors", is3D ? "bg-cyan/15 text-cyan" : "text-ink/45")}
          >
            3D
          </button>
        </div>
        <button
          onClick={recenter}
          aria-label="Recenter on the Caspian Sea"
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-surface-1/95 border border-hairline text-ink/60"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          ⟲
        </button>
        <div className="relative">
          <button
            onClick={() => setLayersOpen((v) => !v)}
            aria-label="Map layers"
            className={clsx(
              "h-9 w-9 flex items-center justify-center rounded-xl border transition-colors",
              layersOpen ? "border-cyan/40 text-cyan bg-cyan/10" : "border-hairline text-ink/60 bg-surface-1/95"
            )}
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <LayersIcon />
          </button>
          {layersOpen && (
            <div
              className="absolute top-full mt-2 left-0 flex flex-col gap-1 bg-surface-1 border border-hairline rounded-xl p-1.5 w-40 z-20"
              style={{ boxShadow: "var(--shadow-soft)" }}
            >
              {TOGGLES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => toggleLayer(t.key)}
                  className={clsx(
                    "text-[11px] px-2.5 py-1.5 rounded-lg text-left transition-colors whitespace-nowrap",
                    layers[t.key] ? "bg-cyan/15 text-cyan" : "text-ink/45"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
