# Installation on iPhone – Volley Live Capture v1.1.3

## Prerequisites
- iPhone with a recent iOS version and **Safari**.
- The repository content published on an **HTTPS** static host (e.g. GitHub Pages).
  `http://` (e.g. `serve_local.py`) works for a quick online test only: no offline mode.

## First installation
1. On the iPhone, open the HTTPS URL in **Safari** (not Chrome, not an in-app browser).
2. Tap **Share** → **Add to Home Screen** → keep the name *Volley Live* → **Add**.
3. Start the app **from its icon**, with network, once. The Home screen shows **v1.1.3**.
4. Close the app, enable **Airplane mode**, start it again from its icon → it must open.
   The app is now 100 % offline.

## Update
1. In the app: **SAVE .JSON** the current match → *Save to Files* (safety copy).
2. Publish the new files on the host (replace all files).
3. With network: open the app from its icon, close it completely (swipe up), open it again.
4. Check the version on the Home screen. Match data stored on the phone is kept.

## Good practice
- Always use the app from its **icon**: Safari and the installed app keep **separate** data.
- Save the match (.JSON) at the end of each set; share it via the Share sheet (Files, AirDrop, mail).
- If iOS has not opened the app for several weeks, it can clear website data:
  reload the last .JSON with **OPEN MATCH .JSON**.

## Troubleshooting
| Symptom | Action |
|---|---|
| Old version still displayed | Open with network, close completely, reopen (twice if needed). |
| Does not open in Airplane mode | It was never started from the icon with network: repeat step 3. |
| Match missing | Home → **OPEN MATCH .JSON** → select the saved file. |
