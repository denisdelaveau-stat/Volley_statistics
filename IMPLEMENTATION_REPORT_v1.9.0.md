# Implementation report — Volley Live Capture v1.9.0

## Scope delivered

- Added the **ADVANCED STATISTICS** button to Home.
- Integrated the supplied Advanced Statistics report under `statistics/index.html`.
- Preserved Set Timeline, horizontal/vertical orientation, filters, player/team metrics, Rotation Metrics, Roster Ranking, Playing Time and chart enlargement.
- Added Home navigation and JSON file loading inside the statistics interface.

## Data integration

`statistics/adapter.js` replaces the report's hard-coded dataset and role table. It accepts the current `volley-live-capture` version 1 document and derives the report model from:

- `match.team.roster` and positions;
- `match.startingRotation` and setter identity;
- `match.firstRally`;
- `match.subs[]`;
- `events[]`, including set, player, action, evaluation, winner and score.

The adapter groups sequential contacts until a `winningTeam` closes the rally. It derives serve/reception phase, side-out, break point, lost rally, clockwise rotation, on-court snapshots and standard libero replacement. Source values remain authoritative; UI colors are derived only after normalization.

## Reference fixture

The exact file `statistics/data/As_cannes_vs_Frejus_2026-11-15.json` is bundled and used when no live match is stored. It produces:

- 2 sets;
- 93 rallies;
- 93 displayed source actions;
- 9 roster players and one opponent row;
- the recorded substitution in set 2.

Because the Capture v1 fixture stores only the terminal action of each rally, the UI displays an explicit coverage warning. It does not synthesize missing contacts.

## Loading priority

1. JSON selected in the statistics interface;
2. current Volley Live Capture local stores;
3. bundled reference JSON fetched from the PWA;
4. embedded copy of the same fixture when `fetch` is unavailable (for example `file://`).

## Offline integration

The service worker cache is `volley-live-capture-v1.9.0` and precaches the statistics HTML, adapter and reference JSON.

## Verification

- JavaScript syntax checks for `adapter.js` and all inline scripts.
- HTML duplicate-ID check.
- Adapter validation against the supplied reference JSON.
- Automated browser checks for Home navigation, reference rendering and current-store rendering.
- Existing regression suite retained.
