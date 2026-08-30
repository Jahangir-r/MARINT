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

export default function MapControls() {
  const layers = useMarintStore((s) => s.layers);
  const toggleLayer = useMarintStore((s) => s.toggleLayer);
  const mapInstance = useMarintStore((s) => s.mapInstance);
  const [is3D, setIs3D] = useState(false);

  function recenter() {
    mapInstance?.easeTo({ center: CASPIAN_CENTER, zoom: CASPIAN_ZOOM, pitch: mapInstance.getPitch(), bearing: 0, duration: 900 });
  }

  function toggleView() {
    const next = !is3D;
    setIs3D(next);
    mapInstance?.easeTo({ pitch: next ? 55 : 0, bearing: next ? -12 : 0, duration: 700 });
  }

  return (
    <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
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
  );
}
