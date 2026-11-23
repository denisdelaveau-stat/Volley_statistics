# Copy instructions — v1.24.0

## Complete installation

Deploy the complete contents of the `Volley_statistics_v1.24.0` folder at the application root, replacing the previous application files. Keep the directory structure unchanged.

Open the application online once so service-worker cache `volley-live-capture-v1.24.0` is installed, then fully close and reopen the PWA.

## Update from v1.23.0

Extract `Volley_statistics_v1.24.0_update_from_v1.23.0.zip`, then run:

```bash
python3 APPLY_UPDATE.py /path/to/Volley_statistics_v1.23.0
```

The updater verifies the expected v1.23.0 base tree, copies v1.24.0 changed/new files, writes `VERSION` as `1.24.0`, and verifies the resulting application tree against the bundled target hashes.

## Verification

- Home displays `v1.24.0`.
- TEAMS MANAGEMENT opens the dedicated dark interface.
- NEW TEAM opens the name and player editor.
- Player validation uses Numero, Nom, and Poste.
- Sorting works by NUMBER, NAME, and POSITION.
- REGISTERED TEAMS lists saved teams.
- IMPORT NEW TEAM accepts a CSV roster for review before save.
- Existing match, Coach View, statistics, settings, capture, spectator, and JSON import workflows remain available.
