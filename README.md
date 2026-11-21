# Volley Live Capture v1.12.3

Offline-first volleyball match capture and analysis for Basic, Intermediate and Advanced workflows.


## v1.12.3 highlights

- Reverses the v1.12.2 visual rule: **red now means demonstration-only data with no real match value**.
- Values extracted from a match stay in the normal theme.
- Values calculated from the match history — including Capture v1 phase, rotation, side-out and reconstructed court presence — also stay in the normal theme.
- Application-defined performance thresholds keep their usual tactical colours and no longer receive a red “outside JSON” marker.
- The bundled Cannes–Fréjus reference fixture is explicitly identified as demonstration data and is red in **Advanced Statistics** and **Coach View** until a real current/imported match is loaded.
- PWA cache bumped to `volley-live-capture-v1.12.3`.

## v1.12.2 highlights

- Complete JSON-provenance audit for **Advanced Statistics** and **Coach View**.
- Every value based on explicit JSON records remains in the normal theme.
- Indicators that depend on inferred Capture v1 context (phase, rotation, or on-court lineup) are visibly red.
- Application-defined interpretation thresholds are marked with a red **SEUIL HORS JSON** badge or red dotted underline.
- The exact `As_cannes_vs_Frejus_2026-11-15.json` reference export is covered by automated tests.
- Coach player presence is now computed instead of always displaying “Sur le terrain”.
- PWA cache bumped to `volley-live-capture-v1.12.2`.

## v1.12.1 highlights

- Matches the supplied action-entry reference on a night-blue panel: Set and Defence at the top, Attack/Block left, Serve/Reception right, POSITIF/ERREUR/NEUTRE in the central green/red/blue column, and RELANCE at the bottom.
- Compresses the six on-court players into one role-coloured row and reduces the Bench/Substitute controls, keeping the action area dominant on a 390 × 844 display.
- Removes the visible **SAVE .JSON**, **REPORT .HTML** and end-of-match report/export controls from Capture; match state still auto-saves locally.
- Keeps every capture control at fixed coordinates across player, action and result-first states. HOME/AWAY still replaces the reserved NEUTRE cell without moving the grid.
- Preserves the compact Initial rotation libero bench, same-position substitution filtering, the 450 ms post-result lock, Undo, scoring and History.
- Preserves the pastel position palette plus **COACH VIEW** and **ADVANCED STATISTICS** on Home.

## v1.10.1 baseline retained

- Pastel role palette shared by setup and Coach courts: OPP blue, SET yellow, OH red, MB green, LIB grey.
- Coach View blue surfaces replace the remaining white setup page, card, panel and header backgrounds.
- Roster and initial-rotation courts remain orange.

- Adds a dedicated **Sélectionne ton équipe** page with configured-team selection, opponent entry, an automatically generated/editable match name and **VALIDE**.
- Rebuilds **SELECT TEAM** on a volleyball court with role-coloured player circles, Present/Focus controls and sorting by shirt number, position or name.
- Rebuilds **Initial rotation** in the Coach View visual language: P1–P6 tabs, Organisation actuelle, orange court, direct compatible-player selection, Reception/Service and conditional **START MATCH**.
- Retains all v1.9.1 unified-data features below.

## v1.9.1 unified-data baseline

- Keeps both required Home actions fully integrated:
  - `COACH VIEW`: overview, team/rotation analysis, players and player detail;
  - `ADVANCED STATISTICS`: Set Timeline, advanced metrics, Rotation Metrics, Roster Ranking and Playing Time.
- Uses the official unified `volley-live` JSON contract, schema version `2.1.0`, as the authoritative input for both interfaces.
- Bundles `statistics/data/As_cannes_vs_Frejus_2026-11-15.fixture.v2.json` as the common reference match.
- The fixture contains 2 sets, 93 rallies and 365 source events: 94 captured events and 271 explicitly identified neutral synthetic contacts.
- Reads explicit set, rally, score, serve/reception phase, setter rotation, lineup snapshot, on-court players, substitution, action and provenance data.
- Includes `docs/VolleyLive_Unified_JSON_Format_Specification.md` and `docs/volley-live.match.schema.v2.1.json`.
- Keeps Capture-v1 local stores only as a labelled migration path for an in-progress match; v1 is no longer the reference fixture.
- Precaches Coach, Advanced Statistics, the shared adapter, JSON fixture and offline fixture module in PWA cache `volley-live-capture-v1.12.3`.

## Reference data caveat

The bundled match is a `TEST_FIXTURE`. Its scores, winners, 93 rally boundaries and 94 captured events come from the Cannes–Fréjus export. The 271 added actions are neutral and carry `provenance: "SYNTHETIC"`; they exist to exercise the metrics and interfaces. Set lineups were inferred from recorded servers and remain `lineupVerified: false`.

## Run locally

```bash
python serve_local.py
```

Open the displayed local URL in a modern browser. Opening HTML directly with `file://` is not the supported deployment mode.

## Deploy or update

Publish the **complete folder contents** at the site root. Keep `index.html`, `coach.css`, `coach.js`, `statistics/`, `sw.js`, `manifest.webmanifest`, `Font_app_ref.jpg` and `icons/` together. On iPhone, launch once online, fully close the installed PWA, then reopen it. Confirm `v1.12.3` on Home.

## Verification

```bash
pytest -q
```

The v1.12.3 test suite verifies the reference action geometry, fixed controls at 390 × 844, the one-row compact player strip, removed export buttons, compatible RELANCE/freeball semantics, the compact libero bench, same-position substitution filtering and logging, Undo, the three-stage New Match flow, the unified fixture contract and both Home analysis interfaces.
