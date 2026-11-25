# Copy instructions — v1.23.0

## Complete installation

Deploy the complete contents of the `Volley_statistics_v1.23.0` folder at the application root, replacing the previous application files. Keep the directory structure unchanged.

Open the application online once so service worker cache `volley-live-capture-v1.23.0` is installed, then fully close and reopen the PWA.

## Update from v1.22.0

Extract `Volley_statistics_v1.23.0_update_from_v1.22.0.zip`, then run:

```bash
python3 APPLY_UPDATE.py /path/to/Volley_statistics_v1.22.0
```

The updater verifies the expected v1.22.0 base files, copies v1.23.0 changed/new files, removes obsolete cache artifacts, writes `VERSION` as `1.23.0`, and verifies the resulting application tree against the bundled target hashes.

## Verification

- Home displays `v1.23.0`.
- Home contains MATCH HUB, COACH VIEW, TEAMS MANAGEMENT, ADVANCED STATISTICS, and SETTINGS.
- MATCH HUB opens a separate screen containing NEW MATCH, CONTINUE MATCH, VIEW MATCH, RECENT MATCHES, and Import match.
- The Match Hub Back control returns to Home.
- Existing match, coach, statistics, team, settings, capture, spectator, and import workflows remain available.
