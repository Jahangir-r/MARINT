import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ensureGsap } from "./gsapSetup";

/**
 * Scopes a GSAP animation (ScrollTrigger included) to a container ref and
 * guarantees cleanup on unmount / re-run — safe under React StrictMode's
 * double-invoke, since each mount gets its own gsap.context() that fully
 * reverts (killing tweens + ScrollTriggers) before the next one is created.
 */
export function useScrollScene<T extends HTMLElement>(
  setup: (ctx: { gsap: typeof gsap; scope: T }) => void
) {
  const scopeRef = useRef<T | null>(null);

  useLayoutEffect(() => {
    if (!scopeRef.current) return;
    const { gsap } = ensureGsap();
    const ctx = gsap.context(() => setup({ gsap, scope: scopeRef.current! }), scopeRef);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return scopeRef;
}
