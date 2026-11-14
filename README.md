# Volley Live Capture – v1.1.3 (iPhone package)

Touch-first web app (PWA) to record a volleyball match rally by rally on an iPhone.
Runs **100 % offline** once added to the Home Screen. All match data stays on the phone.

## Repository content

| Path | Role |
|---|---|
| `index.html` | The application (single file, no external dependency) |
| `manifest.webmanifest` | Home Screen app definition |
| `sw.js` | Offline cache (cache name `volley-live-capture-v1.1.3`) |
| `icons/` | Home Screen icons (180, 192, 512 px) |
| `serve_local.py` | Optional quick test from a PC on the same Wi-Fi (online only) |
| `docs/IMPLEMENTATION_SPEC.md` | General implementation specification |
| `docs/IOS_IMPLEMENTATION_SPEC.md` | iOS / Safari specific implementation specification |
| `docs/INSTALL_IPHONE.md` | Installation and update procedure on iPhone |
| `tests/test_e2e_pwa.py` | End-to-end test (Playwright, iPhone viewport, offline) |
| `CHANGELOG.md` | Version history |

## Publish (static HTTPS hosting)

The folder root **is** the web root: push it as-is to any static HTTPS host
(e.g. GitHub Pages: *Settings → Pages → Deploy from branch → `main` / root*).
HTTPS is mandatory for the offline service worker on iPhone.

## Update an existing installation (→ v1.1.3)

1. On the phone: **SAVE .JSON** the current match (safety).
2. Replace **all** files on the HTTPS host with the content of this folder.
3. On the iPhone, with network: open the app from its icon, close it completely, open it again.
   The Home screen shows **v1.1.3**. Match data on the phone is kept.

## First installation

See [`docs/INSTALL_IPHONE.md`](docs/INSTALL_IPHONE.md).

## In a match

* NEW MATCH → Team (names, match name, format, roster 7–12) → Starting 7 → Rotation + first rally.
* Each rally: **Player → Action → Result** (3 taps). Saved on the phone after every rally.
* Opponent: one generic player button **ADVERSE** → one generic action → Neutral / Point / Error.
* ⇄ SUBSTITUTION, UNDO LAST, STATISTICS ▼ on the capture screen; START SET n → between sets.
* **SAVE .JSON** → Share sheet → *Save to Files*. **REPORT .HTML** → self-contained match report.
* **OPEN MATCH .JSON** (Home) reloads a saved match. One match at a time on the phone.

## Tests

```bash
pip install playwright && playwright install chromium
python tests/test_e2e_pwa.py      # expects: 22 checks -> ALL PASSED
```

## Release rule

At every change: bump the version in `index.html` (`appVersion`), in `sw.js` (`CACHE`),
in this file and in `CHANGELOG.md`, then run the tests.
