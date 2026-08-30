export type Country = "AZE" | "RUS" | "KAZ" | "TKM" | "IRN";

export type VesselCategory = "tanker" | "cargo" | "ferry" | "offshore" | "tug" | "patrol" | "fishing";

export type Scenario =
  | "dark_vessel"
  | "ais_anomaly"
  | "ship_to_ship"
  | "loitering"
  | "route_deviation"
  | null;

export interface RiskFactor {
  code: string;
  label: string;
  delta: number;
}

export interface VesselCurrent {
  lat: number;
  lon: number;
  sog: number;
  cog: number | null;
  heading: number | null;
  nav_status: string;
  ts: string;
  ais_active: boolean;
}

export interface Vessel {
  id: string;
  name: string;
  imo: string;
  mmsi: string;
  callsign: string;
  flag: Country;
  type: string;
  type_label: string;
  category: VesselCategory;
  length: number;
  beam: number;
  image: string | null;
  origin: string;
  destination: string;
  scenario: Scenario;
  risk_score: number;
  risk_band: "low" | "watch" | "elevated" | "critical";
  risk_band_label: string;
  risk_factors: RiskFactor[];
  current: VesselCurrent | null;
}

export interface TrackPoint {
  ts: string;
  lat: number;
  lon: number;
  sog: number;
  cog: number | null;
  heading: number | null;
  nav_status: string;
}

export type EventSeverity = "info" | "watch" | "elevated" | "critical" | null;

export interface FootprintPolygon {
  type: "Polygon";
  coordinates: number[][][];
}

export interface DetectionData {
  sensor_type: "SAR" | "Optical";
  source: string;
  position: { lat: number; lon: number };
  estimated_length_m: number;
  estimated_heading_deg: number;
  confidence: number;
  detected_targets: number;
  footprint: FootprintPolygon;
}

export interface MarintEvent {
  id: string;
  vessel_id: string;
  related_vessel_id: string | null;
  kind: string;
  ts: string;
  title: string;
  description: string;
  severity: EventSeverity;
  data: Record<string, unknown>;
}

export interface Port {
  id: string;
  name: string;
  country: Country;
  lon: number;
  lat: number;
  kind: "major" | "terminal";
  precision: "verified" | "approximate";
  note: string;
}

export interface ProvenanceBlock {
  data_type: "real" | "derived" | "synthetic";
  source: string;
  source_url?: string | null;
  retrieved_at?: string | null;
  is_synthetic: boolean;
}

export interface VesselsFile extends ProvenanceBlock {
  generated_at: string;
  window: { start: string; end: string };
  vessels: Vessel[];
}

export interface TracksFile extends ProvenanceBlock {
  generated_at: string;
  tracks: Record<string, TrackPoint[]>;
}

export interface EventsFile extends ProvenanceBlock {
  generated_at: string;
  events: MarintEvent[];
}

export interface PortsFile extends ProvenanceBlock {
  ports: Port[];
  acg_field: { lon: number; lat: number; name: string };
}
