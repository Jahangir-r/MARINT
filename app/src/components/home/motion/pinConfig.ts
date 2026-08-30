import { prefersReducedMotion } from "./gsapSetup";
import { ensureStableViewport } from "./stableViewport";

/**
 * The outer wrapper's height: 100 stable-vh-units + the scrub distance
 * normally, but just 100 under prefers-reduced-motion (no pin is created in
 * that case either -- see each section's setup -- so the section must not
 * reserve extra empty scroll space for a pin that will never happen).
 *
 * Built from --stable-vh (see stableViewport.ts), NOT vh or dvh. GSAP
 * ScrollTrigger measures this element's pixel height once at setup/refresh
 * and caches it; dvh keeps changing live as Safari's address bar
 * hides/shows mid-scroll, which desyncs that cached measurement from the
 * real DOM and is what broke mobile pin timing. --stable-vh only changes on
 * a genuine width/orientation change, so ScrollTrigger's cached math stays
 * valid for the whole scroll gesture.
 */
export function sectionHeightVh(pinVh: number): string {
  ensureStableViewport();
  const units = prefersReducedMotion() ? 100 : 100 + pinVh;
  return `calc(var(--stable-vh) * ${units})`;
}

/** Inline style for the pinned inner div -- pairs with sectionHeightVh()
 * above, same --stable-vh basis so the pin target's own height can never
 * drift out of sync with the outer scroll-spacer it's measured against. */
export function pinInnerStyle(): { height: string } {
  ensureStableViewport();
  return { height: "calc(var(--stable-vh) * 100)" };
}

/** Picks a shorter mobile scroll journey than desktop for a pinned scene.
 * Mobile viewports are narrow and portrait; reproducing the exact desktop
 * scroll distance reads as long dead scrolling on a phone. Both numbers are
 * plain vh-equivalents (matching the desktop values already tuned for each
 * section) -- only the absolute pixel distance differs, not the internal
 * GSAP timeline's own 0..1 progress choreography, which stays identical. */
export function responsivePinVh(desktopVh: number, mobileVh: number): number {
  if (typeof window === "undefined") return desktopVh;
  return window.innerWidth < 768 ? mobileVh : desktopVh;
}

/**
 * Standard pinned-scene ScrollTrigger config. Pairs with the markup pattern:
 *   <section ref={rootRef} style={{ height: sectionHeightVh(pinVh) }}>
 *     <div data-pin-inner style={pinInnerStyle()} className="...">...</div>
 *   </section>
 * Pinning the INNER sticky div (not the outer section) while the outer
 * section's height already equals 100vh + the scrub distance means the pin
 * releases exactly as the section ends — no leftover "dead" viewport of
 * static scroll before the next scene starts (the classic ScrollTrigger
 * pin-height gotcha, easy to get wrong: pinning a `h-screen` trigger element
 * directly leaves its own 100vh sitting inert in the flow after it unpins).
 */
export function pinnedScrollTrigger(scope: HTMLElement, pinEl: Element) {
  return {
    trigger: scope,
    start: "top top",
    end: "bottom bottom",
    scrub: 0.8,
    pin: pinEl,
    anticipatePin: 1,
  } as const;
}
