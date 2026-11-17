# Volley Live Capture v1.6.5 — Implementation Specification

## Runtime and storage
Single-page HTML/CSS/vanilla JavaScript application. Match, event, chart and reusable setup data use browser localStorage. The service worker provides the offline shell over HTTPS/localhost.

| Key | Content |
|---|---|
| `volleyCapture.match.v1` | Current match configuration/status |
| `volleyCapture.events.v1` | Accepted action log |
| `volleyCapture.chartData.v1` | Scoring-event projection for charts |
| `volleyCapture.library.v1` | Saved teams, starting sevens and rotations |

## Capture implementation
The v1.6.5 block in `index.html` delegates all normative result controls from the capture panel:
- `.vlc-result-bar`: shared Basic/Intermediate/Advanced TEAM/ADVERSE grammar.
- `[data-vlc-result="error|point"]`: full-area result zones.
- `[data-adv-row]`: six fixed Advanced action rows.
- `[data-adv-result="error|point|neutral"]`: combined Advanced result controls.
- `ACTION_MATRIX` and `actionState(position, action)`: classify each action row as `expected`, `rare` or `blocked`.
- `[data-adv-state]`: exposes the classification for styling, accessibility and automated acceptance.
- `primary()`: clears selection and returns to the player/team selection step.
- `commit(player, action, result)`: derives the pre-rally rotation, delegates to the event model and arms the post-result guard only when the event count increases.
- `currentRotationNumber()`: replays current-set events before commit and returns the integer persisted as `event.rotation`.

Internal values remain:
- players: number, `T` (TEAM), `A` (ADVERSE);
- actions: `attack`, `block`, `defense`, `reception`, `service`, `set`, `generic`, `team`, `adverse`;
- results: `point`, `error`, `neutral`.

## Position-aware action grid
All six action rows are rendered for every selected player. `.is-expected` keeps full emphasis, `.is-rare` is visually attenuated without disabling its result controls, and `.is-blocked` disables every result control. The blocked state is used only for Libero Attack, Block and Service. The delegated click handler also rejects synthetic events from blocked rows.

## Continue asset
Continue is a reusable inline SVG containing two circular arrows. The same generated markup is used for every Advanced Continue cell. It is announced through the button `aria-label`; the SVG itself is decorative.

## Focus and substitution
`updateCourt()` retains service, rotation, libero and Focus rendering. Normal capture ignores `.nofocus` cells. In substitution mode, the v1.6 capture handler yields player taps to the existing substitution handler and blocks all result controls.

## Duplicate-entry guard
`LOCK_MS` is 400 ms. The guard is armed only after an accepted result. Player selection and the following combined result are not separated by an artificial delay. Statistics, navigation and export controls remain outside the guard.

## Compatibility
No migration is required. Portable match JSON remains format version 1, and existing `point`, `error` and `neutral` events remain readable. New events add the optional integer `rotation`; older events display `—` in History. Saved team library entries may add optional `maxPlayers`; entries without it use the compatible default.

## Service worker
`sw.js` uses `volley-live-capture-v1.6.5`. Increment the cache ID whenever shell content changes.


## v1.6.5 rotation and setup changes
- `#courtStatus` renders only `Rotation N` with transparent background, black text and centred alignment in court-based modes.
- The event is tagged with the rotation active before that rally; a side-out updates the live indicator for the next rally.
- `#captureHistory` adds the Rotation column and tolerates legacy missing values.
- `#suLevel` receives a class derived from the selected level; CSS applies the three pale backgrounds.
- `S.maxPlayers` defaults to 12, is changed by `#suRosterMax`, limits jersey selection and is saved as `team.rosterMax` / library `maxPlayers`.

## Compact capture UI retained from v1.6.3
- `.score-live.board` contains two `.score-side` wrappers, external `.set-badge` values and one `.service-line` per team.
- `window.updateScoreService('A'|'B')` is called from both Basic and court-based service-state renderers after every replay.
- `#captureTitle`, `#setsLine` and the primary player-step title remain non-rendered; completion banners and match reports keep full match/set context.
- `.bench-row` uses a centred flex pair; `#benchBtn` is 82 × 44 CSS px and `#subToggle` is 146 × 44 CSS px at the primary viewport, with smaller widths at 360 px and below.
