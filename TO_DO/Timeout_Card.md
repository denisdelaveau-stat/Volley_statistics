# Timeout Card

**Product:** VolleyLive
**Module:** Coach View → Timeout Card
**Status:** Draft v1.0 (working specification)
**Language:** English
**Depends on:** Unified JSON match action log; capture model `Player → Action → Status` for our team and `A → Action → Status` for the opponent (see *Physical Gamepad Input*, section 4.4).

---

## 1. Purpose

During a timeout, a coach has about 30 seconds to decide what to tell the team. The **Timeout Card** is a full-screen summary that answers three questions in **10 seconds or less**:

1. **Where are we losing points?**
2. **Who is being targeted?**
3. **What is working for us?**

Each block ends with **one suggested lead** (a "PISTE"): a short, rule-based hint the coach can use or ignore.

### 1.1 Goals

- Be readable at a glance on a tablet, from arm's length, under pressure.
- Compute everything from the **unified JSON action log**, which remains the single source of truth.
- Never show invented numbers: insufficient data is shown as **`NA` in grey**.
- Share the visual language of **Coach View** (dark theme, position colours, status colours).

### 1.2 Non-goals (v1)

- No free-text or AI-generated advice. Leads come from deterministic rules (section 7).
- No manual data entry on the card. It is read-only.
- No video, no per-point replay.
- No end-of-match debrief and no match-to-match comparison (see section 14, future work).

---

## 2. Principles

| Principle | Consequence |
|---|---|
| Log is the source of truth | The card stores nothing. Every figure is recomputed from the log whenever the card opens |
| No fake data | No match loaded → counters `0`, non-computable values `NA` in grey, no suggestion, no lead |
| Leads, not verdicts | Leads are worded as suggestions ("consider…", "protect…"), never as certainties |
| Small samples are not shown as facts | Every block has a minimum sample size (section 6); below it the block shows `NA` |
| Glanceable | Maximum 3 blocks, 1 headline figure per block, 1 lead per block |

---

## 3. Triggers

### 3.1 Manual

A large **TIMEOUT** button is always available in Coach View. Pressing it opens the card and starts the countdown.

On the physical gamepad, `TIMEOUT` is a configurable **control command**. To avoid accidental opening during capture, its suggested default is a **two-button combo** (L1 + R1). It is configured like any other binding (see *Physical Gamepad Input*, section 9).

### 3.2 Automatic suggestion

VolleyLive displays a **suggestion banner** with a TIMEOUT button when the opponent has scored **N consecutive points** (default **3**).

- A **series** counts consecutive rallies whose `derived.pointFor = "opponent"`. Rallies that did not end (`rallyEnded = false`) are ignored. The series resets as soon as we win a rally, or when a new set starts.
- The banner reads: *"A scored 4 points in a row (threshold: 3)"*, and stays visible while the series is ≥ N.
- Dismissing the banner hides it until the series grows by at least one point.
- The banner is **never shown** when no match is loaded.

| Setting | Default | Range |
|---|---|---|
| Series threshold | 3 | 2 – 8 |
| Suggestion enabled | On | On / Off |
| Optional: score-gap trigger | Off | gap ≥ N points |

### 3.3 Timeouts remaining

The number of timeouts allowed per set depends on the competition rules, so it is **a setting** (default 2 per team per set), not a hard-coded rule. The card header shows `Timeouts used: x / n` when enabled. The suggestion banner is suppressed when none remain.

---

## 4. Screens

### 4.1 Pre-timeout view (Coach View)

Top to bottom:

1. **Scoreboard:** `NOUS | SET n | A` with the current score (large, 38 px minimum).
2. **Series line:** *"A: 4 points in a row"* in red when the series is ≥ 1 for the opponent; grey `Series: NA` with no data.
3. **Suggestion banner** (yellow, with a TIMEOUT button), only when the trigger of 3.2 is met.
4. **TIMEOUT** large button, always visible.

### 4.2 Card (full screen)

Top to bottom:

1. **Header:** title `TIMEOUT`, subtitle `Set n · summary of the current set`, and the **countdown**.
2. **Countdown bar:** a thin bar that empties linearly over the timeout duration (default 30 s).
3. **Scoreboard and series line** (same as 4.1), for context.
4. **Three blocks**, always in this order:
   1. WHERE WE LOSE POINTS (red)
   2. WHO IS TARGETED (yellow)
   3. WHAT WORKS (green)
5. **Footer button:** `CLOSE · RESUME PLAY`, full width, green.

### 4.3 Block anatomy

Every block follows the same structure so that the eye learns it once:

```
┌───────────────────────────────────────┐  ← border in block colour
│ BLOCK TITLE                (small caps)│
│ HEADLINE FIGURE            (very large)│
│ one-line subtitle          (small, grey)│
│ [bars or chips]            (optional)  │
│ - - - - - - - - - - - - - - - - - - - │
│ LEAD  one-line suggestion              │
└───────────────────────────────────────┘
```

- Headline size: `clamp(34px, 11vw, 52px)`, weight 900.
- Title colour = block colour; subtitle = muted.
- Bars are horizontal, proportional to the largest value of the block.
- Bars use the block colour; chips use status colours (✓ green, O yellow, ✕ red).

### 4.4 Behaviour

| Event | Result |
|---|---|
| Open | Countdown starts at the configured duration; metrics are computed once at opening |
| Countdown reaches 0 | The countdown stops at `0`. The card **stays open** until the coach closes it |
| `CLOSE · RESUME PLAY` or gamepad ✕ | Card closes, capture screen is restored with the previous selection state |
| New action captured while the card is open | Ignored for the card. The card shows the state at opening (no live flicker) |
| Opening a second time in the same set | Recomputed from the log |

The card **does not block capture**: it is a Coach View overlay, and closing it never discards a partially entered action.

### 4.5 Visual specification

- Theme: **Coach View dark**. Light theme supported through the same tokens.
- Colours: red `#ef4444`, yellow `#facc15`, green `#22c55e`, accent `#38bdf8`, muted grey for `NA`.
- Position colours (when a player is shown): OPP blue, Setter yellow, OH red, MB green, Libero grey.
- Opponent `A` is always shown as a **black card** with the label `A`.
- Selection or emphasis is never conveyed by colour alone (size, border and label are used too).
- Minimum touch target: **48 px**; the footer button is at least 56 px high.
- Layout adapts to portrait and landscape; no horizontal scrolling down to 320 px.

---

## 5. Data foundation

### 5.1 Input

The card reads the unified action log. Each entry already contains (see *Physical Gamepad Input*, sections 4.4 and 10):

```json
{
  "type": "action",
  "set": 2,
  "team": "us | opponent",
  "player": 12,
  "slot": 2,
  "action": "ATTACK",
  "status": "POSITIVE",
  "derived": { "rallyEnded": true, "pointFor": "us | opponent", "cause": "KILL" }
}
```

### 5.2 Point attribution rules (recalled)

The status qualifies the action for the team that played it:

| Status | Effect |
|---|---|
| ✓ POSITIVE | Ends the rally **only** for `SERVE`, `ATTACK`, `BLOCK`; point for the acting team (ace, kill, block point) |
| O NEUTRAL | Rally continues |
| ✕ NEGATIVE | Rally ends; point for the **other** team |

`derived.pointFor` and `derived.cause` are computed by the match engine and are never entered by the scorer.

### 5.3 Glossary of derived terms

| Term | Definition |
|---|---|
| **Rally end** | Entry with `derived.rallyEnded = true` |
| **Point lost** | Rally end with `pointFor = "opponent"` |
| **Point won** | Rally end with `pointFor = "us"` |
| **Our error** | Rally end where `team = "us"` and `status = NEGATIVE`. Cause = the action type (e.g. reception error) |
| **Point given** | Point won where `team = "opponent"` and `status = NEGATIVE` (the opponent made an error) |
| **Kill** | Rally end, `team = "us"`, `action = ATTACK`, `status = POSITIVE` |
| **Ace** | Rally end, `action = SERVE`, `status = POSITIVE` |
| **Attack attempt** | Any `ATTACK` entry of the player, whatever its status |
| **Reception** | Any `RECEPTION` entry of our team |
| **Rotation** | The rotation number at the time of the entry, recorded by the match engine |

### 5.4 Window

The default analysis window is **the current set**. It is configurable:

| Window | Description |
|---|---|
| Current set (default) | All entries with the current `set` value |
| Last N rallies | The most recent N rally ends (default N = 12), across a set boundary if needed |

The header always states the window used (*"Set 2 · summary of the current set"* or *"Last 12 rallies"*).

---

## 6. Blocks

### 6.1 Block 1 – WHERE WE LOSE POINTS (red)

**Question:** What costs us points, and how does the opponent score?

**Headline:** `X / Y`
- `Y` = total points lost in the window.
- `X` = points lost through **our own errors** (subset of Y).

**Subtitle:** *"points lost on our errors · Z won by A (k aces, m attacks)"*, where `Z = Y − X`, with the main causes of the opponent's scoring.

**Bars (up to 3):** our errors grouped by action type, sorted descending, e.g.:

```
Reception ✕   ███████ 3
Attack ✕      █████ 2
Serve ✕       ██ 1
```

**Lead rules:** see section 7.

**Minimum sample:** `Y ≥ 5` points lost in the window. Below that, the block shows `NA`.

### 6.2 Block 2 – WHO IS TARGETED (yellow)

**Question:** Who receives the most pressure, and how well do they cope?

**Headline:** `#N · P %`
- `#N` = our player with the highest number of `RECEPTION` entries in the window.
- `P` = that player's share of all our `RECEPTION` entries, rounded to the nearest integer.

**Subtitle:** *"of opponent serves received (r of R) · position"*.

**Chips:** that player's reception quality: `✓ a`, `O b`, `✕ c`, in status colours.

**Tie-break:** on equal counts, the player with more ✕ is shown first, then the lowest jersey number.

**Minimum sample:** `R ≥ 5` total receptions. Below that, the block shows `NA`.

> **Data dependency:** this block is only reliable if reception entries are captured systematically. The card never estimates missing receptions.

### 6.3 Block 3 – WHAT WORKS (green)

**Question:** Who or what is scoring for us right now, and what is the opponent giving us?

**Headline:** `#N · K kills`
- `#N` = our player with the most **kills** in the window.

**Subtitle:** *"on T attacks (E %) · position · G points given by A"*, where `E = K / T` (attack efficiency based on kills) and `G` = points given by the opponent's errors.

**Bars (up to 3):** points given by the opponent, grouped by cause, e.g.:

```
A serve ✕    ███████ 3
A attack ✕   ██ 1
```

**Tie-break:** on equal kills, higher efficiency, then the lowest jersey number.

**Minimum sample:** at least `5` of our attack attempts in the window, and the featured player must have at least `3` attempts. Otherwise `NA`.

### 6.4 Sample thresholds (summary)

| Block | Minimum sample | Below threshold |
|---|---|---|
| 1 Where we lose points | 5 points lost | `NA`, grey block |
| 2 Who is targeted | 5 receptions | `NA`, grey block |
| 3 What works | 5 attack attempts, ≥ 3 for the featured player | `NA`, grey block |

All thresholds are constants in configuration (section 11) and shown in the grey block: *"Insufficient sample (2 / 5 actions)"*.

---

## 7. Leads ("PISTE")

### 7.1 Principles

- One lead per block, maximum **90 characters**.
- Chosen by **deterministic rules** in the order listed; the first matching rule wins.
- Worded as a suggestion. Never presented as a certainty or an instruction.
- If no rule matches, or the block is `NA`, the lead reads *"no lead: insufficient data"* (grey).
- Leads are localisable strings with placeholders.

### 7.2 Rule table

| Block | Priority | Condition | Lead template |
|---|---|---|---|
| 1 | 1 | One rotation holds ≥ 50 % of our errors and ≥ 3 errors | `Secure {action} errors, especially in rotation {r} ({k} of {X} errors)` |
| 1 | 2 | One action holds ≥ 50 % of our errors | `Reduce {action} errors ({k} of {X})` |
| 1 | 3 | Opponent aces ≥ 3 | `Adjust reception positioning against A's serve ({aces} aces)` |
| 1 | 4 | Otherwise | `No dominant cause: errors are spread out` |
| 2 | 1 | Targeted player share ≥ 50 % and ✕ ≥ 3 | `Consider relieving #{n} or covering with the libero ({share} % of serves)` |
| 2 | 2 | Targeted player share ≥ 50 % | `A targets #{n} ({share} %): prepare the reception cover` |
| 2 | 3 | Otherwise | `Serves are spread across players` |
| 3 | 1 | Featured player efficiency ≥ 50 % and ≥ 4 kills | `Keep looking for #{n}; maintain serve pressure` |
| 3 | 2 | Points given ≥ 3 | `Keep the serve pressure: A gave {G} points` |
| 3 | 3 | Otherwise | `No clear scoring pattern yet` |

Thresholds (50 %, 3, 4) are configuration constants, not hard-coded in the rules. The same template engine drives all rules, so adding or tuning a rule never changes the card layout.

### 7.3 Rotation attribution

The rotation of an error is the **rotation at the time of the entry**, taken from the match engine, never inferred afterwards from the current line-up. Substitutions are handled by the match engine; the card only reads the recorded value.

---

## 8. NA state (no data)

With no match loaded, or when a block does not reach its sample threshold:

| Element | Display |
|---|---|
| Scores | `0` |
| Set | `SET NA` |
| Series | `Series: NA` (grey) |
| Suggestion banner | Hidden; a grey line *"No match loaded: no automatic suggestion"* |
| Block headline | `NA` (grey) |
| Block subtitle | *"Insufficient sample (x / 5 actions)"* |
| Block lead | *"no lead: insufficient data"* (grey) |
| Block border | Neutral grey instead of the block colour |

The TIMEOUT button stays usable so that a coach can still run the timer. The three blocks are then all `NA`.

**Demonstration values must never be shown in the real app.** Example values in the design mockup are invented and exist only for visual review.

---

## 9. Timeout event

Opening the card records a `timeout` event in the unified log, so timeouts can be counted and replayed in the timeline:

```json
{
  "type": "timeout",
  "timestamp": "2026-11-26T20:31:05.220Z",
  "set": 2,
  "team": "us",
  "score": { "us": 14, "opponent": 17 },
  "trigger": "manual | suggestion | gamepad",
  "durationSec": 30,
  "inputSource": "touch | gamepad"
}
```

- `trigger = "suggestion"` when the button of the suggestion banner was used.
- The event is written when the countdown starts, not when the card closes.
- A timeout accidentally opened can be removed with **UNDO** (same rule as other events, see *Physical Gamepad Input*, section 10.3).
- A timeout called by the opponent can be logged with `team = "opponent"` (no card is shown by default; see open questions).

The Live Timeline displays timeouts as a distinct marker.

---

## 10. Gamepad integration

| Command | Default | Notes |
|---|---|---|
| `TIMEOUT` (open card) | L1 + R1 | Combo, to prevent accidental opening. Configurable like every control |
| `CLOSE` | ✕ | Same as the footer button |
| Scroll | Left stick / D-pad ↑ ↓ | Only if the card exceeds the screen height (small viewports) |

The card respects the same debounce and one-press-one-command rules as the capture screens.

---

## 11. Configuration

`Settings > Coach View > Timeout Card`

| Setting | Default | Range |
|---|---|---|
| Timeout duration | 30 s | 15 – 60 s |
| Window | Current set | Current set / Last N rallies |
| Last N rallies | 12 | 6 – 30 |
| Suggestion enabled | On | On / Off |
| Series threshold | 3 | 2 – 8 |
| Score-gap trigger | Off | gap ≥ N |
| Timeouts per set | 2 | 0 – 4 (0 hides the counter) |
| Sample thresholds | 5 / 5 / 5 | 3 – 10 |
| Lead thresholds | 50 % / 3 / 4 | per rule |
| Show lead | On | On / Off |

Settings are stored locally and exported with the match configuration.

---

## 12. Edge cases

| Situation | Behaviour |
|---|---|
| No match loaded | NA state (section 8) |
| First rallies of a set (little data) | Blocks show `NA` with their sample counter, e.g. `2 / 5` |
| Opponent entries missing for some rallies | Block 1 and 3 only count captured rally ends; the subtitle states the number of rallies analysed |
| Set boundary during a "Last N rallies" window | Window crosses sets; header states `Last 12 rallies` |
| Substitution or rotation between the entries | Uses the values recorded in each entry |
| Card opened twice in a row | Two `timeout` events unless the second is an **UNDO** target; the timeout counter reflects the log |
| Gamepad disconnects while the card is open | Card stays open; touch controls remain usable |
| Countdown reaches 0 | Stays at `0`, card stays open (section 4.4) |
| Tablet screen rotates | Layout reflows; countdown and state are preserved |
| Very long player or position names | Truncated with ellipsis; the jersey number is always visible |
| App goes to background | Countdown continues from the timestamp, not from a paused timer |

---

## 13. Acceptance criteria

1. The card opens from the TIMEOUT button and from the suggestion banner, and from the gamepad combo.
2. A series of 3 consecutive opponent points shows the suggestion banner; the series resets on our point and at a new set.
3. The three blocks are always in the same order and structure; each shows one headline figure and one lead.
4. Every figure on the card can be **recomputed from the unified JSON log**; no value comes from a separate store.
5. With no match loaded, all counters are `0`, all non-computable values are `NA` in grey, and there is no suggestion and no lead.
6. A block below its sample threshold shows `NA` and the sample counter.
7. The countdown starts at opening, stops at 0, and does not close the card.
8. Closing the card restores the capture screen without losing a partially entered action.
9. A `timeout` event is added to the log when the card opens and can be undone.
10. The card is readable on a tablet in portrait and landscape; the headline of each block is at least 34 px.
11. Leads are produced by the rule table (section 7) and never exceed 90 characters.
12. Changing the window or thresholds in settings changes the figures consistently on the next opening.

### Test scenarios

| Scenario | Expected |
|---|---|
| Log with 4 consecutive opponent rally ends | Banner shown: *"A scored 4 points in a row"* |
| 6 of 17 points lost on our errors, 3 reception errors | Block 1: `6 / 17`, reception bar = 3 |
| One player has 6 of 10 receptions | Block 2: `#N · 60 %`; ≥ 3 ✕ gives the "consider relieving" lead |
| 5 kills in 8 attempts for one player | Block 3: `5 kills`, efficiency 63 % |
| 4 receptions in total | Block 2 shows `NA` with `4 / 5` |
| Empty log | NA state everywhere, no suggestion |

---

## 14. Future work (out of scope for v1)

1. **Automatic end-of-match debrief:** a single shareable page reusing the same three blocks over the whole match, with the evolution set by set.
2. **Match-to-match comparison:** shows whether a weakness identified in one match recurs in the next.
3. **Opponent timeout view:** a variant of the card oriented toward what the opponent is doing.
4. **Additional blocks** (side-out efficiency, rotation heat map) only if the 10-second readability goal is still met.

---

## 15. Open questions

1. **Series threshold and trigger:** keep 3 consecutive opponent points, or add a score-gap trigger by default?
2. **Analysis window:** current set only, or "last N rallies" by default?
3. **Non-standard faults** (net touch, double contact, rotation fault, ball out without attack): are they added as a `FAULT` action with a sub-cause? Without it they are classified `OTHER` and do not appear in the causes of Block 1.
4. **Reception coverage:** are all our receptions captured with a status during real matches? If not, Block 2 must carry a visible warning.
5. **Timeout counter:** use a fixed default of 2 per set, or make it depend on the competition profile?
6. **Opponent timeout:** should it open the card too, or only be logged as an event?
7. **Cause naming:** align `derived.cause` values with the *Physical Gamepad Input* spec (e.g. `SERVICE_ERROR` with `team = "opponent"` versus `OPPONENT_SERVICE_ERROR`).
