# UI-SPECTATOR-GRAPH — Spectator View: score and fault evolution

| Field | Value |
|---|---|
| Spec ID | `UI-SPECTATOR-GRAPH` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-28 |
| Source of truth | `js/spectator-graph.js` (`renderValueRows`, `deltaChartMarkup`, `renderGraphs`, `updateSetSelector`), `js/spectator-core.js` (rally model), `spectator.js` (scroll, « Dernier point »), `spectator.html` (`[data-panel="live-graph"]`), `spectator.css` |
| Related specs | UI-SPECTATOR (shell), UI-SPECTATOR-TIMELINE (shared order and window), DOM-STATS-15 to -17 |

## 1. Purpose

The GRAPH tab shows, rally after rally, how the score and the faults evolve in the selected set: two aligned value
rows and two charts of the HOME − AWAY difference.

## 2. Scope

- In scope: controls, score panel, fault panel, alignment, accessible summaries, empty state, history browsing.
- Out of scope: the formulas (DOM-STATS-15 to -17), the shell (UI-SPECTATOR).

## 3. Definitions

- Rally key: the identifier shared by the cells and chart points of one rally.

## 4. Requirements

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-SPECTATOR-GRAPH-01` | Controls: « Ordre » (« Ancien → récent » / « Récent → ancien ») and « Rallyes visibles » (5, 10, 11, 20, « Tout le set »), shared with the timeline (UI-SPECTATOR-TIMELINE-03). | Product |
| `UI-SPECTATOR-GRAPH-02` | « Évolution du score » (« Derniers points • lecture de gauche à droite ») shows a HOME row and an AWAY row of the score after each rally, the scoring cell coloured side-out (yellow), HOME break point (green) or AWAY break point (red), with its legend, and a chart of the score difference (« HOME devant », « Égalité », « AWAY devant »). | DOM-STATS-15, -16 |
| `UI-SPECTATOR-GRAPH-03` | « Évolution des fautes » (« Fautes cumulées • Δ = HOME − AWAY ») shows the cumulative faults of each team, the new faults of the rally highlighted, and a chart of the fault difference (« HOME : plus de fautes », « Égalité », « AWAY : plus de fautes »), with « Un delta positif indique davantage de fautes HOME. ». | DOM-STATS-17 |
| `UI-SPECTATOR-GRAPH-04` | Both panels render the same rally list: cells and chart points of a rally share its key and line up within one CSS pixel; curves use uniform colours. | Product (v1.18.0) |
| `UI-SPECTATOR-GRAPH-05` | Every cell has an accessible name (« HOME 12, Side-out, rallye 8 », « AWAY, 3 fautes cumulées, 1 nouvelle faute sur ce rallye, rallye 8 »), every chart a summary (« Évolution du score, Set n. HOME a, AWAY b. Delta plus d. ») and each point a title (« Rallye n · delta d »). | Accessibility |
| `UI-SPECTATOR-GRAPH-06` | Without rally, « Aucun rallye disponible » and « Les axes restent disponibles sans point de données fabriqué. ». | UI-SPECTATOR-05 |
| `UI-SPECTATOR-GRAPH-07` | The board scrolls horizontally; scrolling away from the latest rally of the live set shows « Dernier point », which scrolls back; new data does not force the scroll position. | Product |
| `UI-SPECTATOR-GRAPH-08` | Selecting a set rebuilds score and faults for that set at once; a correction or undo rebuilds the whole set without stale points. | UI-SPECTATOR-04 |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| Several faults in one rally | Each counts for the team that made it (DOM-STATS-17). |
| Missing classification | Neutral cell. |
| Basic data | Values and charts only, no invented actions. |

## 6. Data

Rally model of the selected set (`homeScore`, `awayScore`, `scoreDelta`, `pointClassification`, cumulative faults,
increments, `faultDelta`, `rallyKey`).

## 7. Interface

`[data-graph-order]`, `#graphWindowSize`, `#returnLive`, `#graphContent`, `#evolutionCanvas`, `#scoreRows`,
`#scoreChart`, `#faultRows`, `#faultChart`, `#scoreSummary`, `#faultSummary`, `#graphEmpty`. Rows and charts share
the CSS grid `--label-column-width` + `repeat(--visible-rally-count, minmax(--rally-min-width, 1fr))`.

## 8. Accessibility and language

Controls at least 44 px, keyboard operable with visible focus; the scroll area is focusable and labelled; reduced
motion respected. Texts: `spectator.*` keys.

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `UI-SPECTATOR-GRAPH-01` | `tests/spectator/test_live_graph.py::test_update10_header_score_connectors_home_delta_and_filters` |
| `UI-SPECTATOR-GRAPH-02`, `-03` | `tests/spectator/test_score_fault_evolution.py::test_unit_deltas_classification_fault_cumulation_and_shared_rally_keys`, `::test_official_json_integration_scores_faults_all_sets_and_reopen_stability`; `tests/spectator/test_live_graph.py::test_vivid_score_accents_keep_exactly_one_black_half` |
| `UI-SPECTATOR-GRAPH-04` | `tests/spectator/test_score_fault_evolution.py::test_exact_alignment_within_one_css_pixel_and_uniform_curve_colors`, `::test_visual_regression_score_fault_evolution_three_viewports` |
| `UI-SPECTATOR-GRAPH-05`, `-06` | `tests/spectator/test_score_fault_evolution.py::test_empty_one_rally_accessibility_keyboard_touch_and_reduced_motion`; `tests/spectator/test_live_graph.py::test_live_graph_has_empty_state_and_basic_does_not_invent_actions` |
| `UI-SPECTATOR-GRAPH-07` | `tests/spectator/test_score_fault_evolution.py::test_history_browse_return_live_and_live_replay_data_parity`; `tests/spectator/test_live_graph.py::test_responsive_internal_scrolling_accessibility_and_offline_cache` |
| `UI-SPECTATOR-GRAPH-08` | `tests/spectator/test_score_fault_evolution.py::test_set_selection_resets_score_and_faults_and_filters_atomically`, `::test_undo_rebuilds_without_stale_points_and_missing_classification_is_neutral` |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-28 | First version; replaces `docs/VolleyLive_Score_Fault_Evolution_View_Specification_v1.0.md`, `docs/SCORE_FAULT_EVOLUTION_VIEW_v1.18.0.md` and `docs/LIVE_GRAPH_UPDATE_v1.17.0.md`. |
