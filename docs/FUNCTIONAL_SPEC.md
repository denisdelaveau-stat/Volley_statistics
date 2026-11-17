# Volley Live Capture v1.6.2 — Functional Specification

## 1. Purpose
Touch-first volleyball match capture for iPhone/tablet with offline PWA operation, JSON persistence, HTML reporting, live statistics and three input-detail levels. This file is the implementation companion to `Volley_Live_Capture_UI_Functional_Specification_EN_With_Original_Images.docx`.

## 2. Match creation and reusable setup
1. Home: NEW MATCH, CONTINUE / VIEW MATCH, OPEN MATCH .JSON.
2. Setup 1: team/opponent/match name, match format, detail level and roster for Intermediate/Advanced.
3. Setup 2: starting seven for Intermediate/Advanced.
4. Setup 3: initial P1–P6 rotation and first service/reception for Intermediate/Advanced.
5. Capture screen.

The v1.5 setup library remains available for saved teams, starting sevens and rotations. ROTATE +1 applies P2→P1, P1→P6, P6→P5, P5→P4, P4→P3 and P3→P2; six rotations restore the initial composition.

## 3. Cross-mode normative behaviour
- **Automatic return:** after an accepted event, return immediately to the mode’s primary selection screen.
- **Continue:** records the selected action with result `neutral`; no score change is made.
- **Phase banner:** SERVICE/RECEPTION describes the tracked team’s state, is read-only and updates from service state.
- **Undo:** one neutral grey/white **UNDO LAST** control removes exactly the latest accepted event. Red is reserved for Error.
- **Substitution:** while active, rally capture is suspended and no scoring event is created by player selection.
- **Duplicate protection:** after an accepted result, further rally-entry results are ignored for 400 ms. Navigation, statistics and export are not guarded.

## 4. Basic mode
- No player or action attribution.
- For each team: red ✕ Error zone on the left, team name in the centre, green ✓ Point zone on the right.
- Tracked team above NET; opponent below NET.
- Each result is accepted in one tap.

| Tap | Player | Result | Score |
|---|---|---|---|
| Tracked team ✕ | `T` | `error` | Opponent +1 |
| Tracked team ✓ | `T` | `point` | Tracked team +1 |
| Opponent ✕ | `A` | `error` | Tracked team +1 |
| Opponent ✓ | `A` | `point` | Opponent +1 |

## 5. Intermediate mode
- Court and bench show individually selectable Focus players.
- At most one Focus player is selected and visibly highlighted.
- Selected Focus player → tracked-team ✕/✓ records that player in two taps total.
- No selected player → tracked-team ✕/✓ records `TEAM` (`T`) in one tap.
- Opponent ✕/✓ records `ADVERSE` (`A`) directly in one tap.
- Non-Focus players are not individually selectable during normal capture.
- Selection clears after an accepted event.

## 6. Advanced mode
### 6.1 Primary screen
Focus players are selectable on court/bench. When at least one player is non-Focus, a direct TEAM result bar is displayed. ADVERSE always has a direct result bar below NET.

### 6.2 Combined Action/Result grid
A selected player opens one fixed grid. One result tap completes the event and returns to player selection.

| Action | Error | Point | Continue |
|---|---:|---:|---:|
| Attack | Yes | Yes | Yes |
| Block | Yes | Yes | Yes |
| Defence | Yes | No | Yes |
| Reception | Yes | No | Yes |
| Service | Yes | Yes | Yes |
| Set | Yes | No | Yes |

Unavailable Point cells have no active hit target. Continue uses the circular dual-arrow SVG and persists `neutral`.

### 6.3 Position/action guidance
The six rows remain visible in the fixed order above for every selected player. Expected actions use full emphasis. Rare legal actions are attenuated but remain tappable. Only Libero Attack, Block and Service are blocked.

| Position | Attack | Block | Reception | Defence | Service | Set |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Setter | X | X |  | X | X | X |
| OH | X | X | X | X | X |  |
| OPP | X | X |  | X | X |  |
| MB | X | X |  | X | X |  |
| Libero | Blocked | Blocked | X | X | Blocked | X |

`X` means expected for the position. An empty cell means rare but legal and therefore still selectable. `Blocked` is reserved for the three Libero prohibitions.

## 7. Scoring and match rules
Normal sets finish at 25 or more with a two-point margin. The deciding set finishes at 15 or more with a two-point margin. A completed set locks normal rally capture until the next set starts; a completed match is marked completed.

| Actor | Result | Winning team | Point origin |
|---|---|---|---|
| Tracked player / TEAM | Error | Opponent | `opponent_error` |
| Tracked player / TEAM | Point | Tracked team | `earned` |
| ADVERSE | Error | Tracked team | `opponent_error` |
| ADVERSE | Point | Opponent | `earned` |
| Advanced player | Continue | None | None |

## 8. Persistence, reports and statistics
- Match state/events: localStorage.
- Setup library: independent key `volleyCapture.library.v1`.
- SAVE .JSON exports portable match data; OPEN MATCH .JSON restores it.
- REPORT .HTML exports a self-contained report.
- Score, point origin, error charts, set progression and attacker statistics are rebuilt from events.
- Portable match JSON schema remains version 1.

## 9. Acceptance
Automated coverage is defined in `tests/TEST_PLAN.md`. v1.6.2 acceptance requires all listed pytest/Playwright tests to pass with no uncaught JavaScript errors, plus manual iPhone layout, VoiceOver and offline-persistence checks.
