# UI-COACH — Coach View: shell, data source and overview

| Field | Value |
|---|---|
| Spec ID | `UI-COACH` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-28 |
| Source of truth | `coach.js` (`window.VolleyCoach`), `js/coach-core.js` (data loading, rally model, shared cards, empty states), `js/coach-overview.js`, `coach.css`, `index.html` (`#coachScreen`) |
| Related specs | UI-COACH-ROTATIONS, UI-COACH-PLAYERS, UI-COACH-LIVE, UI-LIBRARY (entry), DOM-STATS (indicators), SYS-JSON (data), SYS-ARCH-07 (read only) |

## 1. Purpose

The Coach View is a read-only analysis of the selected match for the coach: live court, team and rotation analysis,
player performance. This spec covers its shell, its data source and the overview tab « Vue coach ».

## 2. Scope

- In scope: entry and exit, tabs, header, data source and provenance banner, period selector, overview content,
  empty state.
- Out of scope: the other tabs (UI-COACH-ROTATIONS, UI-COACH-PLAYERS, UI-COACH-LIVE); indicator formulas (DOM-STATS).

## 3. Definitions

- Source: the replay document chosen in the Match Library or loaded with « Charger JSON », or the live match.
- Period: the rallies analysed: current set, whole match or the last 10 rallies (DOM-STATS-08).

## 4. Requirements

### 4.1 Shell

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-COACH-01` | The Coach View opens from the Match Library (« Vue coach », double-click or Enter on a row); « ← ACCUEIL » closes it and returns to the screen that opened it (Match Library by default), focus on its entry control. | UI-LIBRARY-09 |
| `UI-COACH-02` | Tabs: « Vue coach » (overview), « LIVE COURT », « Équipe » (rotations), « Joueurs » and « PLAYER FOCUS », the last one visible only while a player is focused; LIVE COURT and PLAYER FOCUS are full-screen views. | Product |
| `UI-COACH-03` | The header shows the source: « AUCUN MATCH », « REPLAY · MATCH », « V2.1 · MATCH » or « LIVE · MATCH ». | Product |
| `UI-COACH-04` | Nothing in the Coach View writes the active match. | SYS-ARCH-07 |

### 4.2 Data source

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-COACH-05` | The source is chosen in this order: empty after « Décharger »; the replay document of the session; the live match (`VolleyStatsAdapter.fromLocalStorage`); otherwise the raw capture keys, with phase, rotation and line-up rebuilt and a warning. Every document goes through `VolleyStatsAdapter.toCoachData`; « Charger JSON » validates the file first. | SYS-JSON |
| `UI-COACH-06` | The banner « Origine des données » says « Replay JSON chargé. », « Match JSON chargé. » or « Match live chargé. », shows the data warnings, and offers « Charger JSON », « Match live » (when a replay hides an available live match) and « Décharger ». | Transparency |
| `UI-COACH-07` | Changing the source resets the period, phase filter, rotation, scope, role, player and skill. | Product |
| `UI-COACH-08` | Values that rest on inferred context (phase, rotation, line-up) are marked as not backed by the document (`data-json-backed="false"`) and are never presented as measured. | SYS-JSON-16 |

### 4.3 Overview « Vue coach »

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-COACH-09` | The overview shows « Vue coach » and « Détecter la dynamique du match », the period buttons (« SET n », « MATCH », « 10 DERNIERS ») and a period list. | Product |
| `UI-COACH-10` | The score card shows both teams and the current score, « SET n · SETS a–b », and who serves (« NOTRE SERVICE » / « SERVICE ADVERSE »). | DOM-MATCH |
| `UI-COACH-11` | Six indicator cards: Side-out, Break point, Efficacité attaque, Réception +, Service, Bloc, each with its value, sample (« n/d réceptions », « Échantillon limité »…) and status colour (DOM-STATS-01 to -07). | DOM-STATS |
| `UI-COACH-12` | « Organisation actuelle » shows the current court (libero included) with « Passeuse en Pn ». | DOM-ROTATION-06 |
| `UI-COACH-13` | Two insights: « À surveiller » (the rotation with the worst won − lost differential, « n/d rallyes gagnés ») and « Point fort » (the best of attack efficiency, positive reception or team momentum). | DOM-STATS |
| `UI-COACH-14` | « Dynamique · 10 derniers points » shows the last 10 rallies (N for us, A for the opponent) and the count for each team; buttons « Analyser les rotations » and « Voir les joueurs » open those tabs. | Product |
| `UI-COACH-15` | Without any match, every tab shows its empty variant (0 or NA, « Aucun match chargé », « Chargez un match live issu de Capture ou un fichier JSON pour afficher les statistiques. », « MATCH LIVE », « CHARGER JSON »); no demonstration data is ever loaded. | Product |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| Invalid file in « Charger JSON » | « Fichier invalide : reason ». |
| Small sample | Status neutral, « Échantillon limité » (DOM-STATS-07). |

## 6. Data

Reads the session replay keys and the live match (SYS-DATA); writes only `volleyAnalysis.*` session keys (replay,
source name, unloaded flag).

## 7. Interface

`#coachScreen` (`data-return-screen`): `#coachHome`, `#coachLiveLabel`, tabs `[data-coach-tab]`, content
`#coachContent`; banner actions `[data-coach-load-file]`, `[data-coach-live]`, `[data-coach-unload]`; period
`[data-period]`; overview links `[data-coach-go]`. Public API `window.VolleyCoach` (`open`, `close`, `render`,
`buildRallies`, `metrics`).

## 8. Accessibility and language

`role="tablist"` / `role="tab"` with `aria-selected`; the view title receives the focus after each render; touch
targets at least 44 px. Texts: `coach.*` keys.

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `UI-COACH-01`, `-02` | `tests/coach/test_coach_views.py::test_coach_navigation_live_data_and_player_detail`; `tests/library/test_match_library.py::test_selected_match_actions_keep_coach_spectator_and_reports_routes` |
| `UI-COACH-03`, `-05` to `-07`, `-15` | `tests/coach/test_empty_state.py::test_coach_empty_file_replay_and_unload`, `::test_no_automatic_reference_fixture_loading_and_no_advanced_route`; `tests/coach/test_coach_views.py::test_coach_empty_state_and_accessible_detail` |
| `UI-COACH-04` | `tests/library/test_match_library.py::test_selected_match_actions_keep_coach_spectator_and_reports_routes` |
| `UI-COACH-08` | Manual: open a Capture v1 match; the banner shows the reconstruction warning |
| `UI-COACH-09` to `-14` | `tests/coach/test_coach_views.py::test_coach_navigation_live_data_and_player_detail`, `::test_coach_courts_use_shared_saturated_role_palette`; `tests/coach/test_empty_state.py::test_coach_court_is_compact_without_legend_at_phone_and_tablet` |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-28 | First version; replaces `docs/VolleyLive_Coach_View_Specification.md` (shell, data) and the overview part of `docs/Volley_Live_Live_Statistics_UI_Specification_v1.1.md`. |
