import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMarintStore } from "../lib/store";
import { buildInvestigation, loadAnalystNotes } from "../lib/investigation";
import { countryName, formatDateTime } from "../lib/format";
import { FLAG_ASSET } from "../lib/flags";
import BrandMark from "../components/common/BrandMark";

export default function Report() {
  const { vesselId } = useParams<{ vesselId: string }>();
  const navigate = useNavigate();
  const load = useMarintStore((s) => s.load);
  const loading = useMarintStore((s) => s.loading);
  const vessel = useMarintStore((s) => (vesselId ? s.vesselById(vesselId) : undefined));
  const events = useMarintStore((s) => s.events);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="h-screen flex items-center justify-center text-ink/50 text-sm bg-surface-0">Loading report…</div>;
  if (!vessel) return <div className="h-screen flex items-center justify-center text-ink/50 text-sm bg-surface-0">Vessel not found.</div>;

  const investigation = buildInvestigation(vessel, events);
  if (!investigation) return <div className="h-screen flex items-center justify-center text-ink/50 text-sm bg-surface-0">No investigation available for this vessel.</div>;

  const notes = vesselId ? loadAnalystNotes(vesselId) : "";
  const generatedAt = new Date().toISOString();
  const detectionEvents = investigation.scenarioEvents.filter((e) => e.kind === "sar_detection" || e.kind === "optical_detection");

  return (
    <div className="min-h-screen bg-[#e9edf1]">
      <div className="print-hidden sticky top-0 z-10 bg-navy-deep border-b border-hairline px-6 py-3 flex items-center justify-between">
        <button onClick={() => navigate(`/investigation/${vessel.id}`)} className="text-white/60 hover:text-white text-sm">
          ← Back to investigation
        </button>
        <button onClick={() => window.print()} className="text-[13px] font-medium px-4 py-2 rounded-md bg-cyan text-navy-deep hover:bg-cyan-light transition-colors">
          Print / Save as PDF
        </button>
      </div>

      <div className="max-w-[820px] mx-auto bg-white text-[#1a2733] my-8 shadow-xl print:shadow-none print:my-0 px-12 py-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#112a46] pb-5 mb-8">
          <div className="flex items-center gap-3">
            <BrandMark size={42} />
            <div>
              <div className="font-display font-semibold tracking-[0.2em] text-[#112a46] text-sm">MARINT</div>
              <div className="text-[10px] uppercase tracking-wider text-[#5b7d95]">Maritime Intelligence Report</div>
            </div>
          </div>
          <div className="text-right text-[11px] text-[#5b7d95]">
            <div>{investigation.id}</div>
            <div>Generated {formatDateTime(generatedAt)}</div>
          </div>
        </div>

        <h1 className="text-2xl font-display font-semibold text-[#112a46] mb-1">{investigation.title}</h1>
        <p className="text-[#5b7d95] text-sm mb-8">Subject vessel: {vessel.name} · IMO {vessel.imo} · MMSI {vessel.mmsi}</p>

        <ReportSection title="Executive Summary">
          <p className="leading-relaxed text-[#2b3947]">{investigation.executiveSummary}</p>
        </ReportSection>

        <ReportSection title="Vessel Information">
          <div className="grid grid-cols-3 gap-x-6 gap-y-3 text-[13px]">
            <Field label="Name" value={vessel.name} />
            <Field label="Type" value={vessel.type_label} />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#8298a8]">Flag</div>
              <div className="text-[#1a2733] flex items-center gap-1.5">
                <img src={FLAG_ASSET[vessel.flag]} alt="" className="h-2.5 w-4 object-cover rounded-[1px] ring-1 ring-[#dbe3ea]" />
                {countryName(vessel.flag)}
              </div>
            </div>
            <Field label="IMO" value={vessel.imo} />
            <Field label="MMSI" value={vessel.mmsi} />
            <Field label="Callsign" value={vessel.callsign} />
            <Field label="Length" value={`${vessel.length} m`} />
            <Field label="Beam" value={`${vessel.beam} m`} />
            <Field label="Origin → Destination" value={`${vessel.origin} → ${vessel.destination}`} />
          </div>
        </ReportSection>

        <ReportSection title="Risk Assessment">
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-3xl font-display font-semibold text-[#112a46]">{vessel.risk_score}</span>
            <span className="text-[#5b7d95] text-sm">/ 100 — {vessel.risk_band_label}</span>
          </div>
          <table className="w-full text-[13px] border-collapse">
            <tbody>
              {vessel.risk_factors.map((f) => (
                <tr key={f.code} className="border-t border-[#dbe3ea]">
                  <td className="py-1.5 text-[#2b3947]">{f.label}</td>
                  <td className="py-1.5 text-right font-mono text-[#5b7d95]">+{f.delta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ReportSection>

        <ReportSection title="Event Timeline">
          <table className="w-full text-[12.5px] border-collapse">
            <tbody>
              {investigation.scenarioEvents.map((e) => (
                <tr key={e.id} className="border-t border-[#dbe3ea] align-top">
                  <td className="py-2 pr-3 font-mono text-[#5b7d95] whitespace-nowrap">{formatDateTime(e.ts)}</td>
                  <td className="py-2">
                    <div className="font-medium text-[#1a2733]">{e.title}</div>
                    <div className="text-[#5b7d95] mt-0.5 leading-relaxed">{e.description}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ReportSection>

        {detectionEvents.length > 0 && (
          <ReportSection title="Relevant Detections">
            <div className="space-y-3">
              {detectionEvents.map((e) => {
                const d = e.data as { sensor_type: string; source: string; confidence: number; estimated_length_m: number; position: { lat: number; lon: number } };
                return (
                  <div key={e.id} className="text-[13px] border border-[#dbe3ea] rounded-md p-3">
                    <div className="font-medium text-[#1a2733]">{d.sensor_type} detection — {formatDateTime(e.ts)}</div>
                    <div className="text-[#5b7d95] mt-1">
                      {d.source} · Confidence {Math.round(d.confidence * 100)}% · Est. length {d.estimated_length_m} m · Position {d.position.lat.toFixed(3)}, {d.position.lon.toFixed(3)}
                    </div>
                  </div>
                );
              })}
            </div>
          </ReportSection>
        )}

        <ReportSection title="Geographic Location">
          <p className="text-[#2b3947] text-[13px]">{investigation.where}</p>
        </ReportSection>

        <ReportSection title="Analyst Findings">
          <p className="text-[#2b3947] leading-relaxed whitespace-pre-wrap">{notes || "No analyst notes recorded for this investigation."}</p>
        </ReportSection>

        <ReportSection title="Conclusion">
          <p className="text-[#2b3947] leading-relaxed">{investigation.conclusion}</p>
        </ReportSection>

        <div className="border-t border-[#dbe3ea] mt-10 pt-5 text-[10.5px] text-[#8298a8] leading-relaxed">
          This report was generated by the MARINT Caspian Sea demonstration prototype from the scenario data
          present in the application. Vessel identity, AIS tracks, and events referenced above are synthetic
          demo data, not real-world vessel activity — see the project's data-sources documentation for full
          provenance. Geographic reference data is derived from Natural Earth (public domain).
        </div>
      </div>

      <div className="print-hidden max-w-[820px] mx-auto pb-10 text-center">
        <Link to="/operations" className="text-[#5b7d95] hover:text-[#1a2733] text-xs">Return to operational map</Link>
      </div>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7 break-inside-avoid">
      <h2 className="text-[11px] uppercase tracking-[0.15em] text-[#5b7d95] font-medium border-b border-[#dbe3ea] pb-2 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[#8298a8]">{label}</div>
      <div className="text-[#1a2733]">{value}</div>
    </div>
  );
}
