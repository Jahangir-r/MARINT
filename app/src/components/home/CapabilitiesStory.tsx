import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useScrollScene } from "./motion/useScrollScene";
import { prefersReducedMotion } from "./motion/gsapSetup";
import { pinnedScrollTrigger, sectionHeightVh } from "./motion/pinConfig";

const PIN_VH = 220;
const CAPABILITIES = [
  { title: "Dark Vessel Detection", body: "When a detection can't be matched to any known AIS track, MARINT flags it with the evidence." },
  { title: "AIS Anomalies", body: "Impossible position jumps and transmission gaps are surfaced with the exact reading that triggered them." },
  { title: "Ship-to-Ship Activity", body: "Vessels holding station together longer than routine operations would suggest, timestamped for review." },
  { title: "Suspicious Loitering", body: "Repeated low-speed patterns in open water, away from any port or established route." },
  { title: "Route Deviation", body: "Vessels that diverge from their expected corridor and don't resume course." },
  { title: "Satellite Correlation", body: "SAR and optical passes checked against AIS history to confirm — or contradict — the declared picture." },
];

export default function CapabilitiesStory() {
  const rootRef = useScrollScene<HTMLDivElement>(({ gsap, scope }) => {
    const items = Array.from(scope.querySelectorAll<HTMLElement>("[data-cap-item]"));
    const glyphs = Array.from(scope.querySelectorAll<SVGGElement>("[data-cap-glyph]"));
    const pinEl = scope.querySelector<HTMLElement>("[data-pin-inner]");
    if (!pinEl || !items.length || !glyphs.length) return;

    if (prefersReducedMotion()) {
      gsap.set(items, { opacity: 1 });
      gsap.set(glyphs, { opacity: 0 });
      gsap.set(glyphs[0], { opacity: 1 });
      return;
    }

    gsap.set(items, { opacity: 0.32 });
    gsap.set(items[0], { opacity: 1 });
    gsap.set(glyphs, { opacity: 0, scale: 0.85, transformOrigin: "50% 50%" });
    gsap.set(glyphs[0], { opacity: 1, scale: 1 });

    let active = 0;
    ScrollTrigger.create({
      ...pinnedScrollTrigger(scope, pinEl),
      onUpdate: (self) => {
        const idx = Math.min(CAPABILITIES.length - 1, Math.floor(self.progress * CAPABILITIES.length));
        if (idx === active) return;
        gsap.to(items[active], { opacity: 0.32, duration: 0.3 });
        gsap.to(glyphs[active], { opacity: 0, scale: 0.85, duration: 0.3 });
        gsap.to(items[idx], { opacity: 1, duration: 0.3 });
        gsap.to(glyphs[idx], { opacity: 1, scale: 1, duration: 0.3 });
        active = idx;
      },
    });
  });

  return (
    <section id="capabilities" ref={rootRef} className="relative bg-surface-0 border-y border-hairline" style={{ height: sectionHeightVh(PIN_VH) }}>
    <div data-pin-inner className="relative h-dvh min-h-[640px] overflow-hidden">
      <div className="max-w-6xl mx-auto h-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center px-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-cyan/70 mb-6">Capabilities</p>
          <div className="space-y-7">
            {CAPABILITIES.map((c) => (
              <div key={c.title} data-cap-item>
                <h3 className="font-display text-2xl md:text-3xl font-semibold text-home-ink">{c.title}</h3>
                <p className="text-home-ink/45 text-sm mt-1.5 max-w-md leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative aspect-square hidden lg:block">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <circle cx={200} cy={200} r={150} fill="none" stroke="var(--color-hairline)" strokeWidth={1} />
            <g data-cap-glyph>
              <circle cx={200} cy={200} r={6} fill="#2fa7d6" />
              <circle cx={200} cy={200} r={26} fill="none" stroke="#e0483f" strokeWidth={2} strokeDasharray="4 4" />
              <line x1={178} y1={178} x2={222} y2={222} stroke="#e0483f" strokeWidth={2.5} />
            </g>
            <g data-cap-glyph>
              <path d="M100,240 L150,200 L170,230 L210,150 L230,190 L300,140" fill="none" stroke="#e0a530" strokeWidth={2.5} />
            </g>
            <g data-cap-glyph>
              <circle cx={160} cy={200} r={8} fill="#2fa7d6" />
              <circle cx={240} cy={200} r={8} fill="#2fa7d6" />
              <circle cx={200} cy={200} r={36} fill="none" stroke="#e0a530" strokeWidth={2} strokeDasharray="3 4" />
            </g>
            <g data-cap-glyph>
              <path d="M200,200 m0,-50 a50,50 0 1,1 -35,85" fill="none" stroke="#e0a530" strokeWidth={2.5} />
              <circle cx={165} cy={235} r={5} fill="#e0a530" />
            </g>
            <g data-cap-glyph>
              <path d="M120,260 L200,200" fill="none" stroke="#4c6b85" strokeWidth={2} strokeDasharray="3 4" />
              <path d="M200,200 L300,150" fill="none" stroke="#4c6b85" strokeWidth={2} strokeDasharray="3 4" />
              <path d="M200,200 L280,240" fill="none" stroke="#e0483f" strokeWidth={2.5} />
              <circle cx={280} cy={240} r={5} fill="#e0483f" />
            </g>
            <g data-cap-glyph>
              <rect x={172} y={140} width={56} height={40} fill="none" stroke="#39c2a0" strokeWidth={2} transform="rotate(20 200 160)" />
              <line x1={200} y1={190} x2={200} y2={260} stroke="#39c2a0" strokeWidth={2} strokeDasharray="2 4" />
              <circle cx={200} cy={260} r={6} fill="#39c2a0" />
            </g>
          </svg>
        </div>
      </div>
    </div>
    </section>
  );
}
