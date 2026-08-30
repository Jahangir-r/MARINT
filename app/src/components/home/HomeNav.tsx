import { Link, useNavigate } from "react-router-dom";
import BrandMark from "../common/BrandMark";
import { triggerOperationsTransition } from "../../lib/brandTransition";

export default function HomeNav() {
  const navigate = useNavigate();
  return (
    <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 md:px-10 py-5">
      <Link to="/" className="flex items-center gap-3">
        <BrandMark size={40} />
        <span className="font-display font-semibold tracking-[0.22em] text-sm text-home-ink">MARINT</span>
      </Link>
      <nav className="hidden md:flex items-center gap-8 text-[13px] text-home-ink/60 tracking-wide">
        <a href="#capabilities" className="hover:text-home-ink transition-colors">Capabilities</a>
        <a href="#caspian" className="hover:text-home-ink transition-colors">Caspian Demo</a>
        <a href="#global" className="hover:text-home-ink transition-colors">Global Vision</a>
      </nav>
      <Link
        to="/operations"
        onClick={(e) => {
          e.preventDefault();
          triggerOperationsTransition("/operations", () => navigate("/operations"));
        }}
        className="text-[13px] font-medium px-4 py-2 rounded-md border border-cyan/30 text-cyan hover:bg-cyan/10 transition-colors"
      >
        Enter Operational Picture
      </Link>
    </header>
  );
}
