import { CASPIAN_SEA_PATH, CASPIAN_VIEWBOX } from "./caspianPath";

interface CaspianMapProps {
  className?: string;
  seaFill?: string;
  seaOpacity?: number;
  outlineOnly?: boolean;
  children?: React.ReactNode;
}

/**
 * The real Caspian Sea silhouette (see motion/caspianPath.ts for provenance),
 * as a base layer other homepage scenes draw vessel dots / tracks / detection
 * markers on top of via `children` (rendered in the same SVG coordinate
 * space, viewBox 0 0 800 900).
 */
export default function CaspianMap({ className, seaFill = "#0f2a45", seaOpacity = 1, outlineOnly = false, children }: CaspianMapProps) {
  return (
    <svg viewBox={CASPIAN_VIEWBOX} className={className} aria-hidden="true">
      <path
        d={CASPIAN_SEA_PATH}
        fill={outlineOnly ? "none" : seaFill}
        fillOpacity={seaOpacity}
        stroke="#2fa7d6"
        strokeOpacity={0.55}
        strokeWidth={2}
      />
      {children}
    </svg>
  );
}
