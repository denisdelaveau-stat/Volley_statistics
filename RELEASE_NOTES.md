# Release notes — v1.12.1

## Action-entry screen

The capture pad now follows the supplied reference image on a night-blue background. **Set** and **Defence** are at the top; **Attack** and **Block** are on the left; **Serve** and **Reception** are on the right; **POSITIF**, **ERREUR** and **NEUTRE** form the green/red/blue centre column; **RELANCE** is centred at the bottom.

The result-first workflow remains compatible with v1.12.0: choosing a result before a player reveals **HOME** and **AWAY** in the reserved NEUTRE cell, without moving any other control. Persisted event values remain `point`, `error`, `neutral` and `freeball`.

## Compact players and removed exports

The six on-court players now use one compact horizontal row while retaining their pastel position colours. The Bench/Substitute row is shorter as well. The visible **SAVE .JSON**, **REPORT .HTML** and end-of-match export controls have been removed from Capture; automatic local persistence remains active.

## Preserved functionality

**COACH VIEW**, **ADVANCED STATISTICS**, the shared pastel position palette, scoring, rotation logic, History, Undo, the compact libero bench, same-position substitutions, unified v2.1 analysis and offline operation are retained. The service worker cache is `volley-live-capture-v1.12.1`.

## Previous release — v1.12.0

# Release notes — v1.12.0

## Result-first live capture

- **POINT**, **ERROR** and **CONTINUE** are active by default. A result chosen without a player reveals **HOME** and **AWAY** exactly in the Continue slot; the second tap records the team result.
- FREE BALL is above the central ✓ / ✕ / ○ results, Attack/Block are on the left, Serve/Reception on the right and Set/Defence below.
- Capture controls keep identical positions and sizes in every state. Position guidance remains visual, without probability text or an inserted player/action information line.
- The six current court players are arranged in two rows of three matching the court. Rotation, service and inline Capture statistics/status lines are no longer displayed.
- **SUBSTITUTE**, **UNDO**, **HISTORY**, scoring and the 450 ms duplicate guard remain available.
- A 450 ms lock starts only after an accepted result to stop accidental double entries.

## Initial rotation and substitutions

The grey libero circle sits on a compact 64 × 64 px centred grey seat beneath the orange court. The `BANC LIBÉRO` label is removed; the selectable circle and `SÉLECTIONNER LE LIBÉRO` control remain.

Substitute now lists only present, off-court players whose roster position matches the outgoing player (SET, OH, MB, OPP or LIB). An unavailable position shows `Aucun remplaçant disponible à ce poste`. Each accepted replacement is persisted as a `SUBSTITUTION` event with the two players, position, set and rally, and Undo removes the latest replacement and event together.

## Preserved functionality

**COACH VIEW**, **ADVANCED STATISTICS**, the pastel position palette, scoring, rotation logic, history, unified v2.1 analysis data and offline operation are retained. The Capture-page Statistics panel is removed. The service worker cache is `volley-live-capture-v1.12.0`.

## Previous release — v1.11.0

This release introduced the unified quick-capture panel, FREE BALL and the initial centred libero bench.

# Volley Live Capture v1.10.0 — Release Notes

## New Match interface redesign

- A first page now asks the user to select a configured team, enter the opponent and validate an automatically generated/editable match name.
- Roster confirmation uses role-coloured circles on a volleyball court and retains independent Present and Focus controls for every player. The roster can be sorted by shirt number, position or name.
- Initial rotation now mirrors Coach View with P1–P6 tabs, Organisation actuelle, a Rotation badge, an orange court and direct compatible-player selection from each position.
- Empty rotation circles are grey; the empty setter position alone uses the setter colour. Player names appear only after selection.
- Reception and Service are explicit choices. **START MATCH** appears only after one is chosen.

## One Home, two analysis interfaces

Both required Home buttons are present and operational:

- **COACH VIEW** opens Vue coach, rotation/team analysis, Players and Player Detail.
- **ADVANCED STATISTICS** opens Set Timeline and advanced metrics, with Rotation Metrics, Roster Ranking and Playing Time.

## Official unified JSON v2.1

Coach View and Advanced Statistics now share `statistics/adapter.js` and the same official reference file: `statistics/data/As_cannes_vs_Frejus_2026-11-15.fixture.v2.json`. The adapter validates `format: "volley-live"`, `schemaVersion: "2.1.0"` and `documentType: "match"`, then uses explicit rally context instead of reconstructing it from display colors or hard-coded data.

The canonical fixture exposes 2 sets, 93 rallies and 365 source events. Technical timelines contain 364 action events; the remaining captured source event is the set-2 substitution and is intentionally excluded from action denominators. The 271 synthetic contacts are neutral, provenance-labelled and never change a score or close a rally.

## Offline behavior

The service worker cache is `volley-live-capture-v1.10.0`. It includes both interfaces, the shared adapter, the canonical JSON file and an equivalent generated JavaScript copy used when a normal fetch is unavailable.

## Compatibility

Existing Capture-v1 local stores still open through a labelled migration path, so an in-progress legacy match remains usable. Imported and reference analysis data should use unified v2.1. The application no longer uses the terminal-only Capture-v1 match as its reference fixture.

## Documentation and validation

The package includes the unified format specification and its JSON Schema. Automated coverage validates the fixture structure, provenance counts, role constraints, score progression, both Home buttons, Coach v2.1 rendering and Advanced Statistics v2.1 rendering.
