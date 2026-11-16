# Volley Live Capture v1.6.0

Offline-capable volleyball match capture web app for iPhone and tablet.

## v1.6.0 highlights
- Implements `docs/Volley_Live_Capture_UI_Functional_Specification_EN_With_Original_Images.docx`.
- Basic: one-tap team capture with Error (red ✕) on the left, team name in the centre, Point (green ✓) on the right, and NET separation.
- Intermediate: optional single Focus-player selection followed by the tracked-team result; direct TEAM and ADVERSE entry remains available.
- Advanced: player selection followed by one combined Action/Result tap; unsupported Point combinations are unavailable.
- Advanced TEAM non-Focus and ADVERSE results are recorded in one tap.
- Continue uses a reusable inline circular dual-arrow SVG and persists `neutral` without changing the score.
- Undo is neutral grey/white; red is reserved for Error.
- The 400 ms protection starts only after an accepted result, so it does not slow the two-tap Advanced flow.
- Saved teams, starting sevens, rotations and ROTATE +1 from v1.5.0 are retained.

## Run locally
Serve this directory over HTTP/HTTPS for PWA/service-worker testing:

```bash
python serve_local.py
```

## Tests
Browser automation requires Python, `pytest`, Playwright and Chromium:

```bash
pytest -q tests
```

See `tests/TEST_PLAN.md` for coverage and manual iPhone checks.

## iPhone update
Deploy the whole folder. The service-worker cache ID must contain `v1.6.0`. Open the hosted app online once, then fully close and reopen the Home-screen app. Verify `v1.6.0` on Home before courtside use.
