# Copy instructions — v1.25.0

## Complete package

Deploy the complete contents of the `Volley_statistics_v1.25.0` folder at the application root, replacing the previous application files while preserving the directory structure.

Open the application online once so service-worker cache `volley-live-capture-v1.25.0` is installed, then fully close and reopen the PWA.

## Delta from v1.24.0

Extract `Volley_statistics_v1.25.0_update_from_v1.24.0.zip`, then run:

```bash
python3 APPLY_UPDATE.py /path/to/Volley_statistics_v1.24.0
```

The updater verifies the expected v1.24.0 base hashes, removes obsolete Advanced Statistics files, copies v1.25.0 changed/new files, writes `VERSION` as `1.25.0`, and validates the resulting tree against the bundled target manifest.

## Smoke check

1. Home shows SETUP & CAPTURE, INSIGHTS & VIEWING, and SETTINGS.
2. SETUP & CAPTURE opens Match Capture and Team Management.
3. INSIGHTS & VIEWING opens Match Library, Coach View, Spectator View, and Match Reports.
4. Advanced Statistics is absent and `statistics/index.html` does not exist.
5. Home displays `v1.25.0`.
