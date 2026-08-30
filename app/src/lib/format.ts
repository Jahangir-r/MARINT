export function formatTimeAgo(iso: string, referenceIso: string): string {
  const ref = new Date(referenceIso).getTime();
  const t = new Date(iso).getTime();
  const diffMin = Math.round((ref - t) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.floor(diffMin / 60);
  const remMin = diffMin % 60;
  if (diffH < 24) return remMin ? `${diffH}h ${remMin}m ago` : `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ${diffH % 24}h ago`;
}

export function formatClock(iso: string): string {
  const d = new Date(iso);
  return d.toISOString().slice(11, 16) + "Z";
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)}Z`;
}

export function formatCoord(lat: number, lon: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lonDir = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(3)}°${latDir}, ${Math.abs(lon).toFixed(3)}°${lonDir}`;
}

export function formatSpeed(kn: number): string {
  return `${kn.toFixed(1)} kn`;
}

export function formatDeg(deg: number | null): string {
  if (deg === null) return "—";
  return `${Math.round(deg)}°`;
}

const COUNTRY_NAMES: Record<string, string> = {
  AZE: "Azerbaijan",
  RUS: "Russia",
  KAZ: "Kazakhstan",
  TKM: "Turkmenistan",
  IRN: "Iran",
};
export function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}

const RISK_BAND_COLOR: Record<string, string> = {
  low: "#2fbf8e",
  watch: "#e0a530",
  elevated: "#e07a3f",
  critical: "#e0483f",
};
export function riskBandColor(band: string): string {
  return RISK_BAND_COLOR[band] ?? "#2fa7d6";
}
