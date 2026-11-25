# LIVE TIMELINE layout — v1.16.1

Source: `time line2.docx`.

## Geometry contract
- Desktop score-spine center: 61–64% of the timeline board width.
- AWAY delta-lane left edge: board left + 11–14 px, including the border measurement.
- Maximum AWAY delta bar: same left edge as the AWAY delta lane.
- HOME card: content width, always smaller than its lane when space is available.
- HOME card horizontal content insets: balanced within 1 px; CSS value 14 px per side.

## Responsive contract
The view remains landscape-first. Below 780 px, title, columns, list and footer retain a 760 px internal minimum width while `.timeline-board` owns horizontal scrolling. This prevents document-level overflow on Android portrait and keeps the AWAY edge available at the initial scroll position.

## Data and feature contract
This release changes presentation only. Archive normalization, rally derivation, SO/BP score treatment, action outcome colors, event validation, filters, last-point marking and navigation are unchanged.
