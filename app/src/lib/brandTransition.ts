// Module-level trigger/registration for the "operations" BrandTransition —
// mirrors the pattern already used by lib/theme.ts: a listener registered by
// the one component that actually owns the overlay (mounted inside the
// Router, so it can call useNavigate()), invoked imperatively from wherever
// a CTA needs to start the transition, without prop-drilling or context.
type Listener = (targetPath: string) => void;
let listener: Listener | null = null;

export function registerOperationsTransition(fn: Listener | null) {
  listener = fn;
}

/** Starts the short branded transition and navigates to targetPath partway
 * through it. If no host is mounted (shouldn't happen — App.tsx always
 * mounts one), falls back to an ordinary navigation so the button never
 * just does nothing. */
export function triggerOperationsTransition(targetPath: string, fallbackNavigate?: () => void) {
  if (listener) listener(targetPath);
  else fallbackNavigate?.();
}
