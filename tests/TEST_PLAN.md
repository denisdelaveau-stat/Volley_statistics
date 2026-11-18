# Volley Live Capture v1.6.8 — Automated Test Plan

## Environment
- Python + pytest + Playwright/Chromium.
- Primary viewport: 390 × 844 CSS px, device scale factor 2.
- Offline-capable single-file application shell.

## Automated scope
| Scenario | Acceptance |
|---|---|
| UI-BAS-01 | Basic scoring, ownership text and Undo remain correct |
| UI-INT-01/02 | Intermediate player focus and team/adverse capture remain correct |
| UI-ADV-01/02/03 | Fixed action order and combined result entry remain correct |
| UI-ADV-POS-01/02 | Expected, rare and blocked position guidance remains correct |
| UI6-UNDO-01 | UNDO remains 122 × 36 CSS px |
| UI6-HIS-01 | History stays collapsed by default and uses semantic badges |
| UI6-TEAM-01 | Three independent rounded result blocks remain intact |
| UI7-NET-01 | Net background is transparent so the page background shows through; mesh, tape, posts, antennas and 28 px proportion remain |
| UI7-ACT-01 | Six Advanced labels have no player silhouette icons; colour families and lighter rare rows remain; Reception is not truncated |
| UI6-ICON-01 | Existing PWA artwork and icon dimensions remain unchanged |
| Specification package | Document version 1.8; v1.6.8 corrections are specified; 11 original inline images and 22 media entries remain |

## Manual iPhone checks
1. Deploy the whole folder and verify `v1.6.8` on Home after the service-worker refresh.
2. Verify the light page background remains visible through the volleyball net in Basic, Intermediate and Advanced modes.
3. Verify Advanced labels at 390 px and in landscape: no player silhouettes and no truncated label, especially `Reception`.
4. Verify Attack/Block orange, Defence/Reception green and Service/Set blue label families; rare legal actions remain lighter.
5. Confirm safe-area layout, VoiceOver labels, offline relaunch and persistent match data.
