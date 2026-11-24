# VolleyLive v1.27.0

Offline-first volleyball capture, coach, spectator, library and reporting application.

## v1.27.0 highlights

- MATCH LIBRARY now follows the approved single-row selector design.
- All / Live / Finished lifecycle filters include inline counters and persist locally.
- Selection is shown directly on one row; the details sheet contains origin, access and source metadata.
- Coach View is the primary fixed action, with Spectator and Reports as outlined secondary actions.
- Keyboard listbox navigation, narrow-phone single-line behavior, empty states and safe-area handling are covered.
- Existing v1.26.1 capture, import, duplicate, Coach, Spectator, reporting and offline workflows are preserved.

## Run locally

```bash
python3 serve_local.py
```

## Validate

```bash
python3 -m pytest -q
node --check match-hub.js
node --check spectator.js
node --check statistics/adapter.js
node --check coach.js
node --check sw.js
```

## Current release documents

- `RELEASE_NOTES_v1.27.0.md`
- `IMPLEMENTATION_REPORT_v1.27.0.md`
- `COPY_INSTRUCTIONS_v1.27.0.md`
- `docs/VISUAL_VALIDATION_v1.27.0.md`
