import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMarintStore } from "../lib/store";
import { buildInvestigation, loadAnalystNotes, saveAnalystNotes } from "../lib/investigation";
import { riskBandColor } from "../lib/format";
import MapView from "../components/map/MapView";
import MapLegend from "../components/map/MapLegend";
import DetectionDetail from "../components/map/DetectionDetail";
import EventTimeline from "../components/panels/EventTimeline";
import SatelliteEvidence from "../components/investigation/SatelliteEvidence";
import CorrelationReview from "../components/investigation/CorrelationReview";
import AiCopilot from "../components/investigation/AiCopilot";
import FlagIcon from "../components/common/FlagIcon";
import ThemeToggle from "../components/common/ThemeToggle";
import BrandMark from "../components/common/BrandMark";

export default function Investigation() {
  const { vesselId } = useParams<{ vesselId: string }>();
  const navigate = useNavigate();
  const load = useMarintStore((s) => s.load);
  const loading = useMarintStore((s) => s.loading);
  const vessel = useMarintStore((s) => (vesselId ? s.vesselById(vesselId) : undefined));
  const events = useMarintStore((s) => s.events);
  const selectVessel = useMarintStore((s) => s.selectVessel);
  const revealDetection = useMarintStore((s) => s.revealDetection);
  const primaryDetectionEvent = useMarintStore((s) => s.primaryDetectionEvent);
  const eventsForVessel = useMarintStore((s) => s.eventsForVessel);
  const vesselById = useMarintStore((s) => s.vesselById);
  const track = useMarintStore((s) => (vesselId ? s.tracks[vesselId] : undefined));

  const [notes, setNotes] = useState("");

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!vesselId) return;
    selectVessel(vesselId);
    const det = primaryDetectionEvent(vesselId);
    if (det) revealDetection(det.id, vesselId);
    setNotes(loadAnalystNotes(vesselId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vesselId]);

  if (loading) {
    return <div className="h-dvh w-screen flex items-center justify-center bg-surface-0 text-ink/50 text-sm">Loading investigation…</div>;
  }
  if (!vessel) {
    return <div className="h-dvh w-screen flex items-center justify-center bg-surface-0 text-ink/50 text-sm">Vessel not found.</div>;
  }

  const investigation = buildInvestigation(vessel, events);
  if (!investigation) {
    return (
      <div className="h-dvh w-screen flex flex-col items-center justify-center gap-4 bg-surface-0 text-ink/50 text-sm">
        <p>{vessel.name} has no active investigation — this vessel is not currently flagged.</p>
        <Link to="/operations" className="text-cyan hover:text-cyan-light">← Back to operations</Link>
      </div>
    );
  }

  const relatedVesselId = investigation.scenarioEvents.find((e) => e.related_vessel_id)?.related_vessel_id;
  const relatedVessel = relatedVesselId ? vesselById(relatedVesselId) : undefined;
  const relatedEvents = relatedVesselId ? eventsForVessel(relatedVesselId) : [];
  const combinedEvents = Array.from(new Map([...investigation.scenarioEvents, ...relatedEvents].map((e) => [e.id, e])).values());

  function handleNotesChange(text: string) {
    setNotes(text);
    if (vesselId) saveAnalystNotes(vesselId, text);
  }

  return (
    <div className="h-dvh w-screen flex flex-col bg-surface-0">
      <header
        className="h-16 shrink-0 border-b border-hairline flex items-center gap-4 px-5"
        style={{ background: "var(--nav-surface)", boxShadow: "var(--shadow-card)" }}
      >
        <button onClick={() => navigate("/operations")} className="text-ink/50 hover:text-ink text-sm flex items-center gap-1.5">
          ← Map
        </button>
        <div className="h-5 w-px bg-hairline" />
        <BrandMark size={24} />
        <FlagIcon country={vessel.flag} className="h-4 w-6" />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-wider text-ink/35">{investigation.id}</div>
          <div className="text-sm font-medium text-ink truncate">{investigation.title}</div>
        </div>
        <span
          className="text-[11px] font-medium px-2.5 py-1 rounded-md shrink-0"
          style={{ background: `${riskBandColor(vessel.risk_band)}22`, color: riskBandColor(vessel.risk_band) }}
        >
          {vessel.risk_band_label} · {vessel.risk_score}/100
        </span>
        <Link
          to={`/investigation/${vessel.id}/report`}
          className="shrink-0 text-[13px] font-medium px-4 py-2 rounded-full bg-cyan text-navy-deep hover:bg-cyan-light transition-colors shadow-sm"
        >
          Generate Report
        </Link>
        <ThemeToggle />
      </header>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 relative min-w-0 border-r border-hairline">
          <MapView />
          <MapLegend />
          <DetectionDetail />
        </div>

        <div className="w-[420px] shrink-0 overflow-y-auto p-5 space-y-6 text-[13px]">
          <section>
            <h2 className="text-[11px] uppercase tracking-wider text-ink/40 mb-2.5">Investigation summary</h2>
            <div className="space-y-3 bg-surface-1 border border-hairline rounded-xl p-4 shadow-[var(--shadow-card)]">
              <SummaryRow label="What" value={investigation.what} />
              <SummaryRow label="Where" value={investigation.where} />
              <SummaryRow label="When" value={investigation.when} />
              <SummaryRow label="Why flagged" value={investigation.why} />
            </div>
          </section>

          <SatelliteEvidence events={investigation.scenarioEvents} />
          <CorrelationReview vessel={vessel} events={investigation.scenarioEvents} />

          {relatedVessel && (
            <section>
              <h2 className="text-[11px] uppercase tracking-wider text-ink/40 mb-2.5">Related vessel</h2>
              <Link
                to={`/investigation/${relatedVessel.id}`}
                className="flex items-center justify-between bg-surface-1 border border-hairline rounded-xl p-3.5 hover:border-cyan/40 transition-colors shadow-[var(--shadow-card)]"
              >
                <div>
                  <div className="text-ink/90 font-medium">{relatedVessel.name}</div>
                  <div className="text-ink/40 text-[11px]">{relatedVessel.type_label} · {relatedVessel.flag}</div>
                </div>
                <span className="text-cyan text-[11px]">View →</span>
              </Link>
            </section>
          )}

          <section>
            <h2 className="text-[11px] uppercase tracking-wider text-ink/40 mb-2.5">Evidence timeline</h2>
            <div className="bg-surface-1 border border-hairline rounded-xl p-4 shadow-[var(--shadow-card)]">
              <EventTimeline events={combinedEvents} />
            </div>
          </section>

          <AiCopilot key={vessel.id} vessel={vessel} events={investigation.scenarioEvents} track={track} relatedVessel={relatedVessel} />

          <section>
            <h2 className="text-[11px] uppercase tracking-wider text-ink/40 mb-2.5">MARINT assessment</h2>
            <p className="text-ink/60 leading-relaxed bg-surface-1 border border-hairline rounded-xl p-4 shadow-[var(--shadow-card)]">{investigation.conclusion}</p>
          </section>

          <section>
            <h2 className="text-[11px] uppercase tracking-wider text-ink/40 mb-2.5">Analyst notes</h2>
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Add analyst findings — this text will be included in the generated report…"
              rows={5}
              className="w-full bg-surface-1 border border-hairline rounded-xl p-3.5 text-ink/85 placeholder:text-ink/30 outline-none focus:border-cyan/40 resize-none leading-relaxed shadow-[var(--shadow-card)]"
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink/35 mb-1">{label}</div>
      <div className="text-ink/85 leading-relaxed">{value}</div>
    </div>
  );
}
