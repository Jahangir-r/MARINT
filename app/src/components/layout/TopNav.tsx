import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useMarintStore } from "../../lib/store";
import ThemeToggle from "../common/ThemeToggle";
import BrandMark from "../common/BrandMark";

export default function TopNav() {
  const vessels = useMarintStore((s) => s.vessels);
  const selectVessel = useMarintStore((s) => s.selectVessel);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return vessels
      .filter((v) => v.name.toLowerCase().includes(q) || v.mmsi.includes(q) || v.imo.includes(q) || v.callsign.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, vessels]);

  return (
    <header
      className="h-16 shrink-0 flex items-center gap-6 px-5 relative z-30 border-b border-hairline"
      style={{ background: "var(--nav-surface)", boxShadow: "var(--shadow-card)" }}
    >
      <Link to="/" className="flex items-center gap-2.5 shrink-0">
        <BrandMark size={34} />
        <span className="font-display font-semibold tracking-[0.18em] text-sm text-ink">MARINT</span>
      </Link>

      <nav className="hidden md:flex items-center gap-1.5 text-sm shrink-0">
        <span className="px-3.5 py-1.5 rounded-full bg-surface-1 text-ink font-medium shadow-sm">Operations</span>
        <span className="px-3 py-1.5 rounded-full uppercase tracking-wider text-[11px] text-blue border border-cyan/25 bg-surface-1/60 ml-1">
          Caspian Sea — Demo
        </span>
      </nav>

      <div className="flex-1 max-w-md relative">
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
                onMouseDown={() => { selectVessel(v.id); setQuery(""); setOpen(false); }}
                className="w-full text-left px-3.5 py-2 text-sm text-ink/85 hover:bg-cyan/8 flex items-center justify-between"
              >
                <span>{v.name}</span>
                <span className="text-ink/40 text-xs">{v.type_label} · {v.flag}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="text-[11px] uppercase tracking-wider text-ink/40 shrink-0">
        Born in the Caspian. Built for global waters.
      </div>
      <ThemeToggle />
    </header>
  );
}
