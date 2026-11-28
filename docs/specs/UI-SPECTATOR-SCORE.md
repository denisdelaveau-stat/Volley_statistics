# UI-SPECTATOR-SCORE — Spectator View: live score and momentum

| Field | Value |
|---|---|
| Spec ID | `UI-SPECTATOR-SCORE` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-28 |
| Source of truth | `js/spectator-live-score.js` (`statusLabel`, `renderScoreboard`, `computeMomentum`, `momentumView`, `renderMomentum`), `spectator-live-config.js`, `spectator.html` (`[data-panel="live-score"]`), `spectator.css` |
| Related specs | UI-SPECTATOR (shell), DOM-STATS-18 (momentum), DOM-MATCH (sets), SYS-DESIGN |

## 1. Purpose

The SCORES tab gives the public the score at a glance: a score card and the « MOMENTUM ACTUEL » card that tells which
team has the upper hand over the last points.

## 2. Scope

- In scope: score card, status, service indicator, momentum card, its states and accessible labels.
- Out of scope: the momentum formula (DOM-STATS-18), the shell (UI-SPECTATOR).

## 3. Definitions

- Window: the last 8 points of the selected set (`spectator-live-config.js`).

## 4. Requirements

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-SPECTATOR-SCORE-01` | The tab holds exactly one score card then the momentum card; the timeline holds neither. | Product (v1.19.1) |
| `UI-SPECTATOR-SCORE-02` | The score card shows HOME at left (crest or monogram, name) and AWAY at right, the current score, the sets won, one service ball on the serving side, and a status: « AUCUN MATCH », « SET n · À VENIR », « SET n · EN COURS », « FIN DU SET n », « MATCH TERMINÉ ». | DOM-MATCH |
| `UI-SPECTATOR-SCORE-03` | The score card is labelled for screen readers with both teams, the score, the status, the sets and the serving team (« Aucun match chargé, score 0 à 0 » without match). | Accessibility |
| `UI-SPECTATOR-SCORE-04` | « MOMENTUM ACTUEL » uses at most the last 8 valid points of the set: its subtitle says « Sur les k derniers points », « Fin du set n · k derniers points », « Momentum disponible après 4 points », « Nouveau set — en attente du premier point » or « Aucun match chargé ». | DOM-STATS-18 |
| `UI-SPECTATOR-SCORE-05` | From 4 points, the headline says « Avantage team » (↗) when a team won at least 70 % of the window, otherwise « Équilibré » (↔); the percentages always sum to 100 and the bar splits accordingly; below 4 points the values are NA. | DOM-STATS-18 |
| `UI-SPECTATOR-SCORE-06` | The sequence shows the window as H / A tiles from oldest to newest (empty slots before), with the counts per team. | Product |
| `UI-SPECTATOR-SCORE-07` | « SÉRIE EN COURS » (« SÉRIE FINALE » once the set is over) gives « Dernier point · team » or « n points consécutifs · team »; the streak never crosses a set boundary and is emphasised from 5 points. | DOM-STATS-18 |
| `UI-SPECTATOR-SCORE-08` | « Indicateur de dynamique, pas une prédiction. » is always shown. | Transparency |
| `UI-SPECTATOR-SCORE-09` | Everything is recomputed after a point, a correction, an undo and a set change; without data the card is grey, never a fatal error. | UI-SPECTATOR-04 |
| `UI-SPECTATOR-SCORE-10` | Header and momentum use the team colours, never the side-out / break-point colours. | SYS-DESIGN |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| Fewer than 4 points | « Momentum disponible après 4 points », real counts, NA percentages. |
| New set, 0 point | « Nouveau set — en attente du premier point ». |
| No document | Grey card, « AUCUN MATCH ». |

## 6. Data

Rallies of the selected set from the view model (UI-SPECTATOR); window and thresholds in
`spectator-live-config.js` (`windowSize: 8`, `minPoints: 4`, `advantageThreshold: 0.7`).

## 7. Interface

`#liveScoreboard` (`#homeTeamDisplay`, `#awayTeamDisplay`, `#headerHome`, `#headerAway`, `#setsHome`, `#setsAway`,
`#serviceHome`, `#serviceAway`, `#headerSet`); `#momentumCard` (`state-*`, `leader-*`): `#momentumSubtitle`,
`#momentumArrow`, `#momentumLeader`, `#homePct`, `#awayPct`, `#momentumBar`, `#momentumSequence`, `#streakPill`,
`#streakText`.

## 8. Accessibility and language

Cards labelled with their full content; the headline is announced only when the leader changes; touch and contrast
rules of SYS-DESIGN. Texts: `spectator.*` keys.

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `UI-SPECTATOR-SCORE-01` | `tests/spectator/test_live_score_momentum.py::test_live_score_visual_baselines_and_no_duplicate_score` |
| `UI-SPECTATOR-SCORE-02`, `-03` | `tests/spectator/test_live_score_momentum.py::test_mobile_tablet_landscape_a11y_service_and_no_forbidden_header_colors`, `::test_config_monograms_order_and_section_has_no_replay_archive_text`; `tests/spectator/test_set_navigation.py::test_score_home_is_green_and_away_is_red` |
| `UI-SPECTATOR-SCORE-04`, `-05`, `-06` | `tests/spectator/test_live_score_momentum.py::test_t1_to_t5_window_percent_threshold_and_streak`, `::test_t6_not_enough_data_real_counts_tiles_placeholders_and_streak`, `::test_t7_new_set_zero_points`, `::test_t11_rounding_always_sums_to_100` |
| `UI-SPECTATOR-SCORE-07` | `tests/spectator/test_live_score_momentum.py::test_t9_set_finished_keeps_final_score_momentum_and_final_streak`, `::test_t12_streak_does_not_cross_set_boundary` |
| `UI-SPECTATOR-SCORE-08` | Manual: the disclaimer is visible under the momentum card |
| `UI-SPECTATOR-SCORE-09` | `tests/spectator/test_live_score_momentum.py::test_t8_undo_recomputes_everything_from_json`, `::test_t10_no_json_full_gray_empty_state_without_fatal` |
| `UI-SPECTATOR-SCORE-10` | `tests/spectator/test_live_score_momentum.py::test_mobile_tablet_landscape_a11y_service_and_no_forbidden_header_colors` |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-28 | First version; replaces `docs/VolleyLive_Live_Header_Momentum_Spec.md`, `docs/LIVE_HEADER_MOMENTUM_v1.19.0.md` and `docs/LIVE_SCORE_MOMENTUM_PLACEMENT_v1.19.1.md`. |
