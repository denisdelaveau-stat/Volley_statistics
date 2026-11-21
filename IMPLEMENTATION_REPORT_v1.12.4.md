# Implementation report — Volley Live Capture v1.12.4

## Request

Starting from v1.12.3, remove the red markers from Advanced Statistics and Coach View while retaining the two Home buttons.

## Implementation

- Removed demo-only red CSS overrides, red outlines and red badges from both analysis interfaces.
- Removed runtime emission of `demo-only-indicator`, `stats-demo-only` and `coach-demo-only` visual classes.
- Changed both provenance notices to the normal neutral theme.
- Retained demo/reference classification, `data-demo-only` diagnostic metadata and source labels.
- Preserved normal red UI semantics for recorded errors, critical tactical states and the OH pastel role colour.
- Preserved the COACH VIEW and ADVANCED STATISTICS Home actions.
- Bumped Home and the PWA cache to v1.12.4.

## Validation

See `tests/TEST_RESULTS_v1.12.4.txt` and `RED_MARKER_REMOVAL_AUDIT_v1.12.4.md`.
