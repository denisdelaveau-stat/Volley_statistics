# Volley Live Capture v1.6.3 — Architecture

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
Score, set/match winner, service, rotation, charts and reports are rebuilt from accepted events. Capture-mode UI changes do not alter the portable event schema.

## Capture layers
1. Court renderer owns player, Focus, service, rotation, libero and substitution state.
2. v1.6 result bars and Advanced grid translate user intent into `(player, action, result)`.
3. The existing commit engine derives `winningTeam`, `pointOrigin`, score and persisted event fields.
4. Derived views re-render from the event log.

## Dependency chain
Team → Starting 7 → Rotation. Loaded downstream objects are validated against their upstream dependency; missing numbers are reported and never silently substituted.
