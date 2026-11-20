# Copy instructions — v1.10.0

Deploy the complete `Volley_statistics_v1.10.0` folder contents at the application root.

Keep these paths together:

- `index.html`, `coach.css`, `coach.js`;
- `statistics/index.html` and `statistics/adapter.js`;
- `statistics/data/As_cannes_vs_Frejus_2026-11-15.fixture.v2.json`;
- `statistics/data/reference-fixture.js`;
- `sw.js`, `manifest.webmanifest`, `Font_app_ref.jpg` and `icons/`.

Delete the obsolete `statistics/data/As_cannes_vs_Frejus_2026-11-15.json` Capture-v1 reference if it remains from v1.9.0.

Do not publish only `index.html`: both analysis interfaces depend on shared files and the service worker precache list. On iPhone, open the deployed site online once, fully close the installed PWA, then reopen it. If an older cache remains, remove and re-add the Home-screen shortcut. Confirm `v1.10.0` on Home.
