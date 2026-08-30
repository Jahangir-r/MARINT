// Mobile Safari's address bar hides/shows continuously while scrolling,
// and CSS `dvh` tracks that live -- great for simple full-bleed pages, but
// poisonous for GSAP ScrollTrigger pin math, which measures pixel heights
// ONCE (at setup/refresh) and does not re-measure every frame. Feeding
// ScrollTrigger a height that keeps changing under it mid-scroll is what
// caused pins to release at the wrong scroll position (the "content split
// across blank screens" regression) -- `dvh` alone is not a fix here, it
// just moves the instability from one shape to another.
//
// The stable answer: capture window.innerHeight into a CSS custom property
// ONCE up front, and only update it on a genuine viewport change (a width
// change, i.e. real resize/rotation) -- never on a height-only change,
// which on mobile Safari is almost always just the address bar animating,
// not a real viewport resize. GSAP-pinned sections use this custom
// property instead of vh/dvh; every other (non-scroll-jacked) full-height
// element in the app can safely keep using dvh directly.
let lastWidth = typeof window !== "undefined" ? window.innerWidth : 0;

function applyStableVh() {
  if (typeof document === "undefined") return;
  // Stores ONE vh-equivalent pixel unit (viewport height / 100), matching the
  // semantics of the native `vh` unit -- pinConfig.ts's formulas multiply
  // this by values like 100 or 230, exactly as `100vh`/`230vh` would, so
  // storing the full window.innerHeight here (instead of 1/100th of it)
  // would make every pinned section and pin-inner div 100x too tall.
  document.documentElement.style.setProperty("--stable-vh", `${window.innerHeight / 100}px`);
}

let initialized = false;

/** Call once (idempotent) before any GSAP-pinned homepage section mounts. */
export function ensureStableViewport() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  applyStableVh();
  window.addEventListener("resize", () => {
    // Only a width change (or a height change large enough that it can't
    // just be the address bar, e.g. an actual orientation flip) counts as
    // a real viewport change worth re-measuring and re-syncing GSAP to.
    const widthChanged = window.innerWidth !== lastWidth;
    if (widthChanged) {
      lastWidth = window.innerWidth;
      applyStableVh();
      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => ScrollTrigger.refresh());
    }
  });
}
