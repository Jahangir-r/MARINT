# MARINT — Data Sources

This document lists every external source actually used to build the Caspian Sea demo dataset, and states plainly what is real, what is derived, and what is synthetic. See `Map Assets/Geography/Processed/*.geojson` and `app/public/data/*.json` for the files produced from these sources — every file carries a `data_type` / `is_synthetic` provenance block per the structure below.

```json
{ "data_type": "real | derived | synthetic", "source": "...", "source_url": "...", "retrieved_at": "...", "is_synthetic": false }
```

---

## Natural Earth — 1:10m Land

**Purpose:** Base landmass fill for the Caspian region map.
**Data:** Polygon coastline/land dataset, clipped to a Caspian bounding box (45.5–55.8°E, 35.5–47.6°N).
**Type:** Real, open geographic data.
**License:** Public domain.
**URL:** https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-land/
**Accessed:** 2026-08-28 (dataset shipped with the project under `Map Assets/Geography/Raw/ne_10m_land.zip`)
**Output:** `Map Assets/Geography/Processed/caspian_land.geojson`

## Natural Earth — 1:10m Coastline

**Purpose:** Coastline line layer for map rendering.
**Type:** Real, open geographic data.
**License:** Public domain.
**URL:** https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-coastline/
**Accessed:** 2026-08-28
**Output:** `Map Assets/Geography/Processed/caspian_coastline.geojson`

## Natural Earth — 1:10m Admin 0 Countries

**Purpose:** Country boundaries for the five Caspian coastal states (Azerbaijan, Russia, Kazakhstan, Turkmenistan, Iran).
**Type:** Real, open geographic data.
**License:** Public domain — no attribution required.
**URL:** https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/ (fetched from mirror `https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_0_countries.zip` — this dataset was not shipped with the project and was downloaded directly from the official Natural Earth CDN since internet access was available).
**Accessed:** 2026-08-28
**Output:** `Map Assets/Geography/Processed/caspian_countries.geojson` (clipped to the Caspian bbox; the five countries' full national borders are not needed for this regional demo and are intentionally excluded).

## Natural Earth — 1:10m Populated Places

**Purpose:** Major coastal city labels for map context.
**Type:** Real, open geographic data.
**License:** Public domain.
**URL:** https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/
**Accessed:** 2026-08-28
**Output:** `Map Assets/Geography/Processed/caspian_major_cities.geojson`

## Caspian port coordinates (hand-curated)

**Purpose:** Real-world port locations used as route endpoints for the synthetic vessel-traffic simulation (Baku, Alat, Aktau, Kuryk, Atyrau, Turkmenbashi, Astrakhan, Makhachkala, Bandar Anzali, Amirabad, Neka).
**Type:** Real, static geographic data (Level 2 — verified coordinates, not a live feed).
**Sources (per port):**
- Baku — Wikipedia, "Port of Baku", https://en.wikipedia.org/wiki/Port_of_Baku
- Alat — MagicPort port registry, https://magicport.ai/ports/azerbaijan/alat-port-azala *(aggregator source, coordinates not independently cross-verified — flagged `precision: approximate`)*
- Aktau — Wikipedia, "Aktau", https://en.wikipedia.org/wiki/Aktau
- Kuryk — Port Kuryk official site, https://portkuryk.kz/en/port/tarihy
- Atyrau — SeaRates port profile, https://www.searates.com/port/atyrau_kz *(aggregator source — flagged `precision: approximate`)*
- Turkmenbashi — Wikipedia, "Turkmenbashi International Seaport", https://en.wikipedia.org/wiki/Turkmenbashi_International_Seaport
- Astrakhan — Wikipedia, "Port of Astrakhan", https://en.wikipedia.org/wiki/Port_of_Astrakhan
- Makhachkala — SeaRates port profile, https://www.searates.com/port/makhachkala_ru *(aggregator source — flagged `precision: approximate`)*
- Bandar Anzali — Wikipedia, "Bandar-e Anzali", https://en.wikipedia.org/wiki/Bandar-e_Anzali
- Amirabad — Wikipedia, "Amirabad Port", https://en.wikipedia.org/wiki/Amirabad_Port
- Neka — ShipNext port profile, https://shipnext.com/port/neka-irnka-irn *(aggregator source — flagged `precision: approximate`)*

**Accessed:** 2026-08-28
**Output:** `Map Assets/Geography/Processed/caspian_ports.geojson` and `app/public/data/ports.json`
**Note:** every port record carries a `precision` field (`verified` for Wikipedia/official-site sources, `approximate` for aggregator-only sources) so the distinction is visible in the codebase even though the demo UI does not need to surface it during the jury walkthrough.

## Trans-Caspian shipping / ferry route facts

**Purpose:** Grounding the synthetic route network (which ports plausibly connect, realistic transit character) in real Caspian shipping patterns — the Baku–Aktau/Kuryk and Baku–Turkmenbashi ro-pax/rail-ferry corridors of the Middle Corridor (Trans-Caspian International Transport Route).
**Type:** Real, static information — used to *inform* synthetic route design, not copied verbatim into the UI as live schedule data.
**Sources:**
- Wikipedia, "Azerbaijan Caspian Shipping Company", https://en.wikipedia.org/wiki/Azerbaijan_Caspian_Shipping_Company
- Wikipedia, "Trans-Caspian International Transport Route", https://en.wikipedia.org/wiki/Trans-Caspian_International_Transport_Route
- Baird Maritime, vessel review of new Caspian rail-ferries, https://www.bairdmaritime.com/passenger/ro-pax/vessel-review-azerbaijan-first-in-series-of-new-russian-designed-caspian-sea-rail-ferries
- The Astana Times, "Ferries Between Kazakhstan and Azerbaijan to Launch in 2026", https://astanatimes.com/2025/12/ferries-between-kazakhstan-and-azerbaijan-to-launch-in-2026/
- Journal of Nomads, Caspian ferry crossing guide, https://www.journalofnomads.com/caspian-sea-ferry-baku-aktau/
**Accessed:** 2026-08-28

## Typical vessel speeds by type

**Purpose:** Realistic speed ranges used to parameterize the synthetic AIS movement simulation (oil tanker, general cargo, ro-pax ferry, offshore supply vessel, tugboat, patrol vessel, fishing vessel).
**Type:** Real-world reference ranges from maritime industry sources, applied as generation parameters for synthetic data (Level 2 → Level 3 handoff).
**Sources:**
- Maritimepage, "The Speed Of A Cargo Ship At Sea", https://maritimepage.com/the-speed-of-a-cargo-ship-at-sea-compare-top-10-types/
- Wärtsilä Encyclopedia, "Offshore Support Vessels", https://www.wartsila.com/encyclopedia/term/offshore-support-vessels-(osvs)-
- Simpleforwarding.com, "How Fast Do Cargo Ships Go?", https://simpleforwarding.com/how-fast-do-cargo-ships-go/
**Accessed:** 2026-08-28
**Note:** general-cargo, patrol, and fishing-vessel figures are drawn from industry/trade blogs rather than a single regulatory reference — treated as reasonable working ranges, not precise constants.

## Copernicus Sentinel-1 / Sentinel-2 (satellite intelligence framing)

**Purpose:** Accurate descriptive language for the product's SAR/optical satellite-intelligence concept (sensor type, revisit cadence, open-data policy). No live Sentinel imagery is fetched or displayed — all satellite "detections" in the demo, including the rendered footprint polygons shown on the operational map, are synthetic, framed using real mission characteristics (e.g. footprint orientation approximates a near-polar sun-synchronous pass, and dual SAR + optical corroboration on the flagship dark-vessel scenario reflects how Sentinel-1/2 are actually used together operationally).
**Type:** Real, static factual reference — used for UI copy/framing only.
**Sources:**
- eoPortal, "Copernicus: Sentinel-1", https://www.eoportal.org/satellite-missions/copernicus-sentinel-1
- ESA, "Sentinel-1 Facts and figures", https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Sentinel-1/Facts_and_figures
- ESA, "Copernicus Sentinel-2", https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Sentinel-2
- Registry of Open Data on AWS, https://registry.opendata.aws/sentinel-1/
- ISPRS Annals, "Ship Detection Using Sentinel-1 SAR Data", https://isprs-annals.copernicus.org/articles/IV-5/317/2018/isprs-annals-IV-5-317-2018.pdf
**Accessed:** 2026-08-28

## MapLibre glyph font (Noto Sans Regular, self-hosted)

**Purpose:** Renders text labels (city names, port names) on the operational map. Self-hosted under `app/public/fonts/` (ranges 0–511, covering Basic Latin + Latin-1 Supplement + Latin Extended-A/B, sufficient for every place name in the dataset) so the map never depends on an external font server being reachable during a live demo.
**Type:** Third-party open-source rendering asset, not maritime/geographic data — included here for completeness.
**Source:** Noto Sans, SIL Open Font License; glyph range files as pre-built and served by the MapLibre project's own demo tile server (`demotiles.maplibre.org`), downloaded once and vendored locally.
**Accessed:** 2026-08-28

---

## Everything else: MARINT Demo Dataset (synthetic)

Vessel identities (names, IMO/MMSI/callsign), AIS track points, alerts, ship-to-ship/dark-vessel/loitering/deviation scenarios, SAR and optical "detections" (including their rendered footprint polygons), risk scores, and investigation/report content (executive summaries, analyst notes) are **synthetic**, generated by `_tools/data/generate.mjs` (data) or composed client-side from that data (`app/src/lib/investigation.ts`) for demonstration purposes. They are internally consistent (no duplicate identifiers, no impossible movement, routes follow real port-to-port geography) and are seeded from the real port/speed data above, but do not represent actual vessels or events.

```json
{ "data_type": "synthetic", "source": "MARINT Demo Dataset", "source_url": null, "retrieved_at": null, "is_synthetic": true }
```

Every generated record in `app/public/data/*.json` carries this provenance block (or the `real`/`derived` equivalent for port records) at the top of the file.
