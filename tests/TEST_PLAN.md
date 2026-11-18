# Volley Live Capture v1.6.10 — Automated Test Plan

## Environment
- Python + pytest + Playwright/Chromium.
- Primary viewport: 390 × 844 CSS px, device scale factor 2.
- Offline-capable single-file application shell.

## Automated scope
All v1.6.9 scoring, rotation, setup, history, Advanced-action, compact-score, net-post and BENCH-divider acceptance suites remain active.

| Scenario | Acceptance |
|---|---|
| MUI7-SCORE-01 | Five score blocks retain equal 5 px gaps and the service underline |
| MUI7-NET-01 | Both post/antenna elements remain contained within the 28 px net |
| MUI7-BENCH-01 | Intermediate/Advanced keep the dashed BENCH/input divider; Basic remains excluded |
| ICON10-01 | 180/32/192/512 px icons have exact dimensions, opaque RGB output, dark navy corners and no near-white outer band |
| ICON10-02 | Corrected 1254 px master preserves the supplied source interior while cropping the pre-rounded 96 px perimeter |
| PWA10-01 | HTML, manifest and service worker reference all icon assets and cache `volley-live-capture-v1.6.10` |
| Specification package | Document version 2.0 includes the v1.6.10 icon rule while retaining 11 original inline images and 22 original media entries |

## Manual iPhone checks
1. Remove the old shortcut, deploy all v1.6.10 files and add the application to the Home Screen again.
2. Compare with `icon_ref.png`: navy reaches the launcher-mask edge, with no lighter perimeter or white/transparent corner.
3. Verify `v1.6.10` on Home and confirm offline relaunch and saved-match persistence.
4. Recheck compact score spacing, net-height posts and the Intermediate/Advanced BENCH divider.
