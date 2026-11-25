# VolleyLive — Mobile Coach View
## OPP Attack Share and Efficiency by Rotation

**Document status:** Implementation specification  
**Language:** English  
**Target:** Mobile Coach View  
**Primary role:** Coach  
**Data source:** Unified match event log  
**Reference state:** Demo screen for player `#12 MARTIN`, position `OPP`

---

## 1. Purpose

This screen provides a live, mobile-first view of how much the selected opposite hitter is used and how efficiently the selected opposite hitter converts those opportunities.

The view must answer four questions within a few seconds:

1. What share of the team's attacks is currently assigned to the OPP?
2. What is the OPP's attack efficiency?
3. How do attack share and efficiency differ by team rotation?
4. How have both indicators evolved across the rallies of the current set or match?

The interface is an observation and decision-support view. It must not issue automatic tactical instructions, diagnose fatigue, or label a player as performing well or poorly based only on a small sample.

---

## 2. Scope

### 2.1 Included

- Live score and set status
- Player and position selection
- `Set` and `Match` scopes
- Overall Attack Share and Efficiency
- Recent rolling-window indicators
- Rotation-specific Attack Share and Efficiency
- One combined cumulative chart for both indicators
- Rally number on the horizontal chart axis
- Team rotation timeline aligned with rally numbers
- Latest five OPP attack outcomes
- Small-sample warnings
- Offline, empty, incomplete, correction, and undo states

### 2.2 Excluded

- Automated tactical recommendations
- Fatigue or injury inference
- Setter quality assessment
- Opponent block-system diagnosis
- Video analysis
- Biometric data
- Forecasting future performance
- Arbitrary “good”, “average”, or “bad” thresholds

---

## 3. Terminology

| Term | Definition |
|---|---|
| **Rally** | A sequence beginning with a serve and ending when a point is awarded. |
| **Rally number** | One-based sequential index of a rally within the selected set. For match scope, see section 13.4. |
| **Team attack attempt** | A valid attack event by the selected player's team, classified as `KILL`, `ERROR`, `BLOCKED`, or `IN_PLAY`. |
| **OPP attempt** | A valid attack attempt by the selected OPP. |
| **Attack Share** | OPP attempts divided by team attack attempts over the same observation scope. |
| **Efficiency** | `(kills - errors - blocked attacks) / OPP attempts`. |
| **Team rotation** | Rotation `R1` to `R6`, defined by the position of the team's starting setter at the beginning of the rally. |
| **Recent window** | The latest 10 valid team attack attempts while the selected player is on court. This is not necessarily the latest 10 rallies. |
| **Cumulative value** | Indicator calculated using all eligible events from the beginning of the selected scope through a given rally. |

---

## 4. Screen hierarchy

The mobile screen is vertically scrollable and contains the following sections in this exact order:

1. Application header
2. Live scoreboard
3. Main navigation
4. Position selector
5. Player and period selector
6. Overall KPI cards
7. Recent-window strip
8. Impact by rotation
9. Combined Share & Efficiency chart
10. Latest five OPP attacks
11. Neutral observation and sample warning
12. Formula footer
13. Bottom navigation

The score, tabs, selectors, KPI cards, tables, and graphs must not move horizontally when values update.

---

## 5. Application header

### 5.1 Content

Display:

- Product: `VolleyLive`
- View: `COACH VIEW`
- Data-state badge: `DEMO` when demonstration data is loaded
- Connection state:
  - `Connected`
  - `Reconnecting`
  - `Offline`

### 5.2 Rules

- The `DEMO` badge is mandatory whenever any displayed value is simulated.
- Demonstration data must never be shown without the badge.
- The connection indicator describes synchronization status, not match status.
- `Offline` retains the last locally calculated state and prevents silent data loss.

---

## 6. Live scoreboard

### 6.1 Primary line

Example:

`ANTIBES 18 – 16 NICE`

Display the team names and current set score on one line.

### 6.2 Secondary line

Example:

`SET 3 · Sets 1–1 · Antibes serving`

### 6.3 Behavior

- Update after each validated rally result.
- Use the unified event log as the source of truth.
- An undo or score correction must update this score and all dependent statistics atomically.
- A score update must not reset scroll position or selection state.

---

## 7. Main navigation

Tabs:

- `Overview`
- `Players`
- `Rotations`

For this screen, `Players` is active. The rotation table remains included because rotation is a context applied to the selected player, not a separate player selection mode.

---

## 8. Position selector

Display the following fixed order:

1. `OPP`
2. `OH`
3. `MB`
4. `SET`
5. `LIB`

Use the agreed role colors:

| Position | Color |
|---|---|
| OPP | Blue |
| OH | Red |
| MB | Green |
| SET | Yellow with dark text |
| LIB | Gray |

Role colors identify positions only. They must not communicate positive or negative performance.

Selecting another position keeps the layout stable but loads the KPI set defined for that position. This specification defines the OPP implementation only.

---

## 9. Player and period selection

### 9.1 Player identity

Display:

- Jersey number
- Player name
- Position badge
- Court status
- Current team rotation

Example:

`#12 MARTIN · OPP`  
`On court · Team R4`

If multiple players match the selected position, tapping the identity area opens a player selector.

### 9.2 Period control

Options:

- `Set`
- `Match`

Rules:

- Changing the period must not change the selected player.
- `Set` uses only events from the current set.
- `Match` uses eligible events from all sets in the match.
- The chosen period applies to the overall KPI cards, rotation table, chart, latest actions, and comparison text.

---

## 10. Overall KPI cards

Two equal-width cards are displayed side by side whenever the available width permits.

### 10.1 Attack Share

Label: `SHARE`

Formula:

```text
Attack Share = selected-player OPP attempts / team attack attempts
```

Eligibility rule:

- The numerator and denominator use the same observation interval.
- Only team attacks occurring while the selected player is on court are included.

Example:

```text
OPP attempts = 10
Team attempts = 25
Attack Share = 10 / 25 = 40%
```

Display:

- Main value: `40%`
- Supporting value: `10 / 25 team attacks`

If the denominator is zero, display `NA`, not `0%`.

### 10.2 Efficiency

Label: `EFFICIENCY`

Formula:

```text
Efficiency = (kills - errors - blocked attacks) / OPP attempts
```

Example:

```text
Kills = 6
Errors = 1
Blocked = 1
Attempts = 10
Efficiency = (6 - 1 - 1) / 10 = +40%
```

Display:

- Main value: `+40%`
- Supporting values: `6 kills · 1 error · 1 blocked`

`IN_PLAY` contributes to attempts but not to kills, errors, or blocked attacks.

If OPP attempts equal zero, display `NA`.

### 10.3 Shared context

Display below both cards:

`While on court.`

This qualification prevents a match-wide team denominator from understating the selected player's usage after a substitution.

---

## 11. Recent-window strip

### 11.1 Content

Title:

`Recent · Last 10 team attacks`

Display:

- Recent Attack Share
- Recent Efficiency
- Number of OPP attempts in the window
- Sample warning

Example:

```text
Share 40% | Efficiency +25%
4 OPP attempts · Small sample
```

### 11.2 Window definition

The recent window contains the latest 10 valid team attack attempts recorded while the selected player is on court.

Important:

- The window is not the latest 10 rallies.
- Rallies without a team attack do not advance the attack-window count.
- A rally may contain more than one team attack.
- The same 10 team attacks are used for both indicators.
- Share uses team attempts as the denominator.
- Efficiency uses selected-player attempts as the denominator.

### 11.3 Small sample

Show `Small sample` when the selected player has fewer than 5 attempts in the recent window.

The warning must not hide the calculated value. It communicates uncertainty without imposing a tactical conclusion.

---

## 12. Impact by rotation

### 12.1 Purpose

The rotation section compares OPP usage and outcome across `R1` to `R6` without forcing the coach to read multiple percentages.

### 12.2 Rotation definition

`R1` to `R6` represent team rotations based on the position of the team's starting setter at the beginning of each rally.

The rotation is not the physical zone occupied by the OPP after serve-receive transition or defensive movement.

### 12.3 Table columns

| Column | Content |
|---|---|
| `Rotation` | `R1` to `R6` |
| `OPP / Team` | OPP attempts and team attempts in the rotation |
| `Share` | Blue normalized horizontal bar |
| `Eff.` | Green diverging horizontal bar centered on zero |

### 12.4 Example row data

| Rotation | OPP / Team | Share value | Efficiency value |
|---|---:|---:|---:|
| R1 | 2 / 5 | 40% | +50% |
| R2 | 2 / 4 | 50% | 0% |
| R3 | 1 / 4 | 25% | +100% |
| R4 | 3 / 5 | 60% | +33% |
| R5 | 1 / 4 | 25% | 0% |
| R6 | 1 / 3 | 33% | +100% |

The numerical percentages in this table are implementation examples only. The production interface displays bars rather than percentage labels.

### 12.5 Share bar

- Track represents `0%` to `100%` from left to right.
- Fill color: OPP blue.
- Bar length is proportional to Attack Share.
- No percentage text is displayed in the rotation table.
- A zero value shows an empty track.
- `NA` displays a neutral unavailable track with an `NA` accessible label.

Examples:

- 25% fills one quarter of the track.
- 40% fills two fifths.
- 60% fills three fifths.

### 12.6 Efficiency bar

Efficiency can be negative, zero, or positive. Therefore, a standard left-to-right progress bar is not acceptable.

Use a diverging bar:

- Full scale: `-100%` to `+100%`
- Center tick: `0%`
- Negative values extend left from the center.
- Positive values extend right from the center.
- Zero shows only the center marker.
- Fill color: green in the current design.
- No percentage text is displayed in the rotation table.

Examples:

- `+100%` fills the full positive half.
- `+50%` fills half of the positive half.
- `+33%` fills approximately one third of the positive half.
- `0%` displays only the central zero marker.
- `-50%` fills half of the negative half toward the left.

The bar must include an accessible text value even though the visible table omits percentages.

### 12.7 Current rotation

- Highlight the full current-rotation row with a pale blue background.
- Add a left-side current marker.
- Add a `LIVE` badge at the right side.
- Do not reorder rows. The order remains `R1` through `R6`.

### 12.8 Legend

Display:

```text
Share: low → high
Eff.: negative ← 0 → positive
```

### 12.9 Sample handling

Display:

`Small sample · Tap a rotation for details.`

A tap opens rotation details containing:

- OPP attempts
- Team attempts
- Kills
- Errors
- Blocked attacks
- In-play attacks
- Visible numerical Share and Efficiency values

The compact table itself remains bar-based.

---

## 13. Combined Share & Efficiency chart

### 13.1 Purpose

The chart displays the cumulative evolution of Attack Share and Efficiency in one graph. The chart allows the coach to see whether usage and outcome move together or diverge during the set.

There must be exactly one chart. Do not add a separate scatterplot or a second time-series chart.

### 13.2 Title and subtitle

Title:

`Share & Efficiency`

Subtitle:

`Cumulative within the set`

For Match scope, use:

`Cumulative within the match`

### 13.3 Series

| Series | Style | Calculation |
|---|---|---|
| Share | Solid blue line | Cumulative OPP attempts / cumulative team attempts |
| Efficiency | Dashed green line | Cumulative `(kills - errors - blocked) / OPP attempts` |

Do not smooth the lines. Use straight segments or stepped segments between calculated rally points.

### 13.4 Horizontal axis

Label:

`Rally number`

Set scope:

- Use one-based rally numbers within the current set.
- Example ticks: `1, 5, 10, 15, 20, 25, 30, 34`.
- The final x-coordinate equals the latest validated rally number.

Match scope:

- Use a continuous match rally index to avoid duplicate rally numbers across sets.
- Add subtle vertical set separators labeled `S1`, `S2`, `S3`, etc.
- The event model must retain both `setNumber` and `rallyNumberInSet` for drill-down.

The horizontal axis must never use elapsed clock time.

### 13.5 Vertical axis

Use one common scale for both indicators:

- Minimum: `-100%`
- Maximum: `+100%`
- Emphasized horizontal baseline at `0%`
- Recommended major ticks: `-100, -80, -60, -40, -20, 0, +20, +40, +60, +80, +100`

Attack Share naturally remains between `0%` and `100%`. Efficiency may use the full negative-to-positive scale.

Do not use separate left and right axes.

### 13.6 Cumulative calculation at rally r

For each plotted rally `r`, include all eligible events from the start of the selected scope through rally `r`.

```text
Share(r) = cumulative OPP attempts through r
           / cumulative team attempts through r

Efficiency(r) = cumulative kills through r
                - cumulative errors through r
                - cumulative blocked attacks through r
                ------------------------------------------------
                cumulative OPP attempts through r
```

Render no point when the relevant denominator is zero.

### 13.7 Plot frequency

- Recalculate after every validated rally.
- If the rally contains no eligible team attack, carry forward the previous visible value.
- If no previous value exists, leave the series undefined.
- Preserve the rally index even when no attack occurs, so the chart remains aligned with rotation spans.

### 13.8 Final annotation

At the last rally, display a compact annotation such as:

`Share 40% · Efficiency +40%`

Also display:

`Rally 34`

The endpoint annotation must use overall cumulative values, not the recent-window values. In the example:

- Overall Share: `40%`
- Overall Efficiency: `+40%`
- Recent Efficiency: `+25%`

Therefore, the graph ends at `+40%` Efficiency while the recent strip shows `+25%`.

### 13.9 Rotation timeline under the chart

Display a narrow `Team rotation` band directly below the plot.

Requirements:

- The band begins and ends at the exact horizontal boundaries of the plot area.
- Each block width is proportional to the number of rallies spent in that rotation.
- Blocks use the same rally-number scale as the chart.
- Rotation labels remain centered within their actual spans.
- The current rotation uses a blue fill.
- Earlier rotations use neutral gray fills.
- Tooltip or tap details show start rally and end rally.

Example sequence:

`R1 · R6 · R5 · R4 · R3 · R2 · R1 · R6 · R5 · R4`

Caption:

`Each point includes attacks up to that rally.`

### 13.10 Chart interaction

On tap or horizontal drag:

- Snap to the nearest rally.
- Show rally number.
- Show cumulative Share.
- Show cumulative Efficiency.
- Show team rotation.
- Optionally show score after that rally.
- Provide an accessible text equivalent.

The crosshair must not permanently obscure either curve.

---

## 14. Latest five OPP attacks

Title:

`Last 5 OPP attacks`

Display five result tokens from oldest to newest.

Supported outcomes:

- `KILL`
- `ERROR`
- `BLOCKED`
- `IN PLAY`

Color rules:

| Outcome | Color |
|---|---|
| KILL | Green |
| ERROR | Red |
| BLOCKED | Amber |
| IN PLAY | Gray |

Example:

`KILL → KILL → BLOCKED → IN PLAY → KILL`

New actions append on the right. When a sixth action is added, remove the oldest token from the left.

An undo restores the sequence exactly as derived from the event log.

---

## 15. Neutral observation

Example:

`Stable share · Lower recent efficiency`

Supporting text:

`Small sample: 4 recent OPP attempts.`

Rules:

- The observation must state measurable differences only.
- Do not infer fatigue, confidence, tactical intent, setter preference, or opponent adaptation.
- Do not show directives such as `keep using the OPP`.
- Suppress the observation when either comparison value is `NA`.

Suggested comparison wording:

| Condition | Text |
|---|---|
| Share change within ±5 pp, recent efficiency lower by more than 10 pp | `Stable share · Lower recent efficiency` |
| Share change within ±5 pp, recent efficiency higher by more than 10 pp | `Stable share · Higher recent efficiency` |
| Recent share higher by more than 5 pp | `Higher recent share` |
| Recent share lower by more than 5 pp | `Lower recent share` |
| Insufficient attempts | `Not enough recent attacks for comparison` |

These are display rules, not tactical thresholds.

---

## 16. Formula footer

Display concise definitions:

```text
Share = OPP attempts / team attempts
Efficiency = (kills - errors - blocked) / OPP attempts
```

The full methodological explanation is available from an information action.

---

## 17. Bottom navigation

Fixed items:

- `Live`
- `Coach`
- `Analysis`
- `Archives`

`Coach` is active.

The bottom navigation remains accessible while the content scrolls and must not cover the final content card.

---

## 18. Data model requirements

Each event used by this screen must provide or allow derivation of:

```json
{
  "matchId": "string",
  "setNumber": 3,
  "rallyId": "string",
  "rallyNumberInSet": 34,
  "matchRallyIndex": 92,
  "eventSequence": 417,
  "timestamp": "optional ISO-8601",
  "teamId": "string",
  "playerId": "string",
  "positionAtEvent": "OPP",
  "teamRotation": "R4",
  "playerOnCourt": true,
  "eventType": "ATTACK",
  "attackResult": "KILL | ERROR | BLOCKED | IN_PLAY",
  "isValidated": true,
  "isDeleted": false
}
```

### 18.1 Required properties

- `eventSequence` provides deterministic ordering inside a rally.
- `rallyNumberInSet` drives the Set chart x-axis.
- `matchRallyIndex` drives the Match chart x-axis.
- `teamRotation` is captured at rally start and remains stable for that rally.
- Historical events retain the position and on-court state valid when the event occurred.
- Correcting the current lineup must not silently rewrite previously validated events.

---

## 19. Computation pipeline

Use the following order:

1. Load validated events for the selected match.
2. Remove deleted or undone events.
3. Apply selected period: Set or Match.
4. Determine the selected player's on-court intervals.
5. Retain team attacks within those intervals.
6. Classify selected-player attacks and outcomes.
7. Calculate overall Share and Efficiency.
8. Calculate the latest 10-team-attack window.
9. Group eligible attacks by team rotation.
10. Build cumulative values for every rally index.
11. Build rotation spans using rally-start rotation events.
12. Build the latest-five-attack sequence.
13. Generate neutral comparison text.
14. Commit the entire derived model to the UI atomically.

No UI component may maintain an independent statistical total.

---

## 20. Corrections, undo, and substitutions

Recalculate all dependent content after:

- Attack creation
- Attack-result correction
- Rally correction
- Undo or redo
- Substitution
- Team-rotation correction
- Set change
- Period change
- Player change
- Position change

An undo must consistently update:

- Score, if applicable
- Overall Share
- Overall Efficiency
- Recent Share
- Recent Efficiency
- Rotation bar lengths
- Rotation counts
- Combined chart
- Rotation timeline
- Latest attack sequence
- Observation text

Updates must be applied atomically to avoid temporarily inconsistent values.

---

## 21. Empty and exceptional states

| Condition | Required behavior |
|---|---|
| No match loaded | Counts display `0`; rates display `NA`; chart shows an empty-state message. |
| No team attempts in scope | Share displays `NA`. |
| No OPP attempts in scope | Efficiency displays `NA`. |
| Fewer than 10 recent team attacks | Calculate from available attacks only if product policy allows it; otherwise show `Collecting 10 attacks`. The chosen rule must be consistent. |
| Fewer than 5 recent OPP attempts | Show result plus `Small sample`. |
| Missing rotation | Group under `Unknown`; do not assign an inferred R1–R6 value. |
| Player off court | Freeze current display and show `Off court`, or allow historical viewing without counting new team attacks. |
| Offline | Retain local state, show `Offline`, queue unsynchronized events. |
| Conflicting rally numbers | Reject chart update and flag data validation; never silently reorder. |
| Efficiency exactly zero | Show center marker only in the rotation bar. |
| Negative efficiency | Fill the rotation bar left of zero. |

Recommended recent-window behavior: show `Collecting 10 attacks` until 10 eligible team attacks exist, while retaining overall cumulative KPIs.

---

## 22. Responsive layout

Target width: `320–480 CSS px`.

### 22.1 General

- No page-level horizontal scrolling.
- Minimum touch target: `44 × 44 CSS px`.
- Main text remains readable at 200% zoom.
- Numeric updates must not resize cards or shift controls.

### 22.2 KPI cards

- Keep side by side when each card can retain readable labels and values.
- Stack vertically below the minimum readable width.
- Stack order: Share, then Efficiency.

### 22.3 Rotation table

- Keep all four columns visible.
- Keep `R1–R6` labels fixed.
- Bars use the remaining flexible width.
- Counts may use tabular numerals.
- Do not replace bars with percentages on narrow screens.

### 22.4 Chart

- Use the full card width.
- Keep a minimum plot height of `220 CSS px` on a standard mobile width.
- Reduce tick density before reducing font size.
- Preserve first and final rally labels.
- Keep the rotation timeline horizontally aligned with the plot after resizing.

---

## 23. Accessibility

- Meet WCAG 2.2 AA contrast requirements.
- Do not rely on color alone.
- Provide text labels for the solid Share and dashed Efficiency lines.
- Provide accessible values for rotation bars.
- Expose the chart as a concise summary plus a data table for assistive technology.
- Announce score and KPI updates using a non-intrusive live region.
- Do not announce every chart redraw separately.
- Preserve focus during live updates.
- Use tabular numerals for changing scores and percentages.
- Support reduced motion; no continuous chart animation.

Suggested accessible label for a rotation efficiency bar:

`Rotation R4, efficiency plus 33 percent, 3 OPP attempts.`

Suggested chart summary:

`At rally 34, cumulative attack share is 40 percent and cumulative efficiency is plus 40 percent. Recent efficiency is plus 25 percent over 4 OPP attempts.`

---

## 24. Visual design rules

- Mobile-first light theme
- Pale cool-gray page background
- White rounded cards
- Navy or navy-gradient headers
- Blue for OPP identity and Share
- Green for Efficiency
- Amber for sample cautions
- Red only for explicit errors or attack errors
- Subtle shadows and clear spacing
- No decorative sports photography
- No three-dimensional chart effects
- No arbitrary quadrant backgrounds
- No animation that competes with live match reading

The design must remain visually consistent with the VolleyLive Coach View language.

---

## 25. Performance requirements

- KPI recalculation target: less than `100 ms` for a normal match event log on the client device.
- UI update target after a validated action: less than `250 ms` excluding network confirmation.
- Chart interaction target: maintain smooth interaction at approximately `60 fps` on supported tablets and recent mobile devices.
- Cache derived cumulative arrays by set and invalidate only affected events after a correction.
- Avoid recomputing the full match when a single append-only event can be incrementally applied.
- After undo or historical correction, favor correctness over incremental optimization and rebuild the affected set.

---

## 26. Analytics and diagnostics

Optional non-player-performance telemetry may record:

- Screen opened
- Set/Match scope changed
- Position changed
- Player changed
- Rotation details opened
- Chart rally inspected
- Offline state entered
- Calculation or event-validation error

Do not transmit individual player statistics through product telemetry unless explicitly required and governed by the application's privacy policy.

---

## 27. Acceptance criteria

### 27.1 Overall metrics

1. Given 10 OPP attempts and 25 team attempts while the player is on court, Share displays `40%` and `10 / 25 team attacks`.
2. Given 6 kills, 1 error, 1 blocked attack, and 10 attempts, Efficiency displays `+40%`.
3. When the Share denominator is zero, Share displays `NA`.
4. When OPP attempts are zero, Efficiency displays `NA`.

### 27.2 Recent window

5. The recent window contains the latest 10 eligible team attacks, not the latest 10 rallies.
6. Given 4 recent OPP attempts with efficiency `+25%`, the strip displays `4 OPP attempts · Small sample`.
7. The recent value does not replace the cumulative chart endpoint.

### 27.3 Rotation table

8. Rows remain ordered `R1` through `R6`.
9. The Share column uses proportional blue bars and displays no percentages.
10. The Efficiency column uses zero-centered diverging green bars and displays no percentages.
11. A `0%` Efficiency row displays only the center marker.
12. A negative Efficiency value extends left of the center marker.
13. A `+100%` Efficiency value fills the complete positive half-track.
14. The current rotation row is highlighted and displays `LIVE`.
15. Opening a rotation detail reveals the exact numerical values and counts.

### 27.4 Combined chart

16. Exactly one chart displays both Share and Efficiency.
17. The horizontal axis is `Rally number`, never time.
18. Set mode uses one-based rally numbers for the current set.
19. The Share line is solid blue.
20. The Efficiency line is dashed green.
21. Both lines use the same `-100%` to `+100%` vertical scale.
22. The zero baseline is visually emphasized.
23. At rally 34, the example chart ends at Share `40%` and Efficiency `+40%`.
24. The recent Efficiency value `+25%` appears in the recent panel, not as the cumulative endpoint.
25. The rotation band aligns exactly with the chart plot width and rally-number scale.
26. A rally with no eligible attack carries the previous chart value forward without changing the rally alignment.

### 27.5 Event integrity

27. Undoing an attack updates all KPIs, bars, chart values, the latest-five sequence, and observation text.
28. A substitution changes future eligibility without rewriting historical events.
29. Correcting a team rotation rebuilds the affected rotation grouping and timeline.
30. Demo values never appear without the `DEMO` badge.

### 27.6 Mobile and accessibility

31. The screen has no horizontal page scroll at 320 CSS px.
32. All interactive targets are at least 44 × 44 CSS px.
33. Every bar and chart series has a non-color text equivalent.
34. Live updates preserve focus and scroll position.
35. All visible production interface labels are in English.

---

## 28. Test dataset for the reference mockup

The following aggregate dataset reproduces the visible reference state:

```json
{
  "player": {
    "number": 12,
    "displayName": "MARTIN",
    "position": "OPP",
    "onCourt": true,
    "currentRotation": "R4"
  },
  "period": "SET",
  "latestRallyNumber": 34,
  "overall": {
    "oppAttempts": 10,
    "teamAttempts": 25,
    "kills": 6,
    "errors": 1,
    "blocked": 1,
    "share": 0.40,
    "efficiency": 0.40
  },
  "recent": {
    "teamAttackWindow": 10,
    "oppAttempts": 4,
    "share": 0.40,
    "efficiency": 0.25,
    "smallSample": true
  },
  "byRotation": [
    {"rotation": "R1", "oppAttempts": 2, "teamAttempts": 5, "share": 0.40, "efficiency": 0.50},
    {"rotation": "R2", "oppAttempts": 2, "teamAttempts": 4, "share": 0.50, "efficiency": 0.00},
    {"rotation": "R3", "oppAttempts": 1, "teamAttempts": 4, "share": 0.25, "efficiency": 1.00},
    {"rotation": "R4", "oppAttempts": 3, "teamAttempts": 5, "share": 0.60, "efficiency": 0.33},
    {"rotation": "R5", "oppAttempts": 1, "teamAttempts": 4, "share": 0.25, "efficiency": 0.00},
    {"rotation": "R6", "oppAttempts": 1, "teamAttempts": 3, "share": 0.3333, "efficiency": 1.00}
  ],
  "latestOppAttacks": ["KILL", "KILL", "BLOCKED", "IN_PLAY", "KILL"]
}
```

The aggregate test data are for UI verification only. Production values must always be reconstructed from the official event log.

---

## 29. Implementation notes

- Keep rally numbers as the chart domain even if attack events are sparse.
- Build cumulative arrays keyed by rally number to preserve alignment.
- Derive the rotation table and rotation band from the same normalized rotation data.
- Define a single statistical service for formulas and filtering.
- Avoid calculating Share separately in cards, tables, and charts.
- Keep the recent-window model separate from the cumulative chart model.
- Format rates with a leading plus sign only for positive Efficiency values.
- Store raw ratios; round only for display.
- Recommended display rounding: nearest whole percentage point.
- Use unrounded values to determine bar length and chart coordinates.
- Treat `NA` as a distinct state, never as numeric zero.

---

## 30. Definition of done

The feature is complete when:

- All acceptance criteria pass.
- The interface matches the approved mobile visual hierarchy.
- The rotation table displays Share and Efficiency as bars without visible percentages.
- The combined chart uses rally numbers and contains both indicators.
- Overall and recent windows cannot be confused.
- All values originate from the unified event log.
- Undo, substitution, correction, offline, and empty states are verified.
- Accessibility checks pass for contrast, focus, text scaling, and non-color equivalents.
- No simulated values can appear without the `DEMO` badge.
