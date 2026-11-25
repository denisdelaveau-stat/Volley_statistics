# Demo-only indicator audit — Volley Live Capture v1.12.3

## Visual rule

| Source of the displayed information | Display |
|---|---|
| Real match JSON record | Normal |
| Calculation from real match records/history | Normal |
| Capture v1 reconstructed phase, rotation or lineup | Normal |
| Application performance threshold applied to a real calculated value | Normal tactical colour |
| Bundled/hard-coded demonstration fallback | **Red** |

## Advanced Statistics

- Imported JSON and current-match data use the normal theme.
- Capture v1 phase, setter rotation, side-out, court presence and playing-time values are calculated from the match event history and are no longer red.
- Rotation metric thresholds retain their normal good/watch/bad colours without a special non-JSON underline.
- The bundled Cannes–Fréjus v2.1 fixture is marked `reference-fixture-demo`; its displayed values are red because the fixture is the demonstration fallback, not the active match.

## Coach View

- Score, side-out, break point, attack, reception, service, block, momentum, rotation comparison and player summaries are normal for real match data.
- Capture v1 historical reconstruction is normal and labelled `V1 · HISTORIQUE CALCULÉ`.
- The bundled v2.1 reference fixture and the final hard-coded fallback are demo-only; their indicators are red and labelled `DÉMO · SANS VALEUR RÉELLE`.
- Player on-court/bench status remains calculated from the current/reconstructed lineup; it is red only in demo mode.

## Diagnostics retained

The adapter still records whether a value came from an explicit v2.1 field or Capture v1 reconstruction. This metadata no longer determines the red visual treatment; only the demo-source flag does.
