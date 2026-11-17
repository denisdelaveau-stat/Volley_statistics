# Volley Live Capture v1.6.3

Offline-capable volleyball match capture web app for iPhone and tablet.

## v1.6.3 highlights
- The BENCH replacement-player and SUBSTITUTION controls are shorter, narrower and centred as a compact pair.
- The live header now shows only the rally score, with won-set badges on the outside of the two scores.
- A cyan line directly below the serving team's rally score identifies service ownership.
- The former match title, set-format/mode strip and primary Player instruction line are removed from the live capture header.
- v1.6.2 position-aware Advanced guidance remains unchanged: all six action rows stay visible, rare legal actions remain tappable, and Libero Attack/Block/Service remain blocked.

## Run locally
```bash
python3 serve_local.py
```
Open the displayed local URL in a browser. For iPhone use, deploy the folder over HTTPS and add the app to the Home Screen.

## Automated tests
```bash
python3 -m pytest -q tests
```
The suite uses Playwright/Chromium and validates Basic, Intermediate and Advanced capture, compact live-header/bench layout, substitutions, scoring, sets, report generation, offline cache and non-regression behavior.

## Data compatibility
Match/event JSON remains format version 1. Existing data from v1.6.2 and earlier requires no migration.

## iPhone update
Deploy the whole folder. The service-worker cache ID must contain `v1.6.3`. Open the hosted app online once, then fully close and reopen the Home-screen app. Verify `v1.6.3` on Home before courtside use.
