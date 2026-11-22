# Implementation report — Volley Live Capture v1.14.0

## Baseline

Implemented from the complete v1.13.1 package. Capture, Coach View, LIVE COURT, PLAYER FOCUS, Advanced Statistics, unified JSON handling, the Cannes–Fréjus reference fixture, same-position substitutions and offline support are retained.

## User-interface change

- The scoreboard no longer renders an Undo button.
- History keeps the five reference columns: `#`, `Player`, `Action`, `Result`, `Score`.
- A small `Delete` button is embedded beside the score on the newest row only, avoiding an extra wide column.
- Older rows have no deletion control.
- Empty History renders a single neutral `No action recorded.` row.

## Rollback model

The application removes only the final persisted event and rebuilds all derived state from the remaining journal. This restores score, service, phase, rotation, set/match completion, charts and statistics. If the final event is a substitution, the matching `match.subs` record is removed as part of the same operation. If an action is deleted after a substitution, the substitution remains active.

A 450 ms deletion guard prevents a double-click from deleting two rows. The updated journal and match metadata are written to local storage before the interface is redrawn.

## Result-first side controls

The quick-entry middle area uses three fixed rows in each of its three columns. Attack/Block and Serve/Reception occupy rows one and three. The permanently reserved row-two slots reveal HOME on the left and AWAY on the right only while a result-first choice is pending. This keeps the full action/result geometry unchanged. Both controls mirror the result controls' height and column width and align to ERREUR on the same horizontal axis.

The controls are native buttons with explicit labels, `aria-hidden` and tab-order state. Toggle cancellation and Escape clear the pending result. Mouse, keyboard and touch activation share the same commit path and 450 ms anti-double-click guard.

## Responsive layout

The compact Delete control remains within the existing Score cell at 390 × 844. The History table retains five cells per row and the page has no horizontal overflow.

## Validation

- Complete automated suite: 71 passed.
- Dedicated scenarios: deletion rollback and persistence; HOME–ERROR–AWAY axis/dimensions; zero grid shift; POSITIF/ERREUR/NEUTRE result-first commits; cancellation/reset; keyboard and touch accessibility; anti-double-click protection; and 390 × 844 layout.
- Offline cache bumped to `volley-live-capture-v1.14.0`.
