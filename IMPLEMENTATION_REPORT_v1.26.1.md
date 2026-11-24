# Implementation report — VolleyLive v1.26.1

## Source baseline

Implemented from the verified complete VolleyLive v1.26.0 package. The attached `Dans la vue spectator2.docx` was rendered and its seven embedded reference captures were inspected before implementation.

## SPECTATOR VIEW implementation

### Player card

The Timeline player label uses `white-space: nowrap`, and the HOME card/copy use intrinsic content width. Full names therefore remain on one line without ellipsis.

### Connector and delta geometry

Each Timeline row now has two flex side groups around the fixed 156 px score node. Both HOME and AWAY connectors are fixed at 40 px. Empty delta lanes collapse; a non-zero delta creates a fixed 38 × 28 px square between connector and score. All joins have zero layout gap, so the line and delta square are as close as possible to the adjacent elements.

The delta value and accessible description still use the real score gap. The dotted maximum-gap outline remains based on the real maximum visible gap; only the visual bar length is fixed.

### Timeline header

The generic HOME and AWAY boxes remain in the same grid tracks but are centered at 50% width, halving their former size without changing the central set/score/order block.

### Responsive behavior

The Timeline keeps internal horizontal scrolling. On narrow screens, initial alignment brings the first HOME card into view while retaining access to the score, AWAY marker and opposite edge through the existing horizontal scroller.

## Compatibility

Set selection, direct/replay reset, score derivation, momentum, ranking aggregation, graph rendering, event normalization, invalid-data warnings, offline cache and both supported match schemas are unchanged.

## Validation

- JavaScript syntax checks: `spectator.js`, `sw.js`, `match-hub.js`, `coach.js`, `statistics/adapter.js`.
- Focused v1.26.1 browser tests for names, connectors, deltas, header boxes and mobile scrolling.
- Complete automated pytest suite.
- Ten deterministic v1.26.1 responsive Timeline baselines visually inspected.
- Complete-package and delta reconstruction hash verification.
