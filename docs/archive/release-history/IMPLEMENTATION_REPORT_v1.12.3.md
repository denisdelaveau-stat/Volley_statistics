# Implementation report — Volley Live Capture v1.12.3

## Requested correction

The v1.12.2 rule “red when an indicator is not based on an explicit JSON field” has been cancelled.

The new rule is:

- normal display when the value is extracted from a real match;
- normal display when the value is calculated from the real match history;
- red only when the value is supplied by demonstration/reference fallback data and therefore has no real match value.

## Implementation

- Preserved field-level provenance metadata for diagnostics.
- Removed visual red treatment from Capture v1 inferred phase, rotation, side-out, lineup and playing-time calculations.
- Removed red “SEUIL HORS JSON” badges and dotted threshold markers.
- Classified the bundled v2.1 reference fixture as `reference-fixture-demo` in the shared adapter.
- Added `data-demo-only` state in Coach View and a shared demo-only class in both analysis interfaces.
- Updated explanatory banners so they explicitly state that historical calculations are accepted and only demo data is red.
- Bumped Home and the PWA cache to v1.12.3.

## Validation

- JavaScript syntax checks passed for Coach View, the shared adapter and Advanced Statistics inline code.
- 55 automated tests passed.
- Browser tests cover bundled demo data, Capture v1 historical calculations, Advanced Statistics, Coach View and threshold rendering.

See `tests/TEST_RESULTS_v1.12.3.txt` and `INDICATOR_DEMO_ONLY_AUDIT_v1.12.3.md`.
