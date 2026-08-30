import { useEffect, useState } from "react";

export const WORLD_VIEWBOX = "0 0 2000 778";
// Caspian's center point, pre-computed in the SAME world-scale projection as
// world-land.svgpath.txt — see _tools/geo/make-world-svg.mjs.
export const CASPIAN_CENTER_WORLD: [number, number] = [1281.1, 214.5];

interface WorldPaths {
  world: string;
  caspian: string;
}

let cache: WorldPaths | null = null;
let pending: Promise<WorldPaths> | null = null;

function load(): Promise<WorldPaths> {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = Promise.all([
      fetch("/homepage/world-land.svgpath.txt").then((r) => r.text()),
      fetch("/homepage/caspian-at-world-scale.svgpath.txt").then((r) => r.text()),
    ]).then(([world, caspian]) => {
      cache = { world, caspian };
      return cache;
    });
  }
  return pending;
}

/** Real Natural Earth world land silhouette + the Caspian Sea shape, both
 * projected into the same coordinate space (see Info/DATA_SOURCES.md) —
 * fetched once and cached, used to give the homepage's Caspian-focused
 * scenes real world context instead of an isolated shape in empty space. */
export function useWorldMapPaths(): WorldPaths | null {
  const [paths, setPaths] = useState<WorldPaths | null>(cache);
  useEffect(() => {
    let active = true;
    load().then((p) => {
      if (active) setPaths(p);
    });
    return () => {
      active = false;
    };
  }, []);
  return paths;
}
