import { useScrollScene } from "./motion/useScrollScene";
import { prefersReducedMotion } from "./motion/gsapSetup";
import { pinnedScrollTrigger, pinInnerStyle, responsivePinVh, sectionHeightVh } from "./motion/pinConfig";
import CaspianMap from "./motion/CaspianMap";
import WorldBackdrop from "./motion/WorldBackdrop";
import { CASPIAN_PORTS_XY } from "./motion/caspianPath";
import { useTheme } from "../../lib/theme";

const LABELS = [
  "A VESSEL CAN SWITCH OFF AIS.",
  "BUT IT CANNOT DISAPPEAR FROM THE SEA.",
  "SAR DETECTION",
  "MARINT CORRELATES AIS + SATELLITE EVIDENCE.",
  "POSSIBLE DARK VESSEL",
];

const START = CASPIAN_PORTS_XY.turkmenbashi;
const MID: [number, number] = [450, 500];
const GAP: [number, number] = [498, 462];
const PREDICTED: [number, number] = [455, 425];
const SAR: [number, number] = [468, 428];

export default function DarkVesselStory() {
  const [theme] = useTheme();
  const isDark = theme === "dark";
  const PIN_VH = responsivePinVh(230, 150);
  const rootRef = useScrollScene<HTMLDivElement>(({ gsap, scope }) => {
    const labels = Array.from(scope.querySelectorAll<HTMLElement>("[data-label]"));
    const vessel = scope.querySelector<SVGCircleElement>("[data-vessel]");
    const track = scope.querySelector<SVGPathElement>("[data-track]");
    const predicted = scope.querySelector<SVGPathElement>("[data-predicted]");
    const footprint = scope.querySelector<SVGGElement>("[data-footprint]");
    const correlation = scope.querySelector<SVGGElement>("[data-correlation]");
    const detectionRing = scope.querySelector<SVGGElement>("[data-detection-ring]");
    const finalSub = scope.querySelector<HTMLElement>("[data-final-sub]");
    const pinEl = scope.querySelector<HTMLElement>("[data-pin-inner]");
    if (!pinEl || !labels.length || !vessel || !track || !predicted || !footprint || !correlation || !detectionRing) return;

    if (prefersReducedMotion()) {
      gsap.set(labels, { opacity: 0 });
      gsap.set(labels[labels.length - 1], { opacity: 1 });
      gsap.set([track, footprint, correlation, detectionRing], { opacity: 1 });
      gsap.set(finalSub, { opacity: 1 });
      gsap.set(vessel, { opacity: 0 });
      return;
    }

    const trackLen = track.getTotalLength();
    gsap.set(track, { strokeDasharray: trackLen, strokeDashoffset: trackLen });
    const predLen = predicted.getTotalLength();
    gsap.set(predicted, { strokeDasharray: predLen, strokeDashoffset: predLen, opacity: 0.5 });
    gsap.set(vessel, { attr: { cx: START[0], cy: START[1] }, opacity: 1 });
    gsap.set(footprint, { opacity: 0, scale: 0.8, transformOrigin: `${SAR[0]}px ${SAR[1]}px` });
    gsap.set(correlation, { opacity: 0 });
    gsap.set(detectionRing, { opacity: 0, scale: 0.5, transformOrigin: `${SAR[0]}px ${SAR[1]}px` });
    gsap.set(labels, { opacity: 0, y: 14 });
    gsap.set(finalSub, { opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: pinnedScrollTrigger(scope, pinEl),
      defaults: { ease: "none" },
    });

    const steps = 5;
    labels.forEach((label, i) => {
      const start = i * (1 / steps);
      tl.fromTo(label, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.07 }, start);
      if (i < labels.length - 1) tl.to(label, { opacity: 0, y: -14, duration: 0.07 }, start + 0.09);
    });

    tl.to(track, { strokeDashoffset: 0, duration: 0.18 }, 0)
      .to(vessel, { attr: { cx: MID[0], cy: MID[1] }, duration: 0.09 }, 0)
      .to(vessel, { attr: { cx: GAP[0], cy: GAP[1] }, duration: 0.09 }, 0.09)
      .to(vessel, { opacity: 0, duration: 0.05 }, 0.2)
      .to(predicted, { strokeDashoffset: 0, duration: 0.16 }, 0.22)
      .to(footprint, { opacity: 1, scale: 1, duration: 0.14 }, 0.42)
      .to(correlation, { opacity: 1, duration: 0.14 }, 0.64)
      .to(detectionRing, { opacity: 1, scale: 1, duration: 0.12 }, 0.82)
      .to(finalSub, { opacity: 1, duration: 0.12 }, 0.9);
  });

  return (
    <section ref={rootRef} className="relative bg-home-bg" style={{ height: sectionHeightVh(PIN_VH) }}>
    <div data-pin-inner className="relative min-h-[640px] overflow-hidden" style={pinInnerStyle()}>
      <p className="absolute top-14 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.3em] text-status-dark-vessel/70">
        The dark vessel problem
      </p>
      <WorldBackdrop
        className="absolute inset-0 h-full w-full"
        zoom={2.6}
        landOpacity={isDark ? 0.35 : 0.5}
        seaOpacity={isDark ? 0.2 : 0.35}
        landColor={isDark ? "#1a3552" : "#c7d9e6"}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[80%] aspect-square rounded-full pointer-events-none"
        style={{
          background: isDark
            ? "radial-gradient(circle, rgba(8,29,51,0.88) 0%, rgba(8,29,51,0.6) 45%, transparent 72%)"
            : "radial-gradient(circle, rgba(244,249,252,0.92) 0%, rgba(244,249,252,0.68) 45%, transparent 72%)",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center pb-28">
        <CaspianMap
          className={isDark ? "h-[70%] w-auto drop-shadow-[0_0_60px_rgba(8,29,51,0.9)]" : "h-[70%] w-auto drop-shadow-[0_0_50px_rgba(143,217,255,0.55)]"}
          seaFill={isDark ? "#0d2033" : "#dbeefb"}
        >
          <path data-track d={`M${START[0]},${START[1]} L${MID[0]},${MID[1]} L${GAP[0]},${GAP[1]}`} fill="none" stroke="#2fa7d6" strokeWidth={2.4} />
          <path data-predicted d={`M${GAP[0]},${GAP[1]} L${PREDICTED[0]},${PREDICTED[1]}`} fill="none" stroke="#4c6b85" strokeWidth={2} strokeDasharray="3 4" />
          <circle data-vessel cx={START[0]} cy={START[1]} r={7} fill="#2fa7d6" />

          <g data-footprint>
            <rect x={SAR[0] - 40} y={SAR[1] - 62} width={80} height={124} fill="#b754e0" fillOpacity={0.14} stroke="#b754e0" strokeOpacity={0.7} strokeDasharray="4 3" transform={`rotate(-12 ${SAR[0]} ${SAR[1]})`} />
          </g>

          <g data-correlation>
            <path d={`M${GAP[0]},${GAP[1]} L${SAR[0]},${SAR[1]}`} fill="none" stroke="#e0483f" strokeWidth={1.4} strokeDasharray="2 4" opacity={0.7} />
            <circle cx={GAP[0]} cy={GAP[1]} r={4.5} fill="#4c6b85" />
          </g>

          <g data-detection-ring>
            <circle cx={SAR[0]} cy={SAR[1]} r={5} fill="#e0483f" />
            <circle cx={SAR[0]} cy={SAR[1]} r={16} fill="none" stroke="#e0483f" strokeWidth={2} opacity={0.6} />
          </g>
        </CaspianMap>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-end pb-24 md:pb-32 pointer-events-none px-6">
        <div className="relative h-[3.2em] w-full flex items-center justify-center">
          {LABELS.map((l) => (
            <span key={l} data-label className="absolute text-center font-display font-semibold text-home-ink text-[7.5vw] md:text-[3.4vw] tracking-tight">
              {l}
            </span>
          ))}
        </div>
        <p data-final-sub className="mt-4 text-cyan text-sm md:text-base tracking-wide">
          MARINT connects the evidence.
        </p>
      </div>
    </div>
    </section>
  );
}
