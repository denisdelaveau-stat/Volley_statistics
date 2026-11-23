# Copy instructions — v1.21.0

## Complete package

Deploy the complete `Volley_statistics_v1.21.0` folder contents at the application root. Keep `index.html`, `match-hub.css`, `match-hub.js`, spectator/statistics/coach assets, `sw.js`, `manifest.webmanifest`, images, icons, documentation, and tests together.

## Delta from v1.20.0

Run the included updater against a clean or deployed v1.20.0 application folder:

```bash
python3 APPLY_UPDATE.py /path/to/Volley_statistics_v1.20.0
```

The updater verifies the known v1.20.0 base files before writing, copies changed/new v1.21.0 files, writes `VERSION` as `1.21.0`, and verifies the complete target tree against bundled SHA-256 values.

## Offline refresh

Open the deployed application online once so service worker cache `volley-live-capture-v1.21.0` is installed. Fully close and reopen the PWA. If an older cache remains on iOS, remove and re-add the Home-screen shortcut.

Confirm `v1.21.0` on Home and verify New Match, Continue Match, View Match, Recent Matches, and Import match.
