# Install or update Volley Live Capture v1.6.2 on iPhone

## First installation
1. Publish the complete package through HTTPS.
2. Open `index.html` in Safari while online.
3. Tap Share → Add to Home Screen.
4. Start from the Home-screen icon and verify `v1.6.2` on Home.
5. Create a short test match, close the app, reopen it and confirm CONTINUE / VIEW MATCH restores it.

## Update from an older version
1. Deploy all v1.6.2 files, including `sw.js`.
2. Confirm the service-worker cache ID is `volley-live-capture-v1.6.2`.
3. Open the hosted app online once.
4. Fully close Safari and the Home-screen app.
5. Reopen the Home-screen app. If the old version remains, repeat the online open/close cycle once.

## Courtside verification
- Basic: four result zones score the correct team.
- Intermediate: select one Focus player, then record a result; verify the selection clears.
- Advanced: record Attack Point and Reception Continue; verify Continue does not change score.
- Confirm Undo removes one event, substitution creates no rally, and rapid double-tap creates one result.
- Test once in Airplane Mode after the online shell has loaded.

## Data safety
Safari and the installed app can have separate local storage. Use the same context courtside and export JSON regularly.
