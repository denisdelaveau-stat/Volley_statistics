# Copy instructions — VolleyLive v1.27.0

## Complete package

Deploy the complete contents of `Volley_statistics_v1.27.0` at the application root, replacing the prior application files while preserving the directory structure.

Open the application online once so service-worker cache `volley-live-capture-v1.27.0` is installed, then fully close and reopen the installed PWA.

## Delta package

Extract `Volley_statistics_v1.27.0_update_from_v1.26.1.zip`, then run:

```bash
python3 APPLY_UPDATE.py /path/to/Volley_statistics_v1.26.1
```

The updater verifies the v1.26.1 base tree, applies changed/new files and deletions, and verifies the exact v1.27.0 target tree.

Verification only:

```bash
python3 APPLY_UPDATE.py /path/to/Volley_statistics_v1.27.0 --verify-only
```

## Smoke check

1. Home displays v1.27.0.
2. MATCH LIBRARY shows All / Live / Finished with inline counters.
3. A selected row has a lavender tint, left edge, and check.
4. The info action opens metadata without changing selection.
5. Coach View, Spectator, and Reports act on the selected match.
6. Import validation, duplicate handling, capture, Spectator, Coach, and reports still work.
