# Volley Live Capture v1.6.5 — Architecture

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
Score, set/match winner, service, rotation, charts and reports are rebuilt from accepted events. v1.6.5 also snapshots the pre-rally integer rotation onto each new event so later statistics do not need to infer historical state. The portable file stays at format version 1; the new field is optional for backward compatibility.

## Capture layers
1. Court renderer owns player, Focus, service, rotation, libero and substitution state.
2. v1.6 result bars and Advanced grid translate user intent into `(player, action, result)`.
3. The existing commit engine derives `winningTeam`, `pointOrigin`, pre-rally `rotation`, score and persisted event fields.
4. Derived views re-render from the event log.

## Dependency chain
Team → Starting 7 → Rotation. Loaded downstream objects are validated against their upstream dependency; missing numbers are reported and never silently substituted.
