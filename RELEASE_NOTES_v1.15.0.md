# Release notes — Volley Live Capture v1.15.0

## Action-entry court
- Replaces the pale player-circle fills with a saturated, role-consistent palette: OPP blue, SET yellow, OH red/pink, MB green and LIB grey.
- Keeps dark role-matched number and role text; every pair is WCAG AA at 4.5:1 or better.
- Reduces the six circles to `clamp(72px, 23.5vw, 96px)` at standard mobile widths, increases court margins and row spacing, and preserves exactly two rows of three.
- Retains the orange court, white dashed front/back separator, no net, and the **Changer de joueur** control below the court.

## Spectator archive view
- **OPEN ARCHIVES** accepts official `volley-live` v2.1 archives and supported Capture v1 archives, validates them, and opens `spectator.html` directly on **LIVE TIMELINE** without replacing the local capture match.
- Adds spectator navigation: **LIVE SCORE | LIVE TIMELINE | STATS**.
- Adds AWAY-first scoreboard, current set, sets won, vertical cyan rally spine, AWAY : HOME score pills, SO/BP/L chips, last-point marker, one terminal-action card, and proportional shared-scale delta lanes.
- Adds persistent order and window filters: **Plus anciennes / Plus récentes** and **5 / 10 / 20 / Tout le set**.
- Archive status is explicitly **ARCHIVE / REPLAY D’ARCHIVE**, never “Suivi en direct”.
- Basic score-only data produces timeline rows without invented event cards.
- Invalid archives show a recoverable error state; service actions attributed to the non-serving team are flagged.
- The view re-renders from corrected archive data through the storage event or `VolleySpectator.setArchive()`.

## Compatibility retained
HISTORY Delete with rollback, fixed HOME | ERREUR | AWAY, COACH VIEW, LIVE COURT, PLAYER FOCUS, ADVANCED STATISTICS, the v2.1 reference fixture and offline operation remain available.

## Offline cache
The service-worker cache is `volley-live-capture-v1.15.0` and includes the spectator HTML, CSS and JavaScript.
