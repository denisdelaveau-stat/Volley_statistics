# Implementation report — Volley Live Capture v1.13.0

## Scope

Built from v1.12.6. The Capture interface, Home actions, rotations, shared JSON adapter and Advanced Statistics remain present. The Coach interface adds two landscape views matching the supplied reference mockups.

## LIVE COURT

- Fourth Coach tab, landscape-only.
- 1280 × 800 dark-blue/cyan layout with real score, set, setter rotation, phase, SO and BP.
- Exactly six on-court cards in 4-3-2 / 5-6-1 positions.
- Shared pastel role chips: OPP blue, SET yellow, OH red, MB green, LIB grey.
- Independent Good/Watch/Difficulty status border, arrow and alert strip.
- PTS, ERR and role-specific EFF calculated per player/current set.
- Last 12 real rallies, oldest to newest, with the latest marked Now.
- Capture-v1 substitutions are applied at their recorded event index before current-court rendering.

## PLAYER FOCUS

- Opens from a LIVE COURT card and from the existing player-detail call to action.
- Direct Court return and circular previous/next navigation over current on-court players.
- Player status card and current position mini-court.
- ATTACK, BLOCK, RECEPTION and DEFENSE 2 × 2 panel grid.
- Five latest actions per skill use only real JSON events: point/check, neutral/dash, error/cross.
- Per-skill cumulative curves are linked to real rally records. They include a filled area, 50% guide and circled latest point.

## Data and provenance

- PTS, ERR, EFF, ATT, KILL, TOUCH, DIG, REC, SO and BP are calculated from the loaded records.
- POS and GOOD are derived as non-error contacts, consistent with the existing Advanced Statistics convention.
- Reception and defense efficiency use the same derived convention. Derived values carry `≈` and a tooltip.
- BLK remains `NA` because opponent block detail is absent from the current contract.
- Capture-v1 matches without intermediate contacts show `NA` curves instead of invented flat values.
- The empty state contains only neutral grey `0` and `NA` values.
- Status/outcome rules are centralized in `coach-live-config.js`; defaults match section 7 of the supplied spec and remain to be validated with the coach.

## Visual validation

Viewport: 1280 × 800, no horizontal or vertical overflow.

- `docs/visual-validation/live-court-v1.13.0-1280x800.png`
- `docs/visual-validation/player-focus-v1.13.0-1280x800.png`
- `docs/visual-validation/live-court-reference-vs-v1.13.0.png`
- `docs/visual-validation/player-focus-reference-vs-v1.13.0.png`

## Automated validation

- JavaScript syntax: PASS (`coach.js`, `coach-live-config.js`, `statistics/adapter.js`).
- HTML duplicate IDs: none.
- Full pytest/Playwright suite: **60 passed**.
- New coverage: navigation, previous/next, Good/Watch/Difficulty, alert strips, empty states, Capture-v1 NA curves, v2.1-derived POS/GOOD/trend, five-action history, SVG curves, portrait guidance and 1280 × 800 geometry.
- Offline cache: `volley-live-capture-v1.13.0` includes `coach-live-config.js`.
