# Volley Live Capture v1.6.10 — iOS Implementation Specification

## Target
- iPhone/iPad Safari and Add to Home Screen PWA.
- Primary automated viewport: 390 × 844 CSS px.
- Minimum result touch target: 44 × 44 CSS px; implemented result targets are at least 60 px high.

## Installation/update
1. Host the complete folder through HTTPS.
2. Open once in Safari while online.
3. Share → Add to Home Screen.
4. For an update, deploy `index.html` and `sw.js` together.
5. Confirm cache ID `volley-live-capture-v1.6.10`, fully close the installed app, reopen and verify `v1.6.10` on Home.

## Touch and accessibility
- Capture controls use `touch-action: manipulation`.
- Error is left/red/✕; Point is right/green/✓. Icons and accessible labels prevent colour-only meaning.
- Continue is a dark-grey button with an inline circular dual-arrow SVG and action-specific `aria-label`.
- SERVICE/RECEPTION is a thinner non-interactive status element; RECEPTION is blue. Rotation is a separate centred black `Rot. Pn | Rn | Cn` line without a coloured background.
- The 400 ms guard starts after an accepted result; it does not block player → result speed.
- Undo is light orange.
- BENCH controls use compact 36 px visible height; confirm text and tap accuracy on the target device.

## Persistence caveat
Safari and the installed Home-screen PWA may use distinct storage contexts. Create the saved setup library in the context used courtside and export match JSON regularly.

## Offline verification
After one successful online load and service-worker activation, enable Airplane Mode, relaunch the Home-screen app, record and undo events, then confirm persistence after a second relaunch.


## v1.6.9 Home-screen artwork
Deploy `apple-touch-icon.png`, `favicon-32.png`, `icon-192.png` and `icon-512.png` with `index.html`, `manifest.webmanifest` and `sw.js`. Existing installations may retain the previous Home-screen artwork until the icon is removed and the app is added to the Home Screen again.

## v1.6.10 borderless icon assets
The touch and manifest files are full-square opaque RGB PNGs. Their navy field reaches the image boundary; no pale rim, transparent corner or baked rounded mask is permitted. If iOS displays stale artwork, remove and recreate the Home-screen shortcut.
