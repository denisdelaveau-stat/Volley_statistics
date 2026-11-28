# Volley Live Capture v1.6.10 — Implementation Specification

## Runtime and storage
Single-page HTML/CSS/vanilla JavaScript application. Match, event, chart and reusable setup data use browser localStorage. The service worker provides the offline shell over HTTPS/localhost.

| Key | Content |
|---|---|
| `volleyCapture.match.v1` | Current match configuration/status |
| `volleyCapture.events.v1` | Accepted action log |
| `volleyCapture.chartData.v1` | Scoring-event projection for charts |
| `volleyCapture.library.v1` | Saved teams, starting sevens and rotations |

## Capture implementation
The v1.6 block in `index.html` delegates all normative result controls from the capture panel:
- `.vlc-result-bar`: shared TEAM/ADVERSE grammar used by the single Advanced capture level.
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
No migration is required. Portable match JSON remains format version 1, and existing `point`, `error` and `neutral` events remain readable. Event `time` and integer `rotation` remain persisted but are hidden from live History. Saved team library entries may add optional `maxPlayers`; entries without it use the compatible default.

## Service worker
`sw.js` uses `volley-live-capture-v1.6.10`. Increment the cache ID whenever shell content changes.


## v1.6.8 rotation, setup and presentation changes
- `#courtStatus` renders `Rot. Pn | Rn | Cn` with transparent background, black text, centred alignment and equal score/banner spacing.
- The event is tagged with the integer rotation active before that rally; a side-out updates setter position, configuration and cycle for the next rally.
- `#captureHistory` renders only `#`, `Player`, `Action`, `Result`, `Score` while event time/rotation metadata remains intact.
- `#suLevel` receives a class derived from the selected level; CSS applies the three pale backgrounds.
- `S.maxPlayers` defaults to 12, supports 7–30, limits jersey selection across buttons 1–30 and is saved as `team.rosterMax` / library `maxPlayers`.
- RECEPTION is blue; phase and NET bands are thinner; Undo is light orange.
- Advanced action labels use light orange (Attack/Block), light green (Defence/Reception) and light blue (Service/Set), with rare rows retaining reduced opacity.

## Compact capture UI retained from v1.6.3
- `.score-live.board` contains two `.score-side` wrappers, external `.set-badge` values and one `.service-line` per team.
- `window.updateScoreService('A'|'B')` is called from both Basic and court-based service-state renderers after every replay.
- `#captureTitle`, `#setsLine` and the primary player-step title remain non-rendered; completion banners and match reports keep full match/set context.
- `.bench-row` uses a centred flex pair; `#benchBtn` is 66 × 36 CSS px and `#subToggle` is 122 × 36 CSS px at the primary viewport.
- `.vlc-result-bar` is 60 CSS px high at the primary viewport.


## v1.6.8 UI Modification 6 implementation
- `#captureUndo` is constrained with a high-specificity 122×36 rule so earlier legacy width rules cannot enlarge it.
- `#historyPanel` uses the native `hidden` state and an ARIA-expanded toggle. History cells render semantic `.result-error`, `.result-point` and `.result-neutral` badges.
- `.vlc-result-bar` uses a three-column grid with gaps and independent rounded child blocks; `.vlc-result-label` remains a `div` and has no click handler.
- `.vlc-net` and `.su-net` share a CSS mesh/tape/post/antenna treatment and an accessible `Volleyball net` label.
- Advanced action labels contain no player-silhouette SVG. `.vlc-action-copy` keeps the full action name visible, including `Reception`; semantic colour families and rare-row opacity remain unchanged.
- `.vlc-net` and `.su-net` use a transparent background with grey mesh lines while retaining the same tape, posts, antennas and 28 px height.
- The PNG icon pipeline resamples the supplied 1254×1254 RGB source to 32, 180, 192 and 512 px. Manifest icons declare `any maskable`.
- The service-worker cache ID is `volley-live-capture-v1.6.8` and includes the favicon.

## v1.6.9 Modification UI 7 implementation
- `.score-live.board` uses a single 5 px flex gap for every adjacent score block. Set badges are 32 px high, score panels have a 58 px minimum width, and the service line remains inside each `.score-side`.
- `.vlc-net::before`, `.vlc-net::after`, `.su-net::before` and `.su-net::after` are 28 px high and start at `top: -5px`, aligning their outer bounds with the net's 5 px top tape and 28 px border-box.
- The `.vlc-result-bar.team` rows receive a 2 px dashed top border plus 8 px spacing.
- The service-worker cache ID is `volley-live-capture-v1.6.9`.

## v1.6.10 icon correction
Use the 1254 × 1254 supplied source. Crop the complete 96 px pre-rendered outer rounded/rim area, then resize the clean navy-to-edge square with Lanczos. Save all deliverables as opaque RGB PNG. Assert exact dimensions, alpha-free output, dark non-neutral corners and zero near-white pixels in the outer edge band.
