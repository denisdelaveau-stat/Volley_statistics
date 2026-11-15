# Volley Live Capture v1.5.0 - Architecture

## Components
- `index.html`: UI, scoring, setup wizard, capture flows, statistics and exports.
- `sw.js`: offline app-shell cache.
- `manifest.webmanifest` + `icons/`: PWA metadata/assets when present.
- localStorage: client-side persistence.

## Data separation
Two persistence domains are intentionally independent:
1. Match domain: match configuration, events and chart projection.
2. Setup library domain: reusable teams, starting sevens and initial rotations.

This lets NEW MATCH reset the active match without deleting reusable setup templates.

## Event model
Score is derived from rally events. Positive actions and errors determine `winningTeam` and `pointOrigin`. Derived views (score, set winner, charts, report) are rebuilt from events.

## Setup dependency chain
Team -> Starting 7 -> Rotation. A loaded downstream object is validated against its upstream dependency. Missing numbers are not silently substituted.
