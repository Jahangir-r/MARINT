import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useMarintStore } from "../../lib/store";
import ThemeToggle from "../common/ThemeToggle";
import BrandMark from "../common/BrandMark";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export default function TopNav() {
  const vessels = useMarintStore((s) => s.vessels);
  const selectVessel = useMarintStore((s) => s.selectVessel);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return vessels
      .filter((v) => v.name.toLowerCase().includes(q) || v.mmsi.includes(q) || v.imo.includes(q) || v.callsign.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, vessels]);

  function pick(id: string) {
    selectVessel(id);
    setQuery("");
    setOpen(false);
    setMobileSearchOpen(false);
  }

  return (
    <div className="relative z-30" style={{ paddingTop: "env(safe-area-inset-top)", background: "var(--nav-surface)" }}>
      <header
        className="h-14 lg:h-16 shrink-0 flex items-center gap-3 lg:gap-6 px-3 lg:px-5 border-b border-hairline"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <Link to="/" className="flex items-center gap-2 lg:gap-2.5 shrink-0">
          <span className="lg:hidden"><BrandMark size={28} /></span>
          <span className="hidden lg:inline-flex"><BrandMark size={34} /></span>
          <span className="hidden sm:inline font-display font-semibold tracking-[0.18em] text-sm text-ink">MARINT</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1.5 text-sm shrink-0">
          <span className="px-3.5 py-1.5 rounded-full bg-surface-1 text-ink font-medium shadow-sm">Operations</span>
          <span className="px-3 py-1.5 rounded-full uppercase tracking-wider text-[11px] text-blue border border-cyan/25 bg-surface-1/60 ml-1">
            Caspian Sea — Demo
          </span>
        </nav>

        {/* Desktop search — unchanged behavior, full width */}
        <div className="hidden lg:block flex-1 max-w-md relative">
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Search vessel, MMSI, IMO, callsign…"
            className="w-full bg-surface-1 border border-hairline rounded-full px-4 py-2 text-sm text-ink placeholder:text-ink/35 outline-none focus:border-cyan/50 shadow-sm"
          />
          {open && results.length > 0 && (
            <div className="absolute top-full mt-1.5 left-0 right-0 bg-surface-1 border border-hairline rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-soft)" }}>
              {results.map((v) => (
                <button
                  key={v.id}
                  onMouseDown={() => pick(v.id)}
                  className="w-full text-left px-3.5 py-2 text-sm text-ink/85 hover:bg-cyan/8 flex items-center justify-between"
                >
                  <span>{v.name}</span>
                  <span className="text-ink/40 text-xs">{v.type_label} · {v.flag}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 lg:hidden" />

        {/* Mobile search icon — expands to an overlay input below the header */}
        <button
          onClick={() => setMobileSearchOpen((v) => !v)}
          aria-label="Search vessels"
          className={`lg:hidden h-9 w-9 flex items-center justify-center rounded-full border transition-colors shrink-0 ${
            mobileSearchOpen ? "border-cyan/40 text-cyan bg-cyan/10" : "border-hairline text-ink/60 bg-surface-1"
          }`}
        >
          <SearchIcon />
        </button>

        <div className="hidden lg:block text-[11px] uppercase tracking-wider text-ink/40 shrink-0">
          Born in the Caspian. Built for global waters.
        </div>
        <ThemeToggle />
      </header>

      {mobileSearchOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-surface-1 border-b border-hairline p-3" style={{ boxShadow: "var(--shadow-soft)" }}>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vessel, MMSI, IMO, callsign…"
            className="w-full bg-surface-2 border border-hairline rounded-full px-4 py-2 text-sm text-ink placeholder:text-ink/35 outline-none focus:border-cyan/50"
          />
          {results.length > 0 && (
            <div className="mt-2 rounded-xl overflow-hidden border border-hairline max-h-64 overflow-y-auto">
              {results.map((v) => (
                <button
                  key={v.id}
                  onClick={() => pick(v.id)}
                  className="w-full text-left px-3.5 py-2.5 text-sm text-ink/85 hover:bg-cyan/8 flex items-center justify-between bg-surface-1"
                >
                  <span>{v.name}</span>
                  <span className="text-ink/40 text-xs">{v.type_label} · {v.flag}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
