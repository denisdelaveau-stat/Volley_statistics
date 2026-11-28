# VolleyLive — Coach View Specification

Status: current as of v1.28.0. Source of truth: `coach.js`, `coach-live-config.js`, `coach.css`, `index.html` (`#coachScreen`).
Acceptance tests: `tests/coach/test_coach_views.py`, `tests/coach/test_live_court.py`, `tests/coach/test_empty_state.py`, `tests/capture/test_player_court_palette.py`.
Related: `Volley_Live_Live_Statistics_UI_Specification_v1.1.md` (statistics UI principles), `VolleyLive_Statistics_Implementation_Specification.md` (metric definitions).

## 1. Purpose

Coach View is a **read-only** analysis screen for the selected match: live court state, team and rotation analysis, player performance and player focus. It never modifies score, service, rotation or events.

## 2. Entry and exit

- Opened from MATCH LIBRARY (Coach View button, double-click or `Enter` on a row) via `window.VolleyCoach.open()`.
- `← ACCUEIL` (`#coachHome`) closes Coach View and returns to the screen in `#coachScreen[data-return-screen]` (Match Library by default), restoring focus to its entry control.

## 3. Data loading

Priority order:
1. If `sessionStorage['volleyAnalysis.unloaded.v1'] === '1'` → empty state.
2. Replay document in `sessionStorage['volleyAnalysis.replay.v1']` (set by Match Library or `Charger JSON`).
3. Live match from local storage via `VolleyStatsAdapter.fromLocalStorage`.
4. Fallback: raw capture keys `volleyCapture.match.v1` / `volleyCapture.events.v1`, with phase, rotation and lineup inferred from history (a warning is shown).

All documents are normalised by `VolleyStatsAdapter.toCoachData`. A `Charger JSON` import is validated by `VolleyStatsAdapter.validate` first.

The provenance banner (`Origine des données`) shows the source (`Replay JSON chargé.`, `Match JSON chargé.`, `Match live chargé.`) and the actions `Charger JSON`, `Match live` (replay with a live match available) and `Décharger`.

## 4. Tabs (`role=tablist`)

| Tab | `data-coach-tab` | Content |
|---|---|---|
| Vue coach | `overview` | KPIs, period selector, collective dynamics, priority insight |
| LIVE COURT | `live-court` | Half court with the six players on court, net, per-player status cards |
| Équipe | `rotations` | Rotation analysis, side-out / break point, our service vs opponent service |
| Joueurs | `players` | Player performance table filtered by scope and role |
| PLAYER FOCUS | `player-focus` | Visible only while the player-focus view is active (opened from a player); skill-by-skill detail for that player |

LIVE COURT and PLAYER FOCUS are immersive views (`.coach-live-mode`). The header label `#coachLiveLabel` shows `AUCUN MATCH`, `REPLAY · MATCH`, `V2.1 · MATCH` or `LIVE · MATCH` according to the source.

Period selector: `SET <n>`, `MATCH`, `10 DERNIERS`. Changing the data source resets period, phase, rotation, scope, role, player and skill.

## 5. LIVE COURT

- Landscape only: in portrait it shows `Tournez l’appareil` and a return-to-overview button.
- Court order (front row then back row): positions 4, 3, 2 / 5, 6, 1.
- Each card shows a status `Good`, `Watch` or `Difficulty` computed from the thresholds in `coach-live-config.js`:

| Status | Triggers (any) |
|---|---|
| Difficulty | 3 consecutive errors; efficiency < 15 % with ≥ 6 attempts; ≥ 4 errors with efficiency < 25 %; rolling drop ≥ 30 pts |
| Watch | 2 consecutive errors; efficiency < 30 % with ≥ 5 attempts; reception poor rate ≥ 40 %; rolling drop ≥ 15 pts |

Rolling window: 5 actions; timeline length: 12; minimum sample: 3. Result outcome mapping (point/kill/ace → positive, error/fault/blocked → negative, other → neutral) is also configured there.

## 6. Empty and degraded states

- No match: `AUCUN MATCH` with the empty variant of every tab; values show 0 or NA. No demonstration data is injected.
- Missing context (phase, rotation, lineup) is flagged by `data-json-backed="false"` and the provenance warning; such values are never presented as measured.

## 7. Roles and colours

Roles: setter (`Passeur`), OH, MB (`Centrale`), OPP (`Pointue`), libero, ordered as in `roleOrder`. Colours follow `ROLE_PALETTE_CONTRAST_v1.15.0.md`.

## 8. Accessibility

Tabs use `role=tab`; the active view title receives focus after each render; touch targets ≥ 44 px.

## 9. Acceptance

1. Opening from Match Library shows the selected match, not the live one.
2. `Décharger` shows the empty state; `Match live` returns to the live match.
3. LIVE COURT shows the six on-court players with statuses matching the configured thresholds.
4. Selecting a player reveals PLAYER FOCUS for that player.
5. No control in Coach View writes to `volleyCapture.*` keys.
