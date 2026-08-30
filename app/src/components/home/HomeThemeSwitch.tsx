import { useTheme } from "../../lib/theme";

// Icon rendered size (px) and the inset from each end of the capsule that
// both the static (inactive) icon and the moving thumb's resting position
// share — using the same literal inset for both is what guarantees they
// land in exactly the same spot, with no separate hand-tuned offsets to
// keep in sync.
const ICON_SIZE = 8;
const ANCHOR_INSET = 8;

function SunGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/** Discreet vertical light/dark switch for the public homepage — fixed
 * bottom-right, deliberately visually subordinate (low resting opacity, no
 * label) so it never competes with the cinematic storytelling, but with a
 * generous padded hit target and full keyboard/focus support underneath.
 * Shares the same persisted preference as the Operations theme toggle (see
 * lib/theme.ts) — there is only ever one MARINT theme choice.
 *
 * The active state's icon renders INSIDE the moving thumb (not as a second,
 * separately-positioned copy underneath it) — only the inactive state's icon
 * is ever drawn at the capsule's other end. That's what keeps the sun/moon
 * glyphs from ever overlapping the thumb: there is only ever one icon at
 * each anchor position, never two. */
export default function HomeThemeSwitch() {
  const [theme, toggle] = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="group fixed bottom-3 right-3 md:bottom-5 md:right-5 z-40 p-2 rounded-full
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60"
    >
      <span
        className="relative block h-16 md:h-[72px] w-6 md:w-7 rounded-full
                   border border-home-ink/15 bg-home-bg/45 backdrop-blur-sm
                   opacity-45 shadow-none
                   transition-all duration-[350ms] ease-out
                   group-hover:opacity-100 group-focus-visible:opacity-100
                   group-hover:shadow-[0_4px_16px_rgba(47,167,214,0.28)] group-focus-visible:shadow-[0_4px_16px_rgba(47,167,214,0.28)]
                   group-hover:border-cyan/30 group-focus-visible:border-cyan/30"
      >
        {isDark ? (
          <SunGlyph className="absolute left-1/2 -translate-x-1/2 top-2 text-home-ink/70 group-hover:text-cyan transition-colors" />
        ) : (
          <MoonGlyph className="absolute left-1/2 -translate-x-1/2 bottom-2 text-home-ink/70 group-hover:text-cyan transition-colors" />
        )}
        <span
          className="absolute left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-cyan flex items-center justify-center transition-all duration-[350ms] ease-out"
          style={isDark ? { top: "auto", bottom: ANCHOR_INSET } : { top: ANCHOR_INSET, bottom: "auto" }}
        >
          {isDark ? <MoonGlyph className="text-navy-deep" /> : <SunGlyph className="text-navy-deep" />}
        </span>
      </span>
    </button>
  );
}
