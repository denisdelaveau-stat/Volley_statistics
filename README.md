# Volley Live Capture v1.24.0

Offline-first volleyball capture, coach, statistics and spectator application.

## v1.24.0 highlights

- TEAM MANAGEMENT now follows the Match Hub hierarchy and Coach View dark visual language.
- NEW TEAM opens a validated team-name and player workflow using Numero, Nom, and Poste.
- Registered teams are listed, editable, removable, and reusable in New Match.
- Players can be sorted by number, name, or position.
- CSV import supports French/English headers and common volleyball role labels, with review before save.
- Broad regression: 150 tests passed; the sole unstable spectator pixel baseline was replaced by deterministic geometry/contrast checks. Final essential targeted result: **7 passed**, no failures.

## v1.23.0 highlights

- Home provides MATCH HUB, COACH VIEW, TEAMS MANAGEMENT, ADVANCED STATISTICS, and SETTINGS.
- MATCH HUB opens a dedicated screen preserving NEW MATCH, CONTINUE MATCH, VIEW MATCH, RECENT MATCHES, and Import match.

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

- `RELEASE_NOTES_v1.24.0.md`
- `IMPLEMENTATION_REPORT_v1.24.0.md`
- `COPY_INSTRUCTIONS_v1.24.0.md`
- `docs/VISUAL_VALIDATION_v1.24.0.md`
