# Release v1.6.0 — 16 November 2026

Volley Live Capture v1.6.0 implements the approved UI functional specification for Basic, Intermediate and Advanced capture.

## Capture changes
- **Basic:** one-tap Error/Point zones for each team, with NET separation.
- **Intermediate:** optional Focus-player selection, then one tracked-team result tap; TEAM and ADVERSE remain direct.
- **Advanced:** player selection plus a fixed combined Action/Result grid. Attack, Block and Service support Error/Point/Continue. Defence, Reception and Set support Error/Continue only.
- **Advanced Focus:** non-Focus events use direct TEAM controls; ADVERSE always uses direct controls.
- **Continue:** persists `neutral` and does not change the score.

## Shared behaviour
- Error is always red and left; Point is always green and right.
- Undo is neutral grey/white.
- SERVICE/RECEPTION remains read-only and derived from service state.
- Substitution suspends rally capture.
- The 400 ms duplicate-entry guard starts after a result is accepted.

## Compatibility
The match JSON format remains version 1. Existing `point`, `error` and `neutral` values are reused; no migration is required. The v1.5.0 setup library is unchanged.
