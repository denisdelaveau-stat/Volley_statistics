# v1.13.0 visual validation

Both implementation screenshots were captured in Chromium at **1280 × 800** using the bundled unified v2.1 fixture with set 1 selected. The names and values differ from the supplied mockups because the implementation uses real fixture records; the comparison targets layout, proportions, theme and components.

| View | Implementation | Side-by-side comparison |
|---|---|---|
| LIVE COURT | `live-court-v1.13.0-1280x800.png` | `live-court-reference-vs-v1.13.0.png` |
| PLAYER FOCUS | `player-focus-v1.13.0-1280x800.png` | `player-focus-reference-vs-v1.13.0.png` |

Validation points:

- dark-blue gradient surfaces and cyan court/grid accents;
- score, set, rotation and phase header proportions;
- six status-border cards in 4-3-2 / 5-6-1 order;
- role chips use the single shared pastel palette rather than the mockup's illustrative role colours;
- neon trend arrows and alert strips remain status-coloured;
- four PLAYER FOCUS panels fit in a 2 × 2 grid;
- latest-five icons, filled curves, dotted 50% line and circled last curve point are visible;
- no page overflow at 1280 × 800.
