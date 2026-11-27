# SYS-ARCH — Architecture: modules, load order, shared contracts

| Field | Value |
|---|---|
| Spec ID | `SYS-ARCH` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-27 |
| Source of truth | `index.html`, `spectator.html`, `js/`, `statistics/adapter.js`, `eslint.config.js` (global namespaces) |
| Related specs | SYS-DATA (storage), SYS-JSON (match document), SYS-I18N, SYS-PWA, SYS-SEC, SYS-QA, every DOM-* and UI-* spec |

## 1. Purpose

Describes how VolleyLive is built: the pages, the modules and their load order, the shared contracts between modules
and the rules every module follows. A developer reads this first.

## 2. Scope

- In scope: pages, module map, load order, global and private namespaces, data flow principles.
- Out of scope: storage formats (SYS-DATA, SYS-JSON), offline cache (SYS-PWA), test organisation (SYS-QA), the
  behaviour of each screen (UI-*) and rule set (DOM-*).

## 3. Definitions

- Page: an HTML entry point. Module: a classic script (no ES modules, no bundler) that defines one namespace on
  `window`.
- Active match: the single editable match of the capture (SYS-DATA). Selected document: a read-only match opened from
  the Match Library.

## 4. Requirements

### 4.1 Structure

| ID | Requirement | Rule / source |
|---|---|---|
| `SYS-ARCH-01` | The application is static files (HTML, CSS, classic JavaScript) with no build step and no runtime dependency; it runs from a web server or from `file://`. Node.js is only used by the development tooling. | Product decision |
| `SYS-ARCH-02` | It has two pages: `index.html` (Home, navigation, Team Management, New Match wizard, capture, Match Hub, Match Library, reports, Coach View) and `spectator.html` (Spectator View). | Product decision |
| `SYS-ARCH-03` | Each page loads its scripts in a fixed order (section 7.1); a module only uses at load time the namespaces of the modules loaded before it. A call to a module loaded later goes through a deferred wrapper. | Classic scripts |
| `SYS-ARCH-04` | Every global namespace is declared in `eslint.config.js`; ESLint (`no-undef`, zero warnings) rejects any other global. | Maintainability |
| `SYS-ARCH-05` | The Coach View and Spectator View modules share one private namespace each (`window.VolleyCoachParts`, `window.VolleySpectatorParts`) and expose one public API (`window.VolleyCoach`, `window.VolleySpectator`). | Maintainability |
| `SYS-ARCH-06` | The capture modules communicate through one documented object, `window.VolleyCapture` (section 7.3), not through ad-hoc globals. | Maintainability |

### 4.2 Data flow

| ID | Requirement | Rule / source |
|---|---|---|
| `SYS-ARCH-07` | Only the New Match wizard and the capture write the active match; the Match Library, Coach View, Spectator View and reports read a document and never modify the active match. | Write / read separation |
| `SYS-ARCH-08` | Score, sets, service, rotation, libero, statistics and reports are rebuilt from the recorded events; no derived value is the source of another. The chart data (`volleyCapture.chartData.v1`) and the per-event snapshots (rotation, scores) are caches written with the events. | Event sourcing |
| `SYS-ARCH-09` | The volleyball rules live in pure modules without DOM access (`VolleySets`, `VolleyRotation`, `VolleySubstitutions`, `VolleyDomain.lineup`), shared by every screen and unit-tested in Node. | Single source of truth |
| `SYS-ARCH-10` | `statistics/adapter.js` is the boundary for match documents (validation, Capture v1 migration, Coach and Spectator data); it also runs in Node, so it keeps its own copy of the rotation and line-up rules, kept identical by a consistency test. | SYS-JSON, DOM-ROTATION-08 |
| `SYS-ARCH-11` | Storage keys and role maps are only defined in `js/shared-domain.js` (`VolleyDomain`); no module writes a key as a literal (except `statistics/adapter.js`, see `SYS-ARCH-10`). | SYS-DATA |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| A module throws while loading | The page reports the error in the console; the tests fail on any page error (SYS-QA). |
| Spectator opened without a selected document | Empty state (UI-SPECTATOR). |
| Coach View opened without a match | Empty state (UI-COACH). |

## 6. Data

See SYS-DATA (browser storage) and SYS-JSON (match document). The pages exchange data only through storage: the
Match Library writes the selected document for the Coach View (`sessionStorage`) or the Spectator View
(`localStorage`).

## 7. Interface

### 7.1 Load order

`index.html`: `js/shared-dom.js`, `js/shared-domain.js`, `js/i18n/fr.js`, `js/i18n/en.js`, `js/shared-i18n.js`,
`statistics/adapter.js` (head); then, after the markup and `VolleyI18n.apply()`: `js/index-match-rules.js`,
`js/index-rotation.js`, `js/index-substitution-rules.js`, `js/index-capture-engine.js`, `js/index-report.js`,
`js/index-set-lineup.js`, `js/index-capture-tools.js`, `js/index-navigation-new-match.js`, `team-management.js`,
`settings.js`, `js/index-pwa.js`, `coach-live-config.js`, `js/coach-core.js`, `js/coach-rotations.js`,
`js/coach-overview.js`, `js/coach-players.js`, `js/coach-live.js`, `coach.js`, `match-hub.js`, `runtime-input.js`.

`spectator.html`: `js/shared-dom.js`, `js/shared-domain.js`, `js/i18n/fr.js`, `js/i18n/en.js`, `js/shared-i18n.js`,
`VolleyI18n.apply()`, `statistics/adapter.js`, `spectator-live-config.js`, `js/spectator-core.js`,
`js/spectator-live-score.js`, `js/spectator-ranking.js`, `js/spectator-timeline.js`, `js/spectator-graph.js`,
`spectator.js`.

### 7.2 Namespaces

| Namespace | Module | Role | Spec |
|---|---|---|---|
| `VolleyDom` | `js/shared-dom.js` | `esc()` for HTML | SYS-SEC |
| `VolleyDomain` | `js/shared-domain.js` | Storage keys, `readStored()`, role maps, `court`, `lineup` | SYS-DATA, DOM-ROTATION, DOM-LINEUP |
| `VolleyI18nMessages`, `VolleyI18n` | `js/i18n/*.js`, `js/shared-i18n.js` | Translations | SYS-I18N |
| `VolleyStatsAdapter` | `statistics/adapter.js` | Validation, migration, Coach / Spectator data | SYS-JSON |
| `VolleySets`, `VolleyStats` | `js/index-match-rules.js` | Set and match rules; report statistics | DOM-MATCH, DOM-STATS |
| `VolleyRotation` | `js/index-rotation.js` | Rotation and libero replay | DOM-ROTATION, DOM-LIBERO |
| `VolleySubstitutions` | `js/index-substitution-rules.js` | Substitution and libero change rules | DOM-SUBS, DOM-LIBERO |
| `VolleyCapture` | `js/index-capture-engine.js` | Capture contract (7.3) | UI-CAPTURE |
| `VolleyReport` | `js/index-report.js` | HTML report | UI-REPORTS |
| `VolleySetLineup` | `js/index-set-lineup.js` | Set line-up sheet | UI-SETLINEUP |
| `VolleyShell` | `js/index-navigation-new-match.js` | Screen navigation helpers, JSON file save | UI-HOME, UI-WIZARD |
| `VolleyTeams` | `team-management.js` | Team Management | UI-TEAMS |
| `VolleyCoachConfig`, `VolleyCoachParts`, `VolleyCoach` | `coach-live-config.js`, `js/coach-*.js`, `coach.js` | Coach View | UI-COACH* |
| `VolleyMatchHub`, `VolleyMatchLibrary` | `match-hub.js` | Match Hub, Match Library | UI-HUB, UI-LIBRARY |
| `VolleySpectatorConfig`, `VolleySpectatorParts`, `VolleySpectator` | `spectator-live-config.js`, `js/spectator-*.js`, `spectator.js` | Spectator View | UI-SPECTATOR* |

### 7.3 Capture contract (`window.VolleyCapture`)

| Member | Set by | Used by |
|---|---|---|
| `match` | `js/index-capture-engine.js` (active match, or `null`) | `js/index-capture-tools.js`, `runtime-input.js` |
| `updateScoreService(side)` | `js/index-capture-engine.js` | `runtime-input.js` |
| `commit(player, action, result)`, `logSubstitution(event)`, `deleteLastAction()`, `buildReport()`, `deletesBlocked` | `js/index-capture-tools.js` | `runtime-input.js`, tests |
| `refreshCourt(events)`, `runtimeContext` | `runtime-input.js` | `js/index-capture-tools.js` |

## 8. Accessibility and language

Every page loads the translation layer before its app scripts and calls `VolleyI18n.apply()` once its markup is
parsed (SYS-I18N). Accessibility rules are specified per screen (UI-*) and globally in SYS-DESIGN.

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `SYS-ARCH-01`, `-02` | Every browser test opens `index.html` or `spectator.html` from `file://` (for example `tests/home/test_home.py::test_home_workspace_navigation_and_back_paths`); `tests/capture/test_capture_regressions.py::test_pwa_cache_version_and_shell_assets` |
| `SYS-ARCH-03`, `-04` | CI steps « JavaScript syntax » and « ESLint (no warnings allowed) » (`.github/workflows/tests.yml`); browser tests fail on any page error |
| `SYS-ARCH-05`, `-06` | ESLint globals (`eslint.config.js`); `tests/capture/test_runtime_input.py::test_same_sequence_produces_same_canonical_event_across_modes` (contract used end to end) |
| `SYS-ARCH-07` | `tests/library/test_match_library.py::test_selected_match_actions_keep_coach_spectator_and_reports_routes`; `tests/library/test_match_hub_save.py::test_successful_save_archives_then_clears_the_current_match` |
| `SYS-ARCH-08` | `tests/capture/test_history_delete.py::test_delete_rolls_back_sideout_rotation`, `::test_deleted_state_persists_after_reload` |
| `SYS-ARCH-09` | `tests/unit/` (rules loaded in a Node `vm` context without DOM: `tests/unit/load-browser-scripts.js`) |
| `SYS-ARCH-10` | `tests/unit/court-consistency.test.js` « rotation engine and adapter give the same players on court at every event » |
| `SYS-ARCH-11` | `tests/unit/storage.test.js` « returns the stored value »; manual review (search for `'volleyCapture.` outside `js/shared-domain.js` and `statistics/adapter.js`) |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-27 | First version; replaces the module map and contracts of `docs/ARCHITECTURE.md` (now a pointer to this folder). |
