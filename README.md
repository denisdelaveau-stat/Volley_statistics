# Volley Live Capture v1.6.8

Offline-capable volleyball match capture web app for iPhone and tablet.

## v1.6.8 highlights
- Volleyball-net background is transparent, allowing the light grey page background to remain visible while retaining mesh, top tape, blue posts, red/white antennas and the same compact proportions.
- Advanced action player silhouettes are removed.
- Action-label colour families and lighter rare-action guidance are retained.
- Full action names remain readable, including `Reception`.
- Tests, English Word UI specification, screenshots, release notes and implementation report are updated together.

## Run locally
```bash
python serve_local.py
```
Open the printed URL from a browser on the same network.

## Test
```bash
pytest -q
```

## iPhone update
Deploy the whole folder. The service-worker cache ID must contain `v1.6.8`. Open the hosted app online once, then fully close and reopen the Home-screen app. Verify `v1.6.8` on Home before courtside use.
