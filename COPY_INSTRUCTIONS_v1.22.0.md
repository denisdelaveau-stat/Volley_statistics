# Copy instructions — v1.22.0

## Complete installation

Deploy the complete contents of the `Volley_statistics_v1.22.0` folder at the application root, replacing the previous application files. Keep the directory structure unchanged.

Open the application online once so service worker cache `volley-live-capture-v1.22.0` is installed, then fully close and reopen the PWA.

## Update from v1.21.0

Extract `Volley_statistics_v1.22.0_update_from_v1.21.0.zip`, then run:

```bash
python3 APPLY_UPDATE.py /path/to/Volley_statistics_v1.21.0
```

The updater verifies the expected v1.21.0 base files, copies the v1.22.0 changed/new files, writes `VERSION` as `1.22.0`, removes obsolete files listed by the package, and verifies the resulting tree against the bundled target hashes.

## Verification

- Home displays `v1.22.0`.
- Advanced Statistics opens a single Coach View-aligned timeline.
- No separate statistics cards, graphs, KPI panels, or secondary Advanced Statistics pages are present.
- Filters may be expanded/collapsed and the timeline remains horizontally scrollable on narrow screens.
