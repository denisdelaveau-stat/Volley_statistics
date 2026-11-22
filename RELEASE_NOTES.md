# Release notes — Volley Live Capture v1.14.0

## Last-action correction from History

- Removed the Undo control from the top-right of the scoreboard.
- Added a compact **Delete** control to the latest History row only.
- Older History rows remain visible but cannot be deleted directly.
- Empty History now displays a clear neutral state.

## Complete rollback

Deleting the latest row recomputes and restores the previous:

- score and set/match lock state;
- serving team and phase;
- rotation and on-court lineup;
- substitution metadata when the deleted row is itself a substitution;
- charts, statistics and locally persisted JSON state.

The action-entry court remains orange and net-free, with two rows of three large pastel role circles, the dashed front/back separator and **Changer de joueur** on the blue area above History.

## Result-first HOME / AWAY controls

- Selecting POSITIF, ERREUR or NEUTRE before a player/action reveals HOME to the left and AWAY to the right of the result column.
- HOME, ERREUR and AWAY share the same horizontal axis and control dimensions.
- Dedicated middle-row slots are always reserved, so showing or hiding HOME/AWAY does not move or resize any action or result control.
- HOME/AWAY are hidden, removed from the tab order and non-interactive outside result-first mode.
- Selection, toggle cancellation and Escape reset cleanly; keyboard, touch and the 450 ms result guard are retained.

## Compatibility

**COACH VIEW**, **LIVE COURT**, **PLAYER FOCUS**, **ADVANCED STATISTICS**, the reference JSON, same-position substitutions and offline operation are retained. The service-worker cache is `volley-live-capture-v1.14.0`.

## Validation

- 71 automated tests passed.
- Coverage includes HOME/AWAY points, errors, neutral actions, score/service/rotation rollback, deletion after and of a substitution, older-row protection, empty History, double-click protection, reload persistence, fixed HOME–ERROR–AWAY geometry, zero grid shift, cancellation/reset, keyboard/touch accessibility and 390 × 844 responsive checks.
