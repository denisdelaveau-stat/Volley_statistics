# LIVE SCORE placement — v1.19.1

The spectator tab order and calculations are unchanged. Component ownership is now:

## LIVE SCORE

1. Global VolleyLive header.
2. v1.19.0 score card with HOME crest/name at left, large current score and sets at centre, set-status badge, one service indicator, and AWAY crest/name at right.
3. MOMENTUM ACTUEL directly below the score card.

The legacy LIVE SCORE archive summary is removed. The document contains exactly one score card and one momentum card.

## LIVE TIMELINE

LIVE TIMELINE contains its existing order controls, action-count control and timeline board. It contains no score card and no MOMENTUM ACTUEL card. No other Timeline behavior is changed.

## Data rules retained

- Every displayed team name, logo/monogram, score, set count, status and service side comes from the loaded JSON.
- Momentum uses at most the last 8 valid points of the current set, begins after 4 points and declares advantage at 70%.
- H/A tiles are chronological from oldest to newest.
- Recalculation occurs after a point, correction, Undo and set transition.
- Empty states remain gray; HOME is left and AWAY is right.

## Visual acceptance

Verified at 390×844, 768×1024, 844×390 and 1536×1024. Checks cover crest presence, score and sets, set badge, score-before-momentum order, one score only, and no score/momentum card in LIVE TIMELINE.
