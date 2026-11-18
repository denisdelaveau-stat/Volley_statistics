# Volley Live Capture v1.6.10 — Architecture

## Components
- `index.html`: setup wizard, capture UI, event/scoring engine, rotation/substitution, statistics and exports.
- `sw.js`: versioned offline app-shell cache.
- `manifest.webmanifest` and `icons/`: PWA metadata and Home-screen assets.
- `tests/`: portable pytest/Playwright acceptance and regression suite.
- localStorage: match and reusable setup persistence.

## Data separation
1. Match domain: match configuration, events and chart projection.
2. Setup-library domain: reusable teams, starting sevens and initial rotations.

NEW MATCH resets the active match without deleting reusable setup templates.

## Event-derived state
Score, set/match winner, service, rotation, charts and reports are rebuilt from accepted events. The pre-rally integer rotation is snapshotted onto each new event so later statistics do not need to infer historical state. v1.6.8 hides time and rotation from live History without removing either event field. The portable file stays at format version 1.

## Capture layers
1. Court renderer owns player, Focus, service, rotation, libero and substitution state.
2. v1.6 result bars and Advanced grid translate user intent into `(player, action, result)`.
3. The existing commit engine derives `winningTeam`, `pointOrigin`, pre-rally `rotation`, score and persisted event fields.
4. Derived views re-render from the event log.

## Dependency chain
Team → Starting 7 → Rotation. Loaded downstream objects are validated against their upstream dependency; missing numbers are reported and never silently substituted.


## v1.6.8 presentation assets
UI Modification 6 remains inside the single-file capture shell. The realistic net is CSS-only and uses a transparent field so the page background remains visible. Advanced action labels contain text only; no player-silhouette assets are generated or loaded. PWA icon files are generated from the supplied 1254×1254 artwork and cached with the app shell.

## v1.6.10 icon pipeline
The supplied 1254 × 1254 artwork is converted to an opaque RGB master. The complete pre-rendered 96 px rounded-corner/rim region is cropped away before Lanczos regeneration of the 180, 32, 192 and 512 px outputs. Operating systems apply launcher masks.
