# Implementation report — Volley Live Capture v1.12.6

## Baseline

Implemented from the complete v1.12.5 package. Coach View, Advanced Statistics, the neutral zero/NA empty state, unified JSON handling, scoring, rotations, substitutions and offline support are retained.

## Update8 capture changes

- All ten visible action/result buttons use one shared width and one shared height.
- Set and Defence are centred as a pair above the matrix.
- Attack/Block and Serve/Reception use equal vertical spacing and share the same vertical centre as POSITIF/ERREUR/NEUTRE.
- RELANCE is centred under the result column and keeps the persisted `freeball` action value.
- The six active players appear on an orange court in two rows of three, with the net and dashed court separator visible.
- The bench player is hidden from Capture; replacement candidates still come from the roster and remain filtered to the outgoing player's position.
- The control below the court is labelled `⟳ Changer de joueur`.
- Undo is removed from the lower tool area and placed immediately to the right of the score.

## Compatibility

The capture data model is unchanged. Visible result labels still map to `point`, `error` and `neutral`; RELANCE still maps to `freeball`; substitution events keep the existing schema. Pastel role colours and the COACH VIEW / ADVANCED STATISTICS Home buttons are unchanged.

## Versioning

- Home version: `v1.12.6`.
- Service-worker cache: `volley-live-capture-v1.12.6`.

## Validation

- Complete automated suite: **54 passed**.
- Chromium visual/geometry checks at 320 × 844, 390 × 844 and 768 × 844: no page errors and no horizontal overflow.
- Screenshots are included in `docs/screens_v1.12.6/`.
- Automated coverage verifies equal button dimensions, balanced side controls, two player rows, hidden bench player, Changer de joueur, header Undo, preserved replacement semantics and both Home analysis actions.
