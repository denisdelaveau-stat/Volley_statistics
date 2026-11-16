# Volley Live Capture v1.5.0 - Implementation Specification

## Runtime
Single-page HTML/CSS/vanilla JavaScript application. No runtime framework. Match and library data use browser localStorage. The service worker provides the offline shell when hosted on HTTPS/localhost.

## Main storage keys
- `volleyCapture.match.v1`: current match configuration/status.
- `volleyCapture.events.v1`: action log.
- `volleyCapture.chartData.v1`: chart event projection.
- `volleyCapture.library.v1`: saved teams, starting sevens and rotations.

`volleyCapture.library.v1` schema:
```json
{
  "team": {"<name>": {"team":"...","roster":[],"info":{},"savedAt":"..."}},
  "lineup": {"<name>": {"lineup":{},"savedAt":"..."}},
  "rot": {"<name>": {"rot":{},"savedAt":"..."}}
}
```

## v1.5.0 setup-library functions
`libGet`, `libPut`, `libHtml`, `libSave`, `libLoad`, `libDel` implement local library persistence and setup-screen UI. Saving an existing key requests confirmation. Loading a lineup/rotation validates membership against current roster/starting-seven state.

## Rotation helper
`rotatePlus1()` applies one clockwise displacement: P2->P1->P6->P5->P4->P3->P2. Rotation stays editable and can be saved under a new library name.

## Detail modes
Basic and Intermediate use one-tap split-input handlers. Advanced retains the 3-step handler. Existing score calculation is event-derived. Statistics are regenerated from events rather than independently persisted totals.

## Compatibility
The v1.5.0 library is additive and does not change the portable match JSON schema. Existing match files remain readable. NEW MATCH clears match/event/chart state, not `volleyCapture.library.v1`.

## Service worker
Use a cache identifier containing `v1.5.0`. Whenever `index.html` changes, increment the cache identifier to force iPhone PWA refresh.
