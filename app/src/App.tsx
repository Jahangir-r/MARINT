import { useEffect, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Operations from "./pages/Operations";
import Investigation from "./pages/Investigation";
import Report from "./pages/Report";
import ErrorBoundary from "./components/common/ErrorBoundary";
import BrandTransition from "./components/common/BrandTransition";
import { registerOperationsTransition } from "./lib/brandTransition";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // No sessionStorage/localStorage gating, deliberately: this is a
  // page-load identity animation, not a once-ever loader. App.tsx itself
  // only exists because the document was actually loaded/refreshed — SPA
  // navigation (including browser Back) never remounts it, so `showIntro`
  // starting true here already means "plays on every real page load, never
  // on internal route changes" with no extra bookkeeping needed.
  const [showIntro, setShowIntro] = useState(true);
  const [opsTransition, setOpsTransition] = useState<{ active: boolean; target: string | null }>({ active: false, target: null });

  useEffect(() => {
    registerOperationsTransition((targetPath) => setOpsTransition({ active: true, target: targetPath }));
    return () => registerOperationsTransition(null);
  }, []);

  return (
    <>
      <ErrorBoundary key={location.pathname}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/operations" element={<Operations />} />
          <Route path="/investigation/:vesselId" element={<Investigation />} />
          <Route path="/investigation/:vesselId/report" element={<Report />} />
        </Routes>
      </ErrorBoundary>

      {showIntro && <BrandTransition variant="intro" onComplete={() => setShowIntro(false)} />}

      {opsTransition.active && (
        <BrandTransition
          variant="operations"
          onMidpoint={() => {
            if (opsTransition.target) navigate(opsTransition.target);
          }}
          onComplete={() => setOpsTransition({ active: false, target: null })}
        />
      )}
    </>
  );
}
