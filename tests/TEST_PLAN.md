
## v1.15.0 saturated court and spectator archive view

| ID | Acceptance |
|---|---|
| COURT150-01 | Six saturated role-colored circles remain in exactly two rows of three on the orange court at 390 × 844 |
| COURT150-02 | OPP, SET, OH, MB and LIB number/role text contrast is at least 4.5:1 |
| COURT150-03 | The white dashed separator clears both rows; no net is shown; each circle and substitution control is at least 44 px |
| SPEC150-01 | OPEN ARCHIVES validates v2.1/Capture v1 and opens LIVE TIMELINE directly |
| SPEC150-02 | T1–T11 cover delta lanes, shared scale, windows, SO/BP/L, service validation, order and correction/undo recomposition |
| SPEC150-03 | Basic data renders score/chip/delta without invented event cards |
| SPEC150-04 | Replay status, Home return, invalid archive, tablet and 1536 × 1024 visual/contrast checks pass |
# Volley Live Capture v1.13.0 — Automated Test Plan

## v1.13.0 LIVE COURT / PLAYER FOCUS acceptance

| ID | Acceptance |
|---|---|
| LIVE130-01 | LIVE COURT renders exactly six cards at positions 4-3-2 / 5-6-1 and at most 12 real rallies |
| LIVE130-02 | Good, Watch and Difficulty use independent neon status borders/arrows and matching alert strips |
| FOCUS130-01 | A court-card tap opens PLAYER FOCUS; Court and previous/next navigation work |
| FOCUS130-02 | Four skill panels show five latest real contacts and efficiency curves with filled areas, 50% guide and circled final point |
| DATA130-01 | POS, GOOD and reception/defense efficiency use non-error events and are marked with `≈`; BLK is NA |
| DATA130-02 | Capture v1 without intermediate contacts uses NA curves; no flat curve is invented |
| EMPTY130-01 | Empty LIVE COURT and PLAYER FOCUS contain only neutral 0/NA values |
| VIEW130-01 | Landscape 1280 × 800 has no overflow; portrait requests device rotation |
| COMP130-01 | COACH VIEW, ADVANCED STATISTICS, Capture, rotations and the shared role palette and existing workflows remain available |
| PWA130-01 | Home and cache use v1.13.0 and cache the Coach Live configuration |

## v1.12.6 Update8 capture acceptance

| ID | Acceptance |
|---|---|
| UI126-01 | Set/Defence, side actions, three results and Relance have equal width and height |
| UI126-02 | Attack/Block and Serve/Reception are vertically centred around POSITIF/ERREUR/NEUTRE |
| COURT126-01 | Capture shows only six on-court players on an orange court in two rows of three |
| COURT126-02 | The court keeps its net and pastel role colours while the bench player is hidden |
| SUB126-01 | Changer de joueur appears below the court with the circular-change icon and same-position filtering remains functional |
| UNDO126-01 | Undo is beside the score and no Undo control remains at the bottom |
| HOME126-01 | COACH VIEW and ADVANCED STATISTICS remain on Home |
| PWA126-01 | Home and cache use v1.12.6 |

## v1.12.5 empty analysis acceptance

| ID | Acceptance |
|---|---|
| EMPTY125-01 | No match shows only grey 0/NA values in every Coach screen |
| EMPTY125-02 | No match shows only grey 0/NA values in every Advanced Statistics screen |
| REPLAY125-01 | The reference fixture is never automatic and only appears after explicit JSON loading |
| RESET125-01 | Empty → replay/live → unload returns to a clean empty state without stale values |
| SAFE125-01 | Empty state produces no NaN, Infinity or division by zero |
| HOME125-01 | COACH VIEW and ADVANCED STATISTICS remain on Home |
| PWA125-01 | Home and cache use v1.12.5 |
| COURT125-01 | Coach court has no P/L legend below it and ends 4–18 px below the lower player row |
| COURT125-02 | Compact court keeps six role circles, net, dashed line and setter badge without overflow at 390 px and 1024 px |

## v1.12.4 red-marker removal acceptance

| ID | Acceptance |
|---|---|
| MARK124-01 | Coach View emits no demo-only red class or badge for the bundled fixture |
| MARK124-02 | Advanced Statistics emits no demo-only red class or badge for the bundled fixture |
| MARK124-03 | Neutral source/provenance labels remain visible and diagnostic provenance is retained |
| HOME124-01 | COACH VIEW and ADVANCED STATISTICS remain on Home |
| PWA124-01 | Home shows v1.12.4 and cache `volley-live-capture-v1.12.4` precaches the complete application |

## v1.12.3 demo-only highlighting acceptance

| ID | Acceptance |
|---|---|
| DEMO123-01 | The bundled v2.1 reference fixture is classified as demonstration data in both analysis interfaces |
| DEMO123-02 | Coach View marks demo-only indicators red and labels the source as having no real value |
| DEMO123-03 | Advanced Statistics marks demo-only fixture indicators red |
| HIST123-01 | Capture v1 phase, rotation, side-out and lineup values reconstructed from match history are not red |
| HIST123-02 | Capture v1 provenance remains available for diagnostics without changing the visual theme |
| THRESH123-01 | Application thresholds keep normal tactical colours and have no red “outside JSON” marker |
| PWA123-01 | Home shows v1.12.3 and cache `volley-live-capture-v1.12.3` precaches the complete application |

## v1.12.2 JSON-provenance acceptance

| ID | Acceptance |
|---|---|
| JSON122-01 | Unified v2.1 provenance marks actions, scores, rallies, phase, rotation and lineup as explicit records |
| JSON122-02 | Capture v1 provenance marks actions/scores/rallies as records and phase/rotation/lineup as inferred |
| JSON122-03 | Coach View shows inferred Capture v1 phase, rotation and court indicators in red |
| JSON122-04 | Advanced Statistics shows inferred Capture v1 rotation, phase, side-out and court indicators in red |
| JSON122-05 | App-defined qualitative thresholds carry a red non-JSON marker |
| JSON122-06 | Unified v2.1 record-backed values are not marked as unbacked |
| JSON122-07 | Player detail presence is computed from lineup state, not hard-coded |

## v1.12.1 reference-layout acceptance

| Scenario | Acceptance |
|---|---|
| CAP121-01 | Set/Defence are at the top; Attack/Block left; Serve/Reception right; POSITIF/ERREUR/NEUTRE form the central column; RELANCE is at the bottom |
| CAP121-02 | The six role-coloured court players share one horizontal row at 390 × 844 and the player tray is less than 120 px high |
| CAP121-03 | SAVE .JSON, REPORT .HTML and end-of-match report/export buttons are absent from Capture |
| CAP121-04 | RELANCE still persists `action: freeball`; POSITIF/ERREUR/NEUTRE retain compatible result values |
| HOME121-01 | COACH VIEW and ADVANCED STATISTICS remain on Home |
| ROLE121-01 | OPP blue, SET yellow, OH red, MB green and LIB grey remain visible in the compact player row |
| PWA121-01 | Home shows v1.12.1 and cache `volley-live-capture-v1.12.1` precaches the complete application |

## v1.12.0 result-first and substitution acceptance

| Scenario | Acceptance |
|---|---|
| CAP120-01 | Result controls are active before actor selection; HOME/AWAY remain hidden until a result is selected |
| CAP120-02 | HOME/AWAY replaces Continue in the reserved middle cell and commits the pending result |
| CAP120-03 | Action/result/player bounding boxes do not change across neutral, player, action and result-first states at 390 × 844 |
| CAP120-04 | FREE BALL is above ✓ / ✕ / ○; action buttons occupy the specified surrounding cells |
| CAP120-05 | On-court players render in two court-shaped rows and rotation/service/status lines are not visible |
| CAP120-06 | Capture Statistics is hidden while Home ADVANCED STATISTICS remains available |
| ROT120-01 | Compact libero bench is centred, 64 × 64 px, contains the 50 px circle and has no `BANC LIBÉRO` label |
| SUB120-01 | SET, OH, MB, OPP and LIB pickers return only same-position, present, off-court candidates |
| SUB120-02 | Empty position list shows `Aucun remplaçant disponible à ce poste` |
| SUB120-03 | Accepted replacement persists a SUBSTITUTION event and Undo removes the event and match substitution |
| HOME120-01 | COACH VIEW and ADVANCED STATISTICS remain on Home |
| PWA120-01 | Cache `volley-live-capture-v1.12.0` precaches the complete application |

## v1.11.0 quick-capture acceptance

| Scenario | Acceptance |
|---|---|
| CAP110-01 | Score, HOME/AWAY, quick actions/results and blue player tray render in that vertical order |
| CAP110-02 | Complete path records player + action + result |
| CAP110-03 | Player path records player + generic result |
| CAP110-04 | HOME/AWAY path records a direct side result without player or technical action |
| CAP110-05 | Seven actions include FREE BALL and position guidance marks probable, rare and blocked states |
| CAP110-06 | Libero Attack, Block and Serve are disabled |
| CAP110-07 | A 450 ms lock prevents a second accepted result while navigation remains available |
| CAP110-08 | Substitute, Undo, score, rotation and history continue to work |
| ROT110-01 | Empty Initial rotation shows a grey libero circle on a centred grey bench |
| HOME110-01 | COACH VIEW and ADVANCED STATISTICS remain on Home |
| PWA110-01 | Cache `volley-live-capture-v1.11.0` precaches the complete application |


## v1.10.1 visual-theme acceptance

| Scenario | Acceptance |
|---|---|
| THEME101-01 | Team selection, roster validation and initial rotation replace white structural surfaces with Coach View blue |
| THEME101-02 | Roster and rotation courts remain orange |
| ROLE101-01 | OPP blue, SET yellow, OH red, MB green and LIB grey are defined once as shared CSS variables |
| COACH101-01 | Overview and rotation-analysis courts derive each pastel circle from the roster position in the active JSON |
| A11Y101-01 | Role number/text combinations meet WCAG AA contrast |
| PWA101-01 | Cache `volley-live-capture-v1.10.1` precaches all analysis assets |

## v1.10.0 New Match acceptance

| Scenario | Acceptance |
|---|---|
| SETUP10-01 | New Match opens a dedicated configured-team selector; opponent reveals and updates an editable match name |
| SETUP10-02 | VALIDE advances to SELECT TEAM with role colours, Present/Focus controls and three sort modes |
| SETUP10-03 | Initial rotation exposes P1–P6, six grey/role circles, compatible player selection and a Libero control |
| SETUP10-04 | Empty setter alone uses the setter colour; START MATCH appears after Reception/Service is selected |
| HOME10-01 | Home continues to expose COACH VIEW and ADVANCED STATISTICS |
| PWA10-01 | Cache `volley-live-capture-v1.10.0` precaches all analysis assets |

## v1.9.1 unified-data acceptance

| Scenario | Acceptance |
|---|---|
| JSON21-01 | Canonical fixture validates as `volley-live` schema `2.1.0`, document type `match` |
| JSON21-02 | Fixture has 2 sets, 93 rallies, 365 unique ordered events, 94 captured and 271 synthetic |
| JSON21-03 | Synthetic events are neutral, never change score and never close a rally |
| JSON21-04 | Rally scores, terminal actions, winners, P1–P6 context and lineup snapshots remain coherent |
| JSON21-05 | Libero/server/front-row role constraints hold |
| HOME21-01 | Home displays both `COACH VIEW` and `ADVANCED STATISTICS` |
| COACH21-01 | Coach opens the bundled v2.1 fixture and exposes Overview, rotations, players and detail |
| STATS21-01 | Advanced Statistics opens the same fixture and renders 364 action rows from 365 source events |
| PWA21-01 | Cache `volley-live-capture-v1.9.1` precaches both interfaces, adapter and v2.1 reference assets |

## Environment
- Python + pytest + Playwright/Chromium.
- Primary viewport: 390 × 844 CSS px, device scale factor 2.
- Offline-capable single-file application shell.

## Automated scope
All v1.6.9 scoring, rotation, setup, history, Advanced-action, compact-score, net-post and BENCH-divider acceptance suites remain active.

| Scenario | Acceptance |
|---|---|
| MUI7-SCORE-01 | Five score blocks retain equal 5 px gaps and the service underline |
| MUI7-NET-01 | Both post/antenna elements remain contained within the 28 px net |
| MUI7-BENCH-01 | Intermediate/Advanced keep the dashed BENCH/input divider; Basic remains excluded |
| ICON10-01 | 180/32/192/512 px icons have exact dimensions, opaque RGB output, dark navy corners and no near-white outer band |
| ICON10-02 | Corrected 1254 px master preserves the supplied source interior while cropping the pre-rounded 96 px perimeter |
| PWA10-01 | HTML, manifest and service worker reference all icon assets and cache `volley-live-capture-v1.6.10` |
| Specification package | Document version 2.0 includes the v1.6.10 icon rule while retaining 11 original inline images and 22 original media entries |

## Manual iPhone checks
1. Remove the old shortcut, deploy all v1.6.10 files and add the application to the Home Screen again.
2. Compare with `icon_ref.png`: navy reaches the launcher-mask edge, with no lighter perimeter or white/transparent corner.
3. Verify `v1.6.10` on Home and confirm offline relaunch and saved-match persistence.
4. Recheck compact score spacing, net-height posts and the Intermediate/Advanced BENCH divider.
