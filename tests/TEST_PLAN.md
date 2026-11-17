# Volley Live Capture v1.6.3 — Automated Test Plan

## Environment
- Python 3, `pytest`, Playwright and Chromium.
- Primary viewport: iPhone 390 × 844 CSS px, device scale factor 2.
- Run from the package root: `pytest -q tests`.
- Optional browser override: `CHROMIUM_PATH=/path/to/chrome pytest -q tests`.

## Coverage
| Requirement | Automated coverage |
|---|---|
| UI-BAS-01 | Four Basic Error/Point semantics, icon, colour, placement and minimum target size |
| UI-INT-01/02 | Focus selection, selected highlight, player attribution, automatic clear, TEAM fallback, ADVERSE direct entry when no Focus player is selected |
| UI-INT-UI1 | SUBSTITUTION inside BENCH; selected player number/name in the tracked-team bar; ADVERSE faded, disabled and event-blocked until selection clears |
| UI-BENCH-02 | Replacement-player and SUBSTITUTION controls are compact, side by side, centred and at least 44 CSS px high |
| UI-HDR-01 | Score-only live header; external won-set badges; removed title/metadata/Player instruction; service underline follows service ownership |
| UI-ADV-01/02/03 | Fixed action order, combined result entry, neutral Continue, unavailable Point cells |
| UI-ADV-POS-01/02 | Position/action matrix for Setter, OH, OPP, MB and Libero; expected/rare/blocked styling; rare legal actions remain tappable; Libero Attack/Block/Service cannot create events |
| UI-SUB-01 | Rally capture suspended while substitution mode is active |
| UI-UNDO-01 | Exactly the latest event is removed and a finished set is unlocked when applicable |
| UI-GRD-01 | One accepted event for rapid repeated result taps; no delay between player and result taps |
| UI-PHA-01 | Read-only phase banner follows service state |
| Regression | Set win at 26–24, setup library, ROTATE +1, report generation, PWA cache version, no JavaScript errors |

## Manual iPhone checks
1. Install/update from HTTPS and verify `v1.6.3` on Home.
2. Confirm the compact score header and centred BENCH pair at 390 × 844 and in landscape.
3. Confirm safe-area layout and all result targets in portrait and landscape.
4. Confirm VoiceOver announces team/action plus Error, Point or Continue.
5. Capture several rallies offline, close the Home-screen app, reopen, and verify persistence.
