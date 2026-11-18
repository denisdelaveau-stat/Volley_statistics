# Volley Live Capture v1.7.0 — Release Notes

## New application entry flow
The Home screen now uses the user-supplied `Font_app_ref.jpg` artwork. The active match appears inside `CONTINUE / VIEW MATCH`, `OPEN MATCH .JSON` is renamed `OPEN ARCHIVES`, and the separate Statistics control is removed. Teams and Settings are directly accessible from Home.

## Reusable Teams
A single editor now creates, loads, clones, edits, deletes and saves team rosters. Players use jersey numbers 1–40 and the established SET/OH/MB/OPP/LIB color system. Match-specific Focus selection is intentionally excluded from reusable team data.

## New Match
The match flow selects a saved team, confirms player presence and Focus tracking, then builds the initial court from the setter's P1–P6 position. The S → OH1 → MB1 → OPP → OH2 → MB2 sequence preserves opposite role pairs. Service/Reception selection updates the preview; the libero starts on the bench and can replace a back-row MB in Reception.

## Settings
Match format and capture detail level are now configured in Settings and applied to new matches.

## Compatibility
Existing capture, scoring, substitutions, reports and format-version-1 JSON files remain supported. The PWA cache is `volley-live-capture-v1.7.0` and includes the supplied Home artwork.
