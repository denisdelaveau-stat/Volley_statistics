# Copy instructions — v1.27.0

## Complete package

Deploy the complete contents of the `Volley_statistics_v1.27.0` folder at the application root, replacing the previous application files while preserving the directory structure.

Open the application online once so service-worker cache `volley-live-capture-v1.27.0` is installed, then fully close and reopen the PWA.

## Delta from v1.26.1

Extract `Volley_statistics_v1.27.0_update_from_v1.26.1.zip`, then run:

```bash
python3 APPLY_UPDATE.py /path/to/Volley_statistics_v1.26.1
```

The updater verifies the v1.26.1 base tree, applies changed and new files, removes obsolete paths, writes `VERSION` as `1.27.0`, and verifies the resulting tree against the bundled v1.27.0 target manifest.

Verification only:

```bash
python3 APPLY_UPDATE.py /path/to/Volley_statistics_v1.27.0 --verify-only
```

## Smoke check

1. Home displays `v1.27.0` and the v1.26.1 workflows remain available.
2. MATCH LIBRARY shows All / Live / Finished with inline counters.
3. Each match uses one aligned, non-wrapping row.
4. The selected row shows a lavender tint, left edge and check.
5. Coach View, Spectator and Reports use the selected match.
6. Import, duplicate handling, capture, Coach, Spectator and report exports remain available.
