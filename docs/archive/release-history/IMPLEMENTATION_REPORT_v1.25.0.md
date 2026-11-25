# Implementation report — VolleyLive v1.25.0

## Source baseline

Implemented from the verified complete v1.24.0 package. Its archive SHA-256 was checked before extraction.

## Architecture

- `index.html` owns the Home, Setup & Capture, Insights & Viewing, Match Capture, Match Library, Team Management, Settings, and Coach View shells.
- `match-hub.js` is now the navigation and shared-library controller. It preserves the official capture keys, history, JSON validation, import conflict handling, selected-match persistence, and report exports.
- `coach.js` accepts the selected read-only replay and returns to Match Library.
- `spectator.html` / `spectator.js` continue to consume the selected official JSON for Scores, Timeline, Graph, and Ranking.
- `statistics/adapter.js` remains the shared normalization/validation boundary. The Advanced Statistics page itself is removed.

## Data rules

- Official write operations remain confined to New Match / Continue Capture.
- Match Library stores selection and imported read-only archives without rewriting the active official match.
- Coach View, Spectator View, and report exports read the selected raw document and event history.
- Empty states display 0, NA, or an explicit zero-match message; no sample match is injected.

## Accessibility and responsive behavior

- All new controls have at least 44 px touch targets.
- Focus-visible outlines, semantic headings, status regions, dialog labels, and reduced-motion handling are included.
- Layouts are defined for phone, tablet, and short landscape viewports.
- Navigation avoids red, green, and yellow; cyan identifies write navigation and violet identifies read-only navigation.

## Removed Advanced Statistics assets

Removed: `statistics/index.html`, the Advanced Statistics implementation document, v1.22 screenshots, Advanced Statistics visual baselines, and dedicated route/tests. Shared adapter and fixture assets were deliberately retained.

## Validation

- 152 tests passed with no failures.
- JavaScript syntax and offline asset checks passed.
- Phone, tablet, and landscape navigation screenshots were generated and inspected.
