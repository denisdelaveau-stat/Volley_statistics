# Volley Live Capture v1.11.0

Offline-first volleyball match capture and analysis for Basic, Intermediate and Advanced workflows.

## v1.11.0 highlights

- Rebuilds live action entry as a single mobile quick-capture screen: score first, HOME/AWAY shortcuts, central colour-coded results, role-aware actions and the six on-court players on a blue tray.
- Supports three paths without changing screen: **Complete** (player + action + result), **Player** (player + result) and **HOME/AWAY** (side + result).
- Adds `FREE BALL`, retains likely-action guidance by position, and keeps libero Attack/Block/Serve unavailable.
- Keeps the 450 ms post-result lock, Substitute and Undo.
- Places the unselected libero as a grey player circle on a centred grey bench in Initial rotation.
- Keeps **COACH VIEW**, **ADVANCED STATISTICS** and the shared pastel role palette.

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
- Precaches Coach, Advanced Statistics, the shared adapter, JSON fixture and offline fixture module in PWA cache `volley-live-capture-v1.11.0`.

## Reference data caveat

The bundled match is a `TEST_FIXTURE`. Its scores, winners, 93 rally boundaries and 94 captured events come from the Cannes–Fréjus export. The 271 added actions are neutral and carry `provenance: "SYNTHETIC"`; they exist to exercise the metrics and interfaces. Set lineups were inferred from recorded servers and remain `lineupVerified: false`.

## Run locally

```bash
python serve_local.py
```

Open the displayed local URL in a modern browser. Opening HTML directly with `file://` is not the supported deployment mode.

## Deploy or update

Publish the **complete folder contents** at the site root. Keep `index.html`, `coach.css`, `coach.js`, `statistics/`, `sw.js`, `manifest.webmanifest`, `Font_app_ref.jpg` and `icons/` together. On iPhone, launch once online, fully close the installed PWA, then reopen it. Confirm `v1.11.0` on Home.

## Verification

```bash
pytest -q
```

The v1.11.0 tests verify the three quick-entry paths, result lock, role-aware actions, FREE BALL, substitution, Undo, the centred libero bench, the three-stage New Match flow, the unified fixture contract and both Home analysis interfaces.
