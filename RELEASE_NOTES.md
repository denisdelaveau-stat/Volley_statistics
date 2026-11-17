# Release v1.6.5 — 17 November 2026

Volley Live Capture v1.6.5 is a documentation and package-integrity correction release. Runtime capture behavior and match-data compatibility are unchanged from v1.6.4.

## Corrected specification
- Document-control version is 1.5.
- `UI-ADV-POS-01` and `UI-ADV-POS-02` now appear only in section 10, Automated Acceptance Test Catalogue.
- Section 8, Target UI Matrix, again contains mode/interaction rows only.
- All 11 original inline source images and all 22 embedded media package entries are preserved byte-for-byte.
- The same corrected specification is supplied in `docs/` and at package root for the separate OneDrive copy.

## Current screenshots
- The obsolete `Volley_Live_Capture_Screens_v1.3.2.pdf` is removed.
- `Volley_Live_Capture_Screens_v1.6.5.pdf` contains current captures for Basic, Intermediate, Advanced, the compact live header and Setup 1.

## Version and compatibility
- Visible application version: `v1.6.5`.
- Service-worker cache: `volley-live-capture-v1.6.5`.
- Portable match JSON remains format version 1; no migration is required.

## Verification
Run `python3 -m pytest -q tests`. Manual iPhone Safari/Home-screen, offline relaunch, VoiceOver and portrait/landscape checks remain recommended on the target device.
