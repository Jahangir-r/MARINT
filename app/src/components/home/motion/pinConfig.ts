import { prefersReducedMotion } from "./gsapSetup";

/**
 * The outer wrapper's height: 100vh + the scrub distance normally, but just
 * 100vh under prefers-reduced-motion (no pin is created in that case either —
 * see each section's setup — so the section must not reserve extra empty
 * scroll space for a pin that will never happen).
 */
export function sectionHeightVh(pinVh: number): string {
  return `${prefersReducedMotion() ? 100 : 100 + pinVh}vh`;
}

/**
 * Standard pinned-scene ScrollTrigger config. Pairs with the markup pattern:
 *   <section ref={rootRef} style={{ height: `${100 + pinVh}vh` }}>
 *     <div data-pin-inner className="sticky top-0 h-screen ...">...</div>
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
