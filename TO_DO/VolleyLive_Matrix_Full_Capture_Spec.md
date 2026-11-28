# VolleyLive — Manual Capture Interface "Matrix Full"

**Functional & UI Specification**

| Field | Value |
|---|---|
| Product | VolleyLive |
| Feature | Manual live capture on tablet — Matrix Full |
| Version | 1.0 (draft, implementation-ready) |
| Date | 2026-11-25 |
| Owner | Denis Delaveau |
| Status | For review |

---

## 1. Purpose

Matrix Full is the manual capture screen used courtside on a tablet. Every recorded event is made of exactly three pieces of information:

```
PLAYER (number)  +  ACTION  +  STATUS
```

The interface must be:

- **Intuitive** — no training needed beyond one demo rally.
- **Fast** — one event recorded in 3 taps, no confirmation dialog.
- **Deterministic** — the same sequence of taps always produces the same event. Nothing moves, nothing is guessed.

---

## 2. Scope

In scope:

- Screen layout (3 sections: Player, Action, Status).
- Four layout orientations (2 landscape, 2 portrait).
- Interaction flow, validation rules, score update, undo, substitution.
- Visual theme (Coach View) and role colours.
- Event output in the unified VolleyLive JSON format.

Out of scope:

- Match setup (teams, line-ups) — handled in **SETUP & CAPTURE**.
- Statistics, Coach View, Spectator View.

---

## 3. Screen structure

The screen is made of a header, three permanent sections and a footer.

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER   VolleyLive | SAISIE MANUELLE | Set 2 | NOUS 18 — 16 │
├──────────────────┬──────────────────┬────────────────────────┤
│ 1 Player (number)│ 2 Action         │ 3 Status               │
│                  │                  │                        │
│  [7 ]  [12]      │  Service         │   ✕  Error             │
│  [4 ]  [9 ]      │  Reception       │                        │
│  [3 ]  [6 ]      │  Set             │   ↻  Continue          │
│                  │  Attack          │                        │
│  [ A ] opponent  │  Block           │   ✓  Point             │
│                  │  Defence         │                        │
├──────────────────┴──────────────────┴────────────────────────┤
│ FOOTER  ↶ Undo  |  Last action: #7 · Reception · Continue  |  Substitution │
└──────────────────────────────────────────────────────────────┘
```

### 3.1 Header

| Element | Content |
|---|---|
| Logo + app name | VolleyLive |
| Mode badge | `SAISIE MANUELLE` (outlined cyan) |
| Set | `Set N` |
| Score | `NOUS xx — yy ADVERSAIRE`, score in large white figures |

The header is read-only. It never contains capture controls.

### 3.2 Section 1 — Player (number)

- Shows the **6 players currently on court** for the tracked team, plus the **Libero** when on court.
- Each tile shows **only the jersey number** in large type, with a **slim vertical role accent strip** on the left.
- Below the player grid: one **opponent button "A"** (black circle, white "A") used when the action is performed by the opposing team.
- Grid in landscape: 2 columns × 3 rows. Grid in portrait: 3 columns × 2 rows.
- Tile order is fixed for the whole set and only changes after a substitution (the incoming player takes the slot of the outgoing player).

**Role colours (accent strip):**

| Role | Colour |
|---|---|
| OPP | Blue |
| Setter | Yellow |
| OH | Red |
| MB | Green |
| Libero | Grey |

### 3.3 Section 2 — Action

Six fixed buttons, always in this order:

1. Service
2. Reception
3. Set
4. Attack
5. Block
6. Defence

- Landscape: 1 column × 6 rows. Portrait: 2 columns × 3 rows.
- Buttons never move, never hide and never change size.
- **Role-preferred actions** are emphasised with a subtle highlight (no text, no badge, no reordering):

| Role | Preferred actions |
|---|---|
| OH | Reception, Attack |
| OPP | Attack, Block |
| MB | Block, Attack |
| Setter | Set, Service |
| Libero | Reception, Defence |
| A (opponent) | none |

The emphasis is purely visual. It is **never** a pre-selection.

### 3.4 Section 3 — Status

**One single status group shared by all actions.** Statuses are never repeated per action.

| Button | Icon | Meaning | Persisted value |
|---|---|---|---|
| Error | ✕ | Action is a fault, rally lost | `error` |
| Continue | ↻ | Action done, rally continues | `neutral` |
| Point | ✓ | Action wins the rally | `point` |

Order is fixed: Error, Continue, Point (top to bottom in landscape, left to right in portrait).

### 3.5 Footer

| Element | Behaviour |
|---|---|
| ↶ Undo | Cancels the last recorded event, restores score and history |
| Last action | Text summary of the last recorded event, e.g. `#7 · Reception · Continue` |
| Substitution | Opens the substitution panel (see §7) |

---

## 4. Layout orientations

The user can choose one of four layouts. Only the **position of the sections** changes; the content, order and behaviour inside each section stay identical. Section numbering (1, 2, 3) always stays attached to its section.

| Layout | Tablet | Section order |
|---|---|---|
| Horizontal → | Landscape | Player · Action · Status (left to right) |
| Horizontal ← | Landscape | Status · Action · Player (left to right) |
| Vertical ↓ | Portrait | Player / Action / Status (top to bottom) |
| Vertical ↑ | Portrait | Status / Action / Player (top to bottom) |

Rules:

- **LAY-1** Default layout: Horizontal →.
- **LAY-2** Layout is selected in the capture settings and stored locally on the tablet.
- **LAY-3** Vertical layouts are only offered/applied when the tablet is in portrait; horizontal layouts when in landscape. If the device rotates, the app switches to the user's preferred layout for the new orientation (one horizontal + one vertical preference are stored).
- **LAY-4** Changing layout never clears the current selection nor alters any data.
- **LAY-5** Horizontal ← and Vertical ↑ exist for left-handed users or for operators placed on the other side of the court.

Portrait internal arrangement:

| Section | Arrangement |
|---|---|
| Player | 3 columns × 2 rows + "A" button |
| Action | 2 columns × 3 rows |
| Status | 3 buttons in one row |

---

## 5. Interaction flow

### 5.1 Nominal flow — 3 taps

```
Tap 1: Player   →   Tap 2: Action   →   Tap 3: Status   →   Event recorded
```

- **FLOW-1** Tapping a player selects it (cyan outline + light cyan tint). Only one player can be selected.
- **FLOW-2** Tapping an action selects it (cyan outline). Only one action can be selected.
- **FLOW-3** Tapping a status **records the event immediately**. No confirmation dialog.
- **FLOW-4** After recording, Player and Action selections are cleared. The screen is back to its ready state.
- **FLOW-5** Tapping an already selected player or action deselects it.
- **FLOW-6** Tapping another player/action replaces the current selection.
- **FLOW-7** Player and Action may be selected in any order. Status is always the last tap.

### 5.2 Enabled states

| State | Player | Action | Status |
|---|---|---|---|
| Ready (nothing selected) | Enabled | Enabled | Disabled |
| Player selected only | Enabled | Enabled | Disabled |
| Action selected only | Enabled | Enabled | Disabled |
| Player + Action selected | Enabled | Enabled | Enabled (filtered, see §6) |

Disabled buttons stay visible at the same position, at reduced but readable opacity (≈ 82 %).

### 5.3 Opponent "A"

- **OPP-1** Selecting "A" means the event is attributed to the opponent team, without player detail.
- **OPP-2** With "A", the action is **optional**: "A" + Status records an opponent event with action `null`. "A" + Action + Status records it with the action.
- **OPP-3** No role emphasis is shown for "A".

### 5.4 Feedback

- **FB-1** On record: short flash (≈ 150 ms) on the status button + footer "Last action" updated.
- **FB-2** If the score changes, the score figure in the header pulses once.
- **FB-3** Optional haptic feedback on record (device setting).
- **FB-4** No sound by default.

---

## 6. Validation rules (allowed statuses)

The status group is shared, but some combinations are not possible. When an action is selected, impossible statuses are **disabled in place** (not hidden).

| Action | ✕ Error | ↻ Continue | ✓ Point |
|---|---|---|---|
| Service | ✅ | ✅ | ✅ |
| Reception | ✅ | ✅ | ❌ |
| Set | ✅ | ✅ | ❌ |
| Attack | ✅ | ✅ | ✅ |
| Block | ✅ | ✅ | ✅ |
| Defence | ✅ | ✅ | ❌ |
| (none, opponent "A" only) | ✅ | ❌ | ✅ |

- **VAL-1** A disabled status cannot be tapped; a tap on it has no effect.
- **VAL-2** The application never infers or replaces a value. An event is recorded only with the values explicitly tapped.

---

## 7. Substitution

- **SUB-1** "Substitution" opens a panel listing on-court players and bench players.
- **SUB-2** Sequence: tap outgoing player → tap incoming player → Confirm.
- **SUB-3** The incoming player takes the exact tile position of the outgoing player.
- **SUB-4** A substitution is recorded as an event (`type: "substitution"`) and can be undone with Undo.
- **SUB-5** Libero replacements follow the same mechanism.
- **SUB-6** Capture is not possible while the panel is open; closing it returns to the ready state.

---

## 8. Score rules

| Actor | Status | Rally winner | Score change |
|---|---|---|---|
| Tracked team player | Error | Opponent | Opponent +1 |
| Tracked team player | Point | Tracked team | Tracked team +1 |
| Tracked team player | Continue | — | None |
| Opponent "A" | Error | Tracked team | Tracked team +1 |
| Opponent "A" | Point | Opponent | Opponent +1 |

- **SCO-1** The score is always recomputed from the event log (source of truth), never edited by hand.
- **SCO-2** Set end is detected from the score (25 points, 15 in the 5th set, 2-point lead) and triggers the set-end screen.

---

## 9. Undo

- **UND-1** Undo removes the last event (action or substitution) from the log.
- **UND-2** Score and "Last action" are recomputed.
- **UND-3** Multiple Undo taps step back event by event.
- **UND-4** Undo is disabled when the log of the current set is empty.
- **UND-5** If a player or action is currently selected, the first Undo tap only clears the selection.

---

## 10. Visual theme — Coach View

| Token | Value |
|---|---|
| Background | Gradient `#07142B` → `#0B1F3F` |
| Panel / card | `#0A1730` (base surface) |
| Player section | Emerald `rgba(32, 199, 102, 0.32)` |
| Action section | Blue `rgba(13, 54, 93, 0.72)` |
| Status section | Violet `rgba(155, 114, 243, 0.56)` |
| Status button surface | Navy `#102E50`, opaque and layered over the Status section |
| Borders | Thin, `#22D3EE` at low opacity; full opacity for selection |
| Selection | Cyan `#22D3EE` outline + light cyan tint |
| Primary text | White |
| Secondary text | Muted cyan-grey |
| Error | Red `#EF4444` border |
| Continue | Slate grey border |
| Point | Green `#22C55E` border |
| Opponent "A" | Black circle, white letter |

Rules:

- **VIS-1** Flat design, no glossy gradients on buttons, no glow.
- **VIS-2** Role colours only on the slim accent strip of player tiles, never as full fill.
- **VIS-3** No explanatory text on the capture screen.
- **VIS-4** Same theme for the four layouts.
- **VIS-5** Player, Action and Status section backgrounds use the shared emerald, blue and violet palette from FLOW1 and GAMEPAD. Status buttons keep an opaque navy surface over the violet panel, with status-colored borders.

---

## 11. Ergonomics

| Item | Requirement |
|---|---|
| Target device | 10"–13" tablet |
| Minimum touch target | 15 mm (player, status); 12 mm (action) |
| Minimum spacing between targets | 3 mm |
| Player number size | ≥ 32 pt |
| Scrolling | None on the capture screen |
| Animations | None that delay input (feedback ≤ 150 ms) |
| Response time | Event recorded and displayed in < 100 ms |
| Offline | Full capture without network; local persistence after every event |

---

## 12. Event output (unified JSON)

Each Status tap appends one event to the match log.

```json
{
  "id": "evt_000184",
  "timestamp": "2026-11-25T18:42:10.512Z",
  "set": 2,
  "rally": 34,
  "type": "action",
  "team": "home",
  "player": 12,
  "role": "OH",
  "action": "attack",
  "result": "point",
  "score_after": { "home": 19, "away": 16 },
  "source": "manual_matrix_full"
}
```

Opponent event without action:

```json
{
  "id": "evt_000185",
  "timestamp": "2026-11-25T18:42:31.004Z",
  "set": 2,
  "rally": 35,
  "type": "action",
  "team": "away",
  "player": null,
  "role": null,
  "action": null,
  "result": "error",
  "score_after": { "home": 20, "away": 16 },
  "source": "manual_matrix_full"
}
```

Allowed values:

| Field | Values |
|---|---|
| `action` | `service`, `reception`, `set`, `attack`, `block`, `defence`, `null` (opponent only) |
| `result` | `error`, `neutral`, `point` |
| `team` | `home`, `away` |

---

## 13. Acceptance tests

| ID | Scenario | Expected result |
|---|---|---|
| AT-01 | Tap #12 → Attack → Point | Event recorded, home +1, selections cleared |
| AT-02 | Tap #7 → Reception | Point button disabled, Error and Continue enabled |
| AT-03 | Tap #7 → Reception → Continue | Event `neutral`, score unchanged |
| AT-04 | Tap Status with no player | Nothing happens (status disabled) |
| AT-05 | Tap Attack → #12 → Point | Same event as AT-01 (order free) |
| AT-06 | Tap A → Error | Opponent event, action `null`, home +1 |
| AT-07 | Tap A → Service → Point | Opponent ace, away +1 |
| AT-08 | Select #4 (OH) | Reception and Attack visually emphasised, no position change |
| AT-09 | Undo after AT-01 | Event removed, score back to previous value |
| AT-10 | Undo with #12 selected | Only the selection is cleared |
| AT-11 | Switch Horizontal → to Horizontal ← | Sections swapped, selection and data unchanged |
| AT-12 | Rotate tablet to portrait | Preferred vertical layout applied, all buttons visible without scrolling |
| AT-13 | Substitution #9 → #15 | #15 takes #9's tile position, event logged |
| AT-14 | Network off, record 10 events | All events persisted locally |
| AT-15 | Kill app and restart | Log, score and last action restored |

---

## 14. Open points

1. Should "A" also allow opponent jersey numbers in a later version?
2. Keep a fixed tile order per set, or follow the rotation order on court?
3. Display the rotation number in the header?
