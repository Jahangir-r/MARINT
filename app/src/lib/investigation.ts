import type { MarintEvent, Vessel } from "../types";
import { formatCoord, formatDateTime } from "./format";

interface ScenarioMeta {
  title: string;
  primaryKind: string;
  conclusion: string;
}

const SCENARIO_META: Record<string, ScenarioMeta> = {
  dark_vessel: {
    title: "Possible Dark Vessel",
    primaryKind: "dark_vessel_alert",
    conclusion:
      "AIS transmission stopped mid-corridor and a satellite pass subsequently detected an uncorrelated return of comparable size near the predicted position. This is a possible dark vessel event, not a confirmed one — recommend continued monitoring of this corridor and cross-referencing the next available satellite pass for AIS reacquisition.",
  },
  ais_anomaly: {
    title: "AIS Anomaly",
    primaryKind: "ais_position_jump",
    conclusion:
      "The reported position change between consecutive AIS reports exceeds this vessel's physical capability. This pattern is more consistent with an AIS equipment or transmission fault than deliberate deception, but was flagged because MARINT cannot distinguish the two from a single reading — recommend verifying against subsequent AIS reports.",
  },
  ship_to_ship: {
    title: "Possible Ship-to-Ship Activity",
    primaryKind: "ship_to_ship_start",
    conclusion:
      "Two vessels held station together, in close proximity, for longer than routine transit would suggest. This is not confirmed as illicit — the location and duration are also consistent with legitimate bunkering or offshore support activity — but the unscheduled nature of the rendezvous warrants analyst review.",
  },
  loitering: {
    title: "Suspicious Loitering",
    primaryKind: "loitering_detected",
    conclusion:
      "The vessel has remained in a tight, repeating low-speed pattern in open water, away from any port, anchorage, or established route. Recommend checking for AIS spoofing indicators, verifying the filed destination, and monitoring for a subsequent course change.",
  },
  route_deviation: {
    title: "Unexpected Route Deviation",
    primaryKind: "route_deviation",
    conclusion:
      "The vessel diverged sharply from its established route corridor and has not resumed course toward its filed destination. Recommend contacting the operator to confirm any change of destination, and continued track monitoring.",
  },
};

export interface Investigation {
  id: string;
  title: string;
  vessel: Vessel;
  scenarioEvents: MarintEvent[];
  primaryEvent: MarintEvent | undefined;
  what: string;
  where: string;
  when: string;
  why: string;
  conclusion: string;
  executiveSummary: string;
}

export function investigationId(vessel: Vessel): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `MARINT-INV-${datePart}-${vessel.mmsi.slice(-4)}`;
}

function eventPosition(e: MarintEvent | undefined): { lat: number; lon: number } | null {
  if (!e) return null;
  const d = e.data as Record<string, unknown>;
  if (d.position && typeof d.position === "object") return d.position as { lat: number; lon: number };
  if (d.location && typeof d.location === "object") return d.location as { lat: number; lon: number };
  if (d.area && typeof d.area === "object") return d.area as { lat: number; lon: number };
  if (d.reported_position && typeof d.reported_position === "object") return d.reported_position as { lat: number; lon: number };
  return null;
}

export function buildInvestigation(vessel: Vessel, allEvents: MarintEvent[]): Investigation | null {
  if (!vessel.scenario) return null;
  const meta = SCENARIO_META[vessel.scenario];
  if (!meta) return null;

  const scenarioEvents = allEvents
    .filter((e) => e.vessel_id === vessel.id || e.related_vessel_id === vessel.id)
    .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  const primaryEvent = scenarioEvents.find((e) => e.kind === meta.primaryKind) ?? scenarioEvents[scenarioEvents.length - 1];
  const alertEvents = scenarioEvents.filter((e) => e.severity);
  const firstAlert = alertEvents[0] ?? scenarioEvents[0];
  const lastAlert = alertEvents[alertEvents.length - 1] ?? scenarioEvents[scenarioEvents.length - 1];

  const pos = eventPosition(primaryEvent) ?? (vessel.current ? { lat: vessel.current.lat, lon: vessel.current.lon } : null);
  const where = pos ? formatCoord(pos.lat, pos.lon) : "Position unavailable";

  const when =
    firstAlert && lastAlert
      ? firstAlert.id === lastAlert.id
        ? formatDateTime(firstAlert.ts)
        : `${formatDateTime(firstAlert.ts)} — ${formatDateTime(lastAlert.ts)}`
      : "Unknown";

  const why = vessel.risk_factors
    .filter((f) => f.code !== "baseline")
    .map((f) => `${f.label} (+${f.delta})`)
    .join("; ");

  const what = primaryEvent?.description ?? "See event timeline for details.";

  const relatedVessel = scenarioEvents.find((e) => e.related_vessel_id)?.related_vessel_id;

  const executiveSummary = [
    `${vessel.name} (${vessel.type_label}, ${vessel.flag}-flagged, IMO ${vessel.imo}) was flagged by MARINT for ${meta.title.toLowerCase()}.`,
    what,
    `Current risk score: ${vessel.risk_score}/100 (${vessel.risk_band_label}), driven by: ${why || "baseline operational uncertainty only"}.`,
    relatedVessel ? "This event involves a second vessel, detailed below." : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    id: investigationId(vessel),
    title: `${meta.title} — ${vessel.name}`,
    vessel,
    scenarioEvents,
    primaryEvent,
    what,
    where,
    when,
    why: why || "Baseline operational uncertainty only.",
    conclusion: meta.conclusion,
    executiveSummary,
  };
}

export function analystNotesKey(vesselId: string): string {
  return `marint.analystNotes.${vesselId}`;
}

export function loadAnalystNotes(vesselId: string): string {
  try {
    return localStorage.getItem(analystNotesKey(vesselId)) ?? "";
  } catch {
    return "";
  }
}

export function saveAnalystNotes(vesselId: string, text: string): void {
  try {
    localStorage.setItem(analystNotesKey(vesselId), text);
  } catch {
    // localStorage unavailable — notes simply won't persist across reloads
  }
}
