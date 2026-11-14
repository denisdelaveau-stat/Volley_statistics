# Volley Live Capture – iOS Implementation Specification (v1.1.3)

## 1. Target
iPhone, Safari / Home Screen web app (standalone PWA). No App Store, no Xcode, no account.

## 2. Installation model
- Hosted on HTTPS; installed with **Share → Add to Home Screen**.
- `index.html` head: `apple-mobile-web-app-capable`, `apple-mobile-web-app-title = Volley Live`,
  `apple-touch-icon` (180 px), `viewport-fit=cover`, link to `manifest.webmanifest`.
- Service worker registered only on HTTPS or localhost; cache-first; on activation, old caches
  are deleted, so a new `CACHE` name forces the update at the next launch with network.

## 3. iOS constraints and design answers
| Constraint | Answer |
|---|---|
| Safari and Home Screen app have separate storage | Always start from the icon (told on Home screen). |
| iOS may purge website data of unused apps | JSON export after each set; OPEN MATCH .JSON restores everything. |
| No direct file system access | Export via Blob download → Share sheet → *Save to Files* / AirDrop / mail. |
| Notch and home indicator | `env(safe-area-inset-*)` paddings on full-screen views. |
| Touch accuracy on the bench | Buttons ≥ 54 px high, `touch-action: manipulation` (no double-tap zoom delay). |
| Sun / gym light | High-contrast colours, red-on-black scoreboard. |

## 4. UI rules for iPhone (390 × 844 reference)
- Portrait first; capture panel fits without scrolling for the 3-step entry.
- Role colours: Setter purple, OH blue, MB orange, OPP red, Libero cyan.
- Charts are SVG; wide charts scroll horizontally inside their card, legends stay compact (34 px swatches).

## 5. Data safety on iPhone
- `localStorage` written after every rally (no loss if the app is killed).
- Recommended routine: SAVE .JSON at each set end; REPORT .HTML at match end.

## 6. Acceptance on a real iPhone
1. Install from Safari, start from icon with network, version **v1.1.3** shown.
2. Airplane mode → restart from icon → Home opens.
3. Create a match, enter 10 rallies, kill the app, reopen → score kept.
4. SAVE .JSON → Save to Files; REPORT .HTML opens in Files / Safari.
5. Scoreboard digits are red on black; attacker legends show player names.
