# Volley Live Capture v1.6.2 — iOS Implementation Specification

## Target
- iPhone/iPad Safari and Add to Home Screen PWA.
- Primary automated viewport: 390 × 844 CSS px.
- Minimum result touch target: 44 × 44 CSS px; implemented result targets are at least 60 px high.

## Installation/update
1. Host the complete folder through HTTPS.
2. Open once in Safari while online.
3. Share → Add to Home Screen.
4. For an update, deploy `index.html` and `sw.js` together.
5. Confirm cache ID `volley-live-capture-v1.6.2`, fully close the installed app, reopen and verify `v1.6.2` on Home.

## Touch and accessibility
- Capture controls use `touch-action: manipulation`.
- Error is left/red/✕; Point is right/green/✓. Icons and accessible labels prevent colour-only meaning.
- Continue is a dark-grey button with an inline circular dual-arrow SVG and action-specific `aria-label`.
- SERVICE/RECEPTION is a non-interactive status element.
- The 400 ms guard starts after an accepted result; it does not block player → result speed.
- Undo is neutral grey/white.

## Persistence caveat
Safari and the installed Home-screen PWA may use distinct storage contexts. Create the saved setup library in the context used courtside and export match JSON regularly.

## Offline verification
After one successful online load and service-worker activation, enable Airplane Mode, relaunch the Home-screen app, record and undo events, then confirm persistence after a second relaunch.
