# UI-SPECTATOR-TIMELINE — Spectator View: timeline

| Field | Value |
|---|---|
| Spec ID | `UI-SPECTATOR-TIMELINE` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 (timeline geometry last changed in v1.26.1) |
| Last review | 2026-11-28 |
| Source of truth | `js/spectator-timeline.js` (`visibleRows`, `renderRow`, `eventCard`), `js/spectator-core.js` (`modelV2`, `modelV1`, `terminalV2`), `spectator.js` (`render`), `spectator.html` (`[data-panel="live-timeline"]`), `spectator.css` |
| Related specs | UI-SPECTATOR (shell, set selector), DOM-STATS-15 (SO / BP), SYS-JSON, SYS-DESIGN-02 (role colours) |

## 1. Purpose

TIMELINE is the narrative view: one row per completed rally of the selected set, with the score after the rally, who
scored, whether it was a side-out or a break point, the deciding HOME player and action or the AWAY outcome, and the
lead. It holds no statistics, no score card and no momentum card.

## 2. Scope

- In scope: filters, title, rally rows, derivation, states, responsive behaviour.
- Out of scope: the shell and set selector (UI-SPECTATOR).

## 3. Definitions

- Terminal event: the action that decided the rally.
- Window: the number of most recent rallies shown.

## 4. Requirements

### 4.1 Filters and title

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-SPECTATOR-TIMELINE-01` | « En haut » orders the rows: « Plus anciennes » (default, oldest → newest, « Ancien → récent ») or « Plus récentes » (« Récent → ancien »); only the direction changes. | Product |
| `UI-SPECTATOR-TIMELINE-02` | « Nombre d’actions » keeps the N most recent rallies of the set: 5 (default), 10, 11, 20 or « Tout le set »; with fewer rallies all are shown, never placeholders. | Product |
| `UI-SPECTATOR-TIMELINE-03` | Order and window are stored on the device, restored on reload and shared with the GRAPH tab. | Product |
| `UI-SPECTATOR-TIMELINE-04` | The title shows HOME (left) and AWAY (right) in equal boxes, « SET n · Fil du match » and « Score : HOME — AWAY »; the footer shows « REPLAY D’ARCHIVE ». | Product |

### 4.2 Rally row

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-SPECTATOR-TIMELINE-05` | A row reads, left to right: HOME event card, connector, HOME delta, score pill (HOME : AWAY, score after the rally, « Rallye N » tab above), AWAY delta, connector, AWAY marker; adjacent parts touch (1 px tolerance) and share the pill's vertical centre. | Product (v1.26.1) |
| `UI-SPECTATOR-TIMELINE-06` | Exactly one half of the score pill is coloured, the half of the rally winner: yellow for a side-out, green for a HOME break point, red for an AWAY break point; the other half stays black. SO / BP is judged for the winning team (DOM-STATS-15) and exposed as `data-code`, with no chip or legend. | DOM-STATS-15 |
| `UI-SPECTATOR-TIMELINE-07` | The leading team gets a fixed-size bar « +N » next to the score on its side (green HOME, red AWAY), none on a tie; the largest gap among the visible rows is outlined and announced « , écart maximum du set ». | Product |
| `UI-SPECTATOR-TIMELINE-08` | A HOME card shows the player's number and role in a role-coloured circle, the full name on one line (never truncated) and the skill label coloured by outcome (point green, error red, neutral blue); a missing player shows « Joueur HOME ». | SYS-DESIGN-02 |
| `UI-SPECTATOR-TIMELINE-09` | AWAY shows only a circle « A »: green when its action won the rally, red when its fault gave the point to HOME. | Product |
| `UI-SPECTATOR-TIMELINE-10` | The last rally of the set is outlined and labelled « DERNIER POINT ». | Product |
| `UI-SPECTATOR-TIMELINE-11` | Basic or score-only data (detail level basic, generic or team action) shows no card or marker, only the score, accent and lead. | UI-SPECTATOR-05 |

### 4.3 Derivation

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-SPECTATOR-TIMELINE-12` | Unified v2.1: rows are the non-voided rallies of the set with a winner, by set then rally number; Capture v1: the events of the set grouped into rallies closed by a winning event. The terminal event is the rally's `terminalEventId`, else its last decisive action (v2.1), or the closing event (v1). | SYS-JSON |
| `UI-SPECTATOR-TIMELINE-13` | The serving team is the recorded `servingTeamId` (v2.1) or derived from the first rally and the previous winner (v1). | DOM-ROTATION-02 |
| `UI-SPECTATOR-TIMELINE-14` | A terminal serve by the team not serving marks the row « DONNÉE À VÉRIFIER » and adds « Rallye N : action de service rejetée pour l’équipe non au service. » to the warning area. | Data quality |

### 4.4 States and layout

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-SPECTATOR-TIMELINE-15` | Without archive the empty text is « Aucun match chargé »; a set without completed rally shows « Le set n’a pas encore commencé ». | Product |
| `UI-SPECTATOR-TIMELINE-16` | The board scrolls horizontally (the page never does); on a narrow screen it starts with the first HOME card visible. New rows fade in, except with reduced motion. | SYS-DESIGN-05, -06 |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| Correction stored in the archive | Rows, accents, leads, cards and DERNIER POINT are recomputed. |
| Match finished | Filters stay available; badge « TERMINÉ ». |
| Long player name | Shown in full; the board scrolls. |

## 6. Data

Reads the archive (UI-SPECTATOR); stores `volleySpectator.timeline.order` and `volleySpectator.timeline.window`.

## 7. Interface

Elements: `[data-order]`, `#windowSize`, `#homeName`, `#awayName`, `#timelineSet`, `#timelineOrder`, `#timelineList`
(`.tl-row` with `data-rally`, `data-code`, `data-winner`, `data-score-accent`, `data-valid`), `#timelineEmpty`,
`#timelineWarning`, `.replay-status`.

Geometry (v1.26.1): row grid 460 / 156 / 460 px, row height ≤ 105 px, spine at 49–51 % of the board at 1536 × 1024;
connectors 40 px; delta bars 38 × 28 px; score pill 50 px high, at least 148 px wide; HOME avatar 62 px (52 px at
≤ 1100 px); list 1100 px wide at ≤ 900 px; title and footer at least 690 px at ≤ 780 px.

Tokens: cyan `#22d3ee`, score background `#05070b`, side-out `#ffd43b`, HOME green `#18b85a`, AWAY red `#d90429`.

## 8. Accessibility and language

`#timelineList` is a polite live region; delta bars and A markers have `role="img"` with French labels
(« HOME mène de N points », « AWAY, action marquant le point », « AWAY, faute donnant le point à HOME »); controls at
least 44 px; contrast at least 4.5:1. Texts: `spectator.*` keys.

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `UI-SPECTATOR-TIMELINE-01` to `-03` | `tests/spectator/test_timeline.py::test_t10_newest_first_and_filter_persistence`, `::test_t5_window_with_only_three_rallies_has_three_rows`; `tests/spectator/test_timeline_update.py::test_basic_does_not_invent_actions_and_filters_keep_latest_window` |
| `UI-SPECTATOR-TIMELINE-04` | `tests/spectator/test_reference_capture.py::test_reference_home_away_header_boxes_are_half_size_and_equal` |
| `UI-SPECTATOR-TIMELINE-05` | `tests/spectator/test_timeline_update.py::test_connector_delta_and_score_are_centred_in_compact_sequence`; `tests/spectator/test_compact_score_delta.py::test_delta_bars_hug_score_and_share_vertical_centre`; `tests/spectator/test_timeline_alignment.py::test_compact_delta_marker_sequence_and_equal_connectors`; `tests/spectator/test_timeline_layout.py::test_desktop_spine_is_home_left_mirrored_and_away_delta_hugs_score` |
| `UI-SPECTATOR-TIMELINE-06` | `tests/spectator/test_timeline.py::test_t6_t7_t8_side_out_and_break_point_are_derived_without_badges`; `tests/spectator/test_timeline_update.py::test_score_colours_only_the_scoring_half_for_home_and_away_so_bp` |
| `UI-SPECTATOR-TIMELINE-07` | `tests/spectator/test_timeline.py::test_t1_t2_t3_t4_delta_lanes_and_common_scale`; `tests/spectator/test_set_navigation.py::test_timeline_full_name_short_connectors_compact_rows_and_max_gap` |
| `UI-SPECTATOR-TIMELINE-08` | `tests/spectator/test_timeline_update.py::test_home_attack_point_error_neutral_shows_only_attaque`, `::test_vivid_shared_role_colours_and_contrast`; `tests/spectator/test_timeline_layout.py::test_home_card_is_content_sized_with_balanced_side_padding` |
| `UI-SPECTATOR-TIMELINE-09` | `tests/spectator/test_timeline_update.py::test_away_point_and_fault_are_only_coloured_a_circles` |
| `UI-SPECTATOR-TIMELINE-10` | `tests/spectator/test_timeline.py::test_t11_archive_correction_recomposes_last_point` |
| `UI-SPECTATOR-TIMELINE-11`, `-12` | `tests/spectator/test_timeline.py::test_capture_v1_and_basic_score_only_are_supported_without_invention` |
| `UI-SPECTATOR-TIMELINE-13`, `-14` | `tests/spectator/test_timeline.py::test_t9_service_fault_by_non_serving_team_is_flagged` |
| `UI-SPECTATOR-TIMELINE-15` | `tests/spectator/test_timeline.py::test_return_home_invalid_archive_tablet_and_accessibility` |
| `UI-SPECTATOR-TIMELINE-16` | `tests/spectator/test_timeline_layout.py::test_android_portrait_keeps_page_stable_and_timeline_scrollable`; `tests/spectator/test_timeline_alignment.py::test_alignment_and_internal_scrolling_hold_at_three_viewports`, `::test_visual_baselines_desktop_tablet_and_mobile` |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-28 | First version; replaces `docs/VolleyLive_Spectator_Timeline_Specification.md` (which had consolidated the v1.0 draft and the v1.16–v1.18 notes; its table of resolved conflicts stays in the archived copy). |
