# Volley Live Capture v1.6.10

Offline-first volleyball match capture for Basic, Intermediate and Advanced workflows.

## v1.6.10 highlights
- Rebuilt Apple touch, favicon and manifest icons from the supplied 1254 × 1254 `IMG_5596.PNG` source.
- Removed the pre-rendered pale outer rim and white corners: the navy background now reaches every edge of each opaque square PNG.
- Left corner rounding to iOS and other launchers; the files themselves contain no transparency or baked rounded mask.
- Retained all v1.6.9 Modification UI 7 changes: compact equal score spacing, net-height posts and the BENCH/input dashed divider.
- Updated automated tests, English Word specification, screenshot evidence, release notes and implementation report together.

## Run locally
```bash
python serve_local.py
```
Open the displayed local URL in a modern browser.

## iPhone update
Deploy the whole folder, including `sw.js` and `icons/`. Remove the old Home-screen shortcut if iOS still shows cached artwork, add the site to the Home Screen again, launch it online once, close it fully, and reopen it. Verify `v1.6.10` on Home.

Portable match data remains format version 1.
