# Implementation report — Volley Live Capture v1.11.0

## Scope

Implemented the two changes requested in `v2.docx` from the verified v1.10.1 package while retaining the Home analysis buttons and pastel role colours.

## Initial rotation

The unselected libero is now represented by a grey `LIB` player circle rather than a full-width selection button. It sits in a centred grey **BANC LIBÉRO** below the orange court. Selecting the seat opens the existing role-compatible libero picker; after selection, the circle shows the player's number and the bench shows the player's name.

## Unified quick capture

The live screen is now ordered as follows:

1. score;
2. HOME and AWAY shortcuts;
3. central quick-entry panel;
4. the six current on-court players on a blue tray;
5. Substitute, Undo, status and History.

The quick-entry panel presents seven technical actions — Attack, Block, Set, Free Ball, Serve, Reception and Defence — around the central Point, Continue and Error controls.

### Three entry paths

- **Complete:** player → action → result. The selected technical action is stored.
- **Player:** player → result. The event is stored with `generic` action detail.
- **HOME/AWAY:** side → result. No player or technical action is required; HOME stores a team event and AWAY stores an opponent event.

Likely-action guidance continues to use the selected player's position. Probable actions remain fully emphasized, rare legal actions remain available with reduced emphasis, and libero Attack, Block and Serve remain disabled. `FREE BALL` is supported by the unified schema and is now included in capture reports.

## Safety and retained behavior

- The post-result guard is 450 ms and starts only after an accepted result.
- Substitute continues to use the existing on-court/bench substitution workflow.
- Undo removes the last substitution first when applicable, otherwise the last action.
- Score, service, rotation, history, set completion and reports remain connected to the existing event store.
- COACH VIEW and ADVANCED STATISTICS remain on Home.
- Pastel role colours remain shared across setup, capture and Coach courts.
- Offline cache updated to `volley-live-capture-v1.11.0`.

## Validation

- JavaScript syntax: passed.
- 40 automated Playwright/pytest tests: passed.
- Mobile 390 × 844 visual inspection: passed for the unselected libero bench, neutral capture state and selected-player capture state.
- All three input paths, FREE BALL, likely-action guidance, substitution, Undo and double-entry protection: passed.
