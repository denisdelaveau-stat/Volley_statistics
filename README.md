# Volley Live Capture v1.22.0

Offline-first volleyball capture, coach, statistics and spectator application.

## v1.22.0 highlights

- Advanced Statistics now renders one complete timeline only.
- The timeline visual system is aligned with Coach View.
- Every action remains filterable and linked to score, rotation, phase, rally, and player context.

## v1.21.0 highlights

- Home now contains the approved **MATCH HUB** hierarchy: New Match, Continue Match, View Match, Recent Matches, and Import match.
- Continue Match uses only persisted active status and official match/event data; absent values stay explicitly unavailable.
- Recent completed/imported matches are sorted by effective date, limited to two on Home, and opened read-only by stable ID.
- New Match protects an existing active match from silent overwrite.
- JSON import validates shared Capture v1 / VolleyLive v2 structures, enforces a 10 MB limit, rejects unsafe keys, and handles duplicate IDs without silent replacement.
- Coach View, Advanced Statistics, spectator score/timeline/graph/ranking, capture, HISTORY Delete, responsive layouts, and offline operation are retained.
- Full automated and visual regression result: **146 passed**, no failures.

## Run locally

```bash
python3 serve_local.py
```

Then open the local URL shown by the server.

## Validate

```bash
python3 -m pytest -q
node --check match-hub.js
node --check spectator.js
node --check spectator-live-config.js
node --check statistics/adapter.js
node --check coach.js
node --check sw.js
```


## Current release documents

- `RELEASE_NOTES_v1.22.0.md`
- `IMPLEMENTATION_REPORT_v1.22.0.md`
- `COPY_INSTRUCTIONS_v1.22.0.md`
