# Indicator JSON audit — Volley Live Capture v1.12.2

## Scope

Baseline: `Volley_statistics_v1.12.1`.

Interfaces audited:

- **Advanced Statistics** (`statistics/index.html` and `statistics/adapter.js`)
- **Coach View** (`coach.js` and `coach.css`)

Reference inputs:

- exact Capture v1 export: `tests/data/As_cannes_vs_Frejus_2026-11-15.capture.v1.json`;
- unified v2.1 fixture: `statistics/data/As_cannes_vs_Frejus_2026-11-15.fixture.v2.json`.

## Visual rule implemented

- Normal theme: the value is computed from JSON records.
- **Red**: the indicator is not supported by an explicit JSON record.
- **SEUIL HORS JSON** / red dotted underline: the number is record-derived, but its qualitative color uses an application threshold that is not stored in the JSON.

## Advanced Statistics audit

| Indicator family | JSON basis | Result |
|---|---|---|
| Visible columns, visible rallies | `events`, `rallyId` / migrated rally grouping | JSON-backed |
| Score timeline | event/rally score records | JSON-backed |
| Player, action, result | action event records | JSON-backed |
| Points, errors, neutral actions, balls touched | event evaluations | JSON-backed |
| Attack, block, serve efficiency | event action type + evaluation | JSON-backed formula |
| Reception/defence positive rate | event action type + evaluation | JSON-backed formula |
| Player and roster rankings | points − errors from event records | JSON-backed formula |
| Rotation and phase | v2.1 rally records | JSON-backed for v2.1 |
| On-court / bench and playing-time presence | v2.1 lineup records | JSON-backed for v2.1 |
| Rotation, phase, side-out and court presence with Capture v1 | reconstructed by migration logic because Capture v1 has no explicit per-rally context | **Red** |
| Rotation metric traffic-light classes | thresholds `50` and `25` are application constants | **Red dotted threshold marker** |

## Coach View audit

| Indicator family | JSON basis | Result |
|---|---|---|
| Current score and set score | rally/event score records | JSON-backed |
| Side-out and break point | rally winner + phase | JSON-backed for v2.1; **red for Capture v1 inferred phase** |
| Attack efficiency | attack events: `(points − errors) / attempts` | JSON-backed formula |
| Reception positive | reception events excluding errors | JSON-backed formula |
| Service aces/errors and block points/touches | action event records | JSON-backed |
| Momentum (last ten) | rally winner records | JSON-backed |
| Player delta, participation and skill totals | player action records | JSON-backed |
| Court organisation and player presence | v2.1 lineup records | JSON-backed for v2.1; **red for Capture v1 reconstructed lineup** |
| Rotation comparison / best / watch | rally rotation and winners | JSON-backed for v2.1; **red for Capture v1 reconstructed rotation** |
| Strong/watch/critical status dots | application thresholds, not JSON parameters | **SEUIL HORS JSON** |
| Built-in demo fallback | hard-coded demo events, only used if no JSON source can be loaded | **all indicators red** |

## Reference Capture v1 findings

The exact reference export validates as `volley-live-capture` version 1 and contains:

- 93 event records;
- 93 migrated rallies across 2 sets;
- 9 own-team players;
- recorded actions: 51 attack points, 22 attack errors, 10 block points, 3 service points, 5 service errors, 1 reception error, and 1 defence error.

The Capture v1 export does **not** contain explicit phase, rotation, or on-court lineup records for every rally. Those indicators remain available through migration inference, but v1.12.2 marks them red rather than presenting them as fully JSON-backed.

## Corrected hard-coded indicator

The Coach player detail previously displayed **Sur le terrain** unconditionally. It now computes **Sur le terrain** or **Sur le banc** from the current lineup. When that lineup is reconstructed from Capture v1 rather than read from explicit v2.1 records, the status is red.
