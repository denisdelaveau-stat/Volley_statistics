# UI-SPECTATOR-RANKING — Spectator View: ranking

| Field | Value |
|---|---|
| Spec ID | `UI-SPECTATOR-RANKING` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 (implementation last changed in v1.26.x) |
| Last review | 2026-11-28 |
| Source of truth | `js/spectator-ranking.js` (`RANKING_CATEGORIES`, `rankingCategoryForAction`, `rankingSource`, `rankingRows`, `rankingCard`, `renderRanking`), `spectator.html` (`[data-panel="ranking"]`), `spectator.css` |
| Related specs | UI-SPECTATOR (shell, set selector), DOM-STATS-19 (ranking metrics), SYS-I18N-08 (labels kept in English) |

## 1. Purpose

RANKING ranks our team's players (HOME) per skill category, in three views (Highlight, Lowlight, Delta), computed only
from the loaded match document of the selected set.

## 2. Scope

- In scope: filters, data scope, categories and outcomes, rows and sorting, summary, empty states, layout.
- Out of scope: whole-match aggregation, opponent ranking, role comparison, playing time (not implemented).

## 3. Definitions

- Eligible action: a non-voided action of a HOME player of the selected set whose action maps to a category.

## 4. Requirements

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-SPECTATOR-RANKING-01` | The tab shows « SPECTATOR VIEW », « Roster Ranking » and « Classement calculé uniquement depuis le JSON officiel chargé. », a « Vue » list (Highlight, Lowlight, Delta; default Highlight) and a « Catégorie » list (All, Attack, Block, Defence, Reception, Service; default All); a change re-renders at once; the choices are not stored. | Product |
| `UI-SPECTATOR-RANKING-02` | Only the actions of the selected set count (no whole-match aggregation); changing the set re-renders the ranking. | UI-SPECTATOR-06 |
| `UI-SPECTATOR-RANKING-03` | Only HOME players are ranked: v2.1 players of our team; Capture v1 roster by jersey number. Opponent actions and actions without a known HOME player are ignored; voided events are excluded. | Product |
| `UI-SPECTATOR-RANKING-04` | Actions map to categories after upper-casing and folding accents: attack (A, ATTACK, ATTAQUE, SPIKE), block (B, BLOCK, CONTRE), defence (D, DEFENCE, DEFENSE, DIG), reception (R, RECEPTION, RECEIVE), service (SV, SERVICE, SERVE); other actions are ignored. Cards are always ordered Attack, Block, Defence, Reception, Service. | Product |
| `UI-SPECTATOR-RANKING-05` | Outcomes: point (POINT, KILL, ACE, WIN, WINNER, POSITIVE, SUCCESS), error (ERROR, FAULT, OUT, NET, NEGATIVE, FAIL), neutral (NEUTRAL, CONTINUE, CONTINUOUS, IN_PLAY, PLAY, ZERO); neutral and unclassified actions count in the total only. | DOM-STATS-19 |
| `UI-SPECTATOR-RANKING-06` | Each row shows the rank (« #1 »…, gold, silver and bronze for the first three as decoration only), the name (« Joueur n » when missing), « #number · role », the main value of the view and its detail: Highlight points (« p pts · e err »), Lowlight errors (« e erreurs · p pts »), Delta points − errors (« p pts − e err »). Sorting follows DOM-STATS-19; ties get distinct ranks. | DOM-STATS-19 |
| `UI-SPECTATOR-RANKING-07` | The summary counts the ranked players and the eligible actions of the category (or of all five): « n joueur(s) · m action(s) ». | Product |
| `UI-SPECTATOR-RANKING-08` | A category without eligible action shows an empty card (grey « 0 », « NA », « 0 action »); with All and no action, five empty cards and « 0 joueur · 0 action »; the same without archive. No demonstration value is ever shown. | Product |
| `UI-SPECTATOR-RANKING-09` | The note explains the views (« Highlight : points marqués. Lowlight : erreurs. Delta : points marqués − erreurs. Les actions neutres restent comptées dans le total. »). | Transparency |
| `UI-SPECTATOR-RANKING-10` | Two card columns for All, one centred column (max 720 px) for one category; heading and filters stack at ≤ 780 px, filters in one column at ≤ 480 px; no horizontal overflow at 390, 768 and 1536 px. | SYS-DESIGN-05 |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| Invalid archive | Fatal screen (UI-SPECTATOR-03); no ranking. |
| Player name too long | One line with an ellipsis. |

## 6. Data

Reads the archive (UI-SPECTATOR); writes nothing.

## 7. Interface

`#rankingTitle`, `#rankingView`, `#rankingCategory`, `#rankingSection` (`mode-<view>`, `is-empty`),
`#rankingModeTitle`, `#rankingSummary`, `#rankingCards` (`.ranking-card`, `.empty-ranking`, `.ranking-row`),
`.ranking-note`. Colours: Highlight `#5fd8f5`, Lowlight `#ff8d9f`, Delta `#f4fbff`.

## 8. Accessibility and language

Selects at least 44 px high and labelled (« Vue », « Catégorie »); `#rankingSection` is a polite live region; the
rank is text. View and category names stay in English (SYS-I18N-08). Texts: `spectator.*` keys.

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `UI-SPECTATOR-RANKING-01` | `tests/spectator/test_ranking.py::test_archive_tabs_are_renamed_and_ranking_is_available` |
| `UI-SPECTATOR-RANKING-02` | `tests/spectator/test_set_navigation.py::test_shared_set_selector_defaults_to_live_and_controls_every_tab` |
| `UI-SPECTATOR-RANKING-03` to `-07`, `-09` | `tests/spectator/test_ranking.py::test_ranking_filters_and_values_are_derived_from_official_json` |
| `UI-SPECTATOR-RANKING-08` | `tests/spectator/test_ranking.py::test_ranking_empty_state_is_gray_zero_na_and_has_no_demo_values` |
| `UI-SPECTATOR-RANKING-10` | `tests/spectator/test_ranking.py::test_v1_20_visual_baselines_for_ranking` |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-28 | First version; replaces `docs/VolleyLive_Spectator_Ranking_Specification.md` and `docs/ADVANCED_STATISTICS_RANKING_v1.20.0.md`. |
