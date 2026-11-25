# Release notes — Volley Live Capture v1.16.2

## Corrected LIVE TIMELINE geometry
- The whole timeline geometry moves left together. On desktop, the cyan score spine is now between 44% and 48% of the board width instead of the v1.16.1 range of 61% to 64%.
- Every AWAY rally follows one horizontal sequence: red proportional delta, constant gap, A marker on the same Y center, 8 px connector gap, cyan connector and score.
- AWAY delta bars are right-aligned in a fixed lane. The maximum bar starts at the board's 12 px safety inset, while all A markers retain one stable X coordinate.
- The delta-to-marker gap is 12 px on desktop and 8 px at the compact tablet/mobile layout.

## HOME non-regression
- HOME card DOM order, width, height, player circle, number, role, name, action, colors, padding and internal gaps are identical to v1.16.1.
- The HOME container and card receive the same global X translation as the cyan spine and score; their relative score alignment is unchanged.
- A frozen v1.16.1 bounding-box/style baseline verifies the desktop, tablet and mobile layouts.

## Preserved behavior and validation
- Filters, DERNIER POINT, ARCHIVE/REPLAY, proportional delta calculations, split score highlights, archive normalization and responsive board scrolling are preserved.
- Control screenshots and visual baselines cover 1536 × 1024, 1024 × 768 and 412 × 915.
- Offline cache: `volley-live-capture-v1.16.2`.
