# Implementation report — Volley Live Capture v1.18.0

## Baseline

Implementation starts from the verified `Volley_statistics_v1.17.0_complete.zip` whose SHA-256 is `44bfaf6d4ec5236741a108db1074e3fecd05d62913bb9071f51b555badeb0a78`.

## Implementation

The spectator model now derives one selected-set `EvolutionTimelineItem` per completed official rally. Each item contains the official post-rally score, `scoreDelta`, scoring/serving context, approved SIDE_OUT/BREAK_POINT classification, cumulative faults, fault increments and `faultDelta`. The two panels consume that same array and stable rally key.

`VolleyStatsAdapter.isFaultEvent` centralizes the canonical fault rule and is used by statistics normalization and spectator evolution. UI state contains no persisted duplicate match state and no mockup values.

Shared CSS Grid tracks and measured SVG plot view boxes guarantee column-center alignment. The view remains horizontally scrollable for long sets and narrow devices, retains persisted order/window controls, supports set selection and provides live-history return behavior.

## Validation

Static JavaScript validation passed for `spectator.js`, `statistics/adapter.js` and `sw.js`. The complete automated suite passed: **113 tests, 0 failures** in 268.16 seconds. See `tests/test_score_fault_evolution_v1_18.py`, `tests/TEST_RESULTS_v1.18.0.txt`, `docs/screens_v1.18.0/`, `SOURCE_MANIFEST_v1.18.0.txt` and package SHA-256 manifests.
