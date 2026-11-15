# Volley Live Capture – General Implementation Specification (v1.3.2)

Functional rules: *Volley Live Capture – Functional Specification v1.3.2* (FR-xx references).
Screens: `Volley_Live_Capture_Screens_v1.3.2.pdf` (letters A–AA).

## 1. Purpose
Record a volleyball match rally by rally on a phone, with no network, and produce statistics and a
shareable report. Since v1.2.0 the amount of detail recorded per rally is chosen at setup
(**detail level**). Capture data stays saved, recoverable, shareable and independent of the front end.

## 2. Architecture
| Layer | Implementation |
|---|---|
| UI | Single file `index.html` (HTML + CSS + vanilla JS, no library, no build step) |
| Offline | `sw.js`, cache-first, cache `volley-live-capture-v1.3.2` (6 files) |
| Install | `manifest.webmanifest` + `icons/` |
| Live storage | `localStorage`, written after every rally |
| Exchange | `<match name>.json`, `<match name>_report.html` |

| localStorage key | Content |
|---|---|
| `volleyCapture.match.v1` | Match definition and state, including `detailLevel` |
| `volleyCapture.events.v1` | Ordered list of rally events |
| `volleyCapture.chartData.v1` | Point-by-point chart data |
| `volleyCapture.stage` (session) | Screen to open after reload |

## 3. Detail level (v1.2.0)
| Level | `detailLevel` | Capture steps | Results | Setup screens |
|---|---|---|---|---|
| Basic | `basic` | `player` (team) → `result` | point, error | SETUP 1 only |
| Intermediate | `intermediate` | `player` → `result` | point, error | SETUP 1 → 2 → 3 |
| Advanced | `advanced` (default) | `player` → `action` → `result` | neutral, point, error | SETUP 1 → 2 → 3 |

### 3.1 How the level drives the code
- At start-up: `LVL = match.detailLevel || 'advanced'`, exposed as `window.VOLLEY_LEVEL` and as
  `<html data-level="…">` (CSS: 2-column result grid at Basic / Intermediate).
- Step titles: Basic "1. Team"; Basic / Intermediate result step "2. Result"; Neutral button `hidden`.
- Player tap: at Basic / Intermediate the action step is skipped and `choice.action` is set to
  `team` (Basic, own team), `generic` (Intermediate, own player) or `adverse` (opponent), then the
  result step opens. ← CHANGE from the result step returns to step 1.
- `commit()` is unchanged: winning team and point origin come from player + result.
- Basic: the player grid is replaced by two buttons `data-player="T"` (own team) and
  `data-player="A"` (opponent); `updateCourt()` only computes the serving side.

## 4. Setup
- SETUP 1: team, opponent, match name, format, then `<select id="suLevel">` (Basic / Intermediate /
  Advanced) with `#suLevelHint`. A `change` event re-renders the screen.
- Basic: roster block removed, *First rally* card shown, button START SET 1, step bar "1 TEAM" only.
  The roster selection is kept in memory if the user switches back before starting.
- Match written at START SET 1 (Basic):
```json
{ "detailLevel": "basic", "team": { "name": "Antibes", "players": [], "roster": [] },
  "opponent": { "name": "Nice" }, "startingLineup": null, "startingRotation": null,
  "firstRally": { "antibesState": "service" },
  "format": { "setsToWin": 2, "setPoints": 25, "decidingSetPoints": 15 }, "currentSet": 1 }
```
  Intermediate / Advanced: same object as v1.1.x plus `"detailLevel"`.

## 5. Live capture layout (top → bottom)
1. Title, scoreboard (black squares; digits **green** if Team A ahead, **red** if behind, **white** if tied – class `lead` / `trail` / `tie` on `#liveScore`), sets line with level chip (BASIC / INTERMEDIATE / ADVANCED).
2. Step area: Basic = serving line + two team buttons; others = serving line, **SERVICE / RECEPTION badge**
   (`#phaseBadge`, green / amber, directly above the NET), court, bench, ADVERSE, ⇄ SUBSTITUTION.
   The badge replaces the role legend (v1.3.2); it is refreshed by `updateCourt()` from `st.serving`.
3. ← CHANGE (during input) and UNDO LAST, centred.
4. Status line, history, STATISTICS ▼.
5. SAVE .JSON / REPORT .HTML at the bottom with their own status line.

## 6. Events per level
| Level | `player` | `action` | `result` |
|---|---|---|---|
| Basic | `"T"` / `"A"` | `team` / `adverse` | point / error |
| Intermediate | number / `"A"` | `generic` / `adverse` | point / error |
| Advanced | number / `"A"` | 6 actions / `adverse` | neutral / point / error |

Chart rows: own team at Basic coded `T` (category "A - team point"), opponent `0`.

## 7. Rules
- Scoring: own point → A +1 (earned); own error → B +1 (opponent_error); ADVERSE point → B +1;
  ADVERSE error → A +1; neutral (Advanced only) → unchanged.
- Serve: first rally choice, alternating each set; rally winner serves. Rotation and libero rule at
  Intermediate / Advanced only. Sets 25 / deciding 15, 2-point lead, all levels.

## 8. Statistics and report
| Section | Basic | Intermediate | Advanced |
|---|---|---|---|
| Score progression, point-origin pies, error charts | ✔ | ✔ | ✔ |
| Attacker cards | hidden | ✔ (row "No action detail", no Neu) | ✔ |
| All-attackers charts | not drawn | ✔ | ✔ |
| Report – players | points per team | Pts / Err / Diff | P / E / N by action |

The report header states the level. All-attackers charts are skipped when no attacker has an event.

## 9. Files
JSON format unchanged (`format: "volley-live-capture"`, `version: 1`), `match.detailLevel` added.
A file without `detailLevel` opens at Advanced level.

## 9b. Player focus (v1.3.2)
- SETUP 1: each player row has a **Focus** checkbox (`data-ifocus`), **checked by default**.
  Stored in `team.roster[].focus` (`true` / `false`). Files without the field (≤ v1.2.0) → all players focus.
- Applies at **Intermediate** and **Advanced** levels (Basic has no roster).
- CAPTURE step 1: a court / bench cell whose player has `focus=false` shows its zone and **TEAM** (dashed grey),
  no number, and cannot be tapped (class `nofocus`). Rotation, serve ring and libero logic are unchanged.
- A blue **TEAM** button (`#teamFocusBtn`, `data-player="T"`) is shown above ADVERSE whenever at least one
  player on court / bench has no focus. It records events for **all players without focus** with `player: "T"`.
  - Advanced: TEAM → 6 actions (default order) → Neutral / Point / Error.
  - Intermediate: TEAM → Point / Error (`action: "generic"`).
  - Scoring like an own player: Point → team1 earned, Error → team2 opponent_error.
- Substitution mode: non-focus cells stay tappable so they can be substituted; a focus substitute is then proposed.
- Statistics: TEAM events count in team totals and point-origin / error charts, not in individual attacker cards.
  Report: a row "TEAM (players without focus)" in the players table (Intermediate and Advanced).

## 10. Verification – `tests/test_e2e_pwa.py` (69 checks)
| Group | Checks |
|---|---|
| PWA: manifest, version, service worker, cache, offline start | P1–P5 |
| Setup list, default, description, iOS font size | L-01, L-02, L-02b |
| Advanced (v1.1.x): layout, scoreboard, action order, results, ADVERSE, rotation, UNDO, substitution, files | A1–A14 |
| Basic: setup path, 2 steps, scoring, serving, stats, set end, report, persistence, re-open | L-03 … L-06b, L-11a–c, L-13a–b, L-14a |
| Intermediate: court, 2 steps, generic action, rotation, CHANGE, substitution, cards, match end, report | L-07a … L-09, L-13c–d, L-14b |
| Focus: checkbox default, storage, TEAM cells / button, Advanced & Intermediate TEAM events, substitution, report, old files | F-01 … F-16 |
| v1.1.x file opens as Advanced; no JS error | L-12, E |
