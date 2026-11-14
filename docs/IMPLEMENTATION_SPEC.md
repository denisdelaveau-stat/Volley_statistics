# Volley Live Capture – General Implementation Specification (v1.1.3)

## 1. Purpose
Record a volleyball match rally by rally from the bench, on a phone, with no network,
and produce statistics and a shareable report. The capture data must be **saved, recoverable,
shareable and independent of the front end** (plain JSON file).

## 2. Architecture
| Layer | Implementation |
|---|---|
| UI | Single file `index.html` (HTML + CSS + vanilla JS, no library, no build step) |
| Offline | `sw.js` service worker, cache-first, versioned cache `volley-live-capture-vX.Y.Z` |
| Install | `manifest.webmanifest` + `icons/` (standalone Home Screen app) |
| Live storage | `localStorage` (written after every rally) |
| Exchange format | `<match name>.json` (export / import), `<match name>_report.html` (self-contained report) |

### localStorage keys
| Key | Content |
|---|---|
| `volleyCapture.match.v1` | Match definition and state (teams, roster, format, sets, rotation, substitutions) |
| `volleyCapture.events.v1` | Ordered list of rally events |
| `volleyCapture.chartData.v1` | Point-by-point data used by the charts |
| `volleyCapture.stage` | Current screen (home / setup / capture) |

## 3. Screen flow
1. **Home** – NEW MATCH, CONTINUE / VIEW MATCH, OPEN MATCH .JSON, last match summary, version label.
2. **Team setup** – team / opponent / match names, format (best of 3 or 5), roster of 7 to 12 players
   (number, name, position: setter, OH, MB, OPP, libero).
3. **Starting 7** – six court players + libero.
4. **Rotation** – P1…P6 assignment and first rally (serve or receive).
5. **Live capture** – scoreboard, court view, capture panel, statistics.

## 4. Live capture
### 4.1 Scoreboard
- Format `A : B` without team letters; each value in a black square with **red digits** (gym style).
- Under it: sets won (`Sets x : y`), finished set scores (`S1 25-10`…), format reminder.

### 4.2 Court view
- Only the six players on court are shown, at their real position (P4 P3 P2 at the net, P5 P6 P1 behind),
  coloured by role; the server is highlighted (`SERVE`). Bench players are shown on a third row.
- Rotation is applied automatically on side-out; libero in / out for middle blockers in back row.

### 4.3 Rally entry – 3 steps
1. **Player** (own team) or the single generic **ADVERSE** button (opponent).
2. **Action** – reception, defence, set, attack, block, service, ordered by likelihood for the player's role.
   Opponent: one generic action.
3. **Result** – Neutral, Point, Error.

Each event stores: `id, set, timestamp, time, action, result, player, winningTeam, pointOrigin, scoreA, scoreB`.

### 4.4 Set and match rules
- Sets 1–4: 25 points with a 2-point lead; deciding set: 15 points with a 2-point lead.
- At set end the interface shows *Set finished, won by …* and offers **START SET n**;
  at match end *MATCH WON* and **SAVE MATCH .JSON**.
- Serve of the next set alternates.

### 4.5 Substitutions and corrections
- ⇄ SUBSTITUTION at any time: tap the player on court, then the incoming bench player.
  Counter per set (`Subs set n (k/6)`), confirmation above 6.
- UNDO LAST removes the last event (and the last substitution if it was the last action).

## 5. Statistics
- Score progression of the current set with lead bars and filterable markers.
- Point origin per team (points won vs opponent errors) and error differential.
- **Attackers** (OH, MB, OPP with entries in the log), scope *Current set* / *Match*:
  one chart per attacker (points, errors, points − errors) + table Pt / Err / Neu per action.
- Consolidated charts *All attackers – points scored over time* and *– differential*,
  with a legend `Player n (Name · Role)` per curve.

## 6. Files
### 6.1 Match JSON
```json
{ "format": "volley-live-capture", "version": 1, "savedAt": "<ISO date>",
  "match": { "...": "teams, roster, sets, subs, status" },
  "score": { "team1": 0, "team2": 0 },
  "events": [ ], "chartData": [ ] }
```
File name: match name with spaces replaced by `_`, e.g. `Test_offline.json`.
Import through **OPEN MATCH .JSON** restores the full state.

### 6.2 HTML report
Self-contained HTML (inline CSS / SVG, no script dependency), file `<match name>_report.html`.

## 7. Versioning and release
- Semantic version shown on Home (`#appVersion`) and used in the service-worker cache name.
- Every release: bump `index.html`, `sw.js`, `README.md`, `CHANGELOG.md`; run `tests/test_e2e_pwa.py`.

## 8. Verification (tests/test_e2e_pwa.py – 22 checks)
Manifest and icons, service worker active and cache content, offline start, setup, capture,
substitution, set and match end, JSON and HTML export, restart and JSON re-import offline,
red scoreboard digits, legend layout, no JavaScript error.
