import { useScrollScene } from "./motion/useScrollScene";
import { prefersReducedMotion } from "./motion/gsapSetup";
import { pinnedScrollTrigger, sectionHeightVh } from "./motion/pinConfig";

const PIN_VH = 150;
const SOURCES = [
  { key: "ais", label: "AIS", x: 150, y: 190 },
  { key: "sar", label: "SAR", x: 650, y: 170 },
  { key: "optical", label: "OPTICAL", x: 680, y: 560 },
  { key: "radar", label: "RADAR", x: 140, y: 570 },
  { key: "historical", label: "HISTORICAL DATA", x: 400, y: 110 },
];
const CENTER = { x: 400, y: 400 };
const HEADLINES = ["FRAGMENTED SIGNALS", "CORRELATED INTELLIGENCE", "ONE OPERATIONAL PICTURE"];

export default function DataFusion() {
  const rootRef = useScrollScene<HTMLDivElement>(({ gsap, scope }) => {
    const nodes = Array.from(scope.querySelectorAll<SVGGElement>("[data-node]"));
    const lines = Array.from(scope.querySelectorAll<SVGLineElement>("[data-line]"));
    const centerNode = scope.querySelector<SVGGElement>("[data-center]");
    const headlines = Array.from(scope.querySelectorAll<HTMLElement>("[data-headline]"));
    const pinEl = scope.querySelector<HTMLElement>("[data-pin-inner]");
    if (!pinEl || !nodes.length || !centerNode || !headlines.length) return;

    if (prefersReducedMotion()) {
      gsap.set(centerNode, { opacity: 0.22, scale: 0.62, transformOrigin: `${CENTER.x}px ${CENTER.y}px` });
      gsap.set(nodes, { x: (i: number) => CENTER.x - SOURCES[i].x, y: (i: number) => CENTER.y - SOURCES[i].y, opacity: 0.15 });
      gsap.set(lines, { strokeDashoffset: 0 });
      gsap.set(headlines, { opacity: 0 });
      gsap.set(headlines[headlines.length - 1], { opacity: 1 });
      return;
    }

    gsap.set(centerNode, { opacity: 0, scale: 0.6, transformOrigin: `${CENTER.x}px ${CENTER.y}px` });
    gsap.set(headlines, { opacity: 0, y: 14 });
    lines.forEach((line) => {
      const len = Math.hypot(Number(line.dataset.x2) - Number(line.dataset.x1), Number(line.dataset.y2) - Number(line.dataset.y1));
      gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
    });

    const tl = gsap.timeline({
      scrollTrigger: pinnedScrollTrigger(scope, pinEl),
      defaults: { ease: "none" },
    });

    // Headlines live in their own band at the bottom of the frame (see
    // markup) so they never sit on top of the node diagram above — the
    // "text vs. marker" competition this used to have was a spatial
    // overlap, not just a timing one, so the fix is spatial first.
    tl.fromTo(headlines[0], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.12 }, 0)
      .to(headlines[0], { opacity: 0, y: -14, duration: 0.1 }, 0.28)
      .to(lines, { strokeDashoffset: 0, duration: 0.32, stagger: 0.03 }, 0.05)
      .to(
        nodes,
        {
          x: (i) => CENTER.x - SOURCES[i].x,
          y: (i) => CENTER.y - SOURCES[i].y,
          opacity: 0.15,
          duration: 0.38,
          stagger: 0.02,
        },
        0.1
      )
      .fromTo(headlines[1], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.12 }, 0.34)
      .to(headlines[1], { opacity: 0, y: -14, duration: 0.1 }, 0.56)
      // The center node becomes the stable, uncontested focal point once
      // the sources have converged — it reaches full opacity/scale and
      // STAYS there (no fade-to-ghost afterward), so it never lingers as a
      // confusing translucent leftover behind the final headline.
      .fromTo(centerNode, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.16 }, 0.62)
      .fromTo(headlines[2], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.16 }, 0.8);
  });

  return (
    <section ref={rootRef} className="relative bg-surface-1 border-y border-hairline" style={{ height: sectionHeightVh(PIN_VH) }}>
    <div data-pin-inner className="relative h-screen min-h-[640px] overflow-hidden">
      <p className="absolute top-14 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.3em] text-cyan/60">
        Why correlation matters
      </p>
      <div className="absolute inset-0 flex items-center justify-center pb-24">
        <svg viewBox="0 0 800 800" className="h-[74%] w-auto">
          {SOURCES.map((s) => (
            <line key={s.key} data-line data-x1={s.x} data-y1={s.y} data-x2={CENTER.x} data-y2={CENTER.y} x1={s.x} y1={s.y} x2={CENTER.x} y2={CENTER.y} stroke="#2fa7d6" strokeWidth={1.4} opacity={0.5} />
          ))}
          {SOURCES.map((s) => (
            <g key={s.key} data-node>
              <circle cx={s.x} cy={s.y} r={7} fill="#2fa7d6" />
              <text x={s.x} y={s.y - 18} textAnchor="middle" fill="#8fd9ff" fontSize={15} fontWeight={600} letterSpacing="0.08em">
                {s.label}
              </text>
            </g>
          ))}
          <g data-center>
            <circle cx={CENTER.x} cy={CENTER.y} r={40} fill="none" stroke="#2fa7d6" strokeWidth={1.5} opacity={0.5} />
            <circle cx={CENTER.x} cy={CENTER.y} r={10} fill="#8fd9ff" />
            <text x={CENTER.x} y={CENTER.y + 62} textAnchor="middle" fill="var(--color-home-ink)" fontSize={20} fontWeight={700} letterSpacing="0.1em">
              MARINT
            </text>
          </g>
        </svg>
      </div>

      <div className="absolute inset-0 flex items-end justify-center pb-20 md:pb-28 pointer-events-none px-6">
        {HEADLINES.map((h) => (
          <span key={h} data-headline className="absolute text-center font-display font-semibold text-home-ink text-[8vw] md:text-[3.6vw] tracking-tight">
            {h}
          </span>
        ))}
      </div>
    </div>
    </section>
  );
}
