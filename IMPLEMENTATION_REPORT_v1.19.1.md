# Implementation report — v1.19.1

## Source and scope

- Verified base: `Volley_statistics_v1.19.0_complete.zip` (SHA-256 `23042f4ae2bf24af5a5cfb17ad082dcbadac4a2d6000e30716d2a9b4205da29e`).
- Scope: relocate the v1.19.0 score and MOMENTUM ACTUEL cards from LIVE TIMELINE to LIVE SCORE, replace the legacy LIVE SCORE summary, and preserve all calculations and unrelated views.
- Visual reference: `docs/IMG_5734.PNG` and the v1.19.0 score/momentum implementation.

## Implementation

- `spectator.html`: LIVE SCORE owns the only `#liveScoreboard` and `#momentumCard`; the legacy `.summary-card` was removed; LIVE TIMELINE starts with its existing filters and board.
- `spectator.css`: LIVE SCORE always places MOMENTUM ACTUEL immediately below the score card; obsolete summary-card styles were removed.
- `spectator.js`: momentum computation/rendering and JSON normalization are unchanged; obsolete legacy summary writes were removed.
- `sw.js`: cache bumped to v1.19.1 without changing the offline shell asset set.

## Invariants

- One score card and one momentum card exist in the document; neither is duplicated in LIVE TIMELINE.
- Score card order remains HOME / score and sets / AWAY, with JSON logo or monogram fallback and exactly one service indicator.
- Momentum defaults remain 8 / 4 / 70%, chronological H/A, integer percentages summing to 100, counts and current-set streak.
- Corrections, Undo and set changes continue to trigger a full render from the loaded JSON.

## Validation

- T1–T12 include placement assertions for LIVE SCORE and negative assertions for LIVE TIMELINE.
- Four LIVE SCORE delivery screenshots are in `docs/screens_v1.19.1/`.
- Timeline, graph, PWA, accessibility and complete historical regression tests are included in the full test run.
- Final result: **133 passed in 295.60 s**, 0 failed; recorded in `tests/TEST_RESULTS_v1.19.1.txt`.
