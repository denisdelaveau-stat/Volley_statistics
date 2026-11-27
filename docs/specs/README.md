# VolleyLive specifications

This folder holds the specifications of VolleyLive as built (v1.28.0 and later): one specification per interface,
feature or system concern, all written on the same template, each requirement numbered and traced to the tests that
verify it.

Requirements not implemented yet are in `TO_DO/`, not here. Earlier documents are kept in `docs/archive/`.

## 1. Conventions

| Topic | Rule |
|---|---|
| Template | [`_TEMPLATE.md`](_TEMPLATE.md): every spec has the same sections, in the same order. |
| Atomicity | One spec per screen, sheet, domain rule set or system concern. A behaviour is specified in one place only; other specs link to it. |
| As built | A spec describes what the code does today. A change of behaviour updates the spec in the same commit. |
| Spec ID | `SYS-…` (system), `DOM-…` (domain rules), `UI-…` (interface). The file name is the ID: `SYS-DATA.md`. |
| Requirement ID | `<SPEC-ID>-<nn>`, for example `DOM-SUBS-04`. IDs are never reused or renumbered; a removed requirement is marked "Retired". |
| Wording | Present tense, one testable behaviour per requirement ("The capture refuses …"). Rules cite their source (FIVB Official Volleyball Rules 2025-2028, product decision). |
| Traceability | Section 9 of each spec maps every requirement to an automated test (`tests/…`) or to a manual check with its procedure. |
| Language | Specifications are written in English. Interface texts are quoted in French (the default language), with the translation key when useful. |
| Versioning | A spec has its own version (1.0, 1.1 …) and a history table. "Applies to" gives the app version. |
| Status | Draft (being written), Current (matches the code), Superseded (kept for history, moved to `docs/archive/`). |
| Code headers | A module that implements a spec names it in its header comment: `Spec: docs/specs/UI-TEAMS.md`. |

## 2. Catalogue

### 2.1 System

| ID | Title | Status |
|---|---|---|
| [SYS-ARCH](SYS-ARCH.md) | Architecture: modules, load order, shared contracts | Current |
| [SYS-DATA](SYS-DATA.md) | Local data model and storage | Current |
| [SYS-JSON](SYS-JSON.md) | Match document: unified JSON v2.1 and Capture v1 migration | Current |
| [SYS-I18N](SYS-I18N.md) | Interface language (French / English) | Current |
| [SYS-PWA](SYS-PWA.md) | Offline application, installation and updates | Current |
| [SYS-SEC](SYS-SEC.md) | Security and data integrity | Current |
| [SYS-QA](SYS-QA.md) | Quality: tests, gate and continuous integration | Current |
| [SYS-DESIGN](SYS-DESIGN.md) | Visual design system | Current |

### 2.2 Domain rules

| ID | Title | Status |
|---|---|---|
| [DOM-MATCH](DOM-MATCH.md) | Sets, scoring and end of match | Current |
| [DOM-LINEUP](DOM-LINEUP.md) | Starting line-up per set | Current |
| [DOM-ROTATION](DOM-ROTATION.md) | Rotation and service | Current |
| [DOM-LIBERO](DOM-LIBERO.md) | Liberos: replacement, second libero, re-designation | Current |
| [DOM-SUBS](DOM-SUBS.md) | Substitutions | Current |
| [DOM-STATS](DOM-STATS.md) | Statistics and indicators | Current |

### 2.3 Interfaces

| ID | Title | Status |
|---|---|---|
| [UI-HOME](UI-HOME.md) | Home, navigation and Settings | Planned |
| [UI-WIZARD](UI-WIZARD.md) | New Match wizard | Planned |
| [UI-TEAMS](UI-TEAMS.md) | Team Management | Planned |
| [UI-CAPTURE](UI-CAPTURE.md) | Capture screen: score, input modes, history, end of set | Planned |
| [UI-SUBS](UI-SUBS.md) | Substitution and libero sheet | Planned |
| [UI-SETLINEUP](UI-SETLINEUP.md) | Set line-up sheet | Planned |
| [UI-HUB](UI-HUB.md) | Match Hub (Match Capture) | Planned |
| [UI-LIBRARY](UI-LIBRARY.md) | Match Library | Planned |
| [UI-REPORTS](UI-REPORTS.md) | Match reports and exports | Planned |
| [UI-COACH](UI-COACH.md) | Coach View: shell, data source and overview | Planned |
| [UI-COACH-ROTATIONS](UI-COACH-ROTATIONS.md) | Coach View: rotations | Planned |
| [UI-COACH-PLAYERS](UI-COACH-PLAYERS.md) | Coach View: players and player detail | Planned |
| [UI-COACH-LIVE](UI-COACH-LIVE.md) | Coach View: LIVE COURT and PLAYER FOCUS | Planned |
| [UI-SPECTATOR](UI-SPECTATOR.md) | Spectator View: shell, navigation and set selection | Planned |
| [UI-SPECTATOR-SCORE](UI-SPECTATOR-SCORE.md) | Spectator View: live score and momentum | Planned |
| [UI-SPECTATOR-TIMELINE](UI-SPECTATOR-TIMELINE.md) | Spectator View: timeline | Planned |
| [UI-SPECTATOR-GRAPH](UI-SPECTATOR-GRAPH.md) | Spectator View: score and fault evolution | Planned |
| [UI-SPECTATOR-RANKING](UI-SPECTATOR-RANKING.md) | Spectator View: ranking | Planned |

## 3. Glossary

| Term | Meaning |
|---|---|
| Rally | One exchange, from the serve to the point. Its last event names the winning team. |
| Side-out (SO) | A rally won by the receiving team; our team then rotates and serves. |
| Break point (BP) | A rally won by the serving team. |
| Zone P1…P6 | Court positions: P1 right back (server), P2 right front, P3 middle front, P4 left front, P5 left back, P6 middle back. |
| Line-up | The six starting players and their rotation order, handed in before each set (FIVB 7.3.2). |
| Acting libero | The libero who may currently play; a team designates up to two liberos (FIVB 19.1.1). |
| Libero replacement | The libero coming in for, or going out for, a back-row player; not a substitution (FIVB 19.3.2). |
| Capture v1 | The local match format written by the capture screen (`volleyCapture.*` keys), see `SYS-DATA`. |
| Unified JSON v2.1 | The official match document read by the Coach and Spectator views, see `SYS-JSON`. |
| HOME / AWAY | Labels of our team and the opponent in the Spectator View. |

## 4. Documents replaced by this folder

| Former document | Replaced by |
|---|---|
| `docs/ARCHITECTURE.md` | SYS-ARCH, SYS-DATA, DOM-ROTATION, DOM-LIBERO, DOM-SUBS, DOM-LINEUP |
| `docs/FUNCTIONAL_SPEC.md`, `docs/IMPLEMENTATION_SPEC.md` | DOM-MATCH, UI-WIZARD, UI-CAPTURE |
| `docs/specification_saisie_action.md` | UI-CAPTURE |
| `docs/VolleyLive_Navigation_Home_Specification.md` | UI-HOME |
| `docs/VolleyLive_Team_Management_Specification.md` | UI-TEAMS |
| `docs/VolleyLive_Match_Hub_Implementation_Specification.md`, `docs/MATCH_HUB_v1.21.0.md` | UI-HUB |
| `docs/VolleyLive_Match_Library_Specification.md` | UI-LIBRARY, UI-REPORTS |
| `docs/VolleyLive_Coach_View_Specification.md`, `docs/Volley_Live_Live_Statistics_UI_Specification_v1.1.md` | UI-COACH, UI-COACH-ROTATIONS, UI-COACH-PLAYERS, UI-COACH-LIVE |
| `docs/VolleyLive_Live_Header_Momentum_Spec.md`, `docs/LIVE_HEADER_MOMENTUM_v1.19.0.md`, `docs/LIVE_SCORE_MOMENTUM_PLACEMENT_v1.19.1.md` | UI-SPECTATOR-SCORE |
| `docs/VolleyLive_Spectator_Timeline_Specification.md` | UI-SPECTATOR-TIMELINE |
| `docs/VolleyLive_Score_Fault_Evolution_View_Specification_v1.0.md`, `docs/SCORE_FAULT_EVOLUTION_VIEW_v1.18.0.md`, `docs/LIVE_GRAPH_UPDATE_v1.17.0.md` | UI-SPECTATOR-GRAPH |
| `docs/VolleyLive_Spectator_Ranking_Specification.md`, `docs/ADVANCED_STATISTICS_RANKING_v1.20.0.md` | UI-SPECTATOR-RANKING |
| `docs/VolleyLive_Statistics_Implementation_Specification.md` | DOM-STATS |
| `docs/VolleyLive_Unified_JSON_Format_Specification.md` | SYS-JSON (the JSON Schema `volley-live.match.schema.v2.1.json` stays the normative schema) |
| `docs/IOS_IMPLEMENTATION_SPEC.md`, `docs/INSTALL_IPHONE.md` | SYS-PWA |
| `docs/ROLE_PALETTE_CONTRAST_v1.15.0.md` | SYS-DESIGN |
| `tests/TEST_PLAN.md` | SYS-QA and section 9 of each spec |

A former document moves to `docs/archive/superseded-specs/` in the same commit as the spec that replaces it.
