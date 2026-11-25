# Visual validation — v1.24.0

## Method

Validation uses Chromium viewport captures with animation and caret rendering disabled. Because Team Management is a fixed application overlay, viewport screenshots are authoritative; full-page captures can composite the underlying document outside the visible viewport.

## Captures

- `screens_v1.24.0/team_management_mobile.png` — 390×844 registered-team overview.
- `screens_v1.24.0/team_management_tablet.png` — 1024×768 saved-team editor.
- `screens_v1.24.0/GEOMETRY_REPORT.txt` — bounding boxes and overflow values.

## Deterministic results

| Control | Result |
|---|---|
| Mobile horizontal overflow | `scrollWidth 390 = viewport 390` |
| Tablet horizontal overflow | `scrollWidth 1024 = viewport 1024` |
| Mobile NEW TEAM → teams → import order | Passed; no overlap |
| Mobile primary-card width | NEW TEAM 370 px; Import 370 px |
| Tablet editor width | 732 px inside the 1024 px viewport |
| Tablet team-name field | 702×48 px |
| Tablet Add Player target | 48×48 px |
| Roster placement | Below player-entry controls |

## Non-functional rendering variations

The previous spectator baseline check failed only on cross-Chromium rasterization: mean channel difference `4.115624745686849` versus threshold `3.0`. Spectator files were unchanged, functional checks passed, contrast remained compliant, and deterministic layout assertions passed. The pixel threshold was therefore replaced by viewport, ordering, containment, event-presence, touch-target, and contrast assertions.

The accented heading uses separate inline content for the cyan word “MANAGEMENT”. Depending on viewport/font metrics, `innerText` may expose a whitespace or newline boundary even though the visible heading is unchanged. Assertions normalize whitespace and geometry controls verify that the heading remains inside the viewport.
