# Release notes — Volley Live Capture v1.16.1

## LIVE TIMELINE layout refinement
- The score spine is intentionally right-shifted to approximately 63% of the desktop board width. The timeline is no longer centered on the page.
- The AWAY lane uses the available left side and starts at the board's 12 px content inset. A maximum-width AWAY delta bar aligns with that left edge.
- HOME action cards no longer fill the available lane. Each card wraps its player circle, name and skill label, subject to a safe maximum name width.
- HOME card side padding is symmetric: 14 px in CSS (15 px measured from the outer border to content).
- The vertical cyan spine is attached to every score node, so it remains exactly aligned with the score pills at desktop, tablet and horizontally scrolled mobile widths.

## Preserved behavior
- AWAY point/fault circles, HOME action colors, split score highlights, delta calculations, filters, DERNIER POINT and replay status remain unchanged from v1.16.0.
- OPEN ARCHIVES, LIVE SCORE, LIVE TIMELINE, STATS, Capture, HISTORY Delete, COACH VIEW, LIVE COURT, PLAYER FOCUS, ADVANCED STATISTICS and offline operation are retained.
- Displayed match data continues to come only from the loaded official JSON/archive model.

## Web and Android validation
- Desktop acceptance viewport: 1536 × 1024.
- Tablet regression viewport: 1024 × 768.
- Android portrait acceptance viewport: 412 × 915. The page itself does not overflow; the landscape-first timeline scrolls inside its board and controls remain at least 44 px high.
- Visual baselines and automated geometry assertions are included in the complete source package.
- Offline cache: `volley-live-capture-v1.16.1`.
