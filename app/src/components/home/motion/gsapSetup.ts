import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;
export function ensureGsap() {
  if (!registered) {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
    // Recalculate pin start/end positions once every asset (fonts, the
    // ProductReveal screenshot, etc.) has actually loaded and settled —
    // ScrollTrigger snapshots layout eagerly and a late image/font swap can
    // otherwise leave later sections' trigger points slightly stale.
    window.addEventListener("load", () => ScrollTrigger.refresh());
  }
  return { gsap, ScrollTrigger };
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
