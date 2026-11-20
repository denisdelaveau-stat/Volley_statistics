# Implementation report — Volley Live Capture v1.12.0

## Scope

Implemented `Update IU.docx` from the verified v1.11.0 package, plus the requested compact libero bench, fixed capture geometry and position-safe substitution workflow. COACH VIEW, ADVANCED STATISTICS, the shared pastel role palette and unified v2.1 analysis files are retained.

## Result-first capture

- Removed the permanent HOME/AWAY row.
- POINT, ERROR and CONTINUE are active when no player is selected.
- Selecting a result first reveals HOME and AWAY in the fixed Continue slot; selecting a side commits the stored result.
- Player → result and player → action → result remain supported.
- Result order is ✓ Point, ✕ Error, ○ Continue.
- FREE BALL is centred above the results; Attack/Block are left, Serve/Reception right and Set/Defence below.

## Fixed geometry and reduced information

- All action, result, player and Continue-slot bounding boxes remain identical between neutral, selected-player, selected-action and result-first states at 390 × 844.
- HOME/AWAY overlays the reserved Continue slot and does not reflow the grid.
- Removed the `SAISIE RAPIDE` heading and selected-player/action text line.
- Probable/rare/blocked action guidance uses opacity, borders and glow only; it never inserts text or changes button dimensions.
- The six player circles use two rows of three in court order P4–P3–P2 / P5–P6–P1.
- Rotation, service/receive, score service underline and last-event status are hidden from Capture.
- The Capture-page Statistics toggle and panel are removed from the visible workflow; the Home ADVANCED STATISTICS interface is unchanged.

## Compact libero bench

- Removed `BANC LIBÉRO`.
- The grey libero circle is 50 × 50 px inside a centred 64 × 64 px grey seat, with no overflow at 390 px.
- `SÉLECTIONNER LE LIBÉRO`, the LIBÉRO caption and direct circle selection remain available.

## Same-position substitutions

- The candidate list is limited to players whose normalized roster position matches the outgoing player: SET, OH, MB, OPP or LIB.
- Candidates must be present and off court. Current on-court players and players marked absent are excluded.
- Empty lists display `Aucun remplaçant disponible à ce poste` and no fallback candidates.
- An accepted replacement adds both the existing `match.subs` entry and an event with `type` / `eventType: SUBSTITUTION`, outgoing player, incoming player, position, set, rally, event index, timestamp, score and rotation.
- Undo removes the latest substitution event and matching `match.subs` entry together. If a later action exists, Undo removes that action first.

## Validation

- JavaScript syntax checked for every inline and external script.
- Automated Playwright/pytest coverage includes fixed bounding boxes, result-first HOME/AWAY entry, action placement, hidden capture information, the compact libero seat, all five substitution positions, absent/on-court exclusions, empty candidate state, persistence and Undo.
- 390 × 844 evidence screenshots are stored in `docs/screens_v1.12.0/`.
- Offline cache advanced to `volley-live-capture-v1.12.0`.
