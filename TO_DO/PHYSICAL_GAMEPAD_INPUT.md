# Physical Gamepad Input

**Product:** VolleyLive
**Module:** Setup & Capture → Live Capture → Physical Gamepad Input
**Status:** Draft v1.0 (working specification)
**Language:** English
**Controller targeted:** Sony DualSense (PS5). Any controller exposing the browser "standard" mapping must also work.

---

## 1. Purpose

Allow a scorer to record match actions with a **physical gamepad** (PS5 DualSense), without touching the tablet, while the tablet screen provides large, readable visual feedback.

The gamepad is **an additional input source**. It does not change the capture model. Every recorded action is still:

```
Player → Action → Status
```

and is written to the unified JSON match action log, which remains the **single source of truth**.

### 1.1 Goals

- Record one action in **2 or 3 validations** without looking at the controller.
- Show what is being selected, and what has just been recorded, in **large characters** readable from a distance.
- Let the user **configure** which physical button is used for every player, action and status.
- Behave identically to the touch interface at the data level (same events, same JSON).

### 1.2 Non-goals

- No dependency on a native app, driver, server or WebBluetooth. Only the browser **Gamepad API** is used.
- No gamepad-specific logic in the match engine.
- No demo or fake data. With no match loaded, counters show `0` and non-computable values show `NA` in grey.

---

## 2. Architecture

```
DualSense (USB / Bluetooth)
        │
        ▼
Browser Gamepad API  (navigator.getGamepads(), events)
        │
        ▼
GamepadManager      → connection state, polling loop, edge detection
        │
        ▼
GamepadBindings     → physical input → logical command (user-configurable)
        │
        ▼
CaptureController   → state machine (screens, selections, validation)
        │
        ├──► CaptureView   → on-screen visual feedback
        ├──► GamepadHaptics → rumble feedback (optional)
        ▼
VolleyLive.dispatch(command) → Match Engine → JSON action log
```

Touch, keyboard and gamepad all converge on the same commands:

```
Touch ──────┐
Keyboard ───┼──► CaptureController ──► Match Engine ──► JSON action log
Gamepad ────┘
```

### 2.1 Suggested modules

| Module | Responsibility |
|---|---|
| `GamepadManager` | Detect connect/disconnect, run the polling loop, expose pressed/released edges and stick vectors |
| `GamepadBindings` | Store and resolve user mappings, detect conflicts |
| `GamepadHaptics` | Rumble patterns, capability detection |
| `CaptureController` | Capture state machine, independent of the input source |
| `GamepadSetupView` | Controller configuration screens |

---

## 3. Browser API usage

### 3.1 Connection

```js
window.addEventListener("gamepadconnected",    e => GamepadManager.onConnect(e.gamepad));
window.addEventListener("gamepaddisconnected", e => GamepadManager.onDisconnect(e.gamepad));
```

- A controller is typically only exposed to the page **after the first button press** following connection. The UI must tell the user: *"Press any button on the controller."*
- If several controllers are connected, the **first one that sends input** becomes the active controller. The user can change it in Settings.

### 3.2 Polling

Inputs are polled, not event-driven:

```js
function loop() {
  const gp = navigator.getGamepads()[activeIndex];
  if (gp) GamepadManager.process(gp);
  requestAnimationFrame(loop);
}
```

The loop starts on `gamepadconnected` and stops on `gamepaddisconnected`.

### 3.3 Edge detection (mandatory)

One physical press must produce **exactly one** command.

```js
const pressed = gp.buttons[i].pressed;
if (pressed && !previous[i]) emit("press", i);
if (!pressed && previous[i]) emit("release", i);
previous[i] = pressed;
```

- **Auto-repeat** is allowed only for scroll commands (Option 1 list scroll), after **400 ms** hold, then every **120 ms**. Never for VALIDATE, CANCEL or UNDO.
- **Debounce:** ignore a second press of the same button within **40 ms**.

### 3.4 Standard mapping reference (DualSense)

Valid when `gamepad.mapping === "standard"`.

| Index | Physical button | Index | Physical button |
|---|---|---|---|
| 0 | Cross ✕ | 9 | Options |
| 1 | Circle ○ | 10 | L3 (left stick press) |
| 2 | Square □ | 11 | R3 (right stick press) |
| 3 | Triangle △ | 12 | D-pad Up |
| 4 | L1 | 13 | D-pad Down |
| 5 | R1 | 14 | D-pad Left |
| 6 | L2 (analog) | 15 | D-pad Right |
| 7 | R2 (analog) | 16 | PS button |
| 8 | Create | 17 | Touchpad press |

| Axis | Meaning |
|---|---|
| 0 / 1 | Left stick X / Y |
| 2 / 3 | Right stick X / Y |

> Indices must not be hard-coded in business logic. They are only the **default bindings**. If `gamepad.mapping` is not `"standard"`, the app must display a warning and force the user through the **Controller Setup** screen (section 8).

---

## 4. Capture model

### 4.1 Entities

**Players** are bound to **slots**, not to jersey numbers.

```
PLAYER_SLOT_n → player currently in that slot → #12 DUPONT
```

This keeps bindings valid after rotations and substitutions.

**Actions:** `ATTACK`, `BLOCK`, `SERVE`, `RECEPTION`, `SET`, `DEFENCE`, `FREE BALL`.

**Statuses:** `POSITIVE ✓`, `NEUTRAL O`, `NEGATIVE ✕`.

### 4.2 Visual language

- **Theme:** Coach View dark theme.
- **Position colours:** OPP blue, Setter yellow, OH red, MB green, Libero grey.
- **Status colours:** ✓ green, O yellow, ✕ red.
- **Libero** is displayed as `A` on a black card with grey position bar.
- All interactive elements keep sufficient contrast. Selection is never conveyed by colour alone (size + outline + label).

### 4.3 Input modes

Two capture modes are specified. The user chooses one in Settings; the choice is stored per device.

| | Mode 1 – Three screens | Mode 2 – Dual pads |
|---|---|---|
| Principle | One pad scrolls, one button validates | Left pad selects player, right pad selects action, simultaneously |
| Validations per entry | 3 | 2 (default) |
| Screens | Player → Action → Status | Player + Action → Status |
| Best for | Simplicity, fallback | Speed |

**Recommended default:** Mode 2.

---

## 5. Mode 1 – Three screens

### 5.1 Flow

```
[1 PLAYER] --validate--> [2 ACTION] --validate--> [3 STATUS] --validate--> [RESULT] --> [1 PLAYER]
        ◄--back--              ◄--back--               ◄--back--
```

### 5.2 Screen layout

- **Step bar** at the top: `1 PLAYER | 2 ACTION | 3 STATUS`; current step highlighted, completed steps marked.
- **Chips** under the step bar: choices already validated (e.g. `#12`, `ATTACK`).
- **Scroll list** (vertical wheel): 5 visible rows.
  - Centre row: large (≈ 28 px minimum on tablet), outlined.
  - Neighbours: 60 % opacity, smaller.
  - Outer rows: 30 % opacity, smallest.
  - Each row shows label + sub-label (position for players) and a left colour bar (position colour).
- The list is **circular** (wraps around).

### 5.3 Controls

| Command | Default binding |
|---|---|
| Scroll previous / next | D-pad ↑ / ↓ (or left stick ↑ / ↓) |
| Validate | Cross ✕ |
| Back one step | Circle ○ |

---

## 6. Mode 2 – Dual pads

### 6.1 Flow

```
[PLAYER + ACTION] --validate--> [STATUS] --validate--> [RESULT] --> [PLAYER + ACTION]
                                     ◄--back--
```

### 6.2 Screen layout (portrait and landscape)

Two circular selectors displayed side by side:

- **Left circle – PLAYER.** One bubble per player, evenly distributed around the circle, starting at the top (12 o'clock), clockwise.
- **Right circle – ACTION.** One bubble per action, same geometry.
- **Needle** from the centre toward the selected bubble.
- **Selected bubble:** scaled ×1.3, filled with accent colour, drawn above the others.
- **Centre label:** full name of the current selection (e.g. `FREE BALL`).
- Unselected bubbles keep a border in their position colour (players).

### 6.3 Stick-to-selection algorithm

Each stick controls its own circle (left stick → players, right stick → actions).

1. Read `(x, y)`. Compute magnitude `m = √(x² + y²)`.
2. If `m < DEADZONE_IN` (default **0.55**), do **not change** the selection (the last selection is kept).
3. Otherwise compute the angle `θ = atan2(y, x)` and convert to a clockwise angle from 12 o'clock.
4. Sector width `= 360° / N`. The new candidate is the item whose centre angle is closest to `θ`.
5. **Hysteresis:** the candidate replaces the current selection only if `θ` is more than **sector width × 0.6** away from the current item's centre. This avoids flicker at sector boundaries.
6. Selection changes only while `m > DEADZONE_IN`; releasing the stick keeps the last selection.

Parameters (Settings > Gamepad > Sticks):

| Parameter | Default | Range |
|---|---|---|
| Dead zone | 0.55 | 0.30 – 0.80 |
| Hysteresis | 0.60 | 0.50 – 0.90 |
| Invert Y | off | on / off |

### 6.4 Alternative step selection (no stick)

- **Player:** D-pad ← / → or L1 / R1 (previous / next, circular).
- **Action:** Triangle / Circle / Cross / Square or R1 / R2 (see bindings).
- Direct buttons (section 7) are always available as a shortcut.

### 6.5 Controls

| Command | Default binding |
|---|---|
| Select player | Left stick, or L1 / R1 |
| Select action | Right stick |
| Validate (player + action) | Cross ✕ |
| Back | Circle ○ |
| Undo last recorded entry | Create |

---

## 7. Status step

Two variants are specified; the choice is a setting.

### 7.1 Variant A – Dedicated status screen (default)

- Screen shows three large status buttons: `✓ Positive`, `O Neutral`, `✕ Negative`, each with its status colour as border.
- Recalls player and action as chips at the top.
- Left / right (D-pad or stick) moves the highlight (selected button ×1.05, 4 px outline).
- **Validate** records the entry.

### 7.2 Variant B – Direct status buttons

Status buttons directly record the entry in a single press, with no extra validation:

| Status | Default binding |
|---|---|
| ✓ POSITIVE | Triangle △ |
| O NEUTRAL | Circle ○ |
| ✕ NEGATIVE | Cross ✕ |

Total input for one entry: **1 validation + 1 status press**.

> **Open decision:** the default variant (A or B) is to be confirmed by the product owner. Until then, A is the default and B is selectable.

> In Variant B, Circle and Cross are used for status, so *Back* moves to Square and *Validate* to R1 by default. Conflict detection (section 8.4) must enforce this.

---

## 8. Result screen

After the status is validated, the **result is displayed full screen** and large.

### 8.1 Content (top to bottom)

1. Small tag: `ENTRY RECORDED`
2. **Player** in large type (e.g. `#12`), on a card with the position colour bar underneath, and the position name below.
3. **Action** in large type (e.g. `ATTACK`).
4. **Status symbol** as the largest element (✓ / O / ✕) in its status colour, with its label below.

### 8.2 Appearance

- Screen background and border use the **status colour** (background at ≈ 15 % opacity, border 4 px), so the outcome is readable from the bench.
- Font sizes scale with viewport width (`clamp`), status symbol ≥ 80 px.
- A **progress bar** at the bottom shrinks linearly over the display duration.

### 8.3 Behaviour

| Event | Result |
|---|---|
| Timer expires (default **2.5 s**) | Screen closes, capture returns to the first step |
| Validate (Cross ✕) – "NEXT" | Closes immediately |
| Back (Circle ○) – "CANCEL" | Cancels the entry: the event is **removed from the log** (or flagged `cancelled`, see 10.3), then returns to first step |
| Any stick or D-pad movement | Closes immediately and starts the next entry (optional setting, default off) |

The display duration is configurable (1 – 5 s) in Settings > Gamepad.

### 8.4 Haptic feedback

See section 11.

---

## 9. Controller configuration

Everything physical is configurable. The user sets **which physical input triggers which player, action, status and control command**.

### 9.1 Location

`Settings > Gamepad` (also reachable from the capture screen via a controller icon).

### 9.2 Header

```
Controller:  Wireless Controller (DualSense)
Status:      ● Connected   |   ○ Not connected
Mapping:     standard
[ Configure ]   [ Reset to defaults ]
```

The capture screen always shows a small indicator: `🎮 Connected` or grey `🎮 No controller`.

### 9.3 Tabs

`PLAYERS | ACTIONS | STATUS | CONTROLS | STICKS`

Each row:

```
ATTACK        [ △ ]        [ CHANGE ]  [ CLEAR ]
```

- **PLAYERS:** one row per **slot** (Slot 1 … Slot 6 + Libero). Label shows the current occupant (e.g. `Slot 2 → #7`), updated live.
- **ACTIONS:** ATTACK, BLOCK, SERVE, RECEPTION, SET, DEFENCE, FREE BALL.
- **STATUS:** POSITIVE, NEUTRAL, NEGATIVE.
- **CONTROLS:** VALIDATE, BACK/CANCEL, UNDO, NEXT, PREVIOUS, SWITCH MODE.
- **STICKS:** assignment of left and right stick (player / action), dead zone, hysteresis, invert Y.

### 9.4 Learn mode

When the user taps **CHANGE**:

1. Show: **"Press a button on your controller…"** with a 10 s timeout and a Cancel button.
2. Wait for the **next press edge** on the active controller.
3. Store the input and show its friendly name (e.g. `△`, `D-pad ↑`, `R1`).

Supported input types:

```json
{ "type": "button", "index": 3 }
{ "type": "axis",   "index": 1, "direction": -1 }
{ "type": "combo",  "buttons": [4, 3] }
```

Analog triggers (L2 / R2) count as a button press above **0.5**.

### 9.5 Conflict detection

If the captured input is already bound within the same context:

> ⚠ **△ is already assigned to ATTACK.**
> [ REPLACE ] [ CANCEL ]

- **Replace** unassigns the other binding (it becomes `Unassigned`, shown in red).
- Bindings in different *contexts* may share a button, e.g. Cross is VALIDATE in the capture flow and can also be used inside Setup screens.
- The capture mode cannot be saved while a required command is unassigned.

### 9.6 Friendly names

Button names are displayed using DualSense labels (✕ ○ □ △, L1, R1, L2, R2, L3, R3, Create, Options, Touchpad, D-pad). For a non-DualSense controller, generic names (`Button 0`, …) are used.

### 9.7 Default bindings

**Mode 2, Variant A**

| Group | Command | Default |
|---|---|---|
| Players | Select player | Left stick / L1 / R1 |
| Actions | Select action | Right stick |
| Controls | Validate | ✕ |
| Controls | Back / Cancel | ○ |
| Controls | Undo last entry | Create |
| Controls | Switch mode | Options |

**Optional direct-shortcut bindings** (all unassigned by default except where listed)

| Command | Suggested default |
|---|---|
| Player slot 1–4 | D-pad ↑ → ↓ ← |
| Player slot 5 / 6 | L1 / R1 |
| Libero | L3 |
| ATTACK / BLOCK / SERVE / RECEPTION | △ / ○ / ✕ / □ (only when status variant A and no conflict) |
| SET / DEFENCE | L2 / R2 |
| FREE BALL | Touchpad |
| POSITIVE / NEUTRAL / NEGATIVE | R3 / Options / Create |

---

## 10. Data and events

### 10.1 Command layer

The gamepad never writes to the log directly. It emits commands:

```json
{ "source": "gamepad", "command": "SELECT_PLAYER", "slot": 2 }
{ "source": "gamepad", "command": "SELECT_ACTION", "action": "ATTACK" }
{ "source": "gamepad", "command": "SELECT_STATUS", "status": "POSITIVE" }
{ "source": "gamepad", "command": "VALIDATE" }
{ "source": "gamepad", "command": "BACK" }
{ "source": "gamepad", "command": "UNDO" }
```

### 10.2 Recorded event

On final validation, an event identical to a touch-originated event is appended to the unified JSON action log:

```json
{
  "type": "action",
  "timestamp": "2026-11-26T20:14:32.512Z",
  "set": 2,
  "player": 12,
  "slot": 2,
  "action": "ATTACK",
  "status": "POSITIVE",
  "inputSource": "gamepad"
}
```

`inputSource` is the only field that differs between touch and gamepad entries. All statistics and views (Coach View, Spectator View, Match Reports) are computed from the log and are unaffected by it.

### 10.3 Cancel and undo

- **CANCEL on result screen** (within the display window): the just-recorded event is removed.
- **UNDO** (later): appends a compensating entry, or marks the last event as `cancelled`, following the existing undo rule of the app. Statistics ignore cancelled events.
- UNDO never deletes older history silently; it always acts on the **last** event only.

### 10.4 Persistence

Stored locally per device (and optionally exported with settings):

```json
{
  "gamepadConfig": {
    "controllerId": "Wireless Controller",
    "mapping": "standard",
    "mode": 2,
    "statusVariant": "A",
    "resultDurationMs": 2500,
    "sticks": { "deadzone": 0.55, "hysteresis": 0.6, "invertY": false },
    "bindings": [
      { "group": "action",  "target": "ATTACK",   "input": { "type": "button", "index": 3 } },
      { "group": "status",  "target": "POSITIVE", "input": { "type": "button", "index": 11 } },
      { "group": "control", "target": "VALIDATE", "input": { "type": "button", "index": 0 } }
    ]
  }
}
```

Bindings reference **slots and logical names**, never jersey numbers.

---

## 11. Haptics (optional)

Uses `gamepad.vibrationActuator` when available. It must be a **progressive enhancement**; the app works fully without it.

| Event | Pattern |
|---|---|
| Selection changes (bubble / row) | None (avoid noise) |
| Step validated | 40 ms, weak 0.3 |
| Entry recorded | 80 ms, weak 0.4 / strong 0.2 |
| ✕ NEGATIVE recorded | 120 ms, weak 0.2 / strong 0.5 |
| Invalid action / conflict | 2 × 100 ms pulses |
| Controller connected | 150 ms |

```js
gp.vibrationActuator?.playEffect("dual-rumble", {
  startDelay: 0, duration: 80, weakMagnitude: 0.4, strongMagnitude: 0.2
});
```

A setting `Haptics: On / Off` is provided (default On). If unsupported, the setting is shown disabled with the note *"Not supported by this browser or device."*

---

## 12. Edge cases and error handling

| Situation | Behaviour |
|---|---|
| Controller disconnects during capture | Banner `🎮 Controller disconnected`. Current partial selection is **kept**. Touch input remains fully usable. Auto-resume on reconnect |
| Controller sleeps (Bluetooth) | Same as disconnect; user wakes it with any button |
| Browser tab loses focus | Polling pauses; all button states are reset on return (prevents ghost presses) |
| Non-standard mapping | Warning + forced Controller Setup |
| Two controllers connected | Active controller = last one that sent input; selectable in Settings |
| Required command unassigned | Capture with gamepad disabled; message names the missing binding |
| Substitution or rotation during capture | Slot-based player selection updates immediately; if the selected player left the court, selection resets to first valid slot and a short notice is displayed |
| Result screen displayed and a new press occurs | Handled per section 8.3; presses never queue (no replay after the screen closes) |
| Very fast double press | Debounce 40 ms; no duplicate event |
| No match loaded | Capture unavailable; all counters `0`, non-computable values `NA` in grey |
| Haptics unsupported | Silent fallback |

---

## 13. Accessibility and ergonomics

- Minimum touch/visual target for bubbles and status buttons: **48 px**.
- Selection indicated by **size + outline + label**, not colour only.
- Result screen readable at ≥ 2 m on a tablet: status symbol ≥ 80 px, player ≥ 48 px.
- Support light and dark themes. The default is the **Coach View dark theme**.
- `aria-live="polite"` announcements for step changes and recorded entries.
- Keyboard fallback for development and testing (see 14.2).

---

## 14. Testing

### 14.1 Acceptance criteria

1. A DualSense connected by USB or Bluetooth is detected within 1 s of the first button press, and the indicator turns to **Connected**.
2. One physical press records **one** command (no duplicates), including for 500 ms holds.
3. A complete entry (Player → Action → Status) can be recorded with the gamepad only, in both modes.
4. The recorded JSON event is identical to the touch-originated event, except for `inputSource`.
5. After status validation, the full-screen result appears and closes after the configured duration, on Validate, or cancels on Back.
6. Every binding in section 9 can be re-assigned through Learn mode, and conflicts are detected.
7. Configuration persists after reload.
8. Disconnecting the controller never loses a recorded event and never blocks touch capture.
9. Slot-based bindings remain correct after a rotation and a substitution.
10. With no match loaded, no demo values are shown (`0` / `NA` grey).

### 14.2 Development simulator

When no controller is present, a keyboard simulator maps keys to commands:

| Key | Command |
|---|---|
| ↑ / ↓ | Scroll (Mode 1) |
| A / D | Left pad previous / next |
| ← / → | Right pad previous / next |
| Enter | Validate |
| Esc | Back / Cancel |
| Ctrl+Z | Undo |

### 14.3 Manual test matrix

| Device | Browser | Connection |
|---|---|---|
| Android tablet | Chrome | USB-C, Bluetooth |
| iPad | Safari | Bluetooth |
| Windows laptop | Chrome / Edge | USB-C, Bluetooth |

Browser and OS support for the Gamepad API and for vibration varies. It must be verified on the real target tablet before release.

---

## 15. Open questions

1. **Default status variant:** dedicated status screen (A) or direct status buttons (B)?
2. **Default mode:** Mode 2 (dual pads) with Mode 1 kept as a fallback, or both exposed equally?
3. Should the result screen **auto-close on the first stick or D-pad movement** (faster) or only on timer / Validate?
4. Should **UNDO** remove the event or mark it `cancelled` for audit purposes?
