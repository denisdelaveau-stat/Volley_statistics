# Changelog – Volley Live Capture

## v1.6.3 – 2026-11-17
### Changed
- Made the BENCH replacement-player and SUBSTITUTION controls shorter, narrower and centred.
- Replaced the crowded live header with the rally score only, flanked by won-set badges.
- Added a service underline below the score of the team currently serving.
- Removed the match/set title, set-format/mode metadata strip and primary Player instruction from the live capture header.
- Updated the English Word UI specification while retaining all 11 original embedded source visuals.
- Bumped the visible application version and PWA cache to v1.6.3.

### Compatibility
- Match and event JSON formats are unchanged; no migration is required.

## v1.6.2 – 2026-11-17
### Added
- Added the approved player-position/action matrix to the Advanced capture model.
- Added automated checks for Setter, OH, OPP, MB and Libero action guidance.

### Changed
- The Advanced grid always keeps the fixed order Attack, Block, Defence, Reception, Service, Set.
- Expected actions for the selected position remain full emphasis; rare but legal actions are visually attenuated and remain tappable.
- Libero Attack, Block and Service are disabled and cannot create an event, including through a synthetic click.
- PWA cache, visible application version, specification and release documentation bumped to v1.6.2.

### Compatibility
- Match and event JSON formats are unchanged; no data migration is required.

### Verification
- Added position-matrix, rare-action and Libero-prohibition browser acceptance checks.

## v1.6.1 – 2026-11-17
### Changed
- Moved the SUBSTITUTION control into the BENCH row, to the right of the current bench replacement.
- Intermediate Focus selection now replaces the tracked-team label with the selected player's number and name.
- While an Intermediate Focus player is selected, the ADVERSE result bar is visually greyed, semantically disabled and blocked from recording a rally.
- PWA cache and visible application version bumped to v1.6.1.

### Compatibility
- Match and event JSON formats are unchanged; no data migration is required.

### Verification
- Added browser acceptance checks for BENCH placement, player identity rendering and ADVERSE lock/unlock behavior.

## v1.6.0 – 2026-11-16
### Added
- Normative Basic, Intermediate and Advanced capture UI from the approved English functional specification.
- Advanced combined Action/Result grid in fixed order: Attack, Block, Defence, Reception, Service, Set.
- Reusable inline SVG for Continue; the persisted result remains `neutral`.
- Automated acceptance coverage for UI-BAS-01, UI-INT-01/02, UI-ADV-01/02/03, UI-SUB-01, UI-UNDO-01, UI-GRD-01 and UI-PHA-01.

### Changed
- Basic now uses separate full-area Error and Point zones around the team name.
- Intermediate changed from split-player direct entry to optional Focus-player selection followed by the tracked-team result; TEAM and ADVERSE remain one tap.
- Advanced changed from Player → Action → Result to Player → combined Action/Result. TEAM non-Focus and ADVERSE are one tap.
- Error is left/red/✕ and Point is right/green/✓ in every team-result bar.
- Undo is neutral grey/white; red is reserved for Error.
- Duplicate-entry protection now starts after an accepted result instead of after every capture tap.
- PWA cache and visible application version bumped to v1.6.0.

### Compatibility
- Portable match JSON format remains version 1. No data migration is required.
- Saved teams, starting sevens, rotations and ROTATE +1 remain compatible with v1.5.0.

### Verification
- JavaScript syntax validation and full Playwright/pytest suite.
- Primary automated viewport: 390 × 844 CSS px.

## v1.3.2 – 2026-11-15
### Changed
- Scoreboard colour follows Team A's situation in the current set: **green** when ahead, **red** when behind,
  **white** when tied (0:0 included). Both digits take the colour; black squares unchanged.
### Tests
- Scoreboard checks S-01 … S-04 (A4 updated) → 69 checks.

## v1.3.1 – 2026-11-15
### Changed
- Capture screen (Intermediate / Advanced): the role legend (SET / OH / MB / OPP / LIB) above the NET is
  replaced by a large **SERVICE** (green) / **RECEPTION** (amber) badge, updated after every rally.
  Role colours stay on the player cells.
### Tests
- 5 new checks N-01 … N-05 → 66 checks.
### Documentation
- Screens PDF regenerated: `docs/Volley_Live_Capture_Screens_v1.3.2.pdf`.

## v1.3.0 – 2026-11-15
### Added
- **Focus** checkbox for each player on SETUP 1, checked by default; stored as `team.roster[].focus`.
- Intermediate / Advanced capture: players without focus are not proposed by number; their court / bench
  cells show **TEAM** (dashed, not tappable outside substitution mode).
- **TEAM** button (`data-player="T"`) above ADVERSE when at least one player on court has no focus; records the
  actions of all players without focus (Advanced: 6 actions; Intermediate: Point / Error).
- Report: row "TEAM (players without focus)" in the players table.
### Compatibility
- Matches and JSON files without `focus` (≤ v1.2.0) → every player has focus. JSON format version unchanged (1).
### Tests
- 16 new checks F-01 … F-16 → 61 checks.

## v1.2.0 – 2026-11-15
### Added
- **Detail level** drop-down on SETUP 1 (under the match format): Basic, Intermediate, Advanced (default),
  with a description line. Stored in the match (`detailLevel`), shown on Home and in the sets line.
- **Basic**: no roster; first rally chosen on SETUP 1; capture in 2 taps (Team → Point / Error);
  serving side followed; no substitution; attacker sections hidden; report with points per team.
- **Intermediate**: capture in 2 taps (Player / ADVERSE → Point / Error), court, rotation, libero and
  substitutions kept; own-team events stored with action `generic`; attacker cards without Neutral;
  report with Pts / Err / Diff per player.
- End-to-end test extended to 45 checks (v1.1.x behaviour at Advanced level + L-01 … L-14).
### Changed
- Report header states the detail level. Consolidated attacker charts are not drawn when there is no attacker.
- Home Screen icons regenerated.
### Compatibility
- Matches and JSON files without `detailLevel` (v1.1.x) open at **Advanced** level. JSON format version unchanged (1).

## v1.1.5 – 2026-11-14
### Fixed
- SAVE .JSON / REPORT .HTML messages shown only on the file status line at the bottom of the page.

## v1.1.4 – 2026-11-14
### Changed
- UNDO LAST alone and centred below the court; CHANGE above it during input.
- SAVE .JSON and REPORT .HTML at the very bottom of the page, after STATISTICS.

## v1.1.3 – 2026-11-14
### Fixed
- Scoreboard digits in red on black squares; attacker legends with player names.

## v1.1.0 – 2026-11-14
### Added
- Offline iPhone package, set / match end detection, substitutions, statistics, REPORT .HTML.
