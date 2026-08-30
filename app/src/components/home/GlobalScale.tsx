import { useRef } from "react";
import { useScrollScene } from "./motion/useScrollScene";
import { prefersReducedMotion } from "./motion/gsapSetup";
import { pinnedScrollTrigger, pinInnerStyle, responsivePinVh, sectionHeightVh } from "./motion/pinConfig";
import WorldBackdrop, { computeWorldTransform } from "./motion/WorldBackdrop";
import { CASPIAN_CENTER_WORLD } from "./motion/useWorldMapPaths";
import { useTheme } from "../../lib/theme";

const PHRASES = ["BORN IN THE CASPIAN.", "BUILT FOR GLOBAL WATERS."];
// Pulls back from a tight Caspian view to a moderately wider regional view —
// enough to read as "part of a larger, global-capable system" without
// zooming all the way out to a mostly-empty full-globe composition.
const ZOOM_START = 6.5;
const ZOOM_END = 2.5;

export default function GlobalScale() {
  const worldGroupRef = useRef<SVGGElement>(null);
  const [theme] = useTheme();
  const isDark = theme === "dark";
  const PIN_VH = responsivePinVh(150, 100);

  const rootRef = useScrollScene<HTMLDivElement>(({ gsap, scope }) => {
    const pinEl = scope.querySelector<HTMLElement>("[data-pin-inner]");
    const eyebrow = scope.querySelector<HTMLElement>("[data-eyebrow]");
    const lines = Array.from(scope.querySelectorAll<HTMLElement>("[data-line]"));
    const marker = scope.querySelector<SVGGElement>("[data-marker]");
    const worldGroup = worldGroupRef.current;
    if (!pinEl || !worldGroup || !lines.length) return;

    if (prefersReducedMotion()) {
      worldGroup.setAttribute("transform", computeWorldTransform((ZOOM_START + ZOOM_END) / 2));
      gsap.set(eyebrow, { opacity: 1 });
      gsap.set(lines, { opacity: 1, y: 0 });
      gsap.set(marker, { opacity: 1 });
      return;
    }

    gsap.set(eyebrow, { opacity: 0 });
    gsap.set(lines, { opacity: 0, y: 14 });
    gsap.set(marker, { opacity: 0 });
    const zoomState = { z: ZOOM_START };
    worldGroup.setAttribute("transform", computeWorldTransform(zoomState.z));

    const tl = gsap.timeline({
      scrollTrigger: pinnedScrollTrigger(scope, pinEl),
      defaults: { ease: "none" },
    });

    // The zoom-out, the marker, and the two-line reveal are woven together
    // across the whole scroll range instead of front-loading the motion and
    // leaving a static tail — the marker appears early so the frame never
    // reads as empty while the world pulls back.
    tl.fromTo(marker, { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0)
      .fromTo(eyebrow, { opacity: 0 }, { opacity: 1, duration: 0.12 }, 0.04)
      .to(
        zoomState,
        {
          z: ZOOM_END,
          duration: 0.86,
          onUpdate: () => worldGroup.setAttribute("transform", computeWorldTransform(zoomState.z)),
        },
        0.06
      )
      // Line 1 appears and stays — line 2 joins beneath it rather than
      // replacing it, so the two phrases never fade in/out over the same
      // spot and there is no crossfade window where both could ghost.
      .fromTo(lines[0], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.18 }, 0.22)
      .fromTo(lines[1], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.18 }, 0.56);
  });

  return (
    <section ref={rootRef} className="relative bg-home-bg" style={{ height: sectionHeightVh(PIN_VH) }}>
    <div data-pin-inner className="relative min-h-[640px] overflow-hidden" style={pinInnerStyle()}>
      <p data-eyebrow className="absolute top-14 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.3em] text-cyan/60">
        Global-ready
      </p>
      <WorldBackdropWithRef groupRef={worldGroupRef} isDark={isDark} />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none px-6">
        {PHRASES.map((p) => (
          <span key={p} data-line className="text-center font-display font-semibold text-home-ink text-[8vw] md:text-[3.8vw] tracking-tight leading-tight">
            {p}
          </span>
        ))}
      </div>
    </div>
    </section>
  );
}

function WorldBackdropWithRef({ groupRef, isDark }: { groupRef: React.RefObject<SVGGElement | null>; isDark: boolean }) {
  const [cx, cy] = CASPIAN_CENTER_WORLD;
  return (
    <WorldBackdrop
      ref={groupRef}
      className="absolute inset-0 h-full w-full"
      zoom={ZOOM_START}
      landOpacity={isDark ? 0.45 : 0.55}
      seaOpacity={isDark ? 0.6 : 0.45}
      landColor={isDark ? "#1a3552" : "#c7d9e6"}
    >
      <g data-marker transform={`translate(${cx} ${cy})`}>
        {/* Light-mode-only soft halo — invisible in dark mode via the
            --story-marker-halo-opacity token (0 there), so the always-
            approved dark appearance is unchanged. In light mode it gives
            the dot a soft glow so it doesn't blend into the pale land
            fill. */}
        <circle r={4.2} fill="#8fd9ff" style={{ opacity: "var(--story-marker-halo-opacity)" }} />
        <circle r={3.2} fill="none" stroke="var(--color-story-marker)" strokeWidth={0.6} className="animate-radar" />
        <circle r={1.4} fill="var(--color-story-marker)" />
      </g>
    </WorldBackdrop>
  );
}
