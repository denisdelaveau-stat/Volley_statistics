# Copy instructions — v1.20.0

## Complete package

Deploy the complete `Volley_statistics_v1.20.0` folder contents at the application root. Keep `index.html`, `spectator.html`, `spectator.css`, `spectator.js`, `statistics/`, `coach.*`, `sw.js`, `manifest.webmanifest`, images, icons, documentation, and tests together.

## Delta from v1.19.1

Run the included updater against a clean or deployed v1.19.1 application folder:

```bash
python3 APPLY_UPDATE.py /path/to/Volley_statistics_v1.19.1
```

The updater verifies the known v1.19.1 base files before writing, copies all changed/new v1.20.0 files, removes paths listed in `DELETE_THESE.txt` when present, writes `VERSION` as `1.20.0`, and verifies the final tree against the bundled target manifest.

## Offline refresh

After deployment, open the site online once so service worker cache `volley-live-capture-v1.20.0` is installed. Fully close and reopen the PWA. If the older cache remains on iOS, remove and re-add the Home-screen shortcut.

Confirm `v1.20.0` on Home and verify SPECTATOR VIEW opens a valid JSON archive on TIMELINE.
