# Volley Live Capture v1.6.2 — Implementation Report

## Scope
v1.6.2 applies the approved action-versus-position matrix to the Advanced capture grid and updates the English Word UI specification, code, tests, changelog, version metadata and release package together.

## Implemented behavior
- Fixed Advanced row order: Attack, Block, Defence, Reception, Service, Set.
- Full emphasis for actions expected for the selected player's roster position.
- Attenuated but active controls for rare legal actions.
- Disabled Libero Attack, Block and Service controls, with delegated-event blocking as a second enforcement layer.
- No persisted match/event schema change.

## Documentation
`docs/Volley_Live_Capture_UI_Functional_Specification_EN_With_Original_Images.docx` is document version 1.2. It contains the approved matrix, normative emphasis/availability rules, two additional acceptance scenarios and all 11 original source visuals.

## Verification
`python3 -m pytest -q tests` completed with 9 passing tests. The dedicated v1.6.2 tests cover every roster position, rare legal entry and Libero prohibitions. See `tests/TEST_RESULTS_v1.6.2.txt`.

## Deployment
Deploy the complete folder so `index.html`, `sw.js` and the documentation/tests remain aligned. The cache identifier is `volley-live-capture-v1.6.2`. Manual iPhone, VoiceOver and offline-relaunch checks remain required on the target device.
