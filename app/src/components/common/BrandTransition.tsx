import { useEffect, useRef } from "react";
import gsap from "gsap";

export type BrandTransitionVariant = "intro" | "operations";

interface Props {
  variant: BrandTransitionVariant;
  /** Operations variant only: fired once the overlay is fully opaque — the
   * right moment to actually navigate, so the route change happens
   * invisibly underneath and Operations gets the rest of the transition's
   * duration to initialize before being revealed. */
  onMidpoint?: () => void;
  /** Fired when the whole sequence (including fade-out) has finished —
   * the caller unmounts this component in response. */
  onComplete: () => void;
}

// The five MARINT mark pieces — identical d-data to the approved
// public/logo-mark.svg, never redrawn.
const MARK_PATHS = [
  "M 136.0 70.0 L 151.0 92.0 L 159.0 109.0 L 165.0 126.0 L 171.0 156.0 L 172.0 192.0 L 167.0 226.0 L 156.0 264.0 L 145.0 291.0 L 133.0 315.0 L 115.0 345.0 L 149.0 326.0 L 178.0 314.0 L 204.0 307.0 L 216.0 305.0 L 231.0 305.0 L 236.0 275.0 L 247.0 243.0 L 259.0 218.0 L 279.0 187.0 L 271.0 172.0 L 259.0 155.0 L 247.0 141.0 L 225.0 120.0 L 205.0 105.0 L 181.0 90.0 L 148.0 74.0 Z",
  "M 430.0 69.0 L 428.0 69.0 L 394.0 87.0 L 352.0 116.0 L 329.0 135.0 L 306.0 158.0 L 297.0 170.0 L 290.0 182.0 L 285.0 196.0 L 280.0 205.0 L 266.0 242.0 L 258.0 277.0 L 256.0 307.0 L 267.0 309.0 L 287.0 317.0 L 303.0 328.0 L 314.0 340.0 L 337.0 334.0 L 355.0 332.0 L 381.0 334.0 L 414.0 343.0 L 441.0 355.0 L 451.0 361.0 L 437.0 337.0 L 424.0 311.0 L 414.0 286.0 L 402.0 245.0 L 396.0 206.0 L 396.0 167.0 L 401.0 136.0 L 413.0 100.0 L 424.0 78.0 Z",
  "M 302.0 193.0 L 300.0 206.0 L 302.0 229.0 L 306.0 241.0 L 312.0 253.0 L 324.0 270.0 L 345.0 289.0 L 368.0 304.0 L 375.0 307.0 L 380.0 311.0 L 387.0 314.0 L 410.0 328.0 L 442.0 351.0 L 428.0 333.0 L 406.0 311.0 L 388.0 297.0 L 345.0 268.0 L 326.0 250.0 L 318.0 240.0 L 310.0 227.0 L 304.0 210.0 Z",
  "M 89.0 383.0 L 120.0 369.0 L 149.0 361.0 L 172.0 358.0 L 201.0 359.0 L 231.0 365.0 L 251.0 372.0 L 265.0 378.0 L 318.0 405.0 L 339.0 413.0 L 366.0 419.0 L 397.0 420.0 L 425.0 415.0 L 450.0 406.0 L 471.0 394.0 L 479.0 388.0 L 490.0 377.0 L 470.0 385.0 L 442.0 391.0 L 431.0 392.0 L 396.0 391.0 L 372.0 386.0 L 348.0 378.0 L 291.0 351.0 L 263.0 341.0 L 241.0 336.0 L 221.0 334.0 L 207.0 334.0 L 178.0 338.0 L 166.0 341.0 L 141.0 350.0 L 118.0 362.0 L 100.0 374.0 Z",
  "M 68.0 411.0 L 90.0 405.0 L 111.0 402.0 L 134.0 401.0 L 157.0 403.0 L 175.0 407.0 L 193.0 413.0 L 211.0 421.0 L 250.0 442.0 L 262.0 447.0 L 285.0 454.0 L 304.0 457.0 L 327.0 457.0 L 341.0 455.0 L 362.0 449.0 L 376.0 442.0 L 352.0 442.0 L 324.0 436.0 L 291.0 423.0 L 232.0 392.0 L 212.0 385.0 L 186.0 380.0 L 156.0 380.0 L 127.0 385.0 L 98.0 395.0 Z",
];
const PIECE_FILLS = ["url(#bt-leftSailGrad)", "url(#bt-rightSailGrad)", "url(#bt-sailHighlight)", "url(#bt-waveUpperGrad)", "url(#bt-waveLowerGrad)"];

// Vertical "waterline" travel range in the shared viewBox (40 40 480 440).
// The mark's real footprint spans y:58 (sail tips) to y:457 (wave underside).
// FRONT_START sits below the whole mark (nothing revealed yet); FRONT_END
// sits above the sail tips (fully revealed) — animating a mask's leading
// edge between these two values is what makes the mark look like it is
// filling with water from the bottom (wave) up through the sails.
const FRONT_START = 560;
const FRONT_END = 8;

// Four soft, blurred circles riding at slightly different heights around
// the shared waterline value, so the fill's leading edge reads as an
// uneven, organic liquid boundary rather than a flat mask edge.
const FRONT_BUMPS: { cx: number; dy: number; r: number }[] = [
  { cx: 130, dy: -18, r: 85 },
  { cx: 230, dy: 12, r: 95 },
  { cx: 340, dy: -8, r: 90 },
  { cx: 445, dy: 16, r: 80 },
];

export default function BrandTransition({ variant, onMidpoint, onComplete }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const isIntro = variant === "intro";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ambientGlow = root.querySelector<HTMLElement>("[data-ambient-glow]");
    const fluidWrap = root.querySelector<SVGGElement>("[data-fluid-wrap]");
    const fluidBaseGrad = root.querySelector<SVGLinearGradientElement>("#bt-fluidBase");
    const fluidHighlight = root.querySelector<SVGRectElement>("[data-fluid-highlight]");
    const fluidFront = root.querySelector<SVGRectElement>("[data-fluid-front]");
    const fluidBumps = Array.from(root.querySelectorAll<SVGCircleElement>("[data-fluid-bump]"));
    const wobbleMap = root.querySelector<SVGFEDisplacementMapElement>("[data-wobble-map]");
    const crispGroup = root.querySelector<SVGGElement>("[data-crisp-group]");
    const wordmarkSlot = root.querySelector<HTMLElement>("[data-wordmark-slot]");
    const wordmark = root.querySelector<HTMLElement>("[data-wordmark]");

    // Measure the wordmark's natural width once (while unconstrained) so
    // the slot can be animated from 0 -> that exact pixel value — GSAP
    // can't tween to "auto", and this is what lets the flex row grow
    // smoothly (re-centering itself, which is what visibly carries the
    // mark left as the wordmark's space opens up on the right).
    let wordmarkNaturalWidth = 0;
    if (wordmarkSlot) {
      const prevWidth = wordmarkSlot.style.width;
      wordmarkSlot.style.width = "auto";
      wordmarkNaturalWidth = wordmarkSlot.scrollWidth;
      wordmarkSlot.style.width = prevWidth;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: () => onComplete() });

      if (reduced) {
        gsap.set(root, { autoAlpha: 0 });
        if (fluidWrap) gsap.set(fluidWrap, { opacity: 0 });
        if (crispGroup) gsap.set(crispGroup, { opacity: 1 });
        gsap.set(ambientGlow, { opacity: 0 });
        if (wordmarkSlot) gsap.set(wordmarkSlot, { width: isIntro ? wordmarkNaturalWidth : 0 });
        if (wordmark) gsap.set(wordmark, { opacity: isIntro ? 1 : 0, filter: "blur(0px)" });
        tl.to(root, { autoAlpha: 1, duration: 0.12 });
        if (!isIntro) tl.call(() => onMidpoint?.(), undefined, 0.14);
        tl.to({}, { duration: isIntro ? 0.9 : 0.45 }).to(root, { autoAlpha: 0, duration: 0.3 });
        return;
      }

      // Absolute-second stage boundaries per variant — the two variants
      // aren't a uniform scale of one another (the short operations cut
      // is proportionally longer relative to its own total than a simple
      // multiplier would give), so each is spelled out directly.
      const T = isIntro
        ? { fadeIn: 0.25, formationStart: 0.25, formationEnd: 1.65, stabilizeEnd: 2.0, holdEnd: 2.2, moveEnd: 2.65, lockHoldEnd: 2.9, dissolveEnd: 3.2 }
        : { fadeIn: 0.2, formationStart: 0.2, formationEnd: 0.9, stabilizeEnd: 1.2, holdEnd: 1.4, moveEnd: 1.4, lockHoldEnd: 1.4, dissolveEnd: 1.7 };

      gsap.set(root, { autoAlpha: 0 });
      gsap.set(ambientGlow, { opacity: 0, scale: 0.8, transformOrigin: "50% 50%" });
      if (fluidWrap) gsap.set(fluidWrap, { opacity: 1 });
      if (crispGroup) gsap.set(crispGroup, { opacity: 0 });
      if (fluidFront) gsap.set(fluidFront, { attr: { y: FRONT_START } });
      fluidBumps.forEach((el, i) => gsap.set(el, { attr: { cy: FRONT_START + FRONT_BUMPS[i].dy } }));
      if (fluidHighlight) gsap.set(fluidHighlight, { attr: { y: FRONT_START - 30 }, opacity: 0.9 });
      if (wobbleMap) gsap.set(wobbleMap, { attr: { scale: 16 } });
      if (wordmarkSlot) gsap.set(wordmarkSlot, { width: 0 });
      if (wordmark) gsap.set(wordmark, { opacity: 0, filter: "blur(4px)" });

      tl.to(root, { autoAlpha: 1, duration: T.fadeIn, ease: "power1.out" }, 0);
      if (!isIntro) tl.call(() => onMidpoint?.(), undefined, T.fadeIn + 0.02);

      // --- Ambient light: a single large, decoupled radial glow (not
      // confined to the mark's own small box) — a supporting cue only,
      // rising gently as the water enters and receding once the mark
      // resolves. Never the primary effect. ---
      const formDur = T.formationEnd - T.formationStart;
      tl.to(ambientGlow, { opacity: 0.5, scale: 1, duration: formDur, ease: "power1.out" }, T.formationStart);

      // --- The core water-fill: a rising "waterline" (a rect plus four
      // soft, unevenly-offset blurred circles riding along it) is used as
      // a mask over the real MARINT geometry, so the fluid material below
      // it only ever becomes visible where the mark's actual silhouette
      // already allows it — the wave (bottom of the mark) fills first,
      // the sails follow as the line keeps rising. ---
      if (fluidFront) tl.to(fluidFront, { attr: { y: FRONT_END }, duration: formDur, ease: "sine.inOut" }, T.formationStart);
      fluidBumps.forEach((el, i) => {
        tl.to(el, { attr: { cy: FRONT_END + FRONT_BUMPS[i].dy }, duration: formDur, ease: "sine.inOut" }, T.formationStart);
      });
      // The caustic/specular band sits inside the same masked group, so it
      // is automatically clipped to whatever is already revealed — this is
      // what makes it read as "light hugging the leading edge of the
      // fluid" without any extra logic.
      if (fluidHighlight) tl.to(fluidHighlight, { attr: { y: FRONT_END - 30 }, duration: formDur, ease: "sine.inOut" }, T.formationStart);
      // Internal gradient drift — a slow back-and-forth shift of the fluid
      // body's own gradient axis, standing in for "material moving/
      // changing thickness internally" without any per-pixel cost.
      if (fluidBaseGrad) {
        tl.to(fluidBaseGrad, { attr: { y1: 400, y2: 40 }, duration: formDur * 0.6, ease: "sine.inOut", yoyo: true, repeat: 1 }, T.formationStart);
      }

      // --- Stabilization: the fill has fully reached the top, so the
      // highlight takes one last lingering pass back down through the now-
      // complete geometry while it fades, the turbulence settles to
      // exactly zero, and the fluid material crossfades into the exact,
      // undistorted crisp MARINT SVG. ---
      const stabDur = T.stabilizeEnd - T.formationEnd;
      if (fluidHighlight) tl.to(fluidHighlight, { attr: { y: FRONT_START * 0.4 }, opacity: 0, duration: stabDur, ease: "power1.in" }, T.formationEnd);
      if (wobbleMap) tl.to(wobbleMap, { attr: { scale: 0 }, duration: stabDur, ease: "power1.out" }, T.formationEnd);
      tl.to(ambientGlow, { opacity: 0.12, duration: stabDur, ease: "power1.in" }, T.formationEnd);
      const crossfadeDur = Math.min(0.22, stabDur);
      const crossfadeStart = T.stabilizeEnd - crossfadeDur;
      if (fluidWrap) tl.to(fluidWrap, { opacity: 0, duration: crossfadeDur, ease: "power1.in" }, crossfadeStart);
      if (crispGroup) tl.to(crispGroup, { opacity: 1, duration: crossfadeDur, ease: "power1.out" }, crossfadeStart);

      // Clean, undistorted hold from T.stabilizeEnd to T.holdEnd happens
      // naturally — no tweens run in that window.

      if (isIntro) {
        // --- The mark holds centered briefly once fully resolved, then
        // the wordmark slot grows to its natural width — the flex row is
        // always centered by its own parent, so this single width tween
        // is what carries the mark smoothly left while MARINT reveals on
        // the right, finishing as one centered combined lockup. ---
        const moveDur = T.moveEnd - T.holdEnd;
        if (wordmarkSlot) tl.to(wordmarkSlot, { width: wordmarkNaturalWidth, duration: moveDur, ease: "power2.inOut" }, T.holdEnd);
        if (wordmark) tl.to(wordmark, { opacity: 1, filter: "blur(0px)", duration: moveDur * 0.8, ease: "power2.out" }, T.holdEnd + moveDur * 0.25);
        tl.to(root, { autoAlpha: 0, duration: T.dissolveEnd - T.lockHoldEnd, ease: "power1.inOut" }, T.lockHoldEnd);
      } else {
        tl.to(root, { autoAlpha: 0, duration: T.dissolveEnd - T.holdEnd, ease: "power1.inOut" }, T.holdEnd);
      }
    }, root);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[999] pointer-events-none"
      style={{ background: "var(--bt-bg)", opacity: 0 }}
      aria-hidden="true"
    >
      {/* Large, decoupled ambient glow — deliberately much bigger than the
          mark's own small bounding box, with a generous fade radius, so
          there is no small container edge for the light to visibly stop
          at. Supporting cue only — the water-fill below is the primary
          effect. */}
      <div
        data-ambient-glow
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 760,
          height: 760,
          background: "var(--bt-glow)",
          mixBlendMode: "var(--bt-glow-blend)" as React.CSSProperties["mixBlendMode"],
        }}
      />

      <div className="relative h-full w-full flex items-center justify-center">
        <div className="flex items-center">
          <div data-mark-wrap className="relative" style={{ width: 108, height: 99, overflow: "visible" }}>
            <svg viewBox="40 40 480 440" width={108} height={99} style={{ overflow: "visible", position: "absolute", inset: 0 }}>
              <defs>
                <linearGradient id="bt-leftSailGrad" x1="114" y1="75" x2="263" y2="285" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#2FA7D6" />
                  <stop offset="1" stopColor="#1796FB" />
                </linearGradient>
                <linearGradient id="bt-rightSailGrad" x1="300" y1="58" x2="455" y2="313" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#8FD9FF" />
                  <stop offset="0.55" stopColor="#67BDF2" />
                  <stop offset="1" stopColor="#2FA7D6" />
                </linearGradient>
                <linearGradient id="bt-waveUpperGrad" x1="89" y1="334" x2="491" y2="421" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#2FA7D6" />
                  <stop offset="1" stopColor="#1796FB" />
                </linearGradient>
                <linearGradient id="bt-waveLowerGrad" x1="68" y1="380" x2="377" y2="458" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#2FA7D6" />
                  <stop offset="1" stopColor="#1796FB" />
                </linearGradient>
                <linearGradient id="bt-sailHighlight" x1="300" y1="190" x2="444" y2="350" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#EAF7FF" stopOpacity="0.75" />
                  <stop offset="1" stopColor="#CFEAFF" stopOpacity="0.55" />
                </linearGradient>

                {/* The fluid material itself — deep-blue-to-cyan body plus
                    a soft translucent highlight band. Both live inside the
                    double mask below, so their edges are always the
                    mark's own real geometry (curved sail/wave silhouettes)
                    — never a rectangle. */}
                <linearGradient id="bt-fluidBase" x1="120" y1="440" x2="420" y2="80" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#1D5E8A" />
                  <stop offset="0.45" stopColor="#2FA7D6" />
                  <stop offset="1" stopColor="#8FD9FF" />
                </linearGradient>
                <linearGradient id="bt-fluidHighlight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#EAF7FF" stopOpacity="0" />
                  <stop offset="0.5" stopColor="#EAF7FF" stopOpacity="0.55" />
                  <stop offset="1" stopColor="#EAF7FF" stopOpacity="0" />
                </linearGradient>

                {/* Subtle liquid-settle distortion — generous filter
                    region so the modest displacement never clips against
                    its own bounding box. Animated to exactly 0 by the time
                    the fill completes, so the final geometry underneath is
                    pixel-identical to the source. */}
                <filter id="bt-wobble" x="-40%" y="-40%" width="180%" height="180%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves={2} seed={7} result="bt-noise" />
                  <feDisplacementMap data-wobble-map in="SourceGraphic" in2="bt-noise" scale={0} xChannelSelector="R" yChannelSelector="G" />
                </filter>

                {/* The real, unmodified MARINT silhouette — a constant
                    mask (never animated) that constrains everything below
                    to the mark's true geometry. */}
                <mask id="bt-logoShape" maskUnits="userSpaceOnUse">
                  <g fill="#FFFFFF">
                    {MARK_PATHS.map((d, i) => (
                      <path key={i} d={d} />
                    ))}
                  </g>
                </mask>

                {/* The rising "waterline" — a rect plus four unevenly-
                    offset, blurred circles so the leading edge reads as an
                    organic curved boundary rather than a flat wipe. */}
                <mask id="bt-fillProgress" maskUnits="userSpaceOnUse">
                  <rect data-fluid-front x="20" y={FRONT_START} width="520" height="600" fill="#FFFFFF" />
                  {FRONT_BUMPS.map((b, i) => (
                    <circle key={i} data-fluid-bump cx={b.cx} cy={FRONT_START + b.dy} r={b.r} fill="#FFFFFF" style={{ filter: "blur(22px)" }} />
                  ))}
                </mask>
              </defs>

              {/* Fluid formation layer — real MARINT silhouette (outer
                  mask) intersected with the rising waterline (inner mask),
                  so the water only ever fills within the mark's true
                  shape. Fades out once the crisp group below is ready. */}
              <g data-fluid-wrap mask="url(#bt-logoShape)">
                <g mask="url(#bt-fillProgress)" style={{ filter: "url(#bt-wobble)" }}>
                  <rect x="20" y="20" width="520" height="480" fill="url(#bt-fluidBase)" />
                  <rect data-fluid-highlight x="20" y={FRONT_START - 30} width="520" height="46" fill="url(#bt-fluidHighlight)" style={{ mixBlendMode: "screen" }} />
                </g>
              </g>

              {/* The exact, approved MARINT geometry — flat brand-gradient
                  fills, no filters, no transforms. Crossfades in once the
                  fluid has finished forming and stays this way, unchanged,
                  for the rest of the sequence. */}
              <g data-crisp-group>
                {MARK_PATHS.map((d, i) => (
                  <path key={i} d={d} fill={PIECE_FILLS[i]} />
                ))}
              </g>
            </svg>
          </div>

          {/* Wordmark slot: 0-width and clipped until the mark has fully
              formed, then grown to its natural width — the flex row above
              is always centered by its own parent, so this single tween is
              what visibly carries the mark left while MARINT reveals on
              the right, landing as one centered combined lockup. Absent
              entirely (no width, no gap) for the "operations" variant. */}
          {variant === "intro" && (
            <div data-wordmark-slot style={{ width: 0, overflow: "hidden" }}>
              <span
                data-wordmark
                className="inline-block font-display font-semibold tracking-[0.3em] text-bt-wordmark text-lg md:text-xl whitespace-nowrap"
                style={{ paddingLeft: 16 }}
              >
                MARINT
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
