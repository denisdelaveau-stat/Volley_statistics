# Copy instructions — v1.26.0

## Complete package

Deploy the complete contents of the `Volley_statistics_v1.26.0` folder at the application root, replacing the previous application files while preserving the directory structure.

Open the application online once so service-worker cache `volley-live-capture-v1.26.0` is installed, then fully close and reopen the PWA.

## Delta from v1.25.0

Extract `Volley_statistics_v1.26.0_update_from_v1.25.0.zip`, then run:

```bash
python3 APPLY_UPDATE.py /path/to/Volley_statistics_v1.25.0
```

The updater strictly verifies the complete v1.25.0 base tree, applies changed and new files, removes paths listed by the delta if any, writes `VERSION` as `1.26.0`, and verifies the exact resulting v1.26.0 tree against the bundled target manifest.

Verification only:

```bash
python3 APPLY_UPDATE.py /path/to/Volley_statistics_v1.26.0 --verify-only
```

## Smoke check

1. Home displays `v1.26.0` and all v1.25.0 workspaces remain available.
2. SPECTATOR VIEW opens the current set and shows the last point.
3. The common Set selector is visible in SCORES, TIMELINE, GRAPH, and RANKING.
4. Selecting a previous set updates all four tabs and shows **Retour au direct**.
5. HOME momentum cells/bar are green; AWAY momentum cells/bar are red.
6. TIMELINE player names are complete, connectors are compact, and maximum-gap bars keep a dotted outline.
