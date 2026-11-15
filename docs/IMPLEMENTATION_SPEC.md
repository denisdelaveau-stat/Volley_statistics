# Volley Live Capture v1.5.3 - Implementation Specification

## Baseline guard
The updater requires these v1.5.0 anchors: `volleyCapture.library.v1`, `ROTATE +1`, `teamFocusBtn`, `nofocus`, `homeScreen`, and `homeOpen`. It refuses older source.

## Changes
- Roster number loop upper bound: 20 -> 30. `MAXP=12` is unchanged.
- CSS override hides `.court-grid .touch.nofocus` and `.bench-row .touch.nofocus` when `#capturePanel` is not in `.sub-mode`; substitution mode restores visibility and pointer events.
- HOME button `#homeUserGuide` follows OPEN MATCH .JSON.
- Click handler calls `window.open('user_guide.pdf','_blank','noopener')`.
- Service worker cache becomes `volley-live-capture-v1.5.3` and precaches `user_guide.pdf`.
- Visible application version becomes v1.5.3.
