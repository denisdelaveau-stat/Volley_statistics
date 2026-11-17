# Volley Live Capture v1.6.5

Offline-capable volleyball match capture web app for iPhone and tablet.

## v1.6.5 highlights
- Corrected the English Word UI specification (document version 1.5): `UI-ADV-POS-01/02` are now in the automated acceptance catalogue, not the Target UI Matrix.
- Preserved all 11 original inline images and 22 embedded media entries in the corrected Word document.
- Replaced the obsolete v1.3.2 screenshot PDF with current Basic, Intermediate, Advanced, compact-header and Setup 1 captures.
- Supplied the corrected Word specification in both `docs/` and package root.
- Capture behavior and match-data compatibility are unchanged from v1.6.4.

## Run locally
```bash
python3 serve_local.py
```
Open the displayed local URL in a browser. For iPhone use, deploy the folder over HTTPS and add the app to the Home Screen.

## Automated tests
```bash
python3 -m pytest -q tests
```
The suite validates Basic, Intermediate and Advanced capture, rotation persistence/history, configurable setup, compact live layout, substitutions, scoring, sets, report generation, offline cache, specification table placement and image preservation.

## Data compatibility
Portable match JSON remains format version 1. Existing events without `rotation` remain readable; saved setup teams without `maxPlayers` load with the compatible default.

## iPhone update
Deploy the whole folder. The service-worker cache ID must contain `v1.6.5`. Open the hosted app online once, then fully close and reopen the Home-screen app. Verify `v1.6.5` on Home before courtside use.
