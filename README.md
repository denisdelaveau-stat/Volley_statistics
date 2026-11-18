# Volley Live Capture v1.7.0

Offline-first volleyball match capture for Basic, Intermediate and Advanced workflows.

## v1.7.0 highlights
- Uses the supplied `Font_app_ref.jpg` as the full-screen Home artwork.
- Rebuilds Home around New Match, Continue/View Match, Open Archives, Teams and Settings; Statistics is removed.
- Moves the current-match summary into the Continue button.
- Adds a single-screen reusable Teams editor with 1–40 jersey selection and position colors.
- Adds the New Match flow: saved-team selection, Present/Focus confirmation, setter-position-driven rotation, compatible-player selection, and Service/Reception preview with libero handling.
- Adds persistent Settings for match format and capture detail level.
- Retains live capture, scoring, rotation, substitutions, reports and portable match format version 1.

## Run locally
```bash
python serve_local.py
```
Open the displayed local URL in a modern browser.

## iPhone update
Deploy the whole folder, including `Font_app_ref.jpg`, `sw.js` and `icons/`. Launch it online once so cache `volley-live-capture-v1.7.0` is installed, then close and reopen the app. Verify `v1.7.0` on Home.

## Verification
```bash
pytest -q
```
Expected result: `26 passed`.
