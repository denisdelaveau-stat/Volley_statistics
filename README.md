# Volley Live Capture v1.6.2

Offline-capable volleyball match capture web app for iPhone and tablet.

## v1.6.2 highlights
- Advanced always displays **Attack, Block, Defence, Reception, Service, Set** in a fixed order.
- The selected player's position drives visual guidance: expected actions are fully emphasised; rare legal actions are attenuated but remain tappable.
- Libero Attack, Block and Service are disabled and cannot record an event.
- The approved matrix and rules are included in `docs/Volley_Live_Capture_UI_Functional_Specification_EN_With_Original_Images.docx`.
- The v1.6.1 Intermediate behavior is retained: SUBSTITUTION sits in BENCH; selecting a Focus player shows the player's number/name and locks ADVERSE until the entry clears.
- Basic and Advanced TEAM/ADVERSE one-tap result bars, Continue (`neutral`), neutral Undo and the 400 ms post-result guard are retained.

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
Deploy the whole folder. The service-worker cache ID must contain `v1.6.2`. Open the hosted app online once, then fully close and reopen the Home-screen app. Verify `v1.6.2` on Home before courtside use.
