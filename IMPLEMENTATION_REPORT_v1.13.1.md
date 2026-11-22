# Implementation report — Volley Live Capture v1.13.1

## Baseline

Implemented from the complete v1.13.0 package. COACH VIEW, LIVE COURT, PLAYER FOCUS, ADVANCED STATISTICS, unified JSON handling, the bundled Cannes–Fréjus reference fixture, scoring, rotations, substitutions and offline support are retained.

## Action-entry changes

- The orange court keeps two rows of three player circles and the dashed front/back separator.
- Player circles are responsive: approximately 83 px at a 320 px viewport, 101 px at 390 px and capped at 108 px on tablet widths.
- Circle backgrounds use the existing pastel role surfaces; shirt numbers and role labels use the matching dark role colours.
- The net element is no longer rendered on the action-entry court.
- **⟳ Changer de joueur** is rendered after the orange court on the blue Capture surface, before **HISTORY**.
- The hidden libero/bench state remains available to rotation and substitution logic but is not displayed.

## Compatibility

The event and match data models are unchanged. Same-position substitute filtering, substitution events, Undo, action/result values, scoring and rotations are unchanged. No JSON field or adapter behavior was modified.

## Versioning

- Home version: `v1.13.1`.
- Service-worker cache: `volley-live-capture-v1.13.1`.

## Validation

- Complete automated suite: 60 tests.
- Targeted Capture/substitution suite: 19 tests.
- Visual and geometry checks at 320, 390 and 768 px: no JavaScript error and no horizontal overflow.
- Screenshots are included in `docs/screens_v1.13.1/`.