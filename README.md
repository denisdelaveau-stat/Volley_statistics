# Volley Live Capture v1.5.0

Offline-capable volleyball match capture web app for iPhone/tablet.

## v1.5.0 highlights
- Save/load/update/delete reusable teams (number, name, position, Focus).
- Save/load/update/delete starting sevens.
- Save/load/update/delete initial rotations.
- ROTATE +1 on initial position screen; six rotations return to the original position.
- Setup library stored independently from individual match data.
- Existing Basic / Intermediate / Advanced capture, scoring, substitutions, statistics, JSON and self-contained HTML report retained.

## Run locally
Serve this directory over HTTP/HTTPS (do not rely on opening `file://` for PWA/service-worker testing).

## Tests
See `tests/TEST_PLAN.md`. Browser automation requires Python, Playwright and Chromium.

## iPhone update
Use a service-worker cache ID containing `v1.5.0`. Open online once after deployment, then fully close and reopen the Home-screen app.
