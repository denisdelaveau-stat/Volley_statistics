# Volley Live Capture v1.9.0 — Release Notes

## Advanced Statistics integration
A new `ADVANCED STATISTICS` Home button opens the integrated Set Timeline, Rotation Metrics, Roster Ranking and Playing-Time interface. The former stand-alone report is now part of the same offline-first package and includes a direct path back to Home.

## Reference JSON alignment
The report no longer contains hard-coded `DATA` or `PLAYER_ROLES` constants. `statistics/adapter.js` validates and converts Volley Live Capture v1 exports. It derives rallies, serve/reception phase, side-out and break-point classification, standard clockwise setter rotation, roster roles, substitutions and libero presence from source logs. It reads the live browser stores, a selected JSON file or `statistics/data/As_cannes_vs_Frejus_2026-11-15.json`.

The supplied reference contains one terminal action per rally. The UI therefore preserves all 93 rallies and explicitly warns that intermediate-contact metrics are limited instead of inventing missing receptions, sets, attacks or digs. Opponent events remain visible on a dedicated row and are excluded from our roster rankings.

## Offline and validation
The PWA cache is now `volley-live-capture-v1.9.0` and includes the statistics page, adapter and reference JSON. Automated coverage includes Home navigation, the 93-action reference model and direct use of the current Capture local stores.

---

## v1.8.0 retained — Coach View
A new `COACH VIEW` button on Home opens a dedicated live-analysis interface inspired by the four supplied visual references. It contains one-tap navigation between `Vue coach`, `Équipe` and `Joueurs`, plus the complete Player Detail page.

## Live overview and rotations
The Overview displays the score, set status, rotation/phase context, six sample-qualified KPIs, the current court, recent-rally momentum and one priority signal. Rotation Analysis adds P1–P6 and phase filters, selected-rotation context, court reconstruction and transparent rally differentials.

## Players and detail
Players can be filtered by presence and role. Ranking uses the explicit `points − errors` delta rather than an unexplained score. The approved `Voir le détail joueur` CTA opens the selected player with period, rotation, phase and skill context retained; browser and in-page Back paths restore the Players screen.

## Data, responsive UI and PWA
Live data comes from the existing match and event stores. Without a saved match, the screen uses clearly labelled demonstration data. The UI supports 320 CSS px through desktop, keyboard focus and reduced motion. `coach.css` and `coach.js` are cached offline; the PWA cache is `volley-live-capture-v1.8.0`.

## Compatibility and validation
All v1.7.0 capture, setup, scoring, substitution, report and JSON features remain supported. JavaScript syntax validation and the complete automated suite pass: **28 tests passed**.

---

## v1.7.0 baseline retained

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
