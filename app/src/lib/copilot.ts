import type { CorrelationDecision } from "./store";
import type { MarintEvent, TrackPoint, Vessel } from "./../types";
import { formatCoord, formatDateTime, formatTimeAgo } from "./format";

export interface CopilotContext {
  vessel: Vessel;
  events: MarintEvent[];
  track?: TrackPoint[];
  relatedVessel?: Vessel;
  correlationDecision?: CorrelationDecision;
  demoNow?: string | null;
}

interface Question {
  label: string;
  keywords: string[];
  answer: (ctx: CopilotContext) => string;
}

function findEvent(ctx: CopilotContext, kind: string) {
  return ctx.events.find((e) => e.kind === kind);
}
function riskLine(v: Vessel): string {
  return `Risk: ${v.risk_score}/100 — ${v.risk_band_label}`;
}

// ---------------------------------------------------------------------------
// Generic (available for every vessel, flagged or not)
// ---------------------------------------------------------------------------
function qSummarize({ vessel, track }: CopilotContext): string {
  const c = vessel.current;
  const lines = [
    `${vessel.name} — ${vessel.type_label}, ${vessel.flag}-flagged (IMO ${vessel.imo}, MMSI ${vessel.mmsi}).`,
    `Route: ${vessel.origin} → ${vessel.destination}.`,
    c ? `Status: ${c.nav_status}, ${c.sog.toFixed(1)} kn${c.ais_active ? "" : " (AIS inactive — last known values)"}.` : "No current position on file.",
    track && track.length > 1 ? `${track.length} track points in the current window.` : "",
    riskLine(vessel),
  ];
  return lines.filter(Boolean).join("\n");
}

function qStatus({ vessel, demoNow }: CopilotContext): string {
  const c = vessel.current;
  if (!c) return `${vessel.name} has no current position on file in this window.`;
  const age = demoNow ? formatTimeAgo(c.ts, demoNow) : "";
  return [
    `Position: ${formatCoord(c.lat, c.lon)}${age ? ` (updated ${age})` : ""}.`,
    `Speed ${c.sog.toFixed(1)} kn, course ${c.cog ?? "—"}°, status "${c.nav_status}".`,
    c.ais_active ? "AIS: actively transmitting." : "AIS: inactive — this is the last confirmed position before signal loss.",
  ].join("\n");
}

function qMovement({ vessel, track }: CopilotContext): string {
  if (!track || track.length < 2) return `No track history is available for ${vessel.name} in the current window.`;
  const first = track[0];
  const last = track[track.length - 1];
  return [
    `First position in window: ${formatCoord(first.lat, first.lon)} at ${formatDateTime(first.ts)}.`,
    `Latest position: ${formatCoord(last.lat, last.lon)} at ${formatDateTime(last.ts)}.`,
    `${track.length} AIS reports recorded, averaging one every ~15 minutes while transmitting.`,
  ].join("\n");
}

function qDestination({ vessel }: CopilotContext): string {
  return `Filed route: ${vessel.origin} → ${vessel.destination}.`;
}

function qUnusual(ctx: CopilotContext): string {
  const { vessel } = ctx;
  if (!vessel.scenario) {
    return `Nothing flagged for ${vessel.name} — it matches expected AIS behavior for its route and vessel type, with only baseline operational uncertainty (+5) contributing to its risk score.`;
  }
  return qWhyFlagged(ctx);
}

function qRiskFactors({ vessel }: CopilotContext): string {
  const lines = vessel.risk_factors.map((f) => `• ${f.label}: +${f.delta}`);
  return `${riskLine(vessel)}\n\n${lines.join("\n")}`;
}

function qWhyFlagged({ vessel }: CopilotContext): string {
  const factors = vessel.risk_factors.filter((f) => f.code !== "baseline");
  if (factors.length === 0) return `${vessel.name} has no active risk factors beyond baseline operational uncertainty.`;
  return `${vessel.name} is flagged because of:\n${factors.map((f) => `• ${f.label} (+${f.delta})`).join("\n")}\n\n${riskLine(vessel)}.`;
}

function qNextSteps(ctx: CopilotContext): string {
  const { vessel, correlationDecision } = ctx;
  const steps: string[] = [];
  if (vessel.scenario === "dark_vessel" && !correlationDecision) {
    steps.push("Confirm or reject the SAR/optical correlation under Correlation Review before closing this case.");
  }
  if (vessel.current && !vessel.current.ais_active) {
    steps.push("Watch for AIS reacquisition and cross-check the next satellite pass over this corridor.");
  }
  const restricted = findEvent(ctx, "restricted_area_entry");
  if (restricted) steps.push(`Review whether the ${(restricted.data as { zone_name: string }).zone_name} entry warrants an operator inquiry.`);
  if (steps.length === 0) steps.push("No further action needed — continue routine monitoring.");
  return steps.map((s) => `• ${s}`).join("\n");
}

// ---------------------------------------------------------------------------
// Dark vessel
// ---------------------------------------------------------------------------
function qWhyDark(ctx: CopilotContext): string {
  const gap = findEvent(ctx, "ais_gap");
  const sar = findEvent(ctx, "sar_detection");
  const corr = findEvent(ctx, "correlation_failed");
  if (!gap) return `As of the current time, ${ctx.vessel.name}'s AIS is transmitting normally — nothing unusual to report.`;
  const parts: string[] = [`${ctx.vessel.name} is a possible dark vessel because:`];
  if (gap) parts.push(`• AIS transmission stopped at ${formatDateTime(gap.ts)}, mid-corridor.`);
  if (sar) parts.push(`• A SAR pass detected an uncorrelated vessel-sized return at ${formatDateTime(sar.ts)}, near the predicted position.`);
  if (corr) parts.push(`• MARINT could not match that detection to any known AIS track (${Math.round((corr.data as { ais_match_confidence: number }).ais_match_confidence * 100)}% match confidence).`);
  parts.push(`\n${riskLine(ctx.vessel)}.`);
  return parts.join("\n");
}

function qAisLast(ctx: CopilotContext): string {
  const gap = findEvent(ctx, "ais_gap");
  if (!gap) return `${ctx.vessel.name}'s AIS is currently active — no signal loss recorded.`;
  const d = gap.data as { last_position?: { lat: number; lon: number } };
  return [
    `Last AIS report: ${formatDateTime(gap.ts)}.`,
    d.last_position ? `Last confirmed position: ${formatCoord(d.last_position.lat, d.last_position.lon)}.` : "",
    "No AIS reports have been received since.",
  ].filter(Boolean).join("\n");
}

function qSarFindings(ctx: CopilotContext): string {
  const sar = findEvent(ctx, "sar_detection");
  if (!sar) return `No SAR detection is on file for ${ctx.vessel.name}.`;
  const d = sar.data as { source: string; position: { lat: number; lon: number }; estimated_length_m: number; estimated_heading_deg: number; confidence: number };
  return [
    `SAR acquisition: ${formatDateTime(sar.ts)} (${d.source}).`,
    `Position: ${formatCoord(d.position.lat, d.position.lon)}.`,
    `Estimated length ${d.estimated_length_m} m, heading ${Math.round(d.estimated_heading_deg)}°.`,
    `Confidence: ${Math.round(d.confidence * 100)}%.`,
  ].join("\n");
}

function qOpticalFindings(ctx: CopilotContext): string {
  const opt = findEvent(ctx, "optical_detection");
  if (!opt) return `No optical corroboration is on file for ${ctx.vessel.name} yet.`;
  const d = opt.data as { source: string; position: { lat: number; lon: number }; estimated_length_m: number; estimated_heading_deg: number; confidence: number };
  return [
    `Optical acquisition: ${formatDateTime(opt.ts)} (${d.source}).`,
    `Position: ${formatCoord(d.position.lat, d.position.lon)}, ${Math.round(d.confidence * 100)}% confidence.`,
    `Estimated length ${d.estimated_length_m} m — ${findEvent(ctx, "sar_detection") ? "independently corroborates the SAR detection above." : "no SAR detection to compare against."}`,
  ].join("\n");
}

function qCompareEvidence(ctx: CopilotContext): string {
  const sar = findEvent(ctx, "sar_detection");
  const opt = findEvent(ctx, "optical_detection");
  if (!sar && !opt) return "No satellite evidence is on file for this vessel.";
  const lines: string[] = [];
  if (sar) {
    const d = sar.data as { estimated_length_m: number; confidence: number };
    lines.push(`SAR (${formatDateTime(sar.ts)}): ${d.estimated_length_m} m, ${Math.round(d.confidence * 100)}% confidence.`);
  }
  if (opt) {
    const d = opt.data as { estimated_length_m: number; confidence: number };
    lines.push(`Optical (${formatDateTime(opt.ts)}): ${d.estimated_length_m} m, ${Math.round(d.confidence * 100)}% confidence.`);
  }
  if (sar && opt) {
    const sd = sar.data as { estimated_length_m: number };
    const od = opt.data as { estimated_length_m: number };
    lines.push(`Length estimates agree within ${Math.abs(sd.estimated_length_m - od.estimated_length_m)} m — the two independent sensors are consistent with a single target.`);
  }
  return lines.join("\n");
}

function qCorrelationConfidence(ctx: CopilotContext): string {
  const corr = findEvent(ctx, "correlation_failed");
  const conf = corr ? Math.round((corr.data as { ais_match_confidence: number }).ais_match_confidence * 100) : null;
  if (conf === null) return "No correlation attempt is on file — this detection has not been compared against AIS tracks.";
  return `AIS match confidence: ${conf}%. MARINT could not reliably match the satellite detection to any active or recently-lost AIS track, which is why this is flagged as a possible dark vessel rather than a confirmed one.${ctx.correlationDecision ? `\n\nAnalyst decision on file: ${ctx.correlationDecision.replace("_", " ")}.` : "\n\nNo analyst decision recorded yet — see Correlation Review."}`;
}

// ---------------------------------------------------------------------------
// Ship-to-ship
// ---------------------------------------------------------------------------
function qS2sVessels(ctx: CopilotContext): string {
  const { vessel, relatedVessel } = ctx;
  if (!relatedVessel) return `${vessel.name} was involved in a ship-to-ship event, but the related vessel isn't loaded.`;
  return `${vessel.name} (${vessel.type_label}) and ${relatedVessel.name} (${relatedVessel.type_label}) — both ${vessel.flag}-flagged.`;
}
function qS2sDuration(ctx: CopilotContext): string {
  const end = findEvent(ctx, "ship_to_ship_end");
  if (!end) return "Duration not available.";
  const d = end.data as { duration_hours: number };
  return `The two vessels held station together for approximately ${d.duration_hours} hours.`;
}
function qS2sDistance(ctx: CopilotContext): string {
  const start = findEvent(ctx, "ship_to_ship_start");
  return start ? "The vessels closed to within approximately 150 m of each other — consistent with a ship-to-ship transfer distance, not passing traffic." : "No proximity data on file.";
}
function qS2sWhySuspicious(ctx: CopilotContext): string {
  const start = findEvent(ctx, "ship_to_ship_start");
  const end = findEvent(ctx, "ship_to_ship_end");
  const dur = end ? (end.data as { duration_hours: number }).duration_hours : null;
  return [
    "Two vessels closed to ~150 m and held station together, longer than routine passing traffic would justify.",
    dur ? `Duration: ~${dur} hours.` : "",
    start?.data && "location" in (start.data as object) ? `Location: ${formatCoord((start.data as { location: { lat: number; lon: number } }).location.lat, (start.data as { location: { lat: number; lon: number } }).location.lon)}.` : "",
    "This is not confirmed as illicit — it's also consistent with legitimate bunkering or offshore support — but the unscheduled rendezvous warrants review.",
  ].filter(Boolean).join("\n");
}

// ---------------------------------------------------------------------------
// Route deviation
// ---------------------------------------------------------------------------
function qExpectedRoute(ctx: CopilotContext): string {
  const dev = findEvent(ctx, "route_deviation");
  if (!dev) return `${ctx.vessel.name} is on its filed route.`;
  const d = dev.data as { expected_destination: string };
  return `Filed destination: ${d.expected_destination}, on the established Alat–Aktau corridor. The vessel has not resumed course toward it.`;
}
function qDeviationStart(ctx: CopilotContext): string {
  const dev = findEvent(ctx, "route_deviation");
  return dev ? `Deviation began at ${formatDateTime(dev.ts)}.` : "No deviation on file.";
}
function qDeviationExtent(ctx: CopilotContext): string {
  const dev = findEvent(ctx, "route_deviation");
  if (!dev) return "No deviation on file.";
  const d = dev.data as { deviation_bearing_change_deg: number };
  return `Bearing changed by ${d.deviation_bearing_change_deg}° from the expected corridor at ${formatDateTime(dev.ts)}, and the vessel has continued on the new heading since.`;
}
function qDeviationRestricted(ctx: CopilotContext): string {
  const zone = findEvent(ctx, "restricted_area_entry");
  return zone ? `Yes — the deviation carried it into the ${(zone.data as { zone_name: string }).zone_name}.` : "No restricted-area entry recorded for this deviation.";
}

// ---------------------------------------------------------------------------
// Loitering
// ---------------------------------------------------------------------------
function qLoiterWhy(ctx: CopilotContext): string {
  const l = findEvent(ctx, "loitering_detected");
  if (!l) return "No loitering behavior on file.";
  const d = l.data as { duration_hours: number; avg_speed_kn: number };
  return `${ctx.vessel.name} has held a tight repeating pattern in open water — away from any port, anchorage, or route — for ~${d.duration_hours} hours at an average of ${d.avg_speed_kn} kn.`;
}
function qLoiterDuration(ctx: CopilotContext): string {
  const l = findEvent(ctx, "loitering_detected");
  const d = l?.data as { duration_hours: number } | undefined;
  return d ? `~${d.duration_hours} hours and counting.` : "No loitering duration on file.";
}
function qLoiterRestricted(ctx: CopilotContext): string {
  const zone = findEvent(ctx, "restricted_area_entry");
  return zone ? `Yes — this loitering position falls inside the ${(zone.data as { zone_name: string }).zone_name}.` : "This position is not inside a designated restricted zone.";
}

// ---------------------------------------------------------------------------
// AIS anomaly
// ---------------------------------------------------------------------------
function qAisAnomaly(ctx: CopilotContext): string {
  const jump = findEvent(ctx, "ais_position_jump");
  if (!jump) return "No AIS anomaly on file.";
  const d = jump.data as { implied_speed_kn: number };
  return `Two consecutive AIS reports implied a speed of ~${d.implied_speed_kn} kn — far beyond this vessel's capability. This pattern is more consistent with an AIS equipment/transmission fault than deliberate deception, but MARINT can't distinguish the two from a single reading.`;
}

// ---------------------------------------------------------------------------
// Question sets — chip labels shown depend on the vessel's scenario
// ---------------------------------------------------------------------------
const ALWAYS: Question[] = [
  { label: "Explain the risk score", keywords: ["risk", "score", "factor"], answer: qRiskFactors },
  { label: "What should I review next?", keywords: ["next", "review", "should"], answer: qNextSteps },
];

const NORMAL: Question[] = [
  { label: "Summarize this vessel", keywords: ["summar"], answer: qSummarize },
  { label: "What is its current status?", keywords: ["status", "current"], answer: qStatus },
  { label: "Show recent movement", keywords: ["movement", "moved", "track"], answer: qMovement },
  { label: "Does anything look unusual?", keywords: ["unusual", "suspicious", "anomal"], answer: qUnusual },
  { label: "What is its destination?", keywords: ["destination", "going", "route"], answer: qDestination },
];

const FLAGGED_BASE: Question[] = [
  { label: "Why is this vessel flagged?", keywords: ["why", "flag"], answer: qWhyFlagged },
  { label: "What evidence supports this alert?", keywords: ["evidence", "support", "proof"], answer: qSummarize },
  { label: "Summarize this investigation", keywords: ["summar"], answer: qSummarize },
];

const DARK_VESSEL: Question[] = [
  { label: "Why is this considered a possible dark vessel?", keywords: ["why", "dark", "possible"], answer: qWhyDark },
  { label: "When was AIS last received?", keywords: ["ais", "last", "when"], answer: qAisLast },
  { label: "What did SAR detect?", keywords: ["sar"], answer: qSarFindings },
  { label: "Is there an optical confirmation?", keywords: ["optical", "confirm", "corrobor"], answer: qOpticalFindings },
  { label: "Compare AIS and satellite evidence", keywords: ["compare"], answer: qCompareEvidence },
  { label: "What is the correlation confidence?", keywords: ["correlation", "confidence", "match"], answer: qCorrelationConfidence },
];

const SHIP_TO_SHIP: Question[] = [
  { label: "Which vessels were involved?", keywords: ["which", "vessels", "involved"], answer: qS2sVessels },
  { label: "How long were they in proximity?", keywords: ["how long", "duration", "proximity"], answer: qS2sDuration },
  { label: "How close did they get?", keywords: ["close", "distance"], answer: qS2sDistance },
  { label: "Why was the interaction suspicious?", keywords: ["why", "suspicious"], answer: qS2sWhySuspicious },
];

const ROUTE_DEVIATION: Question[] = [
  { label: "What was the expected route?", keywords: ["expected", "route", "filed"], answer: qExpectedRoute },
  { label: "Where did the deviation begin?", keywords: ["where", "begin", "start"], answer: qDeviationStart },
  { label: "How far did the vessel deviate?", keywords: ["how far", "extent", "bearing"], answer: qDeviationExtent },
  { label: "Did the vessel enter a restricted area?", keywords: ["restricted"], answer: qDeviationRestricted },
];

const LOITERING: Question[] = [
  { label: "Why is this loitering considered suspicious?", keywords: ["why", "suspicious", "loiter"], answer: qLoiterWhy },
  { label: "How long has it been loitering?", keywords: ["how long", "duration"], answer: qLoiterDuration },
  { label: "Is it inside a restricted area?", keywords: ["restricted"], answer: qLoiterRestricted },
];

const AIS_ANOMALY: Question[] = [
  { label: "What is the AIS anomaly?", keywords: ["anomaly", "what"], answer: qAisAnomaly },
];

export function questionsFor(vessel: Vessel): Question[] {
  switch (vessel.scenario) {
    case "dark_vessel":
      return [...DARK_VESSEL, ...FLAGGED_BASE, ...ALWAYS];
    case "ship_to_ship":
      return [...SHIP_TO_SHIP, ...FLAGGED_BASE, ...ALWAYS];
    case "route_deviation":
      return [...ROUTE_DEVIATION, ...FLAGGED_BASE, ...ALWAYS];
    case "loitering":
      return [...LOITERING, ...FLAGGED_BASE, ...ALWAYS];
    case "ais_anomaly":
      return [...AIS_ANOMALY, ...FLAGGED_BASE, ...ALWAYS];
    default:
      return [...NORMAL, ...ALWAYS];
  }
}

export function askCopilot(question: string, ctx: CopilotContext): string {
  const lower = question.toLowerCase();
  const pool = questionsFor(ctx.vessel);
  const exact = pool.find((q) => q.label.toLowerCase() === lower);
  if (exact) return exact.answer(ctx);
  const match = pool.find((q) => q.keywords.some((k) => lower.includes(k)));
  if (match) return match.answer(ctx);
  return qSummarize(ctx);
}
