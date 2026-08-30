// Procedurally-rendered stand-ins for a satellite observation crop — no
// external imagery is used (avoids licensing issues and false "this is a
// real Sentinel frame" claims). Optical and SAR are built from deliberately
// different SVG filter recipes so they read as two distinct sensor types,
// not the same image with a tint swapped:
//  - Optical: smooth, low-frequency turbulence tinted ocean-blue, a soft
//    bright fleck + wake — reads as a nadir photographic crop.
//  - SAR: high-frequency turbulence pushed to near-binary contrast and
//    desaturated to gray — reads as radar speckle, with a hard bright
//    return + target box, not a photograph.
function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 97;
}

export default function SatelliteChip({
  sensorType,
  headingDeg,
  lengthM,
  seedKey,
  className = "h-36 w-full",
}: {
  sensorType: "SAR" | "Optical";
  headingDeg: number;
  lengthM: number;
  seedKey: string;
  className?: string;
}) {
  const isSar = sensorType === "SAR";
  const seed = seedFromId(seedKey + sensorType);
  const filterId = `sat-tex-${seed}-${sensorType}`;
  const targetLen = Math.max(8, Math.min(30, lengthM / 7));

  return (
    <div className={`relative overflow-hidden rounded-md border border-hairline shrink-0 ${className}`}>
      <svg viewBox="0 0 200 130" preserveAspectRatio="xMidYMid slice" className="h-full w-full absolute inset-0">
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            {isSar ? (
              <>
                <feTurbulence type="fractalNoise" baseFrequency={0.85} numOctaves={2} seed={seed} result="n" />
                <feColorMatrix in="n" type="saturate" values="0" result="gray" />
                <feComponentTransfer in="gray" result="hard">
                  <feFuncR type="gamma" amplitude={1.4} exponent={2.6} offset={0} />
                  <feFuncG type="gamma" amplitude={1.4} exponent={2.6} offset={0} />
                  <feFuncB type="gamma" amplitude={1.4} exponent={2.6} offset={0} />
                </feComponentTransfer>
              </>
            ) : (
              <>
                <feTurbulence type="fractalNoise" baseFrequency={0.018} numOctaves={4} seed={seed} result="n1" />
                <feTurbulence type="fractalNoise" baseFrequency={0.09} numOctaves={2} seed={seed + 5} result="n2" />
                <feComposite in="n1" in2="n2" operator="arithmetic" k1={0} k2={0.75} k3={0.25} k4={0} result="mix" />
                <feColorMatrix
                  in="mix"
                  type="matrix"
                  values="0 0 0 0 0.03   0 0 0 0 0.16   0 0 0 0 0.34   0 0 0 1 0"
                  result="tinted"
                />
              </>
            )}
          </filter>
          <radialGradient id={`vig-${seed}`} cx="50%" cy="50%" r="70%">
            <stop offset="55%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
          </radialGradient>
        </defs>

        <rect width="200" height="130" fill={isSar ? "#0a0a0c" : "#071b2e"} />
        <rect width="200" height="130" filter={`url(#${filterId})`} opacity={isSar ? 0.85 : 1} />

        {/* satellite pass swath crop, angled like a real strip product */}
        <rect x="-30" y="-10" width="260" height="150" fill="#000" opacity="0.28" transform="rotate(-7 100 65)" />
        <rect x="-30" y="118" width="260" height="60" fill="#000" opacity="0.5" transform="rotate(-7 100 65)" />

        <rect width="200" height="130" fill={`url(#vig-${seed})`} />

        {/* target return */}
        <g transform={`translate(100 65) rotate(${headingDeg})`}>
          {isSar ? (
            <>
              <line x1="0" y1="2" x2="0" y2={targetLen * 0.9} stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2.4" strokeLinecap="round" />
              <ellipse rx="2.6" ry={targetLen * 0.42} fill="#ffffff" />
              <rect x={-targetLen * 0.55} y={-targetLen * 0.7} width={targetLen * 1.1} height={targetLen * 1.4} fill="none" stroke="#e0483f" strokeWidth="1" strokeDasharray="3 2" opacity="0.85" />
            </>
          ) : (
            <>
              <line x1="0" y1="1" x2="0" y2={targetLen * 0.8} stroke="#dff1ff" strokeOpacity="0.4" strokeWidth="1.4" strokeLinecap="round" />
              <ellipse rx="2.2" ry="3.4" fill="#f4fbff" opacity="0.95" />
              <ellipse rx="4.5" ry="6" fill="#8fd9ff" opacity="0.25" />
            </>
          )}
        </g>

        {/* north indicator */}
        <g transform="translate(184 16)">
          <line x1="0" y1="6" x2="0" y2="-6" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1" />
          <path d="M -2.5 -3 L 0 -7 L 2.5 -3 Z" fill="#ffffff" fillOpacity="0.6" />
          <text x="0" y="15" fontSize="6" fill="#ffffff" fillOpacity="0.5" textAnchor="middle">N</text>
        </g>
      </svg>

      <span
        className="absolute top-1.5 left-1.5 text-[8.5px] font-mono font-semibold tracking-wider px-1.5 py-0.5 rounded"
        style={{ background: isSar ? "rgba(183,84,224,0.25)" : "rgba(57,194,160,0.25)", color: isSar ? "#e3b8f5" : "#8fe8cf" }}
      >
        {isSar ? "SAR" : "OPTICAL"}
      </span>
      <span className="absolute bottom-1.5 left-1.5 text-[7.5px] font-mono text-ink/45 tracking-wide">
        DEMO OBSERVATION · SYNTHETIC
      </span>
    </div>
  );
}
