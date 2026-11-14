# Changelog – Volley Live Capture

## v1.1.3 – 2026-11-14
### Fixed
- Scoreboard: digits displayed in **red** on black squares (gym scoreboard style); v1.1.2 showed them in white.
- Statistics, *All attackers* charts (points over time / differential): the legend now shows a short
  colour line **with the player name** (`Player n (Name · Role)`). Previously the legend icons inherited
  the 900 px chart width, which hid the names and left large empty areas.
### Tests
- Added V1 (red digits) and V2 (legend swatch width) checks → 22 checks.

## v1.1.2 – 2026-11-14
### Changed
- Live score shown as `2 : 1` only (no team letters), in black squares like a gym scoreboard.

## v1.1.1 – 2026-11-14
### Added
- Score evolution and action charts verified; per-attacker charts (OH / MB / OPP with log entries).

## v1.1.0 – 2026-11-14
### Added
- Offline iPhone package (manifest, service worker, icons), set / match end detection
  (25 with 2-point lead, 5th set to 15), substitutions, per-attacker statistics, REPORT .HTML,
  match saved as `<match name>.json`.
