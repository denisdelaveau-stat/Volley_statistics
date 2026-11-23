# Volley Live Capture v1.23.0

Offline-first volleyball capture, coach, statistics and spectator application.

## v1.23.0 highlights

- Home now provides five first-level sections: MATCH HUB, COACH VIEW, TEAMS MANAGEMENT, ADVANCED STATISTICS, and SETTINGS.
- MATCH HUB opens a dedicated screen that preserves NEW MATCH, CONTINUE MATCH, VIEW MATCH, RECENT MATCHES, and Import match.
- Back navigation and focus restoration are deterministic; existing workflows and stored match data remain compatible.
- Complete automated result: **147 passed**, no failures.

## v1.22.0 highlights

- Advanced Statistics renders one complete Coach View-aligned timeline.
- Every action remains filterable and linked to score, rotation, phase, rally, and player context.

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

- `RELEASE_NOTES_v1.23.0.md`
- `IMPLEMENTATION_REPORT_v1.23.0.md`
- `COPY_INSTRUCTIONS_v1.23.0.md`
- `docs/VISUAL_VALIDATION_v1.23.0.md`
