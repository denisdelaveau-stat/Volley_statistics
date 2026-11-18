# Volley Live Capture v1.6.4 — Implementation Report

Date: 17 November 2026

## Baseline
The working tree was rebuilt from the published v1.6.2 complete package plus the official v1.6.3 modified-files overlay. The resulting v1.6.3 application, tests, documentation and English Word specification were used as the implementation baseline.

## Implemented changes

### 1. Minimum-readable BENCH controls
- Replacement-player control: 82 × 44 CSS px at 390 × 844.
- SUBSTITUTION control: 146 × 44 CSS px at 390 × 844.
- Both remain centred, side by side and at the 44 px minimum touch height.
- At widths up to 360 px, widths reduce to 76 and 136 px.

### 2. Rotation presentation, History and data
- Replaced the coloured server sentence with centred black `Rotation N` on a transparent background.
- SERVICE / RECEPTION, the service underline and the P1 SERVE marker continue to show service state.
- Added Rotation to the History table.
- Added optional integer `rotation` to each newly accepted event.
- The saved value is the rotation active before the rally; a side-out advances the live value for the following rally.
- Legacy events without `rotation` display `—` and remain readable.

### 3. Setup 1
- Detail level colours: Advanced `#fee2e2`, Intermediate `#fef9c3`, Basic `#dcfce7`.
- Added Roster maximum selector with values 7–20 and default 12.
- The selected limit drives the roster count, disabled jersey buttons and NEXT validation.
- The value is saved as active-team `rosterMax` and reusable-team `maxPlayers`.

## Documentation and release updates
- Application and cache bumped to v1.6.4.
- CHANGELOG, README, release notes, architecture, functional/implementation/iOS documentation and test plan updated.
- English Word UI specification advanced to document version 1.4.
- All 11 original inline source images remain present; all 22 media package entries are byte-identical to v1.6.3.

## Verification
- Pytest/Playwright: 13 passed.
- Primary viewport: 390 × 844 CSS px, device scale factor 2.
- JavaScript syntax: 6 executable inline scripts and `sw.js` valid.
- No uncaught JavaScript errors in automated scenarios.
- Word specification: 186 paragraphs, 11 tables, 11 inline images, 22 media entries.

See `tests/TEST_RESULTS_v1.6.4.txt` for the test summary.
