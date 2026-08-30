import { Link, useNavigate } from "react-router-dom";
import { triggerOperationsTransition } from "../../lib/brandTransition";

export default function FinalCta() {
  const navigate = useNavigate();
  return (
    <section className="relative bg-home-bg border-t border-hairline overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(47,167,214,0.14), transparent)" }}
      />
      <div className="relative max-w-3xl mx-auto text-center px-6 py-28">
        <h2 className="font-display text-3xl md:text-5xl font-semibold text-home-ink mb-6 leading-tight">
          See the operational picture for yourself.
        </h2>
        <p className="text-home-ink/50 mb-10 max-w-lg mx-auto leading-relaxed">
          Walk through the Caspian demonstration — select a vessel, review its route, and see why MARINT flagged it.
        </p>
        <Link
          to="/operations"
          onClick={(e) => {
            e.preventDefault();
            triggerOperationsTransition("/operations", () => navigate("/operations"));
          }}
          className="inline-block px-7 py-3.5 rounded-md bg-cyan text-navy-deep font-medium hover:bg-cyan-light transition-colors"
        >
          Enter Operational Picture
        </Link>
      </div>
    </section>
  );
}
