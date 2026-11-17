# Release v1.6.2 — 17 November 2026

Volley Live Capture v1.6.2 adds the approved player-position/action guidance to the Advanced capture grid while preserving the v1.6.1 Intermediate behavior.

## Position-aware Advanced grid
- The six action rows always remain visible in this order: **Attack, Block, Defence, Reception, Service, Set**.
- Actions expected for the selected player's position use full emphasis.
- Rare but legal actions are faded, not removed or disabled, so an unusual OH set or OPP reception can still be captured.
- Only Libero **Attack**, **Block** and **Service** are blocked and non-selectable.
- The approved matrix is documented in the English Word specification and in `docs/FUNCTIONAL_SPEC.md`.

## Compatibility
The match and event JSON formats remain unchanged. Existing v1.6.1 data requires no migration. The service-worker cache identifier is `volley-live-capture-v1.6.2`.

## Verification
The browser suite verifies the matrix for Setter, OH, OPP, MB and Libero, fixed ordering, rare-action capture, Libero blocking, the prior normative UI and the existing PWA/regression behavior. Manual iPhone/Safari, VoiceOver and offline-relaunch checks remain required on the target device.
