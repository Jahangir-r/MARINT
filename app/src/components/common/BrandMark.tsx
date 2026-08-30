/** The transparent MARINT sail/wave mark — the brand symbol itself, with no
 * background container. Same size prop drives both dimensions since the
 * cropped viewBox (see public/logo-mark.svg) is already tightly framed. */
export default function BrandMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo-mark.svg"
      alt="MARINT"
      className={`shrink-0 ${className}`}
      style={{ height: size, width: size * (480 / 440) }}
    />
  );
}
