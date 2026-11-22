# LIVE TIMELINE alignment contract — v1.16.2

## Horizontal order
Safety inset -> proportional AWAY delta -> constant gap -> A marker -> 8 px gap -> cyan connector -> score/cyan spine -> unchanged HOME container/card.

## Geometry
- Desktop score-spine center: 44-48% of timeline-board width.
- v1.16.1 comparison band: 61-64%; the new spine is materially left-shifted.
- Maximum AWAY delta left edge: board left + 11-14 px including border measurement.
- AWAY delta alignment: right edge fixed; maximum fills the complete lane.
- Delta-to-marker gap: 12 px desktop, 8 px at <=1100 px.
- Delta center Y equals A-marker center Y within 1 px.
- All A markers share one X coordinate within 1 px.
- A-marker-to-connector gap: 8 px.
- Connector right edge equals score-pill left edge within 1 px.

## HOME invariant
Compared with the frozen v1.16.1 baseline, HOME card and child width/height, child-relative X/Y, padding, gap, display, colors, text order and score-relative offset remain identical within 1 px. Only the common global X translation is allowed.

## Responsive contract
- 1536x1024 and 1024x768: score and HOME cards are completely inside the board.
- 412x915: the document does not overflow; the 760 px landscape-first timeline remains inside the board scroller, and score/HOME are fully reachable by horizontal scrolling.
