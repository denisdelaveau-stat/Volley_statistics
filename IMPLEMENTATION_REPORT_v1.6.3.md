# Volley Live Capture v1.6.3 — Implementation Report

## Source baseline
- Input package: `Volley_statistics_v1.6.2.zip`, published by the preceding Position Action Matrix task.
- Requested change source: `Modification UI 2.docx`.
- Local repository `C:\Sam\GIT\Volley_statistics` was not accessed; the modified-files archive preserves repository-relative paths for manual copy.

## Implemented changes

### Compact BENCH
- Replacement-player and SUBSTITUTION controls remain side by side in BENCH.
- Final iPhone-width measurements: replacement player 96 × 56 CSS px; SUBSTITUTION 184 × 56 CSS px.
- The pair is centred and remains above the 44 × 44 CSS px minimum touch target.

### Simplified live header
- Removed the visible match/set title.
- Removed the Sets / Best of / set target / capture-level strip.
- Removed the primary Player instruction line.
- Kept the current rally score as the dominant header element.
- Added compact won-set badges outside the left and right rally scores.
- Added a cyan service underline directly below the score of the serving team; it follows set-start and side-out service state.

### Documentation and compatibility
- Updated the English Word UI specification to document Rule N7, compact-header/BENCH requirements and acceptance scenarios UI-HDR-01 and UI-BENCH-02.
- Preserved all 11 original inline visuals and all 22 pre-existing embedded media payloads byte-for-byte.
- Match and event JSON schemas remain unchanged; no data migration is required.

## Verification
- Automated suite: 11 passed.
- JavaScript syntax: 6 inline scripts and service worker valid.
- 390 × 844 viewport: no horizontal overflow.
- Word document: opened and rendered successfully; document-control version 1.3.

See `tests/TEST_RESULTS_v1.6.3.txt` for detailed results.
