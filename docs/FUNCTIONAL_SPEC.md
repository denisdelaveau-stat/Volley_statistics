# Volley Live Capture v1.6.10 — Functional Specification

## 1. Purpose
Touch-first volleyball match capture for iPhone/tablet with offline PWA operation, JSON persistence, HTML reporting, live statistics and three input-detail levels. This file is the implementation companion to `Volley_Live_Capture_UI_Functional_Specification_EN_With_Original_Images.docx`.

## 2. Match creation and reusable setup
1. Home: NEW MATCH, CONTINUE / VIEW MATCH, OPEN MATCH .JSON.
2. Setup 1: team/opponent/match name, match format, colour-coded detail level and roster for Intermediate/Advanced. The roster maximum is selectable from 7 to 30 and defaults to 12.
3. Setup 2: starting seven for Intermediate/Advanced.
4. Setup 3: initial P1–P6 rotation and first service/reception for Intermediate/Advanced.
5. Capture screen.

The v1.5 setup library remains available for saved teams, starting sevens and rotations. ROTATE +1 applies P2→P1, P1→P6, P6→P5, P5→P4, P4→P3 and P3→P2; six rotations restore the initial composition.

## 3. Cross-mode normative behaviour
- **Automatic return:** after an accepted event, return immediately to the mode’s primary selection screen.
- **Continue:** records the selected action with result `neutral`; no score change is made.
- **Phase banner:** SERVICE/RECEPTION describes the tracked team’s state, is read-only and updates from service state. SERVICE is green; RECEPTION is blue. Both use the same reduced-height geometry.
- **Rotation indicator:** Intermediate/Advanced display `Rot. Pn | Rn | Cn` as centred black text without a coloured background. `P` is the setter's current court position and has priority, `R` is the 1–6 rotation configuration, and `C` is the full rotation cycle. The line is equally spaced between the score and the phase banner.
- **Undo:** one light-orange **UNDO LAST** control removes exactly the latest accepted event. Error remains red and meaning never relies on colour alone.
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
The six rows remain visible in the fixed order above for every selected player. Attack and Block action labels use light orange; Defence and Reception use light green; Service and Set use light blue. Expected actions use full emphasis. Rare legal actions retain the same colour families at reduced emphasis and remain tappable. Only Libero Attack, Block and Service are blocked.

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
- Every new event stores the integer pre-rally `rotation` for statistics and compatibility. Live History deliberately hides time and rotation and shows only `#`, `Player`, `Action`, `Result`, `Score` in that order.
- Portable match JSON schema remains version 1.


## 9. Compact live header and BENCH controls
- The live capture header displays only the current rally score.
- Sets won are shown in compact badges outside the left and right rally scores.
- A visible line directly below the rally score marks the team currently serving; it updates after every side-out and at set start.
- The match/set title, Best-of/set-target/mode metadata strip and primary Player instruction are not displayed during capture.
- The BENCH replacement-player and SUBSTITUTION controls are reduced to compact readable 66 × 36 and 122 × 36 CSS px controls at the primary iPhone viewport and remain centred as one pair.
- The black NET band uses half the previous vertical padding.
- TEAM/ADVERSE result rows are reduced from 76 to 60 CSS px while keeping legible symbols and labels.

## 10. Setup 1 visual and roster rules
- Detail level background: Advanced pale red (`#fee2e2`), Intermediate pale yellow (`#fef9c3`), Basic pale green (`#dcfce7`).
- Roster maximum drop-down values: 7–30 inclusive; default 12. Jersey buttons are available from 1 through 30.
- The maximum drives the `selected (min 7, max N)` label, disables additional number buttons at the limit and blocks NEXT while selected count exceeds the chosen limit.
- Basic mode hides roster controls as before.

## 11. Acceptance

Automated coverage is defined in `tests/TEST_PLAN.md`. v1.6.10 acceptance requires all listed pytest/Playwright tests to pass with no uncaught JavaScript errors, plus manual iPhone layout, VoiceOver and offline-persistence checks.


## 12. v1.6.7 — UI Modification 6
- `UNDO` replaces `UNDO LAST` and uses the same 122×36 CSS px footprint as `SUBSTITUTION`.
- The transient `Saved: …` line is not displayed. History starts collapsed and opens on demand; Error, Point and Neutral use pale semantic badges.
- Each team result bar is three separated rounded blocks: Error, a non-interactive team label, and Point. Error/Point blocks explicitly name the team receiving the point.
- The compact court separator renders as a volleyball mesh with top tape, blue posts and red/white antennas.
- Advanced Attack, Block, Defence, Reception, Service and Set labels include compact action-specific player silhouettes.
- The supplied 1254×1254 icon artwork is used for Apple touch, favicon and manifest assets.
- Match JSON remains format version 1 and no scoring rule changes.


## 13. v1.6.8 — visual corrections
- The volleyball-net field has no dark fill; the page background remains visible through grey mesh lines.
- Top tape, lower edge, blue posts, red/white antennas and compact proportions are unchanged.
- Advanced action labels contain no player-silhouette icons.
- Orange, green and blue action-label families and lighter rare-action guidance remain unchanged.
- Full action names remain visible without clipping or ellipsis, including `Reception`.

## 14. v1.6.9 — Modification UI 7
- The live score uses one equal 5 px gap between all five blocks and smaller set/score blocks for a tighter cluster. The active `.service-line` remains visible directly below the serving score.
- Each CSS net pseudo-element has the same 28 px height as the rendered net and is aligned to its outer top edge; no post or antenna extends above or below the net.
- Intermediate and Advanced tracked-team result bars use a 2 px dashed top divider, 8 px top padding and 8 px top margin to separate BENCH/substitution controls from rally input.

## 15. v1.6.10 — borderless application artwork
Apple touch, favicon and manifest PNGs shall be regenerated from `IMG_5596.PNG` as square, fully opaque images. The navy field shall reach all four edges and corners, with no pale perimeter, white corner or pre-rendered rounded mask. The icon content and gold/white/blue volleyball artwork remain unchanged.
