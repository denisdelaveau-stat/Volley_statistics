# VolleyLive v1.28.0 — Architecture

## Components

| File | Role |
|---|---|
| `index.html` | Application shell markup: Home, workspace navigation, New Match wizard, live capture, Match Hub and Match Library markup, Coach View container. Loads the modules below. Exposes shared shell helpers as `window.VolleyShell` |
| `js/shared-dom.js` | Shared DOM helpers loaded first by `index.html` and `spectator.html`: `window.VolleyDom.esc()`. Rule: every non-constant value inserted with `innerHTML` / `insertAdjacentHTML` goes through `esc()` (or use `textContent`). Enforced by `tests/shared/test_html_escaping.py` |
| `js/shared-domain.js` | Shared domain constants loaded right after `shared-dom.js`: `window.VolleyDomain.STORAGE` (every localStorage / sessionStorage key), `ROLE_CODES` / `ROLE_NAMES` (capture role labels) `court` (`POS`, `NEXT`, `LIBERO_ZONES`, `rotate()`, `zoneOf()`) and `lineup` (`ROTATION_ROLES`, `rotationFromRoles()`, `forSet()`: the starting line-up of a set, see `docs/specs/DOM-LINEUP.md`). Frozen objects. `readStored(key, fallback)` reads stored JSON and reports unreadable values in the console. Rule: never write a storage key or one of these role maps as a literal elsewhere. `statistics/adapter.js` keeps its own copies because it also runs standalone in Node |
| `js/i18n/fr.js`, `js/i18n/en.js`, `js/shared-i18n.js` | Translations (`window.VolleyI18n`). French is the default language; English is chosen in Settings (stored under `VolleyDomain.STORAGE.language`, page reloaded). Code uses `VolleyI18n.t('key', params)`; static HTML uses `data-i18n="key"` (text) and `data-i18n-attr="aria-label:key"`, translated by `VolleyI18n.apply()`, which each page calls once its markup is parsed and before its app scripts render. `statistics/adapter.js` returns the key instead of the text outside the browser (Node unit tests). `tests/unit/i18n.test.js` checks that both dictionaries have the same keys and placeholders, that every key used in the code exists and that no key is orphaned |
| `css/index-*.css` | Shell styling extracted from `index.html`: theme, capture layout, focus mode, result grammar |
| `js/index-*.js` | Capture engine extracted from `index.html`, loaded in this order: `index-match-rules.js` (pure set and match rules and attacker statistics: `window.VolleySets`, `window.VolleyStats`), `index-rotation.js` (pure rotation, libero and substitution replay: `window.VolleyRotation`; the single source of the rotation rules, also used by the Coach View through `trace()` and `replay()`), `index-capture-engine.js` (capture bootstrap: loads the active match as `window.VOLLEY_MATCH`, capture title, serving team on the score board via `window.updateScoreService`), `index-report.js` (match report builder: `window.VolleyReport`), `index-capture-tools.js` (capture screen controller: history panel, action commit, persistence, history, sets, undo; it also keeps the chart data `volleyCapture.chartData.v1`, one point per scoring rally of the current set, saved with the match and read by the Match Hub and `statistics/adapter.js`; no chart is drawn on the capture screen, statistics are in the Coach and Spectator views), `index-navigation-new-match.js` (shared shell helpers and the New Match wizard), `index-pwa.js` (offline cache and install hint) |
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
| `tests/` | pytest + Playwright acceptance suite, one folder per screen: `capture/`, `setup/` (New Match wizard), `teams/`, `home/`, `library/` (Match Hub and Match Library), `coach/`, `spectator/`, `shared/` (escaping, translation, JSON contract, theme, icons). Shared test code is in `support/` (`helpers.py`, `capture_support.py`, `spectator_support.py`), never imported from another test file. `conftest.py` gives each module the interface language of its assertions (`UI_LANGUAGE`). Approved release gate: `tests/run_gate.sh` (the whole folder; run by `.github/workflows/tests.yml`) |
| `tests/unit/` | `node:test` unit tests of the pure modules (rotation and libero rules, set and match rules, adapter, engine/adapter consistency); `npm run test:unit`, run by CI. `load-browser-scripts.js` loads the classic browser scripts in an isolated `vm` context |
| `tools/` | `bump_version.py` (release version) and `generate_manifest.py` (source manifest) |
| `package.json`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore` | Development tooling only (the app has no build step): `npm run lint` (ESLint), `npm run format` / `npm run format:check` (Prettier, JavaScript and CSS; HTML stays hand-formatted because tests assert exact markup; CSS assertions go through `compact_css()` in `tests/support/helpers.py`, so they do not depend on formatting). CI runs both |

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

## Domain rules

The volleyball rules are specified in `docs/specs/` (one specification per rule set, numbered requirements traced to
the tests): DOM-MATCH (sets, scoring, end of match), DOM-LINEUP (starting line-up per set), DOM-ROTATION (rotation and
service), DOM-LIBERO (liberos), DOM-SUBS (substitutions), DOM-STATS (indicators). Index and conventions:
`docs/specs/README.md`.

## Dependency chain

Team → Starting 7 → Rotation. Loaded downstream objects are validated against their upstream dependency; missing numbers are reported and never silently substituted.

## Icon pipeline

The supplied 1254 × 1254 artwork (`icons/IMG_5596.PNG`) is converted to an opaque RGB master; the pre-rendered rounded-corner region is cropped before Lanczos regeneration of the 180, 32, 192 and 512 px outputs.
