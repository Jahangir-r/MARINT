import BrandMark from "../common/BrandMark";

export default function Footer() {
  return (
    <footer className="bg-home-bg border-t border-hairline px-6 py-14">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr] gap-10">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <BrandMark size={30} />
            <span className="font-display font-semibold tracking-[0.22em] text-sm text-home-ink">MARINT</span>
          </div>
          <p className="text-home-ink/40 text-[13px] leading-relaxed max-w-xs">
            One operational picture. Multiple intelligence sources. Faster maritime decisions.
            <br />
            Born in the Caspian. Built for global waters.
          </p>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-wider text-home-ink/35 border-l-2 border-cyan/40 pl-2.5 mb-3">Product</div>
          <ul className="space-y-2 text-[13px] text-home-ink/55">
            <li><a href="#capabilities" className="hover:text-home-ink transition-colors">Capabilities</a></li>
            <li><a href="#caspian" className="hover:text-home-ink transition-colors">Caspian demonstration</a></li>
            <li><a href="/operations" className="hover:text-home-ink transition-colors">Operational map</a></li>
          </ul>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-wider text-home-ink/35 border-l-2 border-cyan/40 pl-2.5 mb-3">Current coverage</div>
          <ul className="space-y-2 text-[13px] text-home-ink/55">
            <li>Azerbaijan</li>
            <li>Russia</li>
            <li>Kazakhstan</li>
            <li>Turkmenistan</li>
            <li>Iran</li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto border-t border-hairline mt-10 pt-6 text-[11px] text-home-ink/30 leading-relaxed">
        MARINT is an operational demonstration prototype. Geographic data derived from Natural Earth (public
        domain); port coordinates are hand-curated from public sources. Vessel identities, tracks, and events
        shown in the Caspian demonstration are synthetic and generated for illustration — see the project's
        data sources documentation for full provenance.
      </div>
    </footer>
  );
}
