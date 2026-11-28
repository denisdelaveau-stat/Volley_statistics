# UI-COACH-PLAYERS — Coach View: players

| Field | Value |
|---|---|
| Spec ID | `UI-COACH-PLAYERS` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-28 |
| Source of truth | `js/coach-players.js` (`renderPlayers`, `playerStats`, `summaryCards`, `contributionBars`), `coach.js` (player selection, « Voir le détail joueur ») |
| Related specs | UI-COACH (shell), UI-COACH-LIVE (PLAYER FOCUS), DOM-STATS |

## 1. Purpose

The « Joueurs » tab ranks our players by their observed contribution and summarises the selected player.

## 2. Scope

- In scope: filters, ranking table, player summary, opening PLAYER FOCUS.
- Out of scope: PLAYER FOCUS itself (UI-COACH-LIVE).

## 3. Definitions

- Delta: points − errors recorded for a player (DOM-STATS-11).

## 4. Requirements

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-COACH-PLAYERS-01` | The tab shows « Performance joueurs » and « Contributions observées · delta = points − erreurs », the period buttons, a scope filter « SUR LE TERRAIN » / « TOUS » and a role filter « TOUS », OH, MB, OPP, S, L. | Product |
| `UI-COACH-PLAYERS-02` | The table ranks the filtered players by delta (rank, player, position, delta) with the count shown (« n affichés ») and the note « Classement explicable : le delta correspond uniquement aux points enregistrés moins les erreurs enregistrées. ». | DOM-STATS |
| `UI-COACH-PLAYERS-03` | A row is selected by click, Enter or Space; the selected player's summary shows Attaque, Réception and Service cards (with « Échantillon limité » when empty), participation (« Rallyes avec action », « Actions enregistrées ») and contribution bars per skill. | Product |
| `UI-COACH-PLAYERS-04` | « Voir le détail joueur » opens PLAYER FOCUS for the selected player (« Ouverture du détail joueur » while it opens); without a selection it is disabled with « Sélectionnez un joueur pour voir le détail »; on failure it says « Impossible d’ouvrir PLAYER FOCUS. Réessayez. ». | UI-COACH-LIVE |
| `UI-COACH-PLAYERS-05` | When no player matches the filters, the tab says « Aucun joueur ne correspond aux filtres actifs. ». | Product |

Known gap: `js/coach-players.js` still contains a former player detail view (`renderDetail`: skill tabs, summary by
skill, recent actions, « Voir toutes les actions ») that no control opens any more since « Voir le détail joueur »
leads to PLAYER FOCUS; it is unreachable code.

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| No match | Empty variant: « 0 joueur chargé. », zero cards. |

## 6. Data

Events and rally model of the source (UI-COACH), filtered by period.

## 7. Interface

`[data-player-scope]`, `[data-role]`, `tr[data-player]`, `#playerDetailCta`.

## 8. Accessibility and language

Rows are focusable and react to Enter / Space; the detail button has an `aria-label` with the player's number and
name. Texts: `coach.*` keys.

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `UI-COACH-PLAYERS-01` to `-04` | `tests/coach/test_coach_views.py::test_coach_navigation_live_data_and_player_detail`, `::test_coach_empty_state_and_accessible_detail` |
| `UI-COACH-PLAYERS-05` | Manual: choose role L with no libero in the data |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-28 | First version; replaces the players part of `docs/Volley_Live_Live_Statistics_UI_Specification_v1.1.md`; documents the unreachable detail view. |
