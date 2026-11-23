# Changelog

## v1.19.1 — Move score and momentum to LIVE SCORE
- Replaced the legacy LIVE SCORE summary with the v1.19.0 crest-based score card.
- Moved MOMENTUM ACTUEL directly below the score card in LIVE SCORE.
- Removed both cards from LIVE TIMELINE without changing its controls, timeline or graph behavior.
- Preserved the 8-point / 4-point / 70% momentum calculation and complete JSON-driven recomputation.
- Updated T1–T12, placement assertions and phone/tablet/landscape/desktop visual baselines.

## v1.19.0 — Spectator Live header and momentum
- Added the VolleyLive header, JSON-derived HOME/AWAY score card and MOMENTUM ACTUEL above the existing Timeline.
- Added configurable 8-point window, 4-point minimum and 70% advantage threshold.
- Added chronological H/A tiles, percentages summing to 100, counts and current-set streak.
- Added no-match, new-set, insufficient-data, finished-set and finished-match states.
- Rebuilds all values after updates, corrections, Undo and set changes; excludes voided/cancelled/undone records.
- Added mobile/tablet/landscape layouts, accessibility, offline caching and visual baselines.
- Added T1–T12 and complete regression coverage: 132 tests passed.

## v1.18.1 — Compact score-adjacent LIVE TIMELINE delta
- Standardized the spectator UI on HOME left / AWAY right, including header, LIVE SCORE, timeline and graph rows.
- Moved HOME/AWAY delta bars from the outer edges to a constant 6 px gap beside the score.
- Placed the green HOME delta left of the HOME:AWAY score and the red AWAY delta to its right.
- Added explicit readable `+delta` badges and exact vertical centering against the score pill.
- Added responsive 18–112 px connectors with no overlap and retained HOME card internals.
- Added controlled narrow-screen board scrolling and four target viewport baselines.
- Preserved all v1.18.0 LIVE GRAPH, archive/replay, filter, score-color and offline functions.

## v1.18.0 — Score and Fault Evolution LIVE GRAPH
- Replaced the former two-series graph with synchronized HOME/AWAY score and cumulative-fault rows.
- Added uniform cyan score-delta and amber fault-delta curves from one selected-set rally timeline.
- Added official set selection, neutral empty/one-rally states, history browse and `Retour au direct`.
- Centralized official ERROR/FAULT classification in the shared statistics adapter.
- Added exact one-pixel alignment, accessibility, integration, performance and three-viewport visual regression coverage.

## v1.17.0 — Update 10 spectator timeline and LIVE GRAPH
- Equal AWAY/HOME connector lengths and compact delta-to-event spacing.
- Wider vivid split score with attached Rallye cell.
- Generic equal AWAY/HOME header cells.
- STATS replaced by JSON-driven LIVE GRAPH score and delta charts.
- Responsive, accessible and offline validation at three target viewports.

## v1.16.2 — Compact left-shifted LIVE TIMELINE geometry
- Shifted the cyan spine and score from the v1.16.1 61-64% position to 44-48% of the desktop board width.
- Right-aligned proportional AWAY delta bars in a fixed left lane and placed every A marker immediately to their right with a constant 12 px desktop / 8 px compact gap.
- Vertically centered each red delta and A marker on the same rally axis and retained an 8 px marker-to-connector gap.
- Preserved HOME card markup, dimensions, internal spacing, colors and score-relative placement exactly; only the shared global X position changes.
- Added frozen v1.16.1 HOME geometry, responsive geometry assertions and desktop/tablet/mobile visual baselines.
- Updated Home and offline cache to v1.16.2.

## v1.16.1 — Archive timeline alignment and compact HOME cards
- Shifted the LIVE TIMELINE score spine to approximately 63% of the desktop board width.
- Kept the AWAY delta lane flush with the 12 px content inset and aligned its maximum bar to that boundary.
- Changed HOME action cards from full-lane width to content width with symmetric 14 px side padding.
- Preserved connected score geometry, replay filters, role colors, data derivation and all v1.16.0 behaviors.
- Added desktop and Android portrait acceptance tests and visual validation.
- Updated Home and offline cache to v1.16.1.

## v1.16.0 — Archive timeline visual simplification
- Replaced AWAY cards with green/red `A` circles only.
- Reduced HOME terminal actions to the skill name with POINT/ERROR/NEUTRAL color treatment.
- Removed visible SO/BP/L badges and qualifiers/icons.
- Split score pills so only the scoring half is colored: SO yellow, HOME BP green, AWAY BP red.
- Centered connectors on score pills and stopped them at the score boundary.
- Added document-specific automated tests and a 1536 × 1024 visual baseline; complete suite: 90 passed.
- Updated Home and offline cache to v1.16.0.

## v1.15.0 — Saturated player court and spectator LIVE TIMELINE
- Increased role-color saturation and reduced action-entry circle size while preserving the orange two-by-three court and dashed separator.
- Added OPEN ARCHIVES → spectator replay flow with LIVE SCORE, LIVE TIMELINE and STATS navigation.
- Added v2.1/Capture v1 derived timeline, filters, SO/BP/L, decisive actions, shared-scale delta bars, replay state and T1–T11 coverage.
- Updated offline cache to v1.15.0.


## v1.14.0 — Last-action Delete in History

- Removed the Undo control from the top-right of the scoreboard.
- Added a compact Delete control inside the Score cell of the latest History row only.
- Rebuilds score, service, phase, rotation, lineup, charts and set/match state after deletion.
- Removes matching substitution metadata when the deleted row is a substitution; deleting a later action keeps the substitution active.
- Added an empty History state and a 450 ms double-click guard.
- Added fixed result-first HOME and AWAY slots to the left and right of ERREUR, with equal control dimensions and no grid movement.
- Added clean toggle/Escape reset, keyboard/touch semantics and preserved the 450 ms result guard.
- Preserved the orange net-free court, large pastel player circles, dashed separator and Changer de joueur placement from v1.13.1.
- Preserved JSON loading, same-position substitutions, Coach View, LIVE COURT, PLAYER FOCUS, Advanced Statistics and offline support.
- Added comprehensive deletion, persistence and 390 × 844 responsive tests; complete suite: 71 passed.
- Updated Home and offline cache to v1.14.0.

## v1.13.0 — LIVE COURT and PLAYER FOCUS

- Added the landscape LIVE COURT tab and its six real-position player cards.
- Added PLAYER FOCUS with previous/next navigation, court position, four skill panels, latest-five contacts and cumulative rally curves.
- Added configurable Good/Watch/Difficulty rules and configurable outcome normalization in `coach-live-config.js`.
- Added discreet `≈` provenance for POS, GOOD and reception/defense efficiency derived from non-error contacts; BLK remains NA.
- Added neutral empty states and Capture-v1 NA curve handling when intermediate contacts are absent.
- Preserved the shared pastel role palette and all v1.12.6 Capture/analysis workflows.
- Added v2.1 metric tests, landscape visual controls and reference comparison images.
- Updated Home and offline cache to v1.13.0.

## v1.12.6 — Update8 capture interface

- Standardized every action and result control to the same size.
- Centred the two side-action pairs around the three result controls.
- Rebuilt player input as an orange court with a net and two rows of three on-court players.
- Removed the visible bench player and renamed the substitution control to Changer de joueur.
- Moved Undo from the bottom of Capture to the right of the score.
- Preserved pastel role colours, Coach View, Advanced Statistics and capture semantics.
- Updated Home and offline cache to v1.12.6.

## v1.12.5 — Explicit empty analysis state

- Replaced all default demo values with a grey zero/NA state when no match is loaded.
- Removed automatic loading of the bundled Cannes–Fréjus fixture.
- Added explicit live, JSON replay and unload transitions without stale values.
- Added full Coach and Advanced Statistics empty-state browser tests.
- Removed the under-court P/L legend and compacted the Coach court at phone and tablet widths.
- Updated Home and offline cache to v1.12.5.

## v1.12.4 — Demo red markers removed

- Removed demo-only red outlines, text overrides and badges from Coach View and Advanced Statistics.
- Retained source labels and provenance metadata in a neutral visual treatment.
- Preserved normal error, tactical and role colours.
- Preserved COACH VIEW and ADVANCED STATISTICS on Home.
- Updated Home and offline cache to v1.12.4.

## v1.12.3 — Demo-only red highlighting

- Red now identifies only values supplied by a bundled or hard-coded demonstration data source.
- Capture v1 values reconstructed from real match history are no longer red.
- Application-defined qualitative thresholds are no longer marked as outside JSON.
- The bundled v2.1 reference fixture is explicitly classified as demo-only in both analysis interfaces.
- Added browser acceptance tests for demo fallback, Capture v1 historical calculations and threshold rendering.
- Updated Home and offline cache to v1.12.3.

## v1.12.2 — JSON provenance audit

- Audited every Advanced Statistics and Coach View indicator against JSON records.
- Added explicit provenance metadata in the shared adapter.
- Marks inferred Capture v1 phase, rotation and lineup indicators in red.
- Marks non-JSON thresholds in red without altering the record-derived numeric value.
- Replaced the hard-coded Coach player-presence label with the computed current lineup state.
- Added exact-reference and browser acceptance tests.
- Updated Home and offline cache to v1.12.2.

## v1.12.1 — Reference capture layout and compact player strip

- Rebuilt the action pad to match the supplied reference: Set/Defence at the top, Attack/Block on the left, Serve/Reception on the right, POSITIF/ERREUR/NEUTRE in the central result column and RELANCE at the bottom.
- Kept underlying persisted values compatible: `point`, `error`, `neutral` and `freeball` are unchanged.
- Reduced the on-court player area from two rows to one compact row of six role-coloured circles and shortened the Bench/Substitute row.
- Removed visible SAVE .JSON, REPORT .HTML and end-of-match export controls from Capture; automatic local persistence remains active.
- Preserved fixed control geometry, result-first HOME/AWAY entry, role guidance, scoring, rotation, History, Undo and same-position substitutions.
- Preserved COACH VIEW, ADVANCED STATISTICS and the shared pastel role palette.
- Updated the Home version and offline cache to `v1.12.1` / `volley-live-capture-v1.12.1`.

## v1.12.0 — Result-first fixed capture and position-safe substitutions

- Removed the permanent HOME/AWAY row; result-first entry now reveals both side choices in the fixed Continue slot.
- Repositioned the seven action buttons around the central ✓ / ✕ / ○ column, with FREE BALL at the top.
- Locked all capture button coordinates and dimensions across neutral, player, action-guidance and result-first states at 390 × 844.
- Replaced probable/rare text with visual-only emphasis and removed the quick-entry/player information line.
- Changed the on-court player tray to two rows of three and removed visible rotation, service, event-status and Capture statistics information.
- Reduced the Initial rotation libero bench to a centred 64 × 64 px seat around the 50 px circle and removed `BANC LIBÉRO`.
- Filtered substitution choices to present, off-court players with the same normalized roster position.
- Added persisted `SUBSTITUTION` log events containing outgoing/incoming player, position, set, rally, score and rotation; Undo removes the latest substitution event and roster change together.
- Preserved COACH VIEW, ADVANCED STATISTICS, pastel role colours and the unified v2.1 analysis interfaces.
- Updated the PWA cache to `volley-live-capture-v1.12.0`.

## v1.11.0 — Quick action entry and libero bench

- Rebuilt live capture around a mobile-first quick-entry panel with score, HOME/AWAY side selectors, central Point/Continue/Error controls, role-aware actions and a blue on-court player tray.
- Added three input paths: player + action + result, player + result, and HOME/AWAY + result.
- Added FREE BALL while preserving likely/rare action guidance and libero restrictions.
- Retained the post-result double-tap guard, substitution workflow, Undo, scoring, rotation and history.
- Replaced the Initial rotation libero button with a default grey libero circle seated on a centred grey bench.
- Preserved COACH VIEW, ADVANCED STATISTICS, orange setup courts and pastel role colours.
- Updated the PWA cache to `volley-live-capture-v1.11.0`.

## v1.10.1 — Pastel role palette and Coach View setup theme

- Applied the requested pastel role colours: OPP blue, SET yellow, OH red, MB green and LIB grey.
- Reused the single shared palette on every Coach View court, including rotation analysis, from each player’s roster position.
- Applied the Coach View dark-blue background to team selection, roster validation and initial rotation.
- Added contrast-aware text colours for role chips, player circles and selected role controls.
- Updated the PWA cache to `volley-live-capture-v1.10.1`.

## v1.10.0 — Guided New Match interfaces

- Added a dedicated team/opponent/match-name page before roster confirmation.
- Rebuilt roster confirmation as a role-coloured player-circle court with Present and Focus controls and sorting by number, position or name.
- Rebuilt initial rotation from the Coach View visual language with P1–P6 tabs, an orange court, direct role-compatible player picking and explicit Reception/Service selection.
- The Start Match action now appears only after the first-rally role is selected.
- Preserved the COACH VIEW and ADVANCED STATISTICS Home actions and the unified v2.1 analysis interfaces.
- Bumped the offline cache to `volley-live-capture-v1.10.0`.

## v1.9.1 — Unified JSON v2.1 for Coach and Advanced Statistics
- Kept both Home entry points: `COACH VIEW` and `ADVANCED STATISTICS`.
- Made `volley-live` schema 2.1 the authoritative data contract for both interfaces.
- Bundled `As_cannes_vs_Frejus_2026-11-15.fixture.v2.json` as the shared reference: 2 sets, 93 rallies and 365 events.
- Added one shared adapter for explicit rally phase, P1–P6 setter rotation, lineup snapshots, on-court presence, substitutions, scores, players and provenance.
- Retained Capture v1 only as a labelled in-memory migration path for a live local match.
- Added the official unified-format specification and JSON Schema.
- Added an offline fixture module and bumped the PWA cache to `volley-live-capture-v1.9.1`.
- Added browser and structural acceptance coverage for both Home buttons and both v2.1-backed interfaces.

## v1.9.0 — Advanced Statistics integration
- Added the `ADVANCED STATISTICS` Home entry point.
- Integrated Set Timeline, Rotation Metrics, Roster Ranking and Playing Time.
- Replaced hard-coded report data with a Capture v1 JSON adapter.
- Bundled and validated `As_cannes_vs_Frejus_2026-11-15.json`.
- Added live-store, imported-file and offline-reference loading paths.
- Added explicit coverage warnings for terminal-only Capture v1 logs.
- Updated PWA cache to `volley-live-capture-v1.9.0`.


## v1.8.0 – 2026-11-20
- Added a Home `COACH VIEW` entry point.
- Implemented the Coach Overview, Rotation Analysis, Player Performance and Player Detail interfaces from the supplied v1.1 specification and visual references.
- Bound the Coach UI to the existing match/event stores with a labelled demonstration fallback.
- Added period, phase, P1–P6, on-court and role filters with context persistence.
- Added six sample-qualified Overview KPIs and transparent rotation/player calculations.
- Implemented the exact `Voir le détail joueur` CTA with loading, focus, accessible naming and Back restoration.
- Added responsive 320 px layouts, reduced-motion handling and offline caching for `coach.css` and `coach.js`.
- Advanced the visible version and PWA cache to v1.8.0; full result: 28 passed.

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