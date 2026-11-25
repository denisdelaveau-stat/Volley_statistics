# Implementation report — Volley Live Capture v1.6.9

## Scope
v1.6.9 starts exclusively from the published complete `Volley_statistics_v1.6.8.zip` package and implements the three presentation changes in `Modification UI 7.docx`. Match data, scoring, service ownership, substitutions and capture semantics are unchanged.

## Delivered changes
1. The live score cluster now uses one equal 5 px gap between the left set badge, left score panel, colon, right score panel and right set badge.
2. Set badges are reduced to 32 px high and score panels to a 58 px minimum width at the 390 px reference viewport, reducing the five-block cluster from approximately 235 px to 210 px.
3. The existing service underline remains visible directly below the score of the serving team and hidden below the receiving team.
4. The left and right CSS post/antenna pseudo-elements are limited to the same 28 px height as the net and aligned with its outer top edge (`top: -5px`), so neither post protrudes above or below the net.
5. The page-grey background, transparent net field, grey mesh, top tape, lower edge and red/white/blue post styling are retained.
6. Intermediate and Advanced tracked-team input rows now have a 2 px pale-grey dashed top divider with 8 px top margin/padding, separating BENCH replacement/SUBSTITUTION controls from Error / team name / Point entry. Basic mode is excluded because it has no BENCH zone.
7. The visible version and service-worker cache are advanced to v1.6.9.

## Tests
- Added `tests/test_ui_modification_v1_6_9.py` for equal score gaps, compact cluster width, serving underline placement, post containment in all three modes, divider styling and Basic-mode exclusion.
- Updated retained net and compact-row regression expectations to reflect the intended post height and divider spacing.
- Full automated result: **22 passed** with no uncaught browser errors.

## Documentation and evidence
- English UI functional specification advanced to document version 1.9 with a dedicated `9.8 Modification UI 7 (v1.6.9)` section and three catalogue cases: `MUI7-SCORE-01`, `MUI7-NET-01` and `MUI7-BENCH-01`.
- All 11 original inline images and all 22 original media files are retained.
- Four current screenshots cover Basic, Intermediate, Advanced and the Advanced action/result regression state.
- `Volley_Live_Capture_Screens_v1.6.9.pdf` is a verified four-page screenshot-evidence PDF.

## Compatibility
Portable match JSON remains format version 1. Existing saved matches, roster data, events, rotation fields and PWA artwork remain compatible.

## Verification
See `tests/TEST_RESULTS_v1.6.9.txt` and `Volley_statistics_v1.6.9_ARTIFACT_SHA256SUMS.txt` for final automated, document, PDF and package integrity results.
