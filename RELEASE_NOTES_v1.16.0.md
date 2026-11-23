# Release notes — Volley Live Capture v1.16.0

## LIVE TIMELINE opened from SPECTATOR VIEW
- AWAY terminal actions are represented only by an `A` circle: green when AWAY wins the point through its action, red when an AWAY error awards the point to HOME. No AWAY card, player name, action label or winning-action wording is rendered.
- HOME keeps the player circle, jersey number, role and name. The action label is reduced to the skill name only (for example `ATTAQUE`), with green POINT, red ERROR and blue NEUTRAL treatment. Qualifiers such as `GAGNANTE` and `OUT`, plus check/cross icons, are removed.
- HOME player circles use the shared saturated role palette: OPP blue, SET yellow, OH red/pink, MB green and LIB grey, with WCAG AA text contrast.
- SO/BP/L badges are removed from the rows and footer. Rally phase remains derived from the archive and is exposed only through row data and score treatment.
- The score is split into AWAY-left and HOME-right halves. Only the scoring half is colored: SO yellow for either team, HOME BP green, AWAY BP red. The other half remains black.
- Connectors are vertically centered on the score pill, stop exactly at its edge and join the HOME card or AWAY circle without overlap.
- DERNIER POINT, order/window filters, ARCHIVE/REPLAY status, AWAY-first order, delta lanes and all existing spectator navigation remain available.

## Data and compatibility
- Every displayed value is derived from the loaded official `volley-live` v2.1 or supported Capture v1 archive.
- Basic score-only archives do not invent action labels or cards.
- SPECTATOR VIEW, LIVE SCORE, LIVE TIMELINE, STATS, Capture, HISTORY Delete, HOME | ERREUR | AWAY, COACH VIEW, LIVE COURT, PLAYER FOCUS, ADVANCED STATISTICS and offline operation are retained.

## Verification
- 90 automated tests passed, including the new timeline acceptance scenarios and all prior regressions.
- Visual regression baseline: 1536 × 1024 landscape.
- Responsive/accessibility checks include 1024 × 768 tablet geometry, minimum 44 px controls and contrast of at least 4.5:1.
- Offline cache: `volley-live-capture-v1.16.0`.
