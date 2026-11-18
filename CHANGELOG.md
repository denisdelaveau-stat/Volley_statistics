# Changelog

## v1.7.0 – 2026-11-18
- Applied the supplied `Font_app_ref.jpg` as the Home reference artwork and rebuilt the Home overlay.
- Moved current-match information inside Continue/View Match and renamed Open Match to Open Archives.
- Added Teams and Settings navigation and removed the Statistics control.
- Replaced team setup with a single reusable team editor, Add Player rows, jersey numbers 1–40 and role colors; removed Focus from reusable teams.
- Replaced the old New Match wizard with saved-team selection, Present/Focus confirmation, setter-position-driven role rotation, compatible-player assignment and Service/Reception libero preview.
- Added persistent Settings for match format and detail level.
- Preserved live capture and portable match format version 1; advanced the visible version and PWA cache to v1.7.0.
- Added v1.7 acceptance tests and visual QA; full result: 26 passed.

## v1.6.10 – 2026-11-18
- Rebuilt Apple touch, favicon, 192 px and 512 px manifest icons from the supplied 1254 × 1254 `IMG_5596.PNG` source.
- Removed the pale pre-rendered perimeter and white corner area; every icon is a full-square, fully opaque PNG with navy pixels extending to all edges.
- Removed baked corner rounding and changed manifest icon purpose to `any`, leaving launcher masking to the operating system.
- Added pixel-level icon acceptance tests, a reference comparison preview and an icon-evidence page in the screenshot PDF.
- Preserved all v1.6.9 Modification UI 7 layout and behaviour without change.
- Advanced the visible application version and PWA cache to v1.6.10.

# Changelog – Volley Live Capture

## v1.6.9 – 2026-11-18
### Changed
- Tightened the live score cluster and applied one consistent gap between the left set badge, left score, colon, right score and right set badge; the service underline remains directly below the serving team score.
- Limited both volleyball-net posts/antennas to the net's 28 px rendered height so they no longer protrude above or below the mesh.
- Added a dashed separator between the BENCH replacement/SUBSTITUTION controls and the tracked-team Error/Team/Point input row in Intermediate and Advanced capture.

### Documentation and verification
- Advanced the English Word UI specification to document version 1.9 while preserving its original images and added Modification UI 7 requirements and acceptance cases.
- Added automated geometry/style coverage, current screenshots, an updated screenshot PDF and an implementation report for v1.6.9.
- Bumped the visible application version and PWA cache to v1.6.9.

### Compatibility
- No match JSON schema, scoring, rotation, substitution or saved-team migration is required.

## v1.6.8 – 2026-11-18
### Changed
- Removed the dark fill behind the compact volleyball net; the page background now remains visible through the mesh while top tape, blue posts, red/white antennas and proportions are retained.
- Removed player silhouette icons from all six Advanced action labels.
- Preserved the orange/green/blue label families and lighter rare-action treatment.
- Ensured complete Advanced labels remain visible, including `Reception`.

### Documentation and verification
- Updated the English Word UI specification to document version 1.8 while preserving the 11 original inline images and 22 original media entries.
- Updated automated tests, current screenshots, screenshot PDF and implementation report for v1.6.8.
- Bumped the visible application version and PWA cache to v1.6.8.

### Compatibility
- No match JSON schema, scoring, rotation, substitution or saved-team migration is required.

## v1.6.7 – 2026-11-18
### Changed
- Renamed `UNDO LAST` to `UNDO` and matched its 122×36 CSS px footprint to `SUBSTITUTION`.
- Removed the transient `Saved: …` confirmation, collapsed History by default, and added pale Error/Point/Neutral result badges.
- Rebuilt each team result control as three separate rounded blocks with explicit “Point for …” semantics and a non-interactive centre label.
- Replaced the striped NET bar with a compact volleyball net including mesh, top tape, blue posts and red/white antennas.
- Added compact action-specific player silhouettes to the six Advanced action rows.
- Replaced the Apple touch icon, favicons and manifest icons with the supplied 1254×1254 `IMG_5596.PNG` artwork.

### Documentation and verification
- Updated the English Word UI specification, automated tests and current screenshot PDF for UI Modification 6.
- Bumped the visible application version and PWA cache to v1.6.7.

### Compatibility
- Portable match JSON remains format version 1; scoring, rotation and existing saved matches are unchanged.

## v1.6.6 – 2026-11-17
### Changed
- Reduced the BENCH replacement-player and SUBSTITUTION controls to compact readable 66×36 and 122×36 CSS px controls at the primary iPhone viewport.
- Extended Setup 1 Roster maximum from 7–20 to 7–30 and exposed jersey buttons 1–30.
- Halved the vertical padding of the black NET band.
- Replaced `Rotation N` with `Rot. Pn | Rn | Cn`, prioritising the setter position, followed by the 1–6 rotation configuration and full-cycle count; equalised spacing above and below the line.
- Changed RECEPTION to blue and reduced the SERVICE/RECEPTION banner height.
- Changed every Undo control to light orange.
- Reduced TEAM/ADVERSE result rows from 76 to 60 CSS px.
- Added semantic Advanced action-label colours: Attack/Block light orange, Defence/Reception light green, Service/Set light blue; rare legal rows remain lighter.
- Reduced on-screen History to `#`, `Player`, `Action`, `Result`, `Score`; time and rotation remain stored in event logs and available to statistics/reporting.

### Documentation and verification
- Updated the English Word UI specification to document version 1.6 while preserving all 11 original inline images and 22 media package entries.
- Replaced the screenshot PDF with current v1.6.6 captures and added browser acceptance coverage for all nine UI changes.
- Bumped the visible application version and PWA cache to v1.6.6 and regenerated SHA-256 manifests.

### Compatibility
- Portable match JSON remains format version 1. Existing `time` and integer `rotation` event fields are unchanged; only their live History columns are hidden.

## v1.6.5 – 2026-11-17
### Fixed
- Moved acceptance scenarios `UI-ADV-POS-01` and `UI-ADV-POS-02` out of section 8 Target UI Matrix and into section 10 Automated Acceptance Test Catalogue in the English Word specification.
- Replaced the obsolete v1.3.2 screenshot PDF with current v1.6.5 captures of Basic, Intermediate, Advanced, the compact live header and Setup 1.
- Replaced the separate root-level Word specification copy with the corrected document version 1.5.

### Changed
- Bumped the visible application version and PWA cache to v1.6.5 so documentation/package integrity changes propagate to installed clients.
- Added automated package checks for specification table placement, document version and preservation of all 11 original inline images.
- Regenerated package SHA-256 manifests.

### Compatibility
- No capture behavior or match-data schema changed from v1.6.4. Portable match JSON remains format version 1.

## v1.6.4 – 2026-11-17
### Added
- Added a Rotation column to live History.
- Persisted the pre-rally integer `rotation` on every new event for future rotation statistics.
- Added pale Detail level colours on Setup 1: Advanced red, Intermediate yellow and Basic green.
- Added a configurable roster maximum from 7 to 20 players; the default remains 12.
- Added browser acceptance coverage for rotation display/persistence/history, setup colours and roster-limit enforcement.

### Changed
- Replaced the coloured server/rotation sentence with plain centred black `Rotation N` text beneath the score.
- Reduced BENCH replacement-player and SUBSTITUTION controls to the minimum readable 44 px touch height and narrower fixed widths.
- Updated the English Word UI specification while retaining all 11 original embedded source visuals.
- Bumped the visible application version and PWA cache to v1.6.4.

### Compatibility
- Portable match JSON stays at format version 1. Older events without `rotation` remain readable and display `—` in History.
- Saved setup teams without `maxPlayers` continue to load with a compatible default.

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
