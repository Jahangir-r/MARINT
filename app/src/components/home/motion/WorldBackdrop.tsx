import { forwardRef } from "react";
import { useWorldMapPaths, WORLD_VIEWBOX, CASPIAN_CENTER_WORLD } from "./useWorldMapPaths";

const VB_CENTER_X = 1000;
const VB_CENTER_Y = 389;

/** SVG transform string that scales the world map by `zoom` around the
 * Caspian's real position and re-centers it in the viewBox — i.e. "zoom
 * into the Caspian" at any zoom level from 1 (full world) upward. */
export function computeWorldTransform(zoom: number): string {
  const [cx, cy] = CASPIAN_CENTER_WORLD;
  return `translate(${VB_CENTER_X - cx * zoom} ${VB_CENTER_Y - cy * zoom}) scale(${zoom})`;
}

interface WorldBackdropProps {
  className?: string;
  zoom?: number;
  landOpacity?: number;
  seaOpacity?: number;
  /** Land fill color — defaults to the original dark-homepage value.
   * Callers pass a light-appropriate tone (e.g. a pale blue-grey) when the
   * active theme is light; the Caspian sea fill stays brand cyan in both
   * themes, since that accent is theme-invariant. */
  landColor?: string;
  children?: React.ReactNode;
}

/** Real Natural Earth world silhouette (see Info/DATA_SOURCES.md), zoomed
 * toward the Caspian's true position — a full-bleed backdrop so the
 * homepage's Caspian-focused scenes read as "world map, focused on the
 * Caspian" rather than an isolated shape floating in empty space.
 * `children` render inside the same transformed group, so a caller can add
 * markers that stay pinned to a real map position as the zoom animates. */
const WorldBackdrop = forwardRef<SVGGElement, WorldBackdropProps>(function WorldBackdrop(
  { className, zoom = 3, landOpacity = 0.5, seaOpacity = 0.55, landColor = "#1a3552", children },
  ref
) {
  const paths = useWorldMapPaths();
  // The <g> wrapper always renders, even before the async SVG-path fetch
  // resolves — callers that forward a ref here (GlobalScale, to drive the
  // zoom transform from GSAP) attach it on the very first render, before
  // their scroll-scene setup effect runs. Returning null until `paths`
  // loaded used to leave that ref null forever as far as a one-time mount
  // effect is concerned, silently skipping ScrollTrigger creation entirely.
  return (
    <svg viewBox={WORLD_VIEWBOX} preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <g ref={ref} transform={computeWorldTransform(zoom)}>
        {paths && (
          <>
            <path d={paths.world} fill={landColor} fillOpacity={landOpacity} stroke="#2fa7d6" strokeOpacity={0.18} strokeWidth={0.6} />
            <path d={paths.caspian} fill="#2fa7d6" fillOpacity={seaOpacity} />
          </>
        )}
        {children}
      </g>
    </svg>
  );
});

export default WorldBackdrop;
