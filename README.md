# VolleyLive v1.28.0

Offline-first volleyball capture, coach, spectator, library and reporting application.

## v1.28.0 highlights

- FOCUS, SPEED+ and FLOW can be switched directly during live capture.
- Mode switching preserves the match, score, event history, selected author and selected action.
- Runtime mode selection is intentionally absent from SETTINGS.
- All modes use the same fixed action grid and immediate result commit.
- Canonical runtime fields are added without breaking the historical event schema.
- Opponent A, atomic Undo, double-tap protection, role preferences, haptics and responsive layouts are covered.

## Run locally

```bash
python3 serve_local.py
```

## Validate

```bash
tests/run_v1_28_approved.sh
node --check runtime-input.js
node --check match-hub.js
node --check spectator.js
node --check statistics/adapter.js
node --check coach.js
node --check sw.js
```

## Current release documents

- `RELEASE_NOTES_v1.28.0.md`
- `IMPLEMENTATION_REPORT_v1.28.0.md`
- `COPY_INSTRUCTIONS_v1.28.0.md`
- `docs/VISUAL_VALIDATION_v1.28.0.md`
