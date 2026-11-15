# Volley Live Capture – iOS Implementation Specification (v1.3.2)

## 1. Target
iPhone, Safari / Home Screen web app (standalone PWA). No App Store, no Xcode, no account.

## 2. Installation model
- Hosted on HTTPS (e.g. GitHub Pages); installed with **Share → Add to Home Screen**.
- `index.html` head: `apple-mobile-web-app-capable`, title *Volley Live*, `apple-touch-icon` (180 px),
  `viewport-fit=cover`, link to `manifest.webmanifest`.
- Service worker on HTTPS / localhost only; cache-first; cache `volley-live-capture-v1.3.2`;
  old caches deleted on activation, so the update applies at the next launch with network.

## 3. Detail level drop-down on iOS (v1.2.0)
| Point | Implementation |
|---|---|
| Control | Native `<select id="suLevel">`: iOS opens its own picker wheel |
| No zoom on focus | `font-size: 18px` (≥ 16 px) |
| Touch size | `min-height: 52px`, full width |
| Read-back | Description line `#suLevelHint` under the list |
| Persistence | Written in the match at START SET 1; not editable afterwards |

## 4. Capture ergonomics per level (390 × 844 portrait)
| Level | Step 1 | Step 2 | Step 3 |
|---|---|---|---|
| Basic | 2 full-width team buttons, 96 px high (own team navy, opponent dark grey) | Point / Error, 2 columns, 84 px | — |
| Intermediate | Court 3 × 2 + bench + ADVERSE | Point / Error, 2 columns, 84 px | — |
| Advanced | Court 3 × 2 + bench + ADVERSE | Action list (★ most probable) | Neutral / Point / Error |

Intermediate / Advanced: a full-width SERVICE (green) / RECEPTION (amber) badge sits directly above the NET,
readable at a glance from the bench. UNDO LAST stays centred below the step area; SAVE .JSON / REPORT .HTML at the bottom of the page.

## 5. iOS constraints and design answers
| Constraint | Answer |
|---|---|
| Safari and Home Screen app have separate storage | Always start from the icon (hint in a Safari tab) |
| iOS may purge data of unused web apps | SAVE .JSON after each set; OPEN MATCH .JSON restores everything, level included |
| No direct file system access | Share sheet (*Save to Files*, AirDrop, Mail); download fallback elsewhere |
| Notch and home indicator | `env(safe-area-inset-*)` paddings |
| Touch accuracy | Large buttons, `touch-action: manipulation` |
| Gym lighting | High contrast, scoreboard on black: green ahead / red behind / white tied |
| Screen lock during a match | Recommend Auto-Lock = Never |

## 6. Acceptance on a real iPhone
1. Install / update: Home shows **v1.3.2**.
2. SETUP 1: the Detail level list opens the iOS wheel without page zoom; default *Advanced*.
3. Basic: START SET 1 from SETUP 1; 10 rallies in 2 taps; kill the app, reopen → score and level kept.
4. Intermediate: court shown, Point / Error only, side-out rotates the court, one substitution.
5. Advanced: identical to v1.1.x.
6. SAVE .JSON → Save to Files; OPEN MATCH .JSON restores the level; REPORT .HTML matches the level.
7. Airplane mode → restart from the icon → the app opens.

## Focus checkbox on iOS (v1.3.2)
- Native `<input type="checkbox">`, 22 px, `accent-color` green; label "Focus" makes the whole line tappable.
- Non-focus court cells use `pointer-events:none` except in substitution mode, so a mistaken tap does nothing.
- TEAM button full width, ≥ 52 px high, above ADVERSE.
