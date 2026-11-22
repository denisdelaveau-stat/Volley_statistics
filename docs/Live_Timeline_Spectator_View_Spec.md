
## VolleyLive — LIVE TIMELINE (Spectator View)
  
**Document type:** Functional & UI specification**Target:** Integration into the VolleyLive app (spectator / fan side)**Version:** 1.0 (draft)**Orientation:** Landscape first (tablet / desktop, reference 1536×1024); portrait handling listed in §15**Language of the UI:** French (default), labels isolated for translation

### 1. Purpose
  
**LIVE TIMELINE** lets a spectator follow a match **rally by rally**. It answers, at a glance:
- What is the current score?
- How did the score evolve, point by point?
- Which team and which player decided each rally, and how (winning action or fault)?
- Who is leading, and by how many points?
- Was the rally a **side-out**, a **break point**, or a **lost** rally for HOME?  
The view is deliberately **narrative, not statistical**: no player statistics panels, no bench, no coach alerts, no charts. Statistics stay in the **STATS** tab.

#### 1.1 Position in the spectator navigation
LIVE SCORE  \|  LIVE TIMELINE  \|  STATS  
LIVE TIMELINE is the **narrative** view of the spectator mode. The current score stays pinned at the top of every spectator tab.

#### 1.2 Out of scope
- Live chat for followers (separate spec)
- Coach and player views (separate specs)
- Statistics (STATS tab)
- Capture interface

### 2. Screen layout

#### 2.1 Regions (reference 1536×1024 px)
┌──────────────────────────────────────────────────────────────────────────────┐
│ A. TOP BAR   logo VolleyLive · ● LIVE                      \[ VUE SPECTATEUR \]│
│ B. SCOREBOARD            AWAY   14 \| 10   HOME      SET 2 • 1–0              │
│ C. NAVIGATION            LIVE SCORE \| LIVE TIMELINE \| STATS                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ D. FILTER BAR   En haut : \[Plus anciennes\|Plus récentes\]  Nombre d'actions : \[5 ▾\]
├──────────────────────────────────────────────────────────────────────────────┤
│ E. TIMELINE PANEL                                                            │
│  ┌lane L┐ ┌─ AWAY column ─┐   SET 2 · Fil du match   ┌─ HOME column ─┐┌lane R┐│
│  │ 0    │ │               │   Score : AWAY — HOME    │               ││    0 ││
│  │ +4 ▬▬│ │               │   Ancien → récent        │ (12 OH) Sam…  ││      ││
│  │ …    │ │               │      ┌────────┐          │               ││      ││
│  └──────┘ └───────────────┘      │ 12 : 8 │ spine    └───────────────┘└──────┘│
│                                  └────────┘                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ F. FOOTER  ✓ Action gagnante  × Faute │ SO · BP · L legend        ● Suivi en direct
└──────────────────────────────────────────────────────────────────────────────┘
<table>
<tr>
<th>  
Region
</th>
<th>  
Content
</th>
<th>  
Behaviour
</th>
</tr>
<tr>
<td>  
A. Top bar
</td>
<td>  
Logo, LIVE badge (red dot), VUE SPECTATEUR pill
</td>
<td>  
Fixed
</td>
</tr>
<tr>
<td>  
B. Scoreboard
</td>
<td>  
AWAY score, HOME score, set number, sets won
</td>
<td>  
Fixed, live
</td>
</tr>
<tr>
<td>  
C. Navigation
</td>
<td>  
3 tabs, active tab = cyan text + underline
</td>
<td>  
Fixed
</td>
</tr>
<tr>
<td>  
D. Filter bar
</td>
<td>  
Display order + number of rallies (§4)
</td>
<td>  
Fixed above the timeline
</td>
</tr>
<tr>
<td>  
E. Timeline panel
</td>
<td>  
Delta lanes, AWAY column, central spine, HOME column (§5–§8)
</td>
<td>  
Scroll if needed
</td>
</tr>
<tr>
<td>  
F. Footer
</td>
<td>  
Legends + live status
</td>
<td>  
Fixed
</td>
</tr>
</table>


#### 2.2 Timeline panel columns (left → right)

<table>
<tr>
<th>  
\#
</th>
<th>  
Column
</th>
<th>  
Role
</th>
<th>  
Reference width
</th>
</tr>
<tr>
<td>  
1
</td>
<td>  
**Delta lane (left)**
</td>
<td>  
Red bars when AWAY leads (§7)
</td>
<td>  
~90 px
</td>
</tr>
<tr>
<td>  
2
</td>
<td>  
**AWAY column**
</td>
<td>  
Event cards of AWAY (§6)
</td>
<td>  
flexible
</td>
</tr>
<tr>
<td>  
3
</td>
<td>  
**Central spine**
</td>
<td>  
Score pills, rally captions, SO/BP/L chips (§5)
</td>
<td>  
~170 px
</td>
</tr>
<tr>
<td>  
4
</td>
<td>  
**HOME column**
</td>
<td>  
Event cards of HOME (§6)
</td>
<td>  
flexible, symmetrical to AWAY
</td>
</tr>
<tr>
<td>  
5
</td>
<td>  
**Delta lane (right)**
</td>
<td>  
Green bars when HOME leads (§7)
</td>
<td>  
~90 px
</td>
</tr>
</table>

  
Both delta lanes have **the same width** and are always reserved, even when empty, so that the layout never shifts.

#### 2.3 Theme

<table>
<tr>
<th>  
Token
</th>
<th>  
Value
</th>
</tr>
<tr>
<td>  
Background
</td>
<td>  
blue-night gradient (#07142B → #0B1F3F)
</td>
</tr>
<tr>
<td>  
Accent
</td>
<td>  
cyan #22D3EE
</td>
</tr>
<tr>
<td>  
Cards
</td>
<td>  
dark navy #0A1730, 1 px cyan-grey outline
</td>
</tr>
<tr>
<td>  
Text
</td>
<td>  
white (names, scores), blue-grey (labels)
</td>
</tr>
<tr>
<td>  
Positive
</td>
<td>  
green #22C55E
</td>
</tr>
<tr>
<td>  
Negative
</td>
<td>  
red #EF4444
</td>
</tr>
<tr>
<td>  
Style
</td>
<td>  
flat, thin outlines, restrained glow, no 3D
</td>
</tr>
</table>


### 3. Header, scoreboard and set
- Scoreboard order is **always AWAY first, HOME second** everywhere on the screen (scoreboard, score pills, column order left/right).
- Scores update immediately when a rally is recorded.
- SET n • a–h shows the current set and the sets won (AWAY–HOME).
- The timeline always shows **the current set**. Past sets: see §15 (open point).

### 4. Filter bar
  
Two controls, placed in a slim bar **above** the AWAY / HOME column headings.

#### 4.1 "En haut" — display order
  
Segmented control, two options:
<table>
<tr>
<th>  
Option
</th>
<th>  
Meaning
</th>
<th>  
Order of rows
</th>
</tr>
<tr>
<td>  
**Plus anciennes** _(default)_
</td>
<td>  
Oldest rally at the top
</td>
<td>  
Top → bottom: oldest → newest
</td>
</tr>
<tr>
<td>  
**Plus récentes**
</td>
<td>  
Newest rally at the top
</td>
<td>  
Top → bottom: newest → oldest
</td>
</tr>
</table>

- Selected option: cyan fill. Unselected: navy with outline.
- The sub-title under Score : AWAY — HOME changes accordingly: Ancien → récent or Récent → ancien.
- Changing the order **reverses the rows**, the data is unchanged. The delta bars, chips and pills travel with their row.

#### 4.2 "Nombre d'actions" — number of rallies displayed
  
Dropdown (closed state shows the value):
<table>
<tr>
<th>  
Option
</th>
<th>  
Meaning
</th>
</tr>
<tr>
<td>  
**5** _(default)_
</td>
<td>  
Last 5 rallies of the current set
</td>
</tr>
<tr>
<td>  
10
</td>
<td>  
Last 10 rallies
</td>
</tr>
<tr>
<td>  
20
</td>
<td>  
Last 20 rallies
</td>
</tr>
<tr>
<td>  
Tout le set
</td>
<td>  
All rallies of the current set
</td>
</tr>
</table>

- The window is **always the N most recent rallies** of the set; the "En haut" toggle only changes the **display direction**.
- If fewer than N rallies exist, all of them are shown (no empty rows).
- Option values are configurable (timeline.windowSizes).

#### 4.3 Persistence
  
The two choices are stored locally per spectator (device storage) and restored on the next visit. They do not affect other spectators.

#### 4.4 Live behaviour with the filters

<table>
<tr>
<th>  
Order
</th>
<th>  
When a new rally is recorded
</th>
</tr>
<tr>
<td>  
Plus anciennes (newest at the bottom)
</td>
<td>  
A new row is appended at the bottom; the oldest row leaves the window at the top (when the window is full)
</td>
</tr>
<tr>
<td>  
Plus récentes (newest at the top)
</td>
<td>  
A new row is inserted at the top; the oldest row leaves the window at the bottom
</td>
</tr>
</table>

  
Animation: fade-in + 200 ms slide; no full re-layout. The newest row carries the DERNIER POINT indicator (§5.4).

### 5. Central spine and score pills

#### 5.1 Structure
  
A thin cyan vertical line (the **spine**) runs through the center of the panel. On the spine, one **score pill** per displayed rally.   Rallye 22  \[L\]
  ┌──────────┐
  │  14 : 8  │
  └──────────┘
<table>
<tr>
<th>  
Element
</th>
<th>  
Spec
</th>
</tr>
<tr>
<td>  
Rally caption
</td>
<td>  
Rallye N — N = rally number within the set; small label above the pill
</td>
</tr>
<tr>
<td>  
Score pill
</td>
<td>  
Dark rounded pill, white bold digits, format AWAY : HOME (score **after** the rally)
</td>
</tr>
<tr>
<td>  
Result chip
</td>
<td>  
Small chip to the right of the caption (§5.2)
</td>
</tr>
<tr>
<td>  
Pill outline
</td>
<td>  
Colored according to the result code (§5.2)
</td>
</tr>
<tr>
<td>  
Connector
</td>
<td>  
Thin horizontal line from the pill to the event card of the acting team (§6)
</td>
</tr>
</table>


#### 5.2 Result code from HOME's point of view — **SO / BP / L**
  
The color codes are the same as in the Metrix statistics report (SO yellow, BP green, L red).
<table>
<tr>
<th>  
Code
</th>
<th>  
Meaning
</th>
<th>  
Condition
</th>
<th>  
Chip / pill color
</th>
</tr>
<tr>
<td>  
**SO**
</td>
<td>  
Side-out
</td>
<td>  
HOME **won** the rally while **receiving**
</td>
<td>  
Yellow #FFE67A (dark text)
</td>
</tr>
<tr>
<td>  
**BP**
</td>
<td>  
Break point
</td>
<td>  
HOME **won** the rally while **serving**
</td>
<td>  
Green #BDF0B8 fill, #22C55E outline (dark text)
</td>
</tr>
<tr>
<td>  
**L**
</td>
<td>  
Lost
</td>
<td>  
HOME **lost** the rally (whatever the phase)
</td>
<td>  
Red #FFB3B3 fill / #EF4444 outline (white text on the chip)
</td>
</tr>
</table>

  
Rules:
- The code is **always from HOME's point of view**.
- The score pill outline uses the code color (thin, 2 px). The last pill additionally keeps the cyan highlight (§5.4); the code outline stays visible.
- Chips carry **only the code** (SO, BP, L). **No series numbering** (a numbered variant was reviewed and rejected).
- Colors must never be the only carrier of information: the code letters are always present.

#### 5.3 Serving-side logic (data consistency)
  
The serving team of a rally is determined by the **previous rally winner** (the team that won the previous rally serves next). The first rally of a set uses the set's initial server.
<table>
<tr>
<th>  
Consequence
</th>
<th>  
Rule
</th>
</tr>
<tr>
<td>  
A **service fault** or **ace** can only belong to the serving team
</td>
<td>  
Validated at capture and at render time
</td>
</tr>
<tr>
<td>  
SO / BP / L is derived, never typed
</td>
<td>  
phase = reception if the serving team is AWAY, else service
</td>
</tr>
</table>

  
**Mockup note:** in the reference image, Rallye 23 is won by HOME while receiving (SO), so HOME serves Rallye 24. The "FAUTE AU SERVICE" of AWAY shown on Rallye 24 is therefore **not possible**. It is a placeholder in the illustration and must be replaced by another AWAY action (e.g. ATTAQUE OUT) in the final reference image and in demo data.

#### 5.4 Last point indicator
  
The most recent rally pill is highlighted (cyan outline + soft glow) and carries a small DERNIER POINT pill below it (above it when order is _Plus récentes_).

### 6. Event cards
  
Exactly **one event card per rally**, on the side of the **team that performed the deciding action** (the action that ended the rally). The opposite side of the row stays empty. This keeps the alternating storytelling of the timeline.

#### 6.1 Which action is shown

<table>
<tr>
<th>  
Rally ended by…
</th>
<th>  
Card side
</th>
<th>  
Tag
</th>
</tr>
<tr>
<td>  
A winning action of team X (ace, winning attack, winning block…)
</td>
<td>  
X
</td>
<td>  
Green with ✓
</td>
</tr>
<tr>
<td>  
A fault of team X (service fault, attack out, net…)
</td>
<td>  
X
</td>
<td>  
Red with ×
</td>
</tr>
</table>

  
The **team receiving the point** is deduced from the score and from the tag; **no explanatory text such as "Point HOME / Point AWAY" is displayed** (removed during review).

#### 6.2 HOME card (right side)
\[connector\]──(12 OH)  Sam Delaveau
                      \[ × FAUTE AU SERVICE \]
<table>
<tr>
<th>  
Element
</th>
<th>  
Spec
</th>
</tr>
<tr>
<td>  
Avatar
</td>
<td>  
Circle, pale fill, **jersey number** (blue, large) and **role** below (OH, MB, OPP, SET, LIB) — the avatar sits **nearest to the spine**
</td>
</tr>
<tr>
<td>  
Name
</td>
<td>  
Player name, bold white (full name or last name — see spectator.nameFormat)
</td>
</tr>
<tr>
<td>  
Tag
</td>
<td>  
Colored rounded tag with icon and label (§6.4)
</td>
</tr>
</table>


#### 6.3 AWAY card (left side) — mirrored
  AWAY            (A)──\[connector\]
  \[ ✓ ACE \]
<table>
<tr>
<th>  
Element
</th>
<th>  
Spec
</th>
</tr>
<tr>
<td>  
Avatar
</td>
<td>  
Circle with the letter **A**, placed on the **right edge of the card, nearest to the spine**
</td>
</tr>
<tr>
<td>  
Name
</td>
<td>  
AWAY (no individual names: the opponent roster is not captured)
</td>
</tr>
<tr>
<td>  
Tag
</td>
<td>  
Placed to the **left** of the avatar, right-aligned
</td>
</tr>
<tr>
<td>  
Alignment
</td>
<td>  
Text and tag are **right-aligned**; reading order from left to right: tag/name → avatar → connector → score pill
</td>
</tr>
</table>

  
If a future version captures AWAY players, the card becomes the mirror of the HOME card (name + role replace AWAY).

#### 6.4 Action tags
  
Each tag has an **icon** (✓ or ×) and a **label**. Color is never the only signal.
<table>
<tr>
<th>  
Outcome
</th>
<th>  
Color
</th>
<th>  
Icon
</th>
</tr>
<tr>
<td>  
Winning action
</td>
<td>  
Green #22C55E
</td>
<td>  
✓
</td>
</tr>
<tr>
<td>  
Fault
</td>
<td>  
Red #EF4444
</td>
<td>  
×
</td>
</tr>
</table>

  
Proposed label mapping (French, short, uppercase; to be aligned with the capture codes):
<table>
<tr>
<th>  
Skill
</th>
<th>  
Result
</th>
<th>  
Tag
</th>
</tr>
<tr>
<td>  
Serve
</td>
<td>  
Point
</td>
<td>  
ACE
</td>
</tr>
<tr>
<td>  
Serve
</td>
<td>  
Error
</td>
<td>  
FAUTE AU SERVICE
</td>
</tr>
<tr>
<td>  
Attack
</td>
<td>  
Point
</td>
<td>  
ATTAQUE GAGNANTE
</td>
</tr>
<tr>
<td>  
Attack
</td>
<td>  
Error (out / net)
</td>
<td>  
ATTAQUE OUT / ATTAQUE AU FILET
</td>
</tr>
<tr>
<td>  
Attack
</td>
<td>  
Blocked by the opponent
</td>
<td>  
ATTAQUE CONTRÉE
</td>
</tr>
<tr>
<td>  
Block
</td>
<td>  
Point
</td>
<td>  
BLOC GAGNANT
</td>
</tr>
<tr>
<td>  
Block
</td>
<td>  
Error
</td>
<td>  
FAUTE DE BLOC
</td>
</tr>
<tr>
<td>  
Reception
</td>
<td>  
Error
</td>
<td>  
FAUTE DE RÉCEPTION
</td>
</tr>
<tr>
<td>  
Set
</td>
<td>  
Error
</td>
<td>  
FAUTE DE PASSE
</td>
</tr>
<tr>
<td>  
Dig / Defence
</td>
<td>  
Error
</td>
<td>  
FAUTE DE DÉFENSE
</td>
</tr>
<tr>
<td>  
Other
</td>
<td>  
Fault
</td>
<td>  
FAUTE
</td>
</tr>
</table>

  
For Attack — Blocked, the card is shown on the side of the **attacker** (red) when the point is credited to the opposing block; when the blocking team is the actor of record, it is shown as BLOC GAGNANT on the blocking side. The rule is: **the card belongs to the team and player recorded as the terminal action in the log.**

### 7. Point-delta bars (outer edges)
  
Each row displays the **point difference** after the rally in the **outer lanes** of the panel.

#### 7.1 Definition
delta = AWAY score − HOME score      (after the rally)
<table>
<tr>
<th>  
Case
</th>
<th>  
Display
</th>
</tr>
<tr>
<td>  
delta \> 0 — **AWAY leads**
</td>
<td>  
**Red** bar in the **left lane**
</td>
</tr>
<tr>
<td>  
delta \< 0 — **HOME leads**
</td>
<td>  
**Green** bar in the **right lane**
</td>
</tr>
<tr>
<td>  
delta = 0 — **tie**
</td>
<td>  
**Nothing** in either lane
</td>
</tr>
</table>


#### 7.2 Geometry

<table>
<tr>
<th>  
Property
</th>
<th>  
AWAY lead (left lane)
</th>
<th>  
HOME lead (right lane)
</th>
</tr>
<tr>
<td>  
Color
</td>
<td>  
Red #EF4444
</td>
<td>  
Green #22C55E
</td>
</tr>
<tr>
<td>  
Zero reference
</td>
<td>  
**Left** outer edge of the lane
</td>
<td>  
**Right** outer edge of the lane
</td>
</tr>
<tr>
<td>  
Growth direction
</td>
<td>  
**Left → right**
</td>
<td>  
**Right → left**
</td>
</tr>
<tr>
<td>  
Label
</td>
<td>  
+N inside the bar, white bold, N = \|delta\|
</td>
<td>  
Same
</td>
</tr>
<tr>
<td>  
Vertical position
</td>
<td>  
Centered on the row's score pill
</td>
<td>  
Same
</td>
</tr>
<tr>
<td>  
Height
</td>
<td>  
Slim, ~26 px (same for all bars)
</td>
<td>  
Same
</td>
</tr>
</table>

- A faint vertical **zero line** runs along the outer border of each lane; a small 0 label sits at the top of each lane.
- **Length is strictly proportional to \|delta\|**: length = \|delta\| / scaleMax × laneWidth.
- scaleMax = the **largest \|delta\| among the displayed rows**, with a **floor of 5** (so a lead of +1 or +2 does not appear as a full-width bar). Both lanes use the **same** scaleMax so left and right bars are comparable.
- **Minimum bar width** = enough to contain the label (+N).
- Only **one** lane is populated on a given row.
- The event cards sit entirely **inside** the columns, never overlapping a lane.

#### 7.3 Behaviour
- Delta bars are recomputed on every live update and when the filter window changes (scaleMax may change).
- Tooltip / long-press on a bar: AWAY +6 (14–8).
- Accessible label: AWAY mène de 6 points, HOME mène de 3 points, or none for ties.

### 8. Footer

<table>
<tr>
<th>  
Left
</th>
<th>  
Middle
</th>
<th>  
Right
</th>
</tr>
<tr>
<td>  
✓ Action gagnante · × Faute
</td>
<td>  
SO Side-out · BP Break point · L Perdu (colored chips)
</td>
<td>  
● Suivi en direct pill (red dot)
</td>
</tr>
</table>

  
Delta bars are self-explanatory (labelled +N); no bar legend.

### 9. States and edge cases

<table>
<tr>
<th>  
Situation
</th>
<th>  
Behaviour
</th>
</tr>
<tr>
<td>  
No rally yet in the set
</td>
<td>  
Timeline shows an empty state: Le set n'a pas encore commencé
</td>
</tr>
<tr>
<td>  
Fewer rallies than N
</td>
<td>  
Show all existing rallies, no placeholders
</td>
</tr>
<tr>
<td>  
New set starts
</td>
<td>  
Timeline clears and starts at Rallye 1 of the new set; scoreboard updates the set number
</td>
</tr>
<tr>
<td>  
Undo in the capture app
</td>
<td>  
The rally (or its action) disappears from the timeline; score pill, chip, delta bar, DERNIER POINT are recomputed
</td>
</tr>
<tr>
<td>  
Correction of the terminal action
</td>
<td>  
The card, tag and side are updated; score and chips remain consistent
</td>
</tr>
<tr>
<td>  
Connection lost
</td>
<td>  
● Suivi en direct pill turns grey with Reconnexion…; last known state stays visible
</td>
</tr>
<tr>
<td>  
Match finished
</td>
<td>  
LIVE badge replaced by TERMINÉ; filters stay available
</td>
</tr>
<tr>
<td>  
Tie
</td>
<td>  
No delta bar on that row
</td>
</tr>
<tr>
<td>  
Very long player name
</td>
<td>  
Truncated with ellipsis, full name in tooltip
</td>
</tr>
</table>


### 10. Data model
  
Everything is **derived from the official match JSON** (the same fixture format used by Capture Live, Coach View and Statistics). No value is typed or stored separately for this view.

#### 10.1 Information required in the log (per rally)

<table>
<tr>
<th>  
Information
</th>
<th>  
Used for
</th>
</tr>
<tr>
<td>  
rally\_id, set, rally\_number
</td>
<td>  
Caption Rallye N, ordering
</td>
</tr>
<tr>
<td>  
serving\_team (HOME / AWAY)
</td>
<td>  
SO / BP / L derivation (§5.3)
</td>
</tr>
<tr>
<td>  
winner (HOME / AWAY)
</td>
<td>  
Score, chips, delta
</td>
</tr>
<tr>
<td>  
score\_after.away, score\_after.home
</td>
<td>  
Score pill, delta
</td>
</tr>
<tr>
<td>  
terminal\_action.team
</td>
<td>  
Card side
</td>
</tr>
<tr>
<td>  
terminal\_action.player\_id (HOME only)
</td>
<td>  
Avatar, name, role
</td>
</tr>
<tr>
<td>  
terminal\_action.skill
</td>
<td>  
Tag label
</td>
</tr>
<tr>
<td>  
terminal\_action.result (point / error)
</td>
<td>  
Tag color and icon
</td>
</tr>
<tr>
<td>  
Player master data: jersey number, name, role
</td>
<td>  
Avatar and name
</td>
</tr>
<tr>
<td>  
Event ordering (timestamp or sequence index)
</td>
<td>  
Display order
</td>
</tr>
</table>

  
If the match is captured in **Basic** mode (score only, without actions), rows are shown **without event card** (score pill, chip and delta bar only).

#### 10.2 View-model (computed client-side)
{
  "header": { "away": 14, "home": 10, "set": 2, "setsAway": 0, "setsHome": 1, "live": true },
  "filters": { "order": "oldestFirst", "windowSize": 5 },
  "deltaScaleMax": 6,
  "rallies": \[
    {
      "rally": 20,
      "score": { "away": 12, "home": 8 },
      "code": "L",
      "delta": { "side": "AWAY", "value": 4 },
      "event": {
        "side": "HOME",
        "playerId": "p12",
        "number": 12,
        "role": "OH",
        "name": "Sam Delaveau",
        "skill": "serve",
        "result": "error",
        "tag": "FAUTE AU SERVICE"
      },
      "isLast": false
    },
    {
      "rally": 22,
      "score": { "away": 14, "home": 8 },
      "code": "L",
      "delta": { "side": "AWAY", "value": 6 },
      "event": { "side": "AWAY", "skill": "serve", "result": "point", "tag": "ACE" },
      "isLast": false
    },
    {
      "rally": 23,
      "score": { "away": 14, "home": 9 },
      "code": "SO",
      "delta": { "side": "AWAY", "value": 5 },
      "event": { "side": "HOME", "playerId": "p12", "number": 12, "role": "OH",
                 "name": "Sam Delaveau", "skill": "attack", "result": "point",
                 "tag": "ATTAQUE GAGNANTE" },
      "isLast": false
    }
  \]
}  
(Values illustrative. delta.side is null and delta.value is 0 on a tie.)

#### 10.3 Derivation rules

<table>
<tr>
<th>  
Field
</th>
<th>  
Rule
</th>
</tr>
<tr>
<td>  
code
</td>
<td>  
L if winner = AWAY; else SO if serving\_team = AWAY; else BP
</td>
</tr>
<tr>
<td>  
delta.side
</td>
<td>  
AWAY if away \> home, HOME if home \> away, null otherwise
</td>
</tr>
<tr>
<td>  
delta.value
</td>
<td>  
abs(away − home)
</td>
</tr>
<tr>
<td>  
deltaScaleMax
</td>
<td>  
max(5, max(delta.value over displayed rows))
</td>
</tr>
<tr>
<td>  
event.side
</td>
<td>  
terminal\_action.team
</td>
</tr>
<tr>
<td>  
tag
</td>
<td>  
Mapping table §6.4
</td>
</tr>
<tr>
<td>  
Window
</td>
<td>  
Last windowSize rallies of the current set (or all if "Tout le set")
</td>
</tr>
<tr>
<td>  
Order
</td>
<td>  
Reverse the array when order = newestFirst
</td>
</tr>
</table>


#### 10.4 Validation rules
- score\_after must equal the previous score + 1 for the winner.
- A service ace or error must belong to serving\_team.
- A rally has **exactly one** terminal action.
- serving\_team of rally _n_ = winner of rally _n−1_ (except the first rally of the set).  
Invalid rows are shown with the available information and logged (never block the live display).

### 11. Interactions

<table>
<tr>
<th>  
Gesture
</th>
<th>  
Target
</th>
<th>  
Result
</th>
</tr>
<tr>
<td>  
Tap
</td>
<td>  
Plus anciennes / Plus récentes
</td>
<td>  
Reverse the order
</td>
</tr>
<tr>
<td>  
Tap
</td>
<td>  
Nombre d'actions dropdown
</td>
<td>  
Open options, apply instantly
</td>
</tr>
<tr>
<td>  
Tap / long-press
</td>
<td>  
Score pill
</td>
<td>  
Tooltip: rally, serving team, code meaning
</td>
</tr>
<tr>
<td>  
Tap / long-press
</td>
<td>  
Delta bar
</td>
<td>  
Tooltip: AWAY +6 (14–8)
</td>
</tr>
<tr>
<td>  
Tap
</td>
<td>  
Event card (optional v1.1)
</td>
<td>  
Expand: action detail
</td>
</tr>
<tr>
<td>  
Scroll
</td>
<td>  
Timeline panel
</td>
<td>  
Vertical scroll when the window exceeds the screen height
</td>
</tr>
</table>

  
Minimum touch target: 44 × 44 px.

### 12. Non-functional requirements

<table>
<tr>
<th>  
Area
</th>
<th>  
Requirement
</th>
</tr>
<tr>
<td>  
Latency
</td>
<td>  
A recorded rally appears in the spectator view in \< 2 s (network permitting)
</td>
</tr>
<tr>
<td>  
Performance
</td>
<td>  
60 fps animations; ≤ 50 ms to apply a filter change
</td>
</tr>
<tr>
<td>  
Layout stability
</td>
<td>  
Lanes, columns and spine never shift when content changes
</td>
</tr>
<tr>
<td>  
Readability
</td>
<td>  
Scores ≥ 24 px, names ≥ 16 px, tags ≥ 12 px
</td>
</tr>
<tr>
<td>  
Accessibility
</td>
<td>  
Contrast ≥ 4.5:1; every color paired with an icon or letter; ARIA labels on delta bars and chips
</td>
</tr>
<tr>
<td>  
Privacy
</td>
<td>  
Player names displayed only if spectator.showPlayerNames = true; otherwise jersey number and role only
</td>
</tr>
<tr>
<td>  
Localization
</td>
<td>  
French default; tags, legends and labels in a translation table
</td>
</tr>
<tr>
<td>  
Offline
</td>
<td>  
Last received state stays visible; filters keep working locally
</td>
</tr>
</table>


### 13. Acceptance criteria
- The view shows a **vertical timeline** with one score pill per displayed rally, scores in the AWAY : HOME format.
- The filter bar is above the column headings and contains **En haut** (two options) and **Nombre d'actions** (dropdown).
- Switching En haut reverses the row order and updates the subtitle (Ancien → récent / Récent → ancien).
- Changing the number of actions shows exactly the last N rallies (or all if fewer).
- Each rally has **one** event card on the acting team's side; the other side is empty.
- HOME cards: avatar (number + role) nearest the spine, name and tag to its right.
- AWAY cards: avatar A on the right edge nearest the spine, AWAY and tag to its left, right-aligned.
- Tags always show an icon (✓ / ×) and a label; no "Point HOME / Point AWAY" text anywhere.
- Every score pill carries a SO, BP or L chip and a matching outline; no numbering on chips.
- When AWAY leads, a **red** bar appears in the **left** lane, from the left edge growing rightwards, labelled +N.
- When HOME leads, a **green** bar appears in the **right** lane, from the right edge growing leftwards, labelled +N.
- On a tie, **no bar** is displayed.
- Bar lengths are strictly proportional to the delta, with a common scale for both lanes.
- The last rally is highlighted and labelled DERNIER POINT.
- Undo / correction in the capture app is reflected in the timeline, chips and bars.
- Everything is derived from the match JSON; no hardcoded values.

#### 13.1 Test scenarios

<table>
<tr>
<th>  
\#
</th>
<th>  
Scenario
</th>
<th>  
Expected
</th>
</tr>
<tr>
<td>  
T1
</td>
<td>  
AWAY leads 14–8
</td>
<td>  
Red +6 in the left lane, nothing on the right
</td>
</tr>
<tr>
<td>  
T2
</td>
<td>  
HOME leads 10–13
</td>
<td>  
Green +3 in the right lane, growing right → left
</td>
</tr>
<tr>
<td>  
T3
</td>
<td>  
Score 11–11
</td>
<td>  
No bar
</td>
</tr>
<tr>
<td>  
T4
</td>
<td>  
Lead changes sides during the window
</td>
<td>  
Bars alternate lanes row by row; same scale
</td>
</tr>
<tr>
<td>  
T5
</td>
<td>  
Window = 5 with 3 rallies played
</td>
<td>  
3 rows
</td>
</tr>
<tr>
<td>  
T6
</td>
<td>  
HOME wins while receiving
</td>
<td>  
Chip SO, yellow outline
</td>
</tr>
<tr>
<td>  
T7
</td>
<td>  
HOME wins while serving
</td>
<td>  
Chip BP, green outline
</td>
</tr>
<tr>
<td>  
T8
</td>
<td>  
HOME loses the rally
</td>
<td>  
Chip L, red outline
</td>
</tr>
<tr>
<td>  
T9
</td>
<td>  
Service fault recorded for the non-serving team
</td>
<td>  
Rejected by validation (§10.4 rule 2)
</td>
</tr>
<tr>
<td>  
T10
</td>
<td>  
Order switched to _Plus récentes_
</td>
<td>  
Newest row on top, DERNIER POINT on the first row
</td>
</tr>
<tr>
<td>  
T11
</td>
<td>  
Undo of the last rally
</td>
<td>  
Row removed, previous row becomes the last point
</td>
</tr>
</table>


### 14. Reference visual
  
Reference image: LIVE TIMELINE, landscape, five rallies (Rallye 20 → 24, scores 12:8 → 14:10), filter bar (Plus anciennes, 5), red delta bars in the left lane (+4, +5, +6, +5, +4), SO / BP / L chips and outlines, AWAY avatars nearest to the spine.  
Known deviations of the illustration from this spec (to be fixed in the implementation, not copied):
<table>
<tr>
<th>  
\#
</th>
<th>  
Deviation
</th>
<th>  
Expected
</th>
</tr>
<tr>
<td>  
1
</td>
<td>  
Ancien → récent partly overlapped by the first rally caption
</td>
<td>  
Fully visible, with enough spacing
</td>
</tr>
<tr>
<td>  
2
</td>
<td>  
Delta bars slightly offset vertically from the score pills
</td>
<td>  
Vertically centered on the pill
</td>
</tr>
<tr>
<td>  
3
</td>
<td>  
The +6 bar nearly touches the AWAY card
</td>
<td>  
Lane width reserved, no overlap
</td>
</tr>
<tr>
<td>  
4
</td>
<td>  
Rallye 24 shows an AWAY service fault although HOME serves
</td>
<td>  
Use a valid AWAY action (§5.3)
</td>
</tr>
</table>


### 15. Open points (to validate)
- **Window semantics:** "last N rallies" (current proposal) vs. "first N rallies of the set" for Plus anciennes.
- **Delta scale:** per-window maximum with floor 5 (current proposal) vs. a fixed scale for the whole set.
- **Portrait / phone layout:** delta lanes collapsed into thin strips, or bars moved under the score pill.
- **Past sets:** selector to browse completed sets.
- **AWAY players:** whether the opponent roster will be captured (names on AWAY cards).
- **Player names:** full name vs. last name vs. number only (spectator privacy).
- **Tag vocabulary:** final French labels and the exact mapping from capture result codes.
- **Card tap (v1.1):** expandable detail of the action.