# Match Hub v1.21.0

The Home Match Hub follows the approved reference in `MATCH_HUB_REFERENCE_v1.21.0.png` and the complete implementation contract in `VolleyLive_Match_Hub_Implementation_Specification.md`.

## Runtime storage

- Active editable match: existing `volleyCapture.match.v1` / `volleyCapture.events.v1` / `volleyCapture.chartData.v1`.
- Read-only history: `volleyMatchHub.history.v1`, containing complete validated archive payloads and source names.
- Spectator hand-off: existing `volleySpectator.archive.v1` and `volleyAnalysis.replay.v1` keys.

## Responsive evidence

`docs/screens_v1.21.0/` contains rendered 320 × 568, 390 × 844, and 768 × 1024 screens plus measured geometry. All measured document and Home scroll widths equal the viewport width.

## Import boundaries

- `.json` only; 10 MB maximum.
- Capture v1 and unified VolleyLive v2.x are validated by the shared adapter.
- Unsafe merge keys are rejected recursively.
- Duplicate stable IDs are never overwritten silently.
