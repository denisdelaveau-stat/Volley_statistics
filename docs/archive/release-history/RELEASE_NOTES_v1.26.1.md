# VolleyLive v1.26.1 — SPECTATOR VIEW Timeline aligned to spectator2 references

## Timeline

- Player names are shown in full on one line; the HOME action card expands to the content instead of wrapping or truncating the name.
- HOME and AWAY connectors use the same fixed 40 px length at every responsive breakpoint.
- Connectors directly join the action card or AWAY marker to the score-side element, with no intermediate gap.
- Delta bars no longer scale with the score gap: every non-zero delta uses one fixed 38 × 28 px square and keeps the exact `+N` value inside.
- The delta square is directly attached to the score block; an empty delta lane collapses so the connector reaches the score directly.
- HOME and AWAY header boxes are centered and reduced to 50% of their previous track width.
- The central score spine, rally captions, latest-point marker, score colours, maximum-gap outline and accessible labels are retained.

## Compatibility

Capture-v1 and unified v2.1 match documents, shared set navigation, SCORE, GRAPH, RANKING, Match Library routing, Coach View, reports, offline PWA behavior and all v1.26.0 functionality remain available.

## Validation

The automated suite includes focused v1.26.1 checks for one-line names, 40 px connectors, fixed 38 px delta squares, zero-gap score attachment and half-width HOME/AWAY header boxes. Ten responsive Timeline baselines cover desktop, tablet, landscape and phone layouts.
