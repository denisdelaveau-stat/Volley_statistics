# VolleyLive v1.28.0 — Architecture

## Components

| File | Role |
|---|---|
| `index.html` | Application shell markup: Home, workspace navigation, New Match wizard, live capture, Match Hub and Match Library markup, Coach View container. Loads the modules below. Exposes shared shell helpers as `window.VolleyShell` |
| `css/index-*.css` | Shell styling extracted from `index.html`: theme, capture layout, focus mode, result grammar |
| `js/index-*.js` | Capture engine extracted from `index.html`, loaded in this order: `index-match-rules.js` (pure set and match rules and attacker statistics: `window.VolleySets`, `window.VolleyStats`), `index-rotation.js` (pure rotation, libero and substitution replay: `window.VolleyRotation`), `index-capture-engine.js` (live court rendering, focus, substitution mode; loads the active match as `window.VOLLEY_MATCH`), `index-report.js` (match report builder: `window.VolleyReport`), `index-capture-tools.js` (score progression and lead charts, SVG drawing), `index-navigation-new-match.js` (shared shell helpers and the New Match wizard), `index-pwa.js` (offline cache and install hint), `index-normative-capture.js` (Advanced position-aware action grid and guarded commit) |
| `team-management.js` / `team-management.css` | Team Management controller (`window.VolleyTeams`) and styling |
| `settings.js` | Settings controller |
| `runtime-input.js` / `runtime-input.css` | Shared runtime input controller for FOCUS, SPEED+ and FLOW (mode switching during capture, preferences, atomic Undo, double-tap guard) |
| `match-hub.js` / `match-hub.css` | Match Capture hub (new/continue/conflict dialogs) and shared Match Library (selection, JSON import, reports, view routing). Exposes `window.VolleyMatchHub` / `window.VolleyMatchLibrary` |
| `coach.js` / `coach.css` / `coach-live-config.js` | Read-only Coach View (`window.VolleyCoach`) and its configurable status thresholds |
| `spectator.html` / `spectator.js` / `spectator.css` / `spectator-live-config.js` | Read-only Spectator View: LIVE SCORE, TIMELINE, GRAPH, RANKING |
| `statistics/adapter.js` | Shared normalisation/validation boundary (`window.VolleyStatsAdapter`: `validate`, `fromLocalStorage`, `toCoachData`) |
| `statistics/data/` | Reference fixtures (unified v2.1) used by viewers and tests |
| `sw.js` | Versioned offline app-shell cache (`volley-live-capture-v<VERSION>`) |
| `manifest.webmanifest`, `icons/` | PWA metadata and Home-screen assets |
| `tests/` | pytest + Playwright acceptance suite; approved release gate: `tests/run_v1_28_approved.sh` (run by `.github/workflows/tests.yml`) |
| `tools/` | `bump_version.py` (release version) and `generate_manifest.py` (source manifest) |

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

## Dependency chain

Team → Starting 7 → Rotation. Loaded downstream objects are validated against their upstream dependency; missing numbers are reported and never silently substituted.

## Icon pipeline

The supplied 1254 × 1254 artwork (`icons/IMG_5596.PNG`) is converted to an opaque RGB master; the pre-rendered rounded-corner region is cropped before Lanczos regeneration of the 180, 32, 192 and 512 px outputs.
