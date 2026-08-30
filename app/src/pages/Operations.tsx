import { useEffect } from "react";
import TopNav from "../components/layout/TopNav";
import Sidebar from "../components/panels/Sidebar";
import VesselPanel from "../components/panels/VesselPanel";
import MapView from "../components/map/MapView";
import MapControls from "../components/map/MapControls";
import MapLegend from "../components/map/MapLegend";
import MapStats from "../components/map/MapStats";
import DetectionDetail from "../components/map/DetectionDetail";
import Timeline from "../components/map/Timeline";
import { useMarintStore } from "../lib/store";

export default function Operations() {
  const load = useMarintStore((s) => s.load);
  const loading = useMarintStore((s) => s.loading);
  const error = useMarintStore((s) => s.error);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="h-screen w-screen flex flex-col bg-surface-0">
      <TopNav />
      <div className="flex-1 flex min-h-0">
        <Sidebar />
        <main className="flex-1 relative min-w-0">
          <MapView />
          <MapControls />
          <MapStats />
          <MapLegend />
          <DetectionDetail />
          <Timeline />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-0/70 text-ink/60 text-sm">
              Loading operational picture…
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-0/90 text-status-critical text-sm">
              {error}
            </div>
          )}
        </main>
        <VesselPanel />
      </div>
    </div>
  );
}
