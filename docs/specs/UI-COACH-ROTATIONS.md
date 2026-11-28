# UI-COACH-ROTATIONS — Coach View: rotations

| Field | Value |
|---|---|
| Spec ID | `UI-COACH-ROTATIONS` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-28 |
| Source of truth | `js/coach-rotations.js` (`rotationMetrics`, `renderRotations`), `js/coach-core.js` (`rotationTo`, `courtHTML`) |
| Related specs | UI-COACH (shell, period), DOM-ROTATION, DOM-LINEUP, DOM-LIBERO-04, DOM-STATS |

## 1. Purpose

The « Équipe » tab compares the six rotations of our team: how each one does in side-out and break point, and which
one to watch.

## 2. Scope

- In scope: filters, rotation tabs, court of a rotation, rotation indicators, comparison chart, best and weakest
  rotation.
- Out of scope: the period selector and shell (UI-COACH).

## 3. Definitions

- Rotation Pn: the rallies played while our setter stood in zone Pn.
- Differential: rallies won − rallies lost in a rotation.

## 4. Requirements

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-COACH-ROTATIONS-01` | The tab shows « Analyse des rotations » and « Set n · contexte tactique », the period buttons and a phase filter « TOUT », « RÉCEPTION », « SERVICE ». | Product |
| `UI-COACH-ROTATIONS-02` | Tabs P1…P6 select a rotation (current rotation by default); each tab is labelled with its differential for screen readers. | Accessibility |
| `UI-COACH-ROTATIONS-03` | The court shows the line-up of the selected rotation from the current set's line-up, libero included, the libero in P1 only when the phase filter is RÉCEPTION. | DOM-LINEUP, DOM-LIBERO-04 |
| `UI-COACH-ROTATIONS-04` | Four indicators for the selected rotation and phase: Side-out, Break point, Attaque, Réception + (DOM-STATS formulas, « Échantillon limité » when empty). | DOM-STATS |
| `UI-COACH-ROTATIONS-05` | « Comparaison des rotations » draws one bar per rotation with its differential (« Différentiel de rallyes gagnés / perdus »); small samples stay neutral, as the note says. | DOM-STATS |
| `UI-COACH-ROTATIONS-06` | « Meilleure rotation » and « À surveiller » give the best and the weakest differential with « n/d rallyes »; « Comparer via les joueurs » opens the players tab. | Product |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| No match | Empty variant: disabled P1…P6, zero bars, « 0 rallye ». |
| Rotation never played | Bar at the neutral minimum, values « — ». |

## 6. Data

Rally model rebuilt by DOM-ROTATION (`buildRallies`: rotation, phase, winner per rally).

## 7. Interface

`[data-phase]`, `[data-rotation]`, `.rotation-chart`, `.rotation-summary`, `[data-coach-go="players"]`.

## 8. Accessibility and language

Filter and tab buttons show their state; the chart has a text note. Texts: `coach.*` keys.

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `UI-COACH-ROTATIONS-01`, `-02`, `-04` to `-06` | `tests/coach/test_coach_views.py::test_coach_navigation_live_data_and_player_detail` |
| `UI-COACH-ROTATIONS-03` | `tests/coach/test_coach_views.py::test_coach_courts_use_shared_saturated_role_palette`; `tests/unit/set-lineup.test.js` « the engine replays each set from its own line-up; set 1 is unchanged » |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-28 | First version; replaces the rotations part of `docs/Volley_Live_Live_Statistics_UI_Specification_v1.1.md`. |
