# Volley Live Capture v1.8.0 — Coach UI implementation report

Date: 20 November 2026

## Scope

This release implements the Coach interface requested in `Volley_Live_Live_Statistics_UI_Specification_v1.1.md` and follows the four supplied visual references: Coach Overview, Rotation Analysis, Player Performance and Player Detail.

## Home entry point

- Added `COACH VIEW` to Home.
- Coach View is available with or without a saved match.
- A saved match uses the current match, roster and event log.
- When no match exists, clearly labelled demonstration data keeps the interface reviewable.

## Coach Overview

- Shared match score, set score, current setter rotation and service/receive phase.
- Period selector for current set, full match and last ten rallies.
- Six primary KPIs: Side-out, Break point, Attack efficiency, Reception+, Serve and Block.
- Every percentage includes a numerator/denominator or an explicit limited-sample message.
- Current court, recent-rally momentum, one watch signal and one observed strength.
- Direct navigation to Rotations and Players.

## Rotations / Team

- P1–P6 one-tap selector and All / Reception / Serve filters.
- Context-preserving court reconstruction for the selected setter rotation.
- Side-out, Break point, Attack and Reception+ metrics.
- Transparent rally differential comparison and explicit best/watch summaries.

## Players and Player Detail

- On-court / all-player and role filters.
- Explainable ranking based only on `points − errors`; no unexplained composite score.
- Player summary for Attack, Reception, Serve, Participation and Contribution.
- Exact approved CTA label: `Voir le détail joueur`.
- Player Detail preserves the selected period, rotation, phase, player and skill state.
- Detail provides skill tabs, gesture breakdown, participation, direct points, per-set attack efficiency and recent actions.
- Browser Back and the in-page Back control restore Players context.

## Data processing

The Coach UI derives rally boundaries from scoring events, reconstructs serving state and rotations from the existing match configuration, and reuses the existing `volleyCapture.match.v1` and `volleyCapture.events.v1` stores. The portable match JSON schema remains version 1.

## Accessibility and responsive behaviour

- Native buttons and selects; visible keyboard focus.
- Player rows support Enter and Space.
- Player Detail CTA has a selected-player accessible name, loading state and duplicate-navigation guard.
- Decorative CTA icon and chevron are hidden from the accessibility name.
- Layout supports 320 CSS px through tablet/desktop and respects reduced-motion preferences.

## Offline/PWA

- Added `coach.css` and `coach.js` to the service-worker shell cache.
- Cache advanced to `volley-live-capture-v1.8.0`.

## Verification

- JavaScript syntax validated with `node --check coach.js`.
- HTML structure validated with no duplicate IDs.
- Playwright/pytest suite: **28 passed**.
- Visual inspection completed at 390 × 844 CSS px for Overview, Rotations, Players and Player Detail.
