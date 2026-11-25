# Implementation report — Volley Live Capture v1.9.1

## Scope

- Retained and verified the `COACH VIEW` Home button and complete Coach workflow introduced in v1.8.0.
- Retained and verified the `ADVANCED STATISTICS` Home button and advanced-metrics workflow introduced in v1.9.0.
- Replaced the Capture-v1 reference dependency with the official unified `volley-live` 2.1 match document for both interfaces.

## Shared data integration

`statistics/adapter.js` is loaded by Home before `coach.js` and by `statistics/index.html`. It validates and normalizes the same v2.1 document for both consumers. Explicit rally phase, setter rotation, lineup snapshot, on-court presence, winner and scores are used directly. Substitutions remain source events but are excluded from technical-action denominators.

Loading behavior:

1. current unified-v2 local document when available;
2. current Capture-v1 local stores through a labelled migration path;
3. bundled v2.1 fixture;
4. generated offline fixture module if network-style fetch is unavailable in Advanced Statistics.

## Canonical fixture

`statistics/data/As_cannes_vs_Frejus_2026-11-15.fixture.v2.json` contains:

- format `volley-live`, schema `2.1.0`, document type `match`;
- 2 sets and 93 closed rallies;
- 365 source events: 94 `CAPTURED`, 271 `SYNTHETIC`;
- 364 technical actions plus one captured substitution;
- 74 attacks, 46 serves, 44 receptions and 25 blocks;
- explicit P1–P6 setter rotation and on-court snapshots;
- inferred, unverified set lineups and explicit data-quality notes.

Synthetic actions are always `NEUTRAL`, never close a rally and never change the score. The fixture is segregated with `TEST_FIXTURE`.

## Documentation

- `docs/VolleyLive_Unified_JSON_Format_Specification.md`
- `docs/volley-live.match.schema.v2.1.json`

## Offline integration

PWA cache `volley-live-capture-v1.9.1` precaches Home, Coach, Advanced Statistics, the shared adapter, the JSON fixture and the offline fixture module.

## Verification

- JSON Schema validation;
- application-level adapter validation;
- event ID and sequence uniqueness;
- score, winner, terminal-event, provenance and role constraints;
- JavaScript syntax checks;
- HTML duplicate-ID checks;
- browser acceptance for both Home buttons and both v2.1-backed interfaces;
- retained regression suite.
