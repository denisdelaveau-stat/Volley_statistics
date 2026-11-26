# VolleyLive v1.28.0 — Architecture

## Components

| File | Role |
|---|---|
| `index.html` | Application shell markup: Home, workspace navigation, New Match wizard, live capture, Match Hub and Match Library markup, Coach View container. Loads the modules below. Exposes shared shell helpers as `window.VolleyShell` |
| `js/shared-dom.js` | Shared DOM helpers loaded first by `index.html` and `spectator.html`: `window.VolleyDom.esc()`. Rule: every non-constant value inserted with `innerHTML` / `insertAdjacentHTML` goes through `esc()` (or use `textContent`). Enforced by `tests/test_html_escaping.py` |
| `js/shared-domain.js` | Shared domain constants loaded right after `shared-dom.js`: `window.VolleyDomain.STORAGE` (every localStorage / sessionStorage key), `ROLE_CODES` / `ROLE_NAMES` (capture role labels) and `court` (`POS`, `NEXT`, `LIBERO_ZONES`, `rotate()`). Frozen objects. Rule: never write a storage key or one of these role maps as a literal elsewhere. `statistics/adapter.js` keeps its own copies because it also runs standalone in Node |
| `css/index-*.css` | Shell styling extracted from `index.html`: theme, capture layout, focus mode, result grammar |
| `js/index-*.js` | Capture engine extracted from `index.html`, loaded in this order: `index-match-rules.js` (pure set and match rules and attacker statistics: `window.VolleySets`, `window.VolleyStats`), `index-rotation.js` (pure rotation, libero and substitution replay: `window.VolleyRotation`; the single source of the rotation rules, also used by the Coach View through `trace()` and `replay()`), `index-capture-engine.js` (capture bootstrap: loads the active match as `window.VOLLEY_MATCH`, capture title, serving team on the score board via `window.updateScoreService`), `index-report.js` (match report builder: `window.VolleyReport`), `index-chart-common.js` (chart data, one point per rally, and player palette: `window.VolleyCaptureCharts`), `index-chart-progression.js` (score progression, lead and per-player charts), `index-chart-origin.js` (point origin pies), `index-chart-errors.js` (cumulative errors and differential), `index-capture-tools.js` (capture screen controller: collapsible panels, action commit, persistence, history, sets, undo), `index-navigation-new-match.js` (shared shell helpers and the New Match wizard), `index-pwa.js` (offline cache and install hint) |
| `team-management.js` / `team-management.css` | Team Management controller (`window.VolleyTeams`) and styling |
| `settings.js` | Settings controller |
| `runtime-input.js` / `runtime-input.css` | The capture input UI (the only one: it replaces the `.steps` container of the capture panel): court, FOCUS / SPEED+ / FLOW modes, preferences, atomic Undo, double-tap guard, substitutions (FIVB Rule 15). Commits through `window.__vlc` of `js/index-capture-tools.js` |
| `match-hub.js` / `match-hub.css` | Match Capture hub (new/continue/conflict dialogs) and shared Match Library (selection, JSON import, reports, view routing). Exposes `window.VolleyMatchHub` / `window.VolleyMatchLibrary` |
| `coach.js` / `coach.css` / `coach-live-config.js` | Read-only Coach View and its configurable status thresholds. `coach.js` holds the controller (render, open/close, event wiring) and the public `window.VolleyCoach` API |
| `js/coach-*.js` | Coach View modules, loaded in this order before `coach.js` and sharing the private `window.VolleyCoachParts` namespace (state object `C`): `coach-core.js` (storage keys, data loading, rally model, metrics, shared cards, empty states), `coach-rotations.js`, `coach-overview.js`, `coach-players.js` (players list and player detail), `coach-live.js` (LIVE COURT and PLAYER FOCUS) |
| `spectator.html` / `spectator.js` / `spectator.css` / `spectator-live-config.js` | Read-only Spectator View: LIVE SCORE, TIMELINE, GRAPH, RANKING. `spectator.js` holds the page controller (render, tabs, storage sync) and the public `window.VolleySpectator` API |
| `js/spectator-*.js` | Spectator modules, loaded in this order before `spectator.js` and sharing the private `window.VolleySpectatorParts` namespace: `spectator-core.js` (storage keys, shared `state`, helpers, v1/v2 view-model builders), `spectator-live-score.js` (scoreboard and momentum), `spectator-ranking.js`, `spectator-timeline.js` (timeline rows and window preferences), `spectator-graph.js` (score and fault evolution charts) |
| `statistics/adapter.js` | Shared normalisation/validation boundary (`window.VolleyStatsAdapter`: `validate`, `fromLocalStorage`, `toCoachData`) |
| `statistics/data/` | Reference fixtures (unified v2.1) used by viewers and tests |
| `sw.js` | Versioned offline app-shell cache (`volley-live-capture-v<VERSION>`) |
| `manifest.webmanifest`, `icons/` | PWA metadata and Home-screen assets |
| `tests/` | pytest + Playwright acceptance suite; approved release gate: `tests/run_v1_28_approved.sh` (run by `.github/workflows/tests.yml`) |
| `tests/unit/` | `node:test` unit tests of the pure modules (rotation and libero rules, set and match rules, adapter, engine/adapter consistency); `npm run test:unit`, run by CI. `load-browser-scripts.js` loads the classic browser scripts in an isolated `vm` context |
| `tools/` | `bump_version.py` (release version) and `generate_manifest.py` (source manifest) |
| `package.json`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore` | Development tooling only (the app has no build step): `npm run lint` (ESLint), `npm run format` / `npm run format:check` (Prettier, JavaScript only; HTML and CSS stay hand-formatted because tests assert exact markup and minified CSS). CI runs both |

## Interfaces and their specifications

| Interface | Specification |
|---|---|
| Home, SETUP & CAPTURE, INSIGHTS & VIEWING, Settings | `VolleyLive_Navigation_Home_Specification.md` |
| Match Capture hub | `VolleyLive_Match_Hub_Implementation_Specification.md` |
| New Match wizard, capture rules, scoring | `FUNCTIONAL_SPEC.md`, `IMPLEMENTATION_SPEC.md` |
| Live capture runtime modes (FOCUS / SPEED+ / FLOW) | `specification_saisie_action.md` |
| Team Management | `VolleyLive_Team_Management_Specification.md` |
| Match Library and Match Reports | `VolleyLive_Match_Library_Specification.md` |
| Coach View | `VolleyLive_Coach_View_Specification.md` |
| Spectator — LIVE SCORE / momentum | `VolleyLive_Live_Header_Momentum_Spec.md` |
| Spectator — TIMELINE | `VolleyLive_Spectator_Timeline_Specification.md` |
| Spectator — GRAPH | `VolleyLive_Score_Fault_Evolution_View_Specification_v1.0.md` |
| Spectator — RANKING | `VolleyLive_Spectator_Ranking_Specification.md` |
| Statistics metrics and UI principles | `VolleyLive_Statistics_Implementation_Specification.md`, `Volley_Live_Live_Statistics_UI_Specification_v1.1.md` |
| Match JSON data interface | `VolleyLive_Unified_JSON_Format_Specification.md`, `volley-live.match.schema.v2.1.json` |
| iOS installation | `IOS_IMPLEMENTATION_SPEC.md`, `INSTALL_IPHONE.md` |

Historical release notes, implementation reports, manifests and test results are kept in `docs/archive/`; superseded specifications are in `docs/archive/superseded-specs/`.

## Storage

| Key | Owner | Content |
|---|---|---|
| `volleyCapture.match.v1`, `volleyCapture.events.v1`, `volleyCapture.chartData.v1`, `volleyCapture.stage` | capture | The single editable official match |
| `volleyCapture.library.v1` | Team Management / New Match | Reusable teams |
| `volleyCapture.settings.v1` | Settings | Match format |
| `volleyCapture.runtimeInput.preferences.v1` | runtime input | Last runtime mode and preferences |
| `volleyMatchHub.history.v1` | Match Library | Finished and imported matches (max 100) |
| `vl.library.filter`, `vl.library.selectedId` | Match Library | Persisted filter and selected match |
| `volleyAnalysis.replay.v1` (session) | Match Library → Coach | Selected read-only document |
| `volleySpectator.archive.v1` | Match Library → Spectator | Selected read-only document |

## Write / read separation

Only NEW MATCH / CONTINUE CAPTURE write to `volleyCapture.match/events/chartData`. Match Library, Coach View, Spectator View and Match Reports read a selected document and never modify the active match.

## Event-derived state

Score, set/match winner, service, rotation, charts and reports are rebuilt from accepted events. The pre-rally rotation is snapshotted onto each event. v1.28 adds canonical runtime fields without breaking the historical event schema; the portable capture file stays at format version 1 and unified documents use schema 2.1.

## Capture screen contract (`window.VolleyCapture`)

The capture scripts share one documented object instead of ad-hoc globals. It is created by `js/index-capture-engine.js`:

| Member | Set by | Used by |
|---|---|---|
| `match` | `index-capture-engine.js` (active match from storage, or `null`) | charts, `index-capture-tools.js`, `runtime-input.js` |
| `updateScoreService(side)` | `index-capture-engine.js` | `runtime-input.js` |
| `commit(player, action, result)`, `logSubstitution(event)`, `deleteLastAction()`, `buildReport()`, `deletesBlocked` | `index-capture-tools.js` | `runtime-input.js`, tests |
| `refreshCourt(events)`, `runtimeContext` | `runtime-input.js` | `index-capture-tools.js` |

`window.VolleyShell.saveMatchJson()` (from `index-navigation-new-match.js`) saves the active match as JSON; the Match Hub uses it.

## Rotation and libero rules

Single implementation in `js/index-rotation.js` (`VolleyRotation`), used by the capture screen and the Coach View; `statistics/adapter.js` applies the same rules for the Spectator matrix (it must also run standalone in Node).

- Rotation: clockwise P2 → P1 → P6 → P5 → P4 → P3, only on a side-out (our team wins a rally the opponent served).
- Libero / middle-blocker permutation, FIVB Official Volleyball Rules 2025-2028, Rule 19:
  - the Libero replaces a back-row player (19.3.1.1): here the middle blocker, the usual tactical choice;
  - back row only (19.3.1.2): P6 or P5, or P1 while our team receives, because the Libero cannot serve (19.3.1.3);
  - one Libero on court (19.1.3);
  - at least one completed rally between two Libero replacements, none during a rally (19.3.2.1, 19.3.2.4);
  - the Libero can only be replaced by the regular player it replaced (19.3.2.2).
- `trace()` applies the Libero rules rally after rally (`liberoFor`, the player the Libero replaces). Without that history (a theoretical rotation in the Coach View Rotations tab, or the explicit v2 context), the first middle blocker in an allowed zone is replaced.
- Middle blockers come from the starting line-up (`mb1`, `mb2`) and follow substitutions. When the line-up does not name them (v2 documents), they are the roster players with position MB.
- Not modelled: the second Libero and Libero re-designation (19.1.1, 19.4). The data has one Libero per match.
- Enforced by `tests/unit/rotation.test.js`, `tests/unit/libero-fivb.test.js` (property test over simulated sets, every starting rotation, middle blockers opposite or adjacent) and `tests/unit/court-consistency.test.js` (engine and adapter agree at every event).

## Substitution rules

`js/index-substitution-rules.js` (`VolleySubstitutions`, pure) checks every substitution against the FIVB Official Volleyball Rules 2025-2028, Rule 15. The capture screen opens it from the « ⇄ Remplacement » button of `runtime-input.js`:

- at most six regular substitutions per set (15.1);
- the Libero is never part of a substitution (15.5.1);
- a starting player leaves once per set and comes back once, only in place of his/her substitute (15.6.1);
- a substitute enters once per set and is only replaced by the starting player he/she replaced (15.6.2);
- an exceptional substitution (injury, illness) is offered only when no regular one is possible. It is recorded with `exceptional: true` and does not count in the six. The replaced player cannot come back in the match (15.7);
- only registered, present players (15.9.1); no substitution during a rally (15.11.1.1).

A substitution is stored as a `match.subs` entry (`set`, `at` = number of events of the set before it, `out`, `in`, `eventId`) and a `SUBSTITUTION` event, through `VLCLogSubstitution`. Undo removes both. Starting players are `match.startingRotation` (the app uses one starting line-up for every set). Enforced by `tests/unit/substitution-rules.test.js` and `tests/test_substitutions.py`.

## Dependency chain

Team → Starting 7 → Rotation. Loaded downstream objects are validated against their upstream dependency; missing numbers are reported and never silently substituted.

## Icon pipeline

The supplied 1254 × 1254 artwork (`icons/IMG_5596.PNG`) is converted to an opaque RGB master; the pre-rendered rounded-corner region is cropped before Lanczos regeneration of the 180, 32, 192 and 512 px outputs.
