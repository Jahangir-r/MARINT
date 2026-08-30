import { Link, useNavigate } from "react-router-dom";
import { useScrollScene } from "./motion/useScrollScene";
import { prefersReducedMotion } from "./motion/gsapSetup";
import { pinnedScrollTrigger, sectionHeightVh } from "./motion/pinConfig";
import { triggerOperationsTransition } from "../../lib/brandTransition";

const PHRASES = ["ONE SEA.", "THOUSANDS OF VESSELS.", "MILLIONS OF SIGNALS.", "ONE OPERATIONAL PICTURE."];
const PIN_VH = 200;

export default function HeroStory() {
  const navigate = useNavigate();
  const rootRef = useScrollScene<HTMLDivElement>(({ gsap, scope }) => {
    const pinEl = scope.querySelector<HTMLElement>("[data-pin-inner]");
    const bg = scope.querySelector<HTMLElement>("[data-bg]");
    const overlay = scope.querySelector<HTMLElement>("[data-overlay]");
    const heroGroup = scope.querySelector<HTMLElement>("[data-hero-group]");
    const indicator = scope.querySelector<HTMLElement>("[data-indicator]");
    const phrases = Array.from(scope.querySelectorAll<HTMLElement>("[data-phrase]"));
    if (!pinEl || !bg || !overlay || !heroGroup || !phrases.length) return;

    if (prefersReducedMotion()) {
      // The phrase sequence only makes sense as a scroll-progressive reveal;
      // under reduced motion just keep the static hero content and skip it
      // entirely, rather than showing it stacked on top of the hero text.
      gsap.set(phrases, { opacity: 0 });
      return;
    }

    gsap.set(phrases, { opacity: 0, y: 16 });

    const tl = gsap.timeline({
      scrollTrigger: pinnedScrollTrigger(scope, pinEl),
      defaults: { ease: "none" },
    });

    tl.to(bg, { scale: 1.06, duration: 1 }, 0)
      .to(overlay, { opacity: 0.72, duration: 1 }, 0)
      .to(heroGroup, { opacity: 0, y: -50, duration: 0.16 }, 0)
      .to(indicator, { opacity: 0, duration: 0.08 }, 0);

    phrases.forEach((phrase, i) => {
      const start = 0.22 + i * 0.185;
      tl.fromTo(phrase, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.08 }, start);
      if (i < phrases.length - 1) {
        tl.to(phrase, { opacity: 0, y: -16, duration: 0.08 }, start + 0.09);
      }
    });
  });

  return (
    <section ref={rootRef} className="relative bg-home-bg" style={{ height: sectionHeightVh(PIN_VH) }}>
    <div data-pin-inner className="relative h-dvh min-h-[640px] overflow-hidden">
      <div data-bg className="absolute inset-0" style={{ transformOrigin: "50% 50%" }}>
        {/* Atmospheric background footage — plays continuously on its own
            (autoplay/loop/muted), independent of scroll. Kept subtle in both
            themes: a translucent wash plus the cyan radial glow sit on top
            so it reads as texture behind the brand, not a video player.
            --home-hero-wash carries the original, unchanged dark-navy wash
            for dark mode and a lighter-opacity cool-white wash for light
            mode (a straight light/dark swap of the same opacity read as
            almost fully opaque against a near-white tone), so the footage
            stays clearly recognizable while readability stays controlled
            across every frame. */}
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-30"
          src="/video/maritime-surveillance.mp4"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        <div className="absolute inset-0" style={{ background: "var(--home-hero-wash)" }} />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(47,167,214,0.22), transparent)" }}
        />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan/25 animate-radar"
              style={{ width: 420, height: 420, animationDelay: `${i * 1.05}s` }}
            />
          ))}
        </div>
      </div>
      <div data-overlay className="absolute inset-0 bg-home-bg" style={{ opacity: 0 }} />

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
        <div data-hero-group className="flex flex-col items-center">
          <p className="text-[11px] md:text-xs uppercase tracking-[0.35em] text-cyan/70 mb-6 text-center max-w-[280px] sm:max-w-none">
            Maritime Intelligence · Caspian Sea Demonstration
          </p>
          <h1 className="text-center font-display font-semibold text-home-ink leading-[0.98] text-[13vw] md:text-[6.2vw] tracking-tight">
            One operational
            <br />
            <span className="text-cyan">picture at sea.</span>
          </h1>
          <p className="mt-7 max-w-xl text-center text-home-ink/55 text-[15px] md:text-base leading-relaxed px-6">
            MARINT transforms fragmented maritime information — AIS, satellite, radar, history — into one
            unified picture, revealing activity that individual systems may miss.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full max-w-xs sm:max-w-none px-6 sm:px-0">
            <Link
              to="/operations"
              onClick={(e) => {
                e.preventDefault();
                triggerOperationsTransition("/operations", () => navigate("/operations"));
              }}
              className="px-6 py-3 rounded-md bg-cyan text-navy-deep font-medium text-sm hover:bg-cyan-light transition-colors text-center whitespace-nowrap"
            >
              Enter Operational Picture
            </Link>
            <a href="#capabilities" className="px-6 py-3 rounded-md border border-home-ink/15 text-home-ink/80 text-sm hover:border-home-ink/35 transition-colors text-center whitespace-nowrap">
              See Capabilities
            </a>
          </div>
        </div>

        <div data-indicator className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-home-ink/25">
          <span className="text-[10px] uppercase tracking-widest">Scroll to discover</span>
          <span className="h-8 w-px bg-gradient-to-b from-home-ink/40 to-transparent" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-6">
          {PHRASES.map((p) => (
            <span
              key={p}
              data-phrase
              className="absolute text-center font-display font-semibold text-home-ink text-[9vw] md:text-[4.4vw] leading-tight tracking-tight"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
    </section>
  );
}
