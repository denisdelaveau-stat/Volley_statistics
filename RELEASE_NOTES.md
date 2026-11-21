# Release notes — v1.13.0

## New Coach landscape views

- Added **LIVE COURT** as a fourth Coach tab. It renders six equal player cards at real positions 4-3-2 / 5-6-1, with status border, trend, role chip, PTS/ERR/EFF and alert strip.
- Added **PLAYER FOCUS** when a live player card or the existing player-detail call to action is activated.
- Added previous/next player navigation and a direct **Court** return.
- Added ATTACK, BLOCK, RECEPTION and DEFENSE panels with the latest five actions and cumulative efficiency curves over the last 12 rallies.

## Data rules

- No match/demo values are hardcoded.
- PTS, ERR, EFF, ATT, KILL, TOUCH, DIG, REC, SO and BP are calculated from the loaded match events/rallies.
- POS, GOOD and reception/defense efficiency use the existing Advanced Statistics convention: contacts whose result is not ERROR. They carry a discreet `≈` marker and tooltip.
- BLK remains `NA`: the current match contract does not identify attacks blocked by the opponent.
- Capture-v1 exports without intermediate contacts show `NA` for curves rather than flat invented series.
- Empty Coach views are neutral grey and contain only `0` or `NA`.

## Visual and compatibility

- Matches the supplied dark-blue/cyan landscape references at 1280 × 800.
- Preserves the single shared pastel role palette: OPP blue, SET yellow, OH red, MB green, LIB grey.
- Status colours remain independent from role colours.
- Portrait mode displays a rotate-device message.
- Preserves Capture, rotations, substitutions, JSON import, **COACH VIEW** and **ADVANCED STATISTICS**.
- Offline cache updated to `volley-live-capture-v1.13.0` and includes `coach-live-config.js`.

## Validation

See `IMPLEMENTATION_REPORT_v1.13.0.md`, `tests/TEST_RESULTS_v1.13.0.txt` and `docs/visual-validation/`.
