# Volley Live Capture v1.5.0 - iOS Implementation Specification

## Target
iPhone/iPad Safari and Add to Home Screen PWA. Primary test viewport: 390 x 844 CSS pixels.

## Installation/update
1. Host the complete folder through HTTPS.
2. Open once in Safari while online.
3. Share -> Add to Home Screen.
4. For an update, deploy `index.html` and a `sw.js` whose cache ID is `volley-live-capture-v1.5.0`, open online once, fully close the installed app and reopen it.

## Persistence caveat
Safari and the installed Home-screen PWA may use distinct storage contexts. Create/save the team/lineup/rotation library in the context used courtside. Export match JSON regularly for portability.

## Touch UX
- `touch-action: manipulation` on capture controls.
- 400 ms fast-double-tap protection on capture controls from v1.4.1 is retained.
- Basic/Intermediate are optimized for one-tap input.
- v1.5.0 saved setup controls are normal form controls and intentionally are not part of rally double-tap suppression.

## Offline
App-shell files must remain in the service-worker precache list. Test offline after one successful online load and service-worker activation.
