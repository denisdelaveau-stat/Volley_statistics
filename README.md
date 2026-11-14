# Volley Live Capture – v1.0.0 (iPhone package)

Touch-first app to record a volleyball match rally by rally on an iPhone.
It runs **100 % offline** once installed on the Home Screen. No account, no server, no App Store.
All match data stays on the phone.

## Package content

| File | Role |
|---|---|
| `index.html` | The whole application (HTML, CSS, JavaScript, no dependency) |
| `manifest.webmanifest` | Home Screen app definition (name, icon, standalone mode) |
| `sw.js` | Service worker: caches every file so the app starts without network |
| `icons/` | Home Screen icons (180, 192, 512 px) |
| `serve_local.py` | Optional: quick test from a PC on the same Wi-Fi (online only) |

## Why a Home Screen app (and not just opening the .html file)

* An `.html` file opened from the iPhone **Files** app is shown in a preview that does not run the
  JavaScript reliably ("A script did not run correctly on this page").
* iOS only allows offline caching (service worker) for pages served over **HTTPS**.
* An app added to the Home Screen gets its own durable storage, exempt from Safari's
  7-day deletion of website data.

So the package must be published **once** on any HTTPS static host, then installed on the phone.
After installation the phone never needs the network again.

## Install – recommended: GitHub Pages (free, ~10 minutes, done once)

1. Create a free account on github.com and a **public** repository, e.g. `volley-live`.
2. *Add file → Upload files*: drag the **content** of this folder (`index.html`, `manifest.webmanifest`,
   `sw.js`, `icons/`) to the root of the repository → *Commit changes*.
3. *Settings → Pages → Source: Deploy from a branch → Branch: main / (root) → Save*.
4. After 1–2 minutes the app is at `https://<your-user>.github.io/volley-live/`.
   (Only the empty app is public; your match data never leaves the phone.)

Any other HTTPS static host (Cloudflare Pages, Netlify, your own server) works the same way:
publish the folder as is.

## Install on the iPhone

1. Open the URL in **Safari** (Wi-Fi or 4G, only this once).
2. Tap **Share** → **Add to Home Screen** → keep *Open as Web App* on → **Add**.
3. Start **Volley Live** from its icon. Open it once while still online so the offline cache is filled.
4. Test: switch on Airplane mode, close the app, start it again → it must open normally.

> Always use the app from its **icon**. Safari and the installed app have separate data.
> The yellow hint on the Home screen is shown only when the page is opened in a Safari tab.

## Using it during a match

* **NEW MATCH** → Team (names, match name, format, roster 7–12 with name and position)
  → Starting 7 → Initial rotation and first rally → **START SET 1**.
* Every rally: **Player → Action → Result** (3 taps). Data is saved on the phone after each tap on the result.
* **⇄ SUBSTITUTION**, **UNDO LAST**, **STATISTICS ▼** are on the capture screen.
* At the end of a set: **START SET n →**. At the end of the match: **SAVE MATCH .JSON**.

## Backup and transfer: SAVE .JSON / OPEN MATCH .JSON

* **SAVE .JSON** creates `<match name>.json`. On iPhone the Share sheet opens: choose
  **Save to Files** (iCloud Drive or On My iPhone), or AirDrop / Mail it to your PC.
* **OPEN MATCH .JSON** on the Home screen reloads a saved match (score, history, court, statistics).
* The phone keeps **one match at a time**: save the current one before NEW MATCH or OPEN.
* Recommended: SAVE .JSON at the end of each set.

## Updating the app

1. Replace the changed files on the host.
2. In `sw.js` change `CACHE = 'volley-live-capture-v1.0.0'` to a new value (e.g. `v1.0.1`),
   and the version label `v1.0.0` in `index.html`.
3. On the iPhone open the app once with network, close it and open it again.
   Match data in the phone is kept.

## Quick test from a PC (optional, online only)

```
python serve_local.py
```
Then open the printed `http://<pc-ip>:8000/` address in Safari on an iPhone on the same Wi-Fi.
Everything works except offline mode (iOS requires HTTPS for it).

## Requirements

* iPhone / iPad with iOS 16.4 or later recommended (Share sheet with files, Home Screen web apps).
* About 0.2 MB of storage.
