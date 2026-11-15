# Volley Live Capture – v1.3.2 (iPhone package)

Touch-first web app (PWA) to record a volleyball match rally by rally on an iPhone.
Runs **100 % offline** once added to the Home Screen. All match data stays on the phone.

## New in v1.3.2 – player focus
On *Team setup* each player has a **Focus** checkbox (checked by default). At Intermediate and Advanced
levels, players with focus are proposed by number on the court; players without focus are not: their
court cells show **TEAM**, and one blue **TEAM** button records the actions of all of them together.

## Detail level (since v1.2.0)
Chosen on the first setup screen (*Team setup*), fixed for the whole match:

| Level | Input per rally | Results |
|---|---|---|
| Basic | Team → Result (2 taps, no roster) | Point · Error |
| Intermediate | Player / ADVERSE → Result (2 taps) | Point · Error |
| Advanced (default) | Player / ADVERSE → Action → Result (3 taps) | Neutral · Point · Error |

## Repository content
| Path | Role |
|---|---|
| `index.html` | The application (single file, no external dependency) |
| `manifest.webmanifest` | Home Screen app definition |
| `sw.js` | Offline cache (cache name `volley-live-capture-v1.3.2`) |
| `icons/` | Home Screen icons (180, 192, 512 px) |
| `serve_local.py` | Optional quick test from a PC on the same Wi-Fi (online only) |
| `docs/IMPLEMENTATION_SPEC.md` | General implementation specification |
| `docs/IOS_IMPLEMENTATION_SPEC.md` | iOS / Safari implementation specification |
| `docs/INSTALL_IPHONE.md` | Installation and update on iPhone |
| `docs/Volley_Live_Capture_Screens_v1.3.2.pdf` | Screens of v1.2.0 (3 levels) + installation; Focus screens in `docs/img/focus_v1.3.2.png` |
| `tests/test_e2e_pwa.py` | End-to-end test (Playwright, iPhone viewport, offline) – 69 checks |
| `CHANGELOG.md` | Version history |

## Publish (static HTTPS hosting)
The repository root **is** the web root. Push it as-is, then on GitHub:
*Settings → Pages → Deploy from a branch → `main` / root → Save*.
HTTPS is mandatory for offline mode on iPhone. Do not use the professional SharePoint / OneDrive.

## Update an installed iPhone (→ v1.3.2)
1. In the app: **SAVE .JSON** the current match (safety).
2. Push the new files.
3. iPhone, with network: open the app from its icon, close it completely, open it again → Home shows **v1.3.2**.
   The stored match is kept; matches and files from v1.1.x open at **Advanced** level.

First installation: see [`docs/INSTALL_IPHONE.md`](docs/INSTALL_IPHONE.md).

## Tests
```bash
pip install playwright && playwright install chromium
python tests/test_e2e_pwa.py      # expected: 69 checks -> ALL PASSED
```

## Release rule
At every change: bump the version in `index.html` (`appVersion`), `sw.js` (`CACHE`), this file,
`CHANGELOG.md` and `tests/test_e2e_pwa.py` (`VERSION`); run the tests; regenerate the screens PDF.
