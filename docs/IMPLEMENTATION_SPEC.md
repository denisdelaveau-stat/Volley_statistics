# Volley Live Capture v1.6.2 — Implementation Specification

## Runtime and storage
Single-page HTML/CSS/vanilla JavaScript application. Match, event, chart and reusable setup data use browser localStorage. The service worker provides the offline shell over HTTPS/localhost.

| Key | Content |
|---|---|
| `volleyCapture.match.v1` | Current match configuration/status |
| `volleyCapture.events.v1` | Accepted action log |
| `volleyCapture.chartData.v1` | Scoring-event projection for charts |
| `volleyCapture.library.v1` | Saved teams, starting sevens and rotations |

## Capture implementation
The v1.6.2 block in `index.html` delegates all normative result controls from the capture panel:
- `.vlc-result-bar`: shared Basic/Intermediate/Advanced TEAM/ADVERSE grammar.
- `[data-vlc-result="error|point"]`: full-area result zones.
- `[data-adv-row]`: six fixed Advanced action rows.
- `[data-adv-result="error|point|neutral"]`: combined Advanced result controls.
- `ACTION_MATRIX` and `actionState(position, action)`: classify each action row as `expected`, `rare` or `blocked`.
- `[data-adv-state]`: exposes the classification for styling, accessibility and automated acceptance.
- `primary()`: clears selection and returns to the player/team selection step.
- `commit(player, action, result)`: delegates to the existing event model and arms the post-result guard only when the event count increases.

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
No migration is required. Portable match JSON remains format version 1, and existing `point`, `error` and `neutral` events remain readable. The setup-library schema introduced in v1.5.0 is unchanged.

## Service worker
`sw.js` uses `volley-live-capture-v1.6.2`. Increment the cache ID whenever shell content changes.
