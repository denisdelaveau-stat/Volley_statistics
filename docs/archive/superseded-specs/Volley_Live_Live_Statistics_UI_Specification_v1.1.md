# Volley Live — Live Statistics UI Specification

**Document type:** Functional and UI implementation specification  
**Target:** Volley Live Statistics  
**Screens:** Live Overview, Rotations, Players, Player Detail entry point  
**Version:** 1.1  
**Language:** English, with approved French UI labels  

---

## 1. Purpose

This specification defines the live statistics experience used by a volleyball coach during a match:

1. **Live Overview** — detect what is happening now.
2. **Rotations** — diagnose the tactical context.
3. **Players** — inspect the player-level events behind the situation.
4. **Player Detail entry point** — open the complete analysis for the selected player through the approved `Voir le détail joueur` control.

The interface shall support decisions between rallies, during time-outs, and between sets. Primary information shall be readable in **2 to 5 seconds**.

> **Detect → Diagnose → Inspect player → Open full detail**

---

## 2. Shared product principles

- Show no more than six primary KPIs on Live Overview.
- Always display a sample size with a percentage.
- Separate current-set, match, and recent-rally statistics.
- Preserve active filters when navigating.
- Do not issue strong alerts on insufficient samples.
- Do not reduce a player's contribution to an unexplained score.
- Use one-tap navigation between the three live screens.
- Keep the player-detail action visually prominent but separate from KPI cards.

### 2.1 Common match header

```text
VOLLEY LIVE
HOME 18–16 AWAY
SETS 1–1 · SET 3
P4 · RECEIVE
```

Required fields:

- home and away teams;
- score and sets;
- current set;
- current rotation `P1–P6`;
- `SERVE` or `RECEIVE` phase;
- optional current server, time-outs, and substitutions.

### 2.2 Navigation

```text
OVERVIEW | ROTATIONS | PLAYERS
```

The active tab uses a cyan indicator. Navigation requires one tap and retains period, rotation, phase, player, and skill context.

### 2.3 Period selector

```text
SET 3 | MATCH | LAST 10
```

The current set is selected by default during live use.

### 2.4 Live state

```text
● LIVE · Updated after each rally
```

Supported states: `LIVE`, `UPDATING`, `OFFLINE`, and `STALE`.

---

# 3. Screen 1 — Live Overview

## 3.1 Objective

Answer quickly:

- What is happening now?
- Is the team gaining or losing momentum?
- Which collective component requires attention?
- Which rotation or player should be inspected next?

## 3.2 Layout

1. Match header
2. Main navigation
3. Period selector
4. Current run and time-outs
5. Six KPI cards
6. Last ten rallies
7. Point sources
8. Team comparison
9. One priority insight
10. Live footer

## 3.3 Primary KPIs

| KPI | Display | Formula or basis |
|---|---|---|
| Side-out | `60% · 12/20` | receive rallies won / receive rallies |
| Break point | `43% · 6/14` | serve rallies won / serve rallies |
| Attack efficiency | `+33% · 12K/4E/24ATT` | `(kills − errors) / attempts` |
| Reception+ | `60% · 9/15` | positive receptions / attempts |
| Serve | `2 aces / 3 errors` | serve actions |
| Block | `2 points · 4 touches` | block points and touches kept separate |

Suggested configurable thresholds:

| KPI | Critical | Watch | Strong |
|---|---:|---:|---:|
| Side-out | `<45%` | `45–59%` | `≥60%` |
| Break point | `<25%` | `25–39%` | `≥40%` |
| Attack efficiency | `<15%` | `15–34%` | `≥35%` |
| Reception+ | `<45%` | `45–59%` | `≥60%` |

Every percentage shall include its denominator. A small sample uses neutral styling and the label `Limited sample`.

## 3.4 Momentum

```text
LAST 10 RALLIES
W L W W L L W L W W
```

The sequence can include rotation changes, `TO`, and `SUB` markers. Tapping a rally opens its event detail.

## 3.5 Priority insight

Only one insight appears at a time.

```text
WATCH · P4 SIDE-OUT
2/6 receive rallies won · limited sample
[View rotation →]
```

The insight is descriptive, not a prescriptive coaching command.

---

# 4. Screen 2 — Rotations

## 4.1 Objective

Identify which rotation is effective or problematic, whether the cause occurs in side-out or break point, and which lineup or technical event explains the result.

## 4.2 Filters and selector

```text
ALL | RECEIVE | SERVE

P1 +2 | P2 +1 | P3 +3
P4 −3 | P5  0 | P6 −1
```

Each rotation tile shall expose:

- point differential;
- won/lost rallies;
- side-out and break-point rates;
- sample size;
- recent trend;
- current and selected state.

## 4.3 Selected rotation

```text
P4 · SET 3
8 rallies · 2 won / 6 lost
SO 33% · 2/6
BP 0% · 0/2
ATT EFF. 0% · 2K/2E/6ATT
REC+ 33% · 2/6
```

## 4.4 Court modes

```text
LINEUP | RECEPTION | ATTACK | SERVE TARGET
```

The court visual shall show shirt number, short name, role, zone, front/back row, setter, libero, and current server.

```text
              NET
      Z4       Z3       Z2
      Z5       Z6       Z1
```

## 4.5 Outcomes and rally sequence

```text
WON                       LOST
Attack 2                  Opp. attack 2
                          Attack error 2
                          Reception error 1
                          Serve error 1

P4 RALLIES
L L W L W L L L
```

Tapping a player on the court opens Players while preserving set, rotation, phase, and technical mode.

---

# 5. Screen 3 — Players

## 5.1 Objective

Expose observed player contributions, recent actions, technical breakdowns, and contextual differences without presenting unsupported personal rankings.

## 5.2 Filters

```text
ON COURT | ALL
ALL | OH | MB | OPP | S | L
#12 | #4 | #9 | #8 | #2 | #7
```

`ON COURT` is selected by default during live use.

## 5.3 Player summary

```text
#12 MARTIN · OH
ON COURT · FRONT ROW · Z4
SET 3 · ALL ROTATIONS

KILLS 6/11
ATT EFF. +27% · (6−3)/11
REC+ 67% · 4/6
SERVE 1 ACE / 1 ERROR
```

## 5.4 Skill tabs

```text
ATTACK | RECEIVE | SERVE | MORE
```

`MORE` contains block, defense, setting, free-ball, and transition information where applicable.

## 5.5 Attack breakdown

| Type | Attempts | Kills | Errors | Efficiency |
|---|---:|---:|---:|---:|
| Zone 4 | 7 | 4 | 2 | +29% |
| Pipe | 2 | 1 | 0 | +50% |
| Zone 2 | 2 | 1 | 1 | 0% |

## 5.6 Reception and serve

Reception shall distinguish perfect, positive, playable, and error outcomes. Serve shall distinguish attempts, aces, errors, targeted zones, opponent reception quality, and team break points with the player serving.

## 5.7 Block and defense

Keep separate:

- block point;
- block touch;
- attack slowed by block;
- controlled dig;
- positive dig enabling organized offense;
- uncontrolled dig.

## 5.8 Recent actions

```text
18–16 Attack kill
17–16 Positive reception
16–16 Attack error
15–14 Attack kill
```

Each row opens the associated rally timeline.

---

# 6. Player Detail entry point — approved interface

## 6.1 Purpose

The Players screen shall provide a prominent navigation control that opens the complete detail page for the currently selected player.

This component is a call-to-action, not a statistic card. It is displayed after the player-summary content and immediately before the demonstration/reference footer.

## 6.2 Exact visible label

The approved French label is:

```text
Voir le détail joueur
```

Do not shorten or replace this wording.

English localization:

```text
View player details
```

## 6.3 Approved visual composition

The component shall reproduce the approved Volley Live interface:

- deep midnight-navy page background;
- large cyan/light-blue rounded rectangle;
- subtle horizontal cyan gradient;
- thin bright-cyan border;
- generic player silhouette at the left;
- bold dark-navy label in the visual center;
- dark-navy right-facing chevron at the far right;
- generous internal spacing;
- footer metadata directly below the button.

Reference structure:

```text
┌──────────────────────────────────────────────────────────────┐
│  [Player icon]     Voir le détail joueur            [›]     │
└──────────────────────────────────────────────────────────────┘
Données de démonstration.             Référence 03 · VOLLEY LIVE
```

## 6.4 Layout requirements

- Full available content width inside normal page margins.
- Entire rounded rectangle is one interactive target.
- Icon, label, and chevron remain on one line.
- Label is visually centered across the complete button.
- Icon and chevron have balanced columns so they do not displace the label.
- Footer is outside the button.
- The component remains in normal document flow, not fixed or floating.

Recommended CSS grid:

```css
grid-template-columns: 48px 1fr 48px;
align-items: center;
```

## 6.5 Recommended design tokens

| Property | Phone | Tablet/Desktop |
|---|---:|---:|
| Minimum height | 72 px | 80–96 px |
| Radius | 18 px | 20–24 px |
| Horizontal padding | 24 px | 28–32 px |
| Label size | 18–20 px | 20–24 px |
| Icon size | 28–32 px | 32–36 px |
| Chevron size | 24–28 px | 28–32 px |
| Border | 1–2 px | 1–2 px |

Suggested theme values:

```text
Page background:  #041A33
Button start:     #58D8F5
Button end:       #44C4EF
Button border:    #36EBF5
Foreground:       #031A36
Footer text:      #9BB9DE
Focus outline:    #FFFFFF
```

Use existing Volley Live theme tokens when available rather than duplicating hard-coded values.

## 6.6 Interaction behavior

When the user activates the control, the app shall:

1. verify that a player is selected;
2. open Player Detail for that player;
3. preserve active match and analysis context;
4. place keyboard focus on the Player Detail heading;
5. provide a back path restoring the Players screen.

Context to preserve:

- `matchId`;
- `setId` or period;
- `playerId`;
- selected rotation;
- serve/receive phase;
- selected skill;
- recent-rally window.

Example route:

```text
/player-detail?matchId={matchId}&playerId={playerId}&period=set-3&rotation=all
```

The route may differ, but the state shall remain equivalent.

## 6.7 Component states

### Default

- Cyan gradient.
- Dark-navy icon, label, and chevron.
- Enabled when a valid player is selected.

### Pressed

- Slightly lower brightness.
- Optional scale limited to `0.99`.
- No page-layout movement.

### Focus

- Clearly visible white or high-contrast external outline.
- Focus must not rely on color change alone.

### Disabled

Used when no valid player is selected.

Accessible explanation:

```text
Sélectionnez un joueur pour voir le détail
```

### Loading

- Preserve dimensions.
- Display an inline progress indicator.
- Block duplicate navigation.
- Accessible label: `Ouverture du détail joueur`.

### Error

- Keep the Players screen and selected context visible.
- Show a concise retry message.
- Do not clear filters or selected player.

## 6.8 Accessibility

- Implement as a native link for routing or a native button when navigation is handled programmatically.
- Recommended accessible name: `Voir le détail du joueur numéro 12, Martin`.
- Hide decorative silhouette and chevron from the accessibility tree.
- Meet WCAG 2.2 AA contrast requirements.
- Support `Enter`, and `Space` for button semantics.
- Use a minimum `44 × 44 CSS px` interactive target. The approved visual exceeds this minimum.
- Respect reduced-motion preferences.
- Do not truncate the visible French label at `320 CSS px` width.

## 6.9 Footer metadata

Approved demonstration footer:

```text
Données de démonstration.             Référence 03 · VOLLEY LIVE
```

Rules:

- muted pale-blue color;
- demonstration text left aligned;
- reference text right aligned;
- footer is informational unless a separate action is specified;
- hide `Données de démonstration.` when production match data is displayed;
- `Référence 03` is a design reference, not a player or match identifier.

## 6.10 Telemetry

Recommended events:

```text
player_detail_cta_impression
player_detail_cta_selected
player_detail_opened
player_detail_open_failed
```

Recommended properties:

- match ID;
- selected player ID;
- period;
- rotation filter;
- skill filter;
- source screen `players`;
- input method;
- demonstration-data flag.

## 6.11 Acceptance criteria

- [ ] Exact label is `Voir le détail joueur`.
- [ ] Player silhouette appears on the left.
- [ ] Right-facing chevron appears on the right.
- [ ] Entire button is interactive.
- [ ] Button uses the approved cyan-on-navy appearance.
- [ ] Label remains visually centered.
- [ ] Player Detail opens for the selected player.
- [ ] Match, period, player, rotation, phase, and skill context are preserved.
- [ ] Back navigation restores the Players context.
- [ ] Keyboard focus is visible.
- [ ] Screen-reader label includes the selected player's identifier.
- [ ] Disabled state explains that a player must be selected.
- [ ] Loading blocks duplicate navigation.
- [ ] Footer metadata is correctly aligned.
- [ ] Demonstration notice is hidden for real match data.

---

# 7. Cross-screen navigation

## 7.1 Overview to Rotations

```text
P4 side-out warning
→ ROTATIONS · selected set · P4 · RECEIVE
```

## 7.2 Rotations to Players

```text
Tap a player on court
→ PLAYERS · selected player · preserved set/rotation/phase
```

## 7.3 Players to Player Detail

```text
Tap “Voir le détail joueur”
→ PLAYER DETAIL · selected player · preserved filters
```

## 7.4 Players to rally detail

```text
Tap recent action
→ Rally detail · complete event sequence
```

## 7.5 Filter persistence

Preserve until explicitly reset:

- match;
- period;
- recent-rally window;
- rotation;
- serve/receive phase;
- selected player;
- selected skill.

---

# 8. Responsive behavior

## Tablet landscape

- Keep header and navigation visible.
- Show all six Overview KPIs without scrolling.
- Keep the complete court visible.
- Allow master/detail layout on Players.
- Keep the Player Detail CTA aligned with the Players content width.

## Phone portrait

- Use a `2 × 3` KPI grid.
- Stack modules vertically.
- Use horizontal selectors for rotations and players.
- Open detailed subpanels as bottom sheets where helpful.
- Render `Voir le détail joueur` at full content width.
- Increase CTA height before reducing or truncating its label.

Minimum supported width: `320 CSS px`.

---

# 9. Data and calculation requirements

Minimum entities:

- `Match`, `Set`, `Rally`, `Team`, `Player`;
- `RosterEntry`, `Lineup`, `RotationState`;
- `Substitution`, `Timeout`, `ActionEvent`.

Minimum event families:

- `SERVE`, `RECEPTION`, `SET`, `ATTACK`;
- `BLOCK`, `DEFENSE`, `FREE_BALL`;
- `OPPONENT_ERROR`, `SANCTION_OR_OTHER_POINT`.

Core formulas:

```text
SO% = receive rallies won / receive rallies played
BP% = serve rallies won / serve rallies played
Attack efficiency = (kills − attack errors) / attempts
Kill% = kills / attempts
Reception+% = positive receptions / reception attempts
Rotation differential = rallies won − rallies lost
```

Historical rally context shall retain lineup, rotation, player zones, serving team, and phase at rally start.

---

# 10. Empty, correction, and performance states

- Missing data displays `—`, not zero.
- Insufficient data displays sample size and neutral styling.
- Correcting a rally recomputes only affected aggregates.
- Do not blank the complete dashboard while updating.
- Preserve offline capture and local statistics.
- Target an in-memory UI update below `300 ms` on a typical current mobile device.

---

# 11. Consolidated acceptance criteria

- [ ] Three live screens share score, set, rotation, and phase.
- [ ] Main navigation requires one tap.
- [ ] Active filters persist.
- [ ] Every percentage includes a sample size.
- [ ] Overview shows six primary KPIs and one priority insight.
- [ ] P1–P6 are accessible with transparent rotation metrics.
- [ ] Court lineups retain correct historical context.
- [ ] Player skill families remain separate.
- [ ] Recent actions open their rally.
- [ ] `Voir le détail joueur` is present on Players.
- [ ] The approved CTA appearance and footer are implemented.
- [ ] Player Detail opens with preserved context.
- [ ] Accessibility, loading, disabled, and error states are implemented.

---

## 12. Implementation summary

The feature is complete when a coach can move from a collective signal to the relevant rotation, player, full player detail, and underlying rally without rebuilding filters. The approved Player Detail entry point is an integral component of the Players screen and must retain the cyan-on-navy Volley Live identity shown in the reference visual.
