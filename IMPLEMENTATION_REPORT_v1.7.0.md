# Volley Live Capture v1.7.0 — Implementation report

Date: 2026-11-18

## Implemented request

### Home
- Uses the supplied `Font_app_ref.jpg` as the full-screen reference artwork.
- New `VolleyLive Insight` overlay layout with `NEW MATCH`, `CONTINUE / VIEW MATCH`, and `OPEN ARCHIVES`.
- Active-match details are rendered inside the Continue button; the former separate footer summary is removed.
- Added `TEAMS` and `SETTINGS` navigation.
- Removed the `STATISTICS` home control.

### Teams
- Replaced the previous three-step team setup with one team-editor screen.
- Saved teams can be loaded, edited, deleted, cloned under another name, and saved in local storage.
- `ADD PLAYER` appends roster rows.
- Jersey number is selected from 1–40.
- Position controls use the established SET/OH/MB/OPP/LIB color families.
- Focus is not stored in the reusable team definition.
- Removed opponent, match name, match format, detail level, starting-seven, rotation, and old roster-grid sections from team editing.

### New Match
- Step 1 selects a saved team and confirms each player with `Present` and `Focus` checkboxes.
- Opponent and match name are entered for the new match.
- Step 2 selects the setter's initial P1–P6 position and derives the circular role sequence `S → OH1 → MB1 → OPP → OH2 → MB2`.
- The lineup editor highlights the role being configured and proposes compatible present players.
- The libero starts on the bench. In Reception preview, the libero visually replaces an eligible back-row MB while the underlying starting rotation remains rule-consistent.
- `SERVICE` / `RECEPTION`, `BACK`, and `START SET 1` controls are available; Start remains disabled until the lineup and first rally are valid.

### Settings
- Match format (two or three winning sets) and detail level (Basic, Intermediate, Advanced) are persisted separately and applied to new matches.

### Compatibility and PWA
- Existing live-capture, scoring, rotation, substitution, history, export, and report code is retained.
- Existing saved-team library structure remains readable.
- Portable match JSON format remains version 1.
- PWA cache advanced to `volley-live-capture-v1.7.0` and includes `Font_app_ref.jpg`.

## Verification
- Automated command: `pytest -q`
- Result: `26 passed`
- Browser: Playwright Chromium
- Primary viewport: 390 × 844 CSS px, device scale factor 2
- Uncaught JavaScript errors during acceptance and screenshot runs: none
- Visual review completed for Home, empty Teams editor, Settings, team confirmation, and initial rotation/Reception preview.
