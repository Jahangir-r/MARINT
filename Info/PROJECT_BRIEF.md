# MARINT — Project Brief
## READ THIS FILE FIRST

MARINT is a maritime intelligence and situational awareness software system.

The current demonstration is focused on the **Caspian Sea**, but the product itself is **not intended to be limited to the Caspian region**. The Caspian is the first operational use case and demo environment. The long-term vision is to scale MARINT to other seas, oceans, ports, offshore zones, and strategic maritime corridors worldwide.

**Core positioning:**
> Born in the Caspian. Built for global waters.

MARINT should look and behave like a serious international maritime intelligence product — not a generic startup landing page and not a simple vessel-tracking website.

---

# 1. PROJECT PURPOSE

MARINT transforms fragmented maritime information into one unified operational picture.

The system should help users:

- understand what is happening at sea
- monitor vessel activity
- search and inspect vessels
- reconstruct vessel movement
- identify suspicious activity
- identify AIS anomalies
- detect possible dark vessels
- compare AIS data with satellite observations
- analyze ship-to-ship activity
- detect suspicious routes or behavior
- evaluate vessel risk
- investigate events over time
- generate intelligence reports
- support faster operational decision-making

The current demo must use the **Caspian Sea** as the main geographic environment.

The system architecture and visual identity, however, must feel globally scalable.

---

# 2. CURRENT DEMO SCOPE

For the jury/demo version, focus on the Caspian Sea and the five coastal states:

- Azerbaijan
- Russia
- Kazakhstan
- Turkmenistan
- Iran

The demo does not need to claim live access to every real-world data source.

Synthetic/demo data may be used where necessary, but the user experience should feel realistic and operational.

The demo should communicate that MARINT can later connect to real data providers and external systems.

---

# 3. MAIN DATA SOURCES / INTELLIGENCE LAYERS

MARINT is conceptually designed to correlate multiple maritime data sources.

Primary layers:

- AIS
- SAR satellite imagery
- optical satellite imagery
- coastal radar
- vessel history
- route history
- vessel registry / identification data
- alerts and anomaly events
- environmental observations

Important concept:

A single data source may be incomplete.

MARINT becomes valuable by correlating multiple sources into one operational picture.

Example:

A vessel may stop transmitting AIS, but it may still be visible in SAR imagery, optical imagery, radar, or historical movement patterns.

---

# 4. CORE CAPABILITIES

The demo should visually communicate the following capabilities.

## Vessel Tracking
Display vessels on an interactive maritime map.

Users should be able to:

- search vessels
- select vessels
- inspect position
- view heading
- view speed
- view course
- view destination
- view vessel type
- view flag
- view MMSI / IMO
- view current status

## Vessel Profile
Selecting a vessel should open a structured vessel information panel or page.

Possible information:

- vessel image
- vessel name
- vessel type
- flag
- IMO
- MMSI
- callsign
- dimensions
- navigation status
- speed
- heading
- destination
- last reported position
- historical movement
- recent alerts
- risk score

Use the supplied Vessel Card References for structure and inspiration.

Do not directly copy another company's interface.

## Route History
Users should be able to see historical vessel movement.

Display:

- track line
- timestamps
- previous positions
- speed changes
- direction changes
- stops
- unusual deviations

Use the supplied `vessel_route_history_reference` as functional inspiration.

## Dark Vessel Detection
This is one of the key MARINT capabilities.

A dark vessel is a vessel that may be physically detected by another source while AIS information is unavailable, inconsistent, missing, or does not match the detected object.

Possible workflow:

1. satellite/radar detection appears
2. MARINT attempts AIS correlation
3. no reliable AIS match is found
4. detection is marked as suspicious / possible dark vessel
5. user can inspect detection details

Display possible:

- detection time
- coordinates
- source
- satellite image
- estimated dimensions
- estimated heading
- confidence
- AIS match confidence
- risk level

Use Map Assets references for design inspiration.

## AIS Anomaly Detection
Possible anomalies:

- AIS signal disappears
- unexpected identity change
- impossible position jump
- abnormal speed
- inconsistent heading
- unusual loitering
- route deviation
- suspicious rendezvous

## Ship-to-Ship Activity
MARINT should be able to visually identify two vessels remaining in close proximity for a meaningful period.

Possible uses:

- cargo transfer
- refueling
- suspicious transfer
- offshore interaction

## Suspicious Movement
Examples:

- repeated loitering
- abnormal route
- unexpected stop
- unusual change of destination
- movement in restricted or high-risk areas

## Risk Score
A vessel may have a risk score from 0–100.

The score may consider:

- AIS anomalies
- dark activity
- unusual route history
- ship-to-ship activity
- suspicious zones
- identity inconsistencies
- recent alerts

The score should be explainable.

Avoid showing a number without telling the user why the risk increased.

## Alerts
Users should be able to see alerts generated by the system.

Examples:

- AIS lost
- dark vessel candidate
- suspicious loitering
- unusual route deviation
- ship-to-ship interaction
- satellite detection mismatch
- restricted area entry
- environmental anomaly

## Investigation Timeline
Users should be able to reconstruct what happened around a vessel or event.

Timeline may combine:

- AIS points
- satellite detections
- alerts
- route changes
- vessel interactions
- analyst notes

## Reports
The system should allow the user to turn an investigation into a report.

For the demo, report generation may be simulated.

Possible report contents:

- vessel identity
- event timeline
- risk assessment
- map snapshots
- detections
- anomalies
- analyst summary

---

# 5. PRIMARY USER EXPERIENCE

The product should not feel like a collection of disconnected pages.

The main operational experience should revolve around:

**MAP → DETECTION → VESSEL → ANALYSIS → INVESTIGATION → REPORT**

Example flow:

1. user opens operational map
2. user sees Caspian vessel activity
3. user selects a vessel or alert
4. vessel information panel opens
5. user reviews route and risk
6. user enables satellite / SAR layer
7. user identifies anomaly
8. user opens investigation view
9. user reviews timeline
10. user creates a report

The user should always understand:

- what happened
- where it happened
- when it happened
- why MARINT considers it important

---

# 6. PUBLIC HOMEPAGE

The public-facing homepage should present MARINT as a premium international maritime intelligence company/product.

The visual direction should be inspired by the supplied Unseenlabs homepage references.

IMPORTANT:

Do not copy:

- Unseenlabs branding
- text
- logo
- exact layouts
- exact animations

Instead, use it as a reference for:

- cinematic presentation
- large typography
- visual storytelling
- section pacing
- premium technology feel
- strong imagery
- restrained use of UI
- immersive scrolling

The homepage should communicate:

1. maritime activity is complex and fragmented
2. important activity can remain unseen
3. MARINT combines multiple intelligence sources
4. MARINT detects anomalies and hidden behavior
5. MARINT supports investigation and decision-making
6. the current operational demonstration is the Caspian Sea
7. the technology is designed to scale globally

Suggested positioning:

> Born in the Caspian. Built for global waters.

Possible supporting message:

> MARINT transforms fragmented maritime data into a unified operational picture — revealing activity that individual systems may miss.

---

# 7. GLOBAL VISION

The Caspian Sea is the current demonstration environment.

Do NOT make MARINT visually appear to be permanently limited to the Caspian.

Avoid making the Caspian outline the dominant permanent brand symbol.

The brand should remain suitable for future deployment in:

- Mediterranean Sea
- Black Sea
- Arabian Gulf
- Red Sea
- Baltic Sea
- Indian Ocean
- Atlantic Ocean
- Pacific maritime regions
- ports
- offshore energy zones
- strategic shipping corridors

The current product story is:

> The Caspian is our starting point, not our boundary.

---

# 8. VISUAL IDENTITY

MARINT should feel:

- premium
- serious
- precise
- modern
- operational
- maritime
- international
- intelligence-focused
- high-trust
- defense-tech / security-tech adjacent

Avoid:

- generic SaaS templates
- excessive gradients
- glowing AI-style cards everywhere
- random neon effects
- cartoonish illustrations
- excessive glassmorphism
- large amounts of decorative UI
- meaningless charts
- fake technical complexity

Use the supplied MARINT brand assets and color palette.

Primary palette is based on:

- deep navy
- dark ocean blue
- blue
- light cyan
- white

Accent colors may be used for:

- detections
- vessel status
- route history
- risk
- alerts
- SAR / satellite layers

Risk and alert colors should be used sparingly and consistently.

---

# 9. MAP DESIGN

The map is one of the most important parts of the product.

The map should feel like a real operational maritime intelligence environment.

Use a proper interactive map implementation when possible.

Do not use a static JPEG as the primary operational map.

The supplied files under:

`Map Assets/References`

are visual references only.

The supplied files under:

`Map Assets/Geography`

are geographic source assets.

Map features may include:

- vessel markers
- vessel heading
- vessel trails
- selected vessel track
- risk markers
- anomaly markers
- alert zones
- SAR footprints
- optical satellite footprints
- dark vessel detections
- ship-to-ship events
- restricted areas
- ports
- country boundaries
- timeline filtering

The current default geographic focus is the Caspian Sea.

---

# 10. SHIP MODELS

Use the supplied vessel images in:

`Ship Models/`

The folders are organized by country.

The filenames identify the vessel type.

Use these assets for:

- vessel cards
- selected vessel views
- vessel profile
- demo examples
- homepage imagery where appropriate

Do not assume that every vessel shown must be Azerbaijani.

The operational map should contain a mix of vessels from Caspian coastal states.

---

# 11. HOW TO USE THE REFERENCES

References are organized by purpose.

## Homepage References
Use these to understand:

- homepage composition
- visual storytelling
- hierarchy
- hero sections
- CTA
- footer
- premium maritime presentation

## UI References
Use these to understand:

- operational layout
- map-centered interfaces
- side panels
- command-center style
- dense information presentation
- selected-object layouts
- analytics

## Function References
Use these to understand:

- vessel actions
- route history
- map interactions

## Vessel Card References
Use these to understand:

- vessel information hierarchy
- selected vessel panel
- vessel profile structure

## Map Assets / References
Use these to understand:

- SAR overlays
- satellite detection
- vessel tracks
- dark vessel detections
- intelligence layers

## Animation References
Use these to understand:

- timing
- reveal style
- motion quality

Never copy another company's interface exactly.

Extract the design principle and rebuild it in the MARINT visual language.

---

# 12. BRAND ASSETS

Use the supplied MARINT logos under:

`Brand/Logos`

Use the supplied visual references under:

`Brand/References`

Do not redraw or replace the brand identity unless explicitly instructed.

Use the correct logo version depending on background contrast.

---

# 13. DEMO DATA

If real live data is unavailable, generate realistic synthetic demo data.

Synthetic data should still behave logically.

Examples:

- vessels should move along plausible maritime routes
- speed should match vessel type
- tracks should not randomly jump
- events should have timestamps
- vessel identities should remain consistent
- risk score should correspond to detected behavior
- dark vessel events should have logical evidence
- ship-to-ship events should occur at plausible positions

The product should feel realistic even when the underlying demo data is synthetic.

---

# 14. PRIORITY FOR DEVELOPMENT

Do NOT try to build every possible feature at once.

Build the product in this order.

## Phase 1 — Foundation
- MARINT brand
- navigation
- design system
- layout
- map environment
- Caspian geographic focus

## Phase 2 — Core Operational Map
- vessel markers
- vessel selection
- vessel search
- vessel information panel
- route history

## Phase 3 — Intelligence
- alerts
- risk score
- AIS anomalies
- dark vessel detection
- SAR / satellite layer
- ship-to-ship activity

## Phase 4 — Investigation
- event timeline
- investigation view
- evidence
- reports

## Phase 5 — Public Homepage
- cinematic homepage
- product story
- capability sections
- operational interface preview
- global scalability message

Prioritize a strong, coherent working prototype over a large number of unfinished features.

---

# 15. PRODUCT PRINCIPLES

When making design or development decisions, follow these rules:

1. The map is the operational center of the product.
2. Every alert should be explainable.
3. Every risk score should have a reason.
4. Every vessel should have a clear identity.
5. Historical movement should be visually understandable.
6. Satellite intelligence should feel integrated, not added as decoration.
7. Avoid unnecessary UI complexity.
8. Use realistic maritime terminology.
9. Maintain visual consistency across all screens.
10. The Caspian is the current demo environment, but the product must feel globally scalable.

---

# 16. SUCCESS CRITERIA

The result should make a jury member understand within a few minutes:

- what MARINT is
- what problem it solves
- why combining data sources matters
- what a dark vessel is
- how MARINT detects suspicious behavior
- how a user investigates a vessel
- why the Caspian is a strong initial use case
- how the same solution can scale internationally

The user should not need a long technical explanation to understand the product.

The interface itself should communicate the story.

---

# 17. FINAL DIRECTION

Build MARINT as a credible maritime intelligence product, not as a concept-only mockup.

Use the provided assets and references intelligently.

Do not recreate competitors.

Do not overdesign.

Do not add unnecessary features just because they look impressive.

Make the system coherent, realistic, visually premium, and easy to demonstrate.

The final product should communicate:

**One operational picture. Multiple intelligence sources. Faster maritime decisions.**

And strategically:

**Born in the Caspian. Built for global waters.**
