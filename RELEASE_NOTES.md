# Release v1.6.3 — 17 November 2026

Volley Live Capture v1.6.3 reduces visual load during live capture and compacts the BENCH controls without changing capture semantics or stored match data.

## Live capture header
- Only the current rally score remains in the top capture header.
- Small outside badges show sets won by the left and right teams.
- A cyan underline below the relevant rally score identifies the serving team and follows side-out changes.
- The previous match title, Best-of/set/mode strip and primary Player instruction are no longer displayed.

## BENCH
- The replacement-player and SUBSTITUTION controls are shorter and narrower.
- The two controls remain side by side, centred, and keep iPhone touch targets of at least 44 CSS px.

## Compatibility
The match and event JSON formats remain unchanged. Existing v1.6.2 data requires no migration. The service-worker cache identifier is `volley-live-capture-v1.6.3`.

## Verification
Run `python3 -m pytest -q tests`. Manual iPhone Safari/Home-screen, offline relaunch, VoiceOver and portrait/landscape checks remain recommended on the target device.
