# Release notes — v1.10.1

This update applies the pastel position palette and Coach View blue setup background requested for New Match. Functionality and saved-data compatibility are unchanged.

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
