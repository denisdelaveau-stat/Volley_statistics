# Volley Live Capture v1.10.1 — Automated Test Plan


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
