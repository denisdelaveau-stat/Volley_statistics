# Changelog – Volley Live Capture

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
