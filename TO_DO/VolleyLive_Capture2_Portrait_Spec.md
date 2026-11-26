# VolleyLive — Manual Capture Interface 2 (Portrait)

**Functional & UI Specification**

| Field | Value |
|---|---|
| Product | VolleyLive |
| Feature | Manual live capture on tablet — Interface 2 (players below, shared statuses) |
| Version | 1.0 (draft, implementation-ready) |
| Date | 25 November 2026 |
| Owner | Denis Delaveau |
| Visual reference | `VolleyLive_Saisie_Portrait_v3.png` |
| Related spec | `VolleyLive_Matrix_Full_Capture_Spec.md` (Interface 1) |

---

## 1. Purpose

Interface 2 is a second manual capture screen for tablets used in **portrait** orientation. It starts from the same capture step as Interface 1 (**action + status**) but puts the **player selection below** the action/status block, on the same screen.

Every event is made of three pieces of information:

```
PLAYER (number)  +  ACTION  +  STATUS
```

Design goals:

- **Intuitive**: three coloured sections, always visible, always in the same place.
- **Very fast**: one event = 3 taps, no screen change, no confirmation.
- **Deterministic**: fixed button positions, no automatic guessing, no hidden state.

---

## 2. Scope

In scope:

- Portrait screen layout and the three sections (Action, Status, Players).
- Interaction flow, allowed statuses per action, score update, undo, substitution.
- Visual theme (Coach View) and section background colours.
- Event output in the unified VolleyLive JSON format.

Out of scope:

- Landscape layout and layout reversal options (see §13).
- Match setup, statistics, Coach View and Spectator View screens.

---

## 3. Screen structure

```
┌──────────────────────────────────────────────────────────┐
│ VolleyLive | SAISIE MANUELLE | Set 2 | NOUS 18 – 16 ADV  │  Header
│        Last action: #7 · Réception · Continue            │  Caption
├──────────────────────────────────────────────────────────┤
│  ACTION SECTION (blue background)                        │
│                      [   FREE BALL   ]                   │
│   [ ATTACK ]       ┌───────────────┐      [  SERVE    ]  │
│                    │  STATUS (violet)                    │
│   [ BLOCK  ]       │  [   ✓   ]    │      [ RECEPTION ]  │
│                    │  [   O   ]    │                     │
│   [  SET   ]       │  [   ✕   ]    │      [ DEFENCE   ]  │
│                    └───────────────┘                     │
├──────────────────────────────────────────────────────────┤
│  PLAYER SECTION (emerald background)                     │
│   [ 7 ]  [ 12 ]  [ 4 ]   ┌─────┐                         │
│   [ 9 ]  [  3 ]  [ 6 ]   │  A  │                         │
│                          └─────┘                         │
├──────────────────────────────────────────────────────────┤
│  [ ↶ Annuler ]                       [ Remplacement ]    │  Footer
└──────────────────────────────────────────────────────────┘
```

No scrolling, pop-ups or overlays during capture. Section titles are **not displayed**: the three sections are identified only by their background colour and position.

### 3.1 Header

| Element | Content |
|---|---|
| Logo + name | VolleyLive |
| Mode pill | `SAISIE MANUELLE` (cyan outline) |
| Set | `Set N` |
| Score | `NOUS` chip · large white score `18 – 16` · `ADVERSAIRE` chip |

The header is read-only. A thin cyan line separates it from the content.

### 3.2 Caption

One centred line under the header: `Dernière action : #<number> · <Action> · <Status>`. Opponent: `Dernière action : A · <Action> · <Status>`.

---

## 4. Action section (blue background)

### 4.1 Grid

One rounded panel containing a fixed 3-column grid:

| | Left column | Centre column | Right column |
|---|---|---|---|
| Row 1 | — | **FREE BALL** | — |
| Row 2 | **ATTACK** | Status block (rows 2–3) | **SERVE** |
| Row 3 | **BLOCK** | Status block (rows 2–3) | **RECEPTION** |
| Row 4 | **SET** | — | **DEFENCE** |

### 4.2 Button rules

- **AC-1** All seven action buttons have the **same size** (same width and same height).
- **AC-2** FREE BALL is **centred** on the vertical axis of the screen, alone on its row, directly above the status block.
- **AC-3** Left and right columns are symmetrical about the centre column.
- **AC-4** Buttons never move, resize or hide, whatever the state.
- **AC-5** Only one action can be selected at a time. Tapping another action replaces the selection; tapping the selected action again deselects it.
- **AC-6** Labels are in English, bold uppercase: FREE BALL, ATTACK, BLOCK, SERVE, RECEPTION, SET, DEFENCE.

### 4.3 Role-based emphasis (optional, same as Interface 1)

When a player is selected, the most likely actions for his role get a slightly lighter fill. No text, badge, star or reordering. Emphasis is visual only and **never pre-selects** an action.

| Role | Emphasised actions |
|---|---|
| OH | RECEPTION, ATTACK |
| OPP | ATTACK, BLOCK |
| MB | BLOCK, ATTACK |
| Setter | SET, SERVE |
| Libero | RECEPTION, DEFENCE |
| A (opponent) | none |

---

## 5. Status section (violet background)

### 5.1 Layout

- A **violet rounded panel** centred between the left and right action columns, spanning rows 2–3 of the action grid.
- It contains exactly **three stacked buttons**, shared by **all actions**. Statuses are never repeated per action.

| Position | Button | Meaning | Persisted value |
|---|---|---|---|
| Top | **✓** (green) | Point | `point` |
| Middle | **O** (slate grey) | Continue — action done, rally continues | `neutral` |
| Bottom | **✕** (red) | Error | `error` |

The order ✓ / O / ✕ is fixed. The two score-changing statuses are at the extremities; O is in the middle.

### 5.2 Allowed statuses per action

| Action | ✓ Point | O Continue | ✕ Error |
|---|---|---|---|
| FREE BALL | — | ✅ | ✅ |
| SERVE | ✅ | ✅ | ✅ |
| RECEPTION | — | ✅ | ✅ |
| SET | — | ✅ | ✅ |
| ATTACK | ✅ | ✅ | ✅ |
| BLOCK | ✅ | ✅ | ✅ |
| DEFENCE | — | ✅ | ✅ |

- **ST-1** A status that is not allowed stays **in place but disabled** (reduced opacity, not tappable). It is never hidden.
- **ST-2** All three statuses are disabled until the selection is complete (see §7.2).
- **ST-3** The status buttons are the **committing taps**. They must be at least as large as an action button wherever the layout allows (see open point 1).

---

## 6. Player section (emerald background)

### 6.1 Layout

- One **emerald rounded panel** under the action section, **without title**.
- Six player cards in **2 rows × 3 columns**, plus one tall **A** card on the right spanning both rows.

| Row | Col 1 | Col 2 | Col 3 | Col 4 |
|---|---|---|---|---|
| 1 | 7 | 12 | 4 | **A** (spans 2 rows) |
| 2 | 9 | 3 | 6 | |

### 6.2 Player card

- Dark navy card with thin border.
- **Jersey number only**, large and bold, centred.
- A short **vertical colour bar** on the left identifies the role:

| Role | Bar colour |
|---|---|
| OH | Red |
| OPP | Blue |
| Setter | Yellow |
| MB | Green |
| Libero | Grey |

### 6.3 Card "A" (opponent)

- Tall **black** card with a large white **A**.
- Selecting **A** means the event is attributed to the opponent team (no player detail).

### 6.4 Rules

- **PL-1** One player (or A) can be selected at a time. Tapping another card replaces the selection; tapping the selected card again deselects it.
- **PL-2** Card order is fixed for the set. After a substitution, the incoming player takes the card position and role bar of the outgoing player.
- **PL-3** The player section never changes size or position.

---

## 7. Interaction flow

### 7.1 Nominal flow — 3 taps

```
Tap 1: Player   →   Tap 2: Action   →   Tap 3: Status   →   Event recorded
```

- **FL-1** Tapping a player or an action selects it (fine cyan outline + light cyan tint).
- **FL-2** Player and action can be selected **in any order**. Status is always the last tap.
- **FL-3** Tapping a status **records the event immediately**. No confirmation dialog.
- **FL-4** After recording, player and action selections are cleared and the screen returns to its ready state.
- **FL-5** Before the status tap, selections can be changed freely.

### 7.2 Enabled states

| State | Players | Actions | ✓ | O | ✕ |
|---|---|---|---|---|---|
| Ready (nothing selected) | Enabled | Enabled | Disabled | Disabled | Disabled |
| Player only | Enabled | Enabled | Disabled | Disabled | Disabled |
| Action only | Enabled | Enabled | Disabled | Disabled | Disabled |
| Player + Action | Enabled | Enabled | Per §5.2 | Per §5.2 | Per §5.2 |
| **A** only (no action) | Enabled | Enabled | Enabled | Disabled | Enabled |
| **A** + Action | Enabled | Enabled | Per §5.2 | Per §5.2 | Per §5.2 |

### 7.3 Feedback

- **FB-1** On record: short flash (≈ 150 ms) on the tapped status button and update of the caption.
- **FB-2** If the score changes, the header score pulses once.
- **FB-3** Optional haptic feedback (device setting). No sound by default.
- **FB-4** Double-tap protection: a second status tap within 300 ms of a commit is ignored.

---

## 8. Score rules

| Actor | Status | Rally winner | Score change |
|---|---|---|---|
| Tracked-team player | ✓ Point | Tracked team | Tracked team +1 |
| Tracked-team player | ✕ Error | Opponent | Opponent +1 |
| Tracked-team player | O Continue | — | None |
| A (opponent) | ✓ Point | Opponent | Opponent +1 |
| A (opponent) | ✕ Error | Tracked team | Tracked team +1 |
| A (opponent) | O Continue | — | None |

- **SC-1** The score is always recomputed from the event log, never edited by hand.
- **SC-2** Set end is detected from the score and triggers the set-end flow.

---

## 9. Footer controls

### 9.1 ↶ Annuler (Undo)

- Cyan-outlined button, bottom left. Enabled when the current set has at least one event.
- Removes the last event and reverses its score effect. Repeated taps step back event by event.
- If a player or action is currently selected, the first tap clears the selection instead.

### 9.2 Remplacement (Substitution)

- Cyan-outlined button, bottom right.
- Opens a substitution panel: tap the outgoing player, then the incoming bench player, then confirm.
- The incoming player takes the outgoing player's card position and role bar.
- Recorded as an event (`type: "substitution"`) and can be undone with Annuler.
- Capture is not possible while the panel is open.

---

## 10. Visual theme

Coach View dark theme with **three clearly different section backgrounds**.

| Token | Value | Usage |
|---|---|---|
| Page background | Gradient `#07142B` → `#0B1F3F` | Screen |
| Action section | Fill `#1F55C4`, border `#60A5FA` | Blue panel |
| Status section | Fill `#7B35D6`, border `#C4B5FD` | Violet panel |
| Player section | Fill `#0E8A6A`, border `#6EE7B7` | Emerald panel |
| Button / card | Fill `#0A1730`, border `#6F86A8` | Actions, player cards |
| Selection | Border `#22D3EE` (3 px), fill `#0C2A44` | Selected player and action |
| ✓ Point | Fill `#0D3B1E`, border `#22C55E`, icon `#4ADE80` | Status |
| O Continue | Fill `#3A4658`, border `#94A3B8`, white icon | Status |
| ✕ Error | Fill `#4A1520`, border `#EF4444`, icon `#F87171` | Status |
| Opponent card | Fill `#000000`, white letter | Card A |
| Text | White, bold sans-serif | Labels, numbers |

Rules:

- **VIS-1** Flat design, no glow, no gloss.
- **VIS-2** The three section backgrounds must be distinguishable at a glance.
- **VIS-3** Buttons and cards keep the same dark navy fill in all three sections.
- **VIS-4** Role colours appear only on the slim bar of player cards.
- **VIS-5** No section titles and no explanatory text on the capture screen.

---

## 11. Ergonomics

| Item | Requirement |
|---|---|
| Target device | 10"–13" tablet, portrait |
| Minimum touch target | 18 mm (actions, players); status buttons ≥ 14 mm height (see open point 1) |
| Minimum spacing between targets | 3 mm |
| Player number size | ≥ 32 pt |
| Action label size | ≥ 20 pt |
| Scrolling | None |
| Response time | Event recorded and displayed in < 100 ms |
| Offline | Full capture without network; local persistence after each event |

---

## 12. Event output (unified JSON)

Each status tap appends one event to the match log.

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
  "source": "manual_capture_2"
}
```

| Field | Values |
|---|---|
| `action` | `freeball`, `serve`, `reception`, `set`, `attack`, `block`, `defence`, `null` (opponent only) |
| `result` | `point`, `neutral`, `error` |
| `team` | `home`, `away` |
| `player` | Jersey number, or `null` for the opponent |

The event log is the source of truth for all statistics and views.

---

## 13. Open points

1. **Status size**: in the validated visual, the status block spans two action rows, leaving an empty slot between SET and DEFENCE. Option: extend the status block over three rows so each status button has the same height as an action button.
2. **Layout options**: reversed layouts (players on top, left/right mirror) are not defined for this interface.
3. **Role emphasis** (§4.3): keep or remove for Interface 2.
4. **A without action** (§7.2): keep the 2-tap shortcut for opponent errors and points.

---

## 14. Acceptance tests

| ID | Scenario | Expected result |
|---|---|---|
| AT-01 | Tap 12 → ATTACK → ✓ | Event recorded, home +1, selections cleared |
| AT-02 | Tap 7 → RECEPTION | ✓ disabled; O and ✕ enabled |
| AT-03 | Tap 7 → RECEPTION → O | Event `neutral`, score unchanged |
| AT-04 | Tap SET → 3 → ✓ | ✓ not tappable, nothing recorded |
| AT-05 | Tap 12 → FREE BALL | ✓ disabled; O and ✕ enabled |
| AT-06 | Tap ATTACK → 12 → ✓ | Same event as AT-01 (free order) |
| AT-07 | Tap a status with no player | Nothing recorded (status disabled) |
| AT-08 | Tap A → ✕ | Opponent event, action `null`, home +1 |
| AT-09 | Tap A → SERVE → ✓ | Opponent ace, away +1 |
| AT-10 | Select 12, then 4, then BLOCK → ✓ | Event attributed to 4 |
| AT-11 | Tap selected card 12 again | Selection cleared |
| AT-12 | Undo after AT-01 | Event removed, score restored |
| AT-13 | Undo with 12 selected | Only the selection is cleared |
| AT-14 | Substitution 9 → 15 | 15 takes 9's card position and role bar |
| AT-15 | Two status taps within 300 ms | Only one event recorded |
| AT-16 | Network off, record 10 events | All events persisted locally |
| AT-17 | Restart the app | Log, score and caption restored |
| AT-18 | Any state | All seven action buttons keep identical size and position; FREE BALL centred |
