# Volley Live Capture v1.6.6

Offline-capable volleyball match capture web app for iPhone and tablet.

## v1.6.6 highlights
- More compact BENCH, NET, phase banner and TEAM/ADVERSE rows.
- Setup roster maximum extended to 30 players.
- Rotation line now shows setter position, rotation configuration and cycle: `Rot. P5 | R3 | C2`.
- RECEPTION is blue; Undo is light orange.
- Advanced action labels use orange, green and blue semantic groups while rare legal actions stay lighter.
- Live History shows only `#`, `Player`, `Action`, `Result`, `Score`; hidden time/rotation metadata remains in events.
- English Word UI specification version 1.6 preserves all original images; the screenshot PDF reflects the current UI.

## Run locally
```bash
python3 serve_local.py
```
Open the displayed local URL in a browser. For iPhone use, deploy the folder over HTTPS and add the app to the Home Screen.

## Automated tests
```bash
python3 -m pytest -q tests
```
The suite validates the three capture modes, scoring, rotation persistence, compact layout, semantic colours, setup limits, history columns, documentation integrity and offline cache.

## Data compatibility
Portable match JSON remains format version 1. Existing events retain `time` and integer `rotation`; these values are still saved for reports/statistics but are hidden from live History.

## iPhone update
Deploy the whole folder. The service-worker cache ID must contain `v1.6.6`. Open the hosted app online once, then fully close and reopen the Home-screen app. Verify `v1.6.6` on Home before courtside use.
