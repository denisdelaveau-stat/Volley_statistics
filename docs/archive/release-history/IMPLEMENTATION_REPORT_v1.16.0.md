# Implementation report — Volley Live Capture v1.16.0

## Baseline and scope
This release is built from the verified v1.15.0 complete package. It implements the `time line.docx` changes only in the archive spectator LIVE TIMELINE and preserves the remaining application workflows.

## Files and behavior
- `spectator.js`: symmetric SO/BP derivation, POINT/ERROR/NEUTRAL normalization, skill-only HOME labels, AWAY circle-only rendering, split score highlight and Basic suppression.
- `spectator.css`: saturated shared role palette, green/red AWAY circles, green/red/blue HOME action labels, black split score, single-half SO/BP colors and edge-to-edge centered connectors.
- `spectator.html`: removes SO/BP/L and winning/fault footer legends while preserving REPLAY D’ARCHIVE.
- `index.html`, `VERSION`, `sw.js`: application and offline cache version updated to v1.16.0.
- `tests/test_timeline_update_v1_16.py`: document-specific behavior, geometry, palette, contrast, Basic and filter coverage.
- `tests/visual_baselines/spectator_live_timeline_1536x1024_v1_16.png`: landscape visual regression baseline.

## Data rules
- HOME outcome colors use official evaluation values normalized to POINT, ERROR or NEUTRAL.
- AWAY color is determined from the acting side and rally winner: green when AWAY wins; red when AWAY is the terminal actor and HOME wins.
- Phase is derived for either team: `SO` when winner differs from serving side; `BP` when winner equals serving side.
- Score accent: SO yellow on the winner half; HOME BP green on HOME half; AWAY BP red on AWAY half; non-winner half black.
- Generic/team actions and Basic detail level render score-only rows without invented labels.

## Verification
- JavaScript syntax check passed.
- Targeted timeline tests passed: 15 non-visual tests plus the 1536 × 1024 visual regression.
- Complete suite passed: 90 tests (the long run completed as 86 successful tests before the execution window, followed by the final 4 successful regressions).
- The v1.15.0 source archive matched its published SHA-256 before modification.
