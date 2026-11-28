
## VolleyLive — Live Header & Momentum Card

### Implementation Specification

<table>
<tr>
<th>  
Item
</th>
<th>  
Value
</th>
</tr>
<tr>
<td>  
Product
</td>
<td>  
VolleyLive / Volley\_statistics
</td>
</tr>
<tr>
<td>  
Screen
</td>
<td>  
Spectator Live page — top section (Scoreboard + Momentum)
</td>
</tr>
<tr>
<td>  
Status
</td>
<td>  
Approved mockup (2026-11-23) — ready for implementation
</td>
</tr>
<tr>
<td>  
Data source
</td>
<td>  
Official VolleyLive match JSON (already specified) — no new fields required
</td>
</tr>
<tr>
<td>  
Language of UI labels
</td>
<td>  
French
</td>
</tr>
<tr>
<td>  
Orientation
</td>
<td>  
Mobile portrait (primary), tablet portrait/landscape (secondary)
</td>
</tr>
</table>


### 1. Purpose & Scope
  
This specification defines the **top section of the spectator Live page**, placed **above the Live Timeline**:
- **App header** — VolleyLive branding.
- **Scoreboard card** — HOME (left) vs AWAY (right), current set score, sets score, service indicator, set status.
- **Momentum card ("MOMENTUM ACTUEL")** — short-term dynamic based on the last N recorded points of the current set.

#### In scope
- Layout, visual tokens, components, states (live, set finished, match finished, empty).
- Momentum computation algorithm (pure function from the match JSON).
- Real-time update and correction/undo behaviour.
- Acceptance criteria and test cases.

#### Out of scope
- The Live Timeline itself (separate spec, unchanged).
- Any **replay / archive** notion: this screen has **no REPLAY or ARCHIVE badge** and no playback controls.
- Coach-only analytics (rotation, player metrics).
- Win probability or prediction of any kind.

#### Fundamental rules (project-wide)
- Every displayed value **must be derived from the match JSON** (points/rallies history). No hard-coded demo values.
- **HOME is always on the left, AWAY always on the right**, consistently with the Live Timeline.
- With **no match loaded**, indicators display **0 or NA in gray** (see §7).
- Green / yellow / red are **reserved for the Timeline BP/SO convention**. They **must not** be used in this section.

### 2. Page Layout
┌──────────────────────────────────────────┐
│  \[logo\] VOLLEYLIVE                        │  ← App header (no badge on the right)
│ ┌──────────────────────────────────────┐ │
│ │ \[shield\]  │   24 : 21    │  \[shield\] │ │
│ │  FRÉJUS   │  0  SETS  1  │ AS CANNES │ │  ← Scoreboard card
│ │    🏐     │              │           │ │
│ │       ( SET 2 · EN COURS )           │ │
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │ MOMENTUM ACTUEL                      │ │
│ │ Sur les 8 derniers points            │ │
│ │        ↗ Avantage Fréjus             │ │
│ │ 75 %                           25 %  │ │
│ │ ███████████████████████░░░░░░░░      │ │  ← Momentum card
│ │ FRÉJUS 6                 2 AS CANNES │ │
│ │ \[H\]\[A\]\[H\]\[H\]\[A\]\[H\]\[H\]\[H\]             │ │
│ │ ──── Plus ancien → Plus récent ────  │ │
│ │ ───────────────────────────────────  │ │
│ │ (SÉRIE EN COURS) 3 points consécutifs· Fréjus │
│ │ ───────────────────────────────────  │ │
│ │ Indicateur de dynamique, pas une prédiction. │
│ └──────────────────────────────────────┘ │
│  LIVE TIMELINE ───────────────────────── │  ← existing component
└──────────────────────────────────────────┘
<table>
<tr>
<th>  
Zone
</th>
<th>  
Vertical order
</th>
<th>  
Height guidance (portrait 390 pt width)
</th>
</tr>
<tr>
<td>  
App header
</td>
<td>  
1
</td>
<td>  
56 px
</td>
</tr>
<tr>
<td>  
Scoreboard card
</td>
<td>  
2
</td>
<td>  
~200 px
</td>
</tr>
<tr>
<td>  
Momentum card
</td>
<td>  
3
</td>
<td>  
~360 px
</td>
</tr>
<tr>
<td>  
Live Timeline
</td>
<td>  
4
</td>
<td>  
remaining, scrollable
</td>
</tr>
</table>

- Outer horizontal page padding: **16 px**.
- Gap between cards: **16 px**.
- The whole page scrolls vertically; header and cards are **not sticky** (optional: compact sticky score bar is a future enhancement, out of scope).

### 3. Visual Design Tokens
  
Colors are aligned with the existing coach-view blue theme. Hex values are reference values; reuse existing CSS variables if they already exist.
<table>
<tr>
<th>  
Token
</th>
<th>  
Usage
</th>
<th>  
Reference value
</th>
</tr>
<tr>
<td>  
\--vl-bg-page
</td>
<td>  
Page background
</td>
<td>  
#0A1628
</td>
</tr>
<tr>
<td>  
\--vl-bg-card
</td>
<td>  
Card background
</td>
<td>  
#0E1E36
</td>
</tr>
<tr>
<td>  
\--vl-border-card
</td>
<td>  
Card border (1 px)
</td>
<td>  
#2A4E7F
</td>
</tr>
<tr>
<td>  
\--vl-accent (cyan)
</td>
<td>  
HOME momentum, score colon, active elements, service ball
</td>
<td>  
#5FD8F5
</td>
</tr>
<tr>
<td>  
\--vl-away-momentum (slate)
</td>
<td>  
AWAY momentum bar / tiles
</td>
<td>  
#3A4A66
</td>
</tr>
<tr>
<td>  
\--vl-away-momentum-text
</td>
<td>  
AWAY momentum numbers
</td>
<td>  
#A9B6CC
</td>
</tr>
<tr>
<td>  
\--vl-text-primary
</td>
<td>  
Scores, team names, headline
</td>
<td>  
#F4F8FC
</td>
</tr>
<tr>
<td>  
\--vl-text-secondary
</td>
<td>  
Subtitles, labels ("SETS", "Plus ancien…")
</td>
<td>  
#9FB0C8
</td>
</tr>
<tr>
<td>  
\--vl-text-muted
</td>
<td>  
Footer disclaimer, empty state
</td>
<td>  
#6B7C95
</td>
</tr>
<tr>
<td>  
\--vl-divider
</td>
<td>  
Thin horizontal lines
</td>
<td>  
#22395C
</td>
</tr>
<tr>
<td>  
\--vl-neutral
</td>
<td>  
NA / empty state elements
</td>
<td>  
#4A5568
</td>
</tr>
</table>


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
Card radius
</td>
<td>  
20 px
</td>
</tr>
<tr>
<td>  
Pill radius
</td>
<td>  
999 px (fully rounded), 1 px border --vl-accent at 60 % opacity
</td>
</tr>
<tr>
<td>  
Tile radius
</td>
<td>  
10 px
</td>
</tr>
<tr>
<td>  
Font
</td>
<td>  
System UI stack (-apple-system, "SF Pro", "Segoe UI", Roboto, sans-serif)
</td>
</tr>
<tr>
<td>  
Numbers
</td>
<td>  
font-variant-numeric: tabular-nums everywhere (no jumping digits)
</td>
</tr>
</table>

  
**Color rule:** in this section, HOME = cyan, AWAY = slate. Never use the BP/SO colors (green/yellow/red) here.

### 4. Component — App Header

<table>
<tr>
<th>  
Property
</th>
<th>  
Spec
</th>
</tr>
<tr>
<td>  
Content
</td>
<td>  
VolleyLive ball logo (28 px) + wordmark VOLLEY (white) LIVE (cyan), bold, 22 px, letter-spacing 0.5 px
</td>
</tr>
<tr>
<td>  
Alignment
</td>
<td>  
Left
</td>
</tr>
<tr>
<td>  
Right side
</td>
<td>  
**Empty.** No REPLAY / ARCHIVE / LIVE badge.
</td>
</tr>
</table>


### 5. Component — Scoreboard Card

#### 5.1 Structure
  
Three columns: HOME (1fr) \| divider \| SCORE (1.4fr) \| divider \| AWAY (1fr). Vertical dividers are 1 px --vl-divider, 70 % of the card inner height.

#### 5.2 Team columns

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
Crest
</td>
<td>  
Club logo from JSON if available (64 × 72 px). **Fallback:** shield outline with monogram (initials of team name, max 3 letters). HOME shield stroke = cyan, AWAY shield stroke = light slate #C5D0E0.
</td>
</tr>
<tr>
<td>  
Name
</td>
<td>  
Uppercase, bold, 18 px, --vl-text-primary, max 2 lines, ellipsis beyond.
</td>
</tr>
<tr>
<td>  
Service indicator
</td>
<td>  
Cyan volleyball icon (24 px) **under the name of the team currently serving**. Only one team shows it. Hidden when unknown.
</td>
</tr>
</table>

  
Monogram rule: first letter of each significant word, ignoring prepositions (de, du, la, le, les, d'), max 3 letters. "Fréjus" → F; "AS Cannes" → ASC.

#### 5.3 Score column

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
Current set score
</td>
<td>  
HOME : AWAY, 64 px, weight 800, white; colon in cyan.
</td>
</tr>
<tr>
<td>  
Sets score
</td>
<td>  
0  SETS  1 — HOME sets count under HOME side, AWAY under AWAY side, 36 px bold; label SETS 13 px, letter-spacing 1.5 px, --vl-text-secondary.
</td>
</tr>
<tr>
<td>  
Status pill
</td>
<td>  
Centered under the columns, cyan text 15 px bold uppercase.
</td>
</tr>
</table>


#### 5.4 Status pill values

<table>
<tr>
<th>  
Situation
</th>
<th>  
Label
</th>
</tr>
<tr>
<td>  
Set in progress
</td>
<td>  
SET {n} · EN COURS
</td>
</tr>
<tr>
<td>  
Set finished, next not started
</td>
<td>  
FIN DU SET {n}
</td>
</tr>
<tr>
<td>  
Match finished
</td>
<td>  
MATCH TERMINÉ
</td>
</tr>
<tr>
<td>  
Match loaded, no point yet
</td>
<td>  
SET 1 · À VENIR
</td>
</tr>
<tr>
<td>  
No match loaded
</td>
<td>  
AUCUN MATCH (gray)
</td>
</tr>
</table>


#### 5.5 Score values in transitional states
- **Set finished, next not started:** show the **final score of the finished set** (e.g. 25 : 21) and the updated sets score.
- **Match finished:** show final score of the last set and final sets score.

### 6. Component — Momentum Card ("MOMENTUM ACTUEL")

#### 6.1 Definition
  
Momentum is the **share of points won by each team over the last N points of the current set** (sliding window), complemented by the **current scoring streak**.
It is a descriptive indicator, **not a prediction**.

#### 6.2 Parameters

<table>
<tr>
<th>  
Parameter
</th>
<th>  
Default
</th>
<th>  
Configurable
</th>
<th>  
Notes
</th>
</tr>
<tr>
<td>  
windowSize (N)
</td>
<td>  
**8**
</td>
<td>  
Yes (app config constant)
</td>
<td>  
Number of last points considered
</td>
</tr>
<tr>
<td>  
minPoints
</td>
<td>  
**4**
</td>
<td>  
Yes
</td>
<td>  
Below this, momentum is not significant (see §6.6)
</td>
</tr>
<tr>
<td>  
advantageThreshold
</td>
<td>  
**0.70**
</td>
<td>  
Yes
</td>
<td>  
Leading share required to display "Avantage …"
</td>
</tr>
<tr>
<td>  
Scope
</td>
<td>  
Current set only
</td>
<td>  
No
</td>
<td>  
Resets at each new set
</td>
</tr>
</table>

  
With N = 8: 6–2, 7–1, 8–0 → _Avantage_; 5–3, 4–4 → _Équilibré_.

#### 6.3 Elements

<table>
<tr>
<th>  
\#
</th>
<th>  
Element
</th>
<th>  
Spec
</th>
</tr>
<tr>
<td>  
1
</td>
<td>  
Title
</td>
<td>  
MOMENTUM ACTUEL, 20 px bold uppercase, white
</td>
</tr>
<tr>
<td>  
2
</td>
<td>  
Subtitle
</td>
<td>  
Sur les {k} derniers points, 16 px, --vl-text-secondary. k = number of points actually used (≤ N). Use singular grammar never needed since k ≥ minPoints.
</td>
</tr>
<tr>
<td>  
3
</td>
<td>  
Headline
</td>
<td>  
Arrow icon + text, 30 px bold, centered (see §6.4)
</td>
</tr>
<tr>
<td>  
4
</td>
<td>  
Percentages
</td>
<td>  
{homePct} % left (cyan), {awayPct} % right (slate text) — 15 px bold. Rounded to integer; the two values must sum to 100.
</td>
</tr>
<tr>
<td>  
5
</td>
<td>  
Distribution bar
</td>
<td>  
Height 22 px, full width, radius 11 px. Left segment cyan = homePct, right segment slate = awayPct. Animated width transition 300 ms ease-out.
</td>
</tr>
<tr>
<td>  
6
</td>
<td>  
Counts
</td>
<td>  
Left: {HOME NAME}  {homeCount}; right: {awayCount}  {AWAY NAME}. Names 15 px bold uppercase; counts 26 px bold, HOME count cyan, AWAY count --vl-away-momentum-text.
</td>
</tr>
<tr>
<td>  
7
</td>
<td>  
Sequence tiles
</td>
<td>  
k equal tiles in one row, gap 8 px, height 56 px. HOME tile: cyan fill, dark text H. AWAY tile: slate fill, 1 px border #4D5F80, light text A. Chronological **left = oldest, right = most recent**.
</td>
</tr>
<tr>
<td>  
8
</td>
<td>  
Axis caption
</td>
<td>  
Thin line — Plus ancien → Plus récent — thin line, 14 px --vl-text-secondary
</td>
</tr>
<tr>
<td>  
9
</td>
<td>  
Divider
</td>
<td>  
1 px --vl-divider
</td>
</tr>
<tr>
<td>  
10
</td>
<td>  
Streak row
</td>
<td>  
Pill SÉRIE EN COURS (cyan outline, 14 px bold) + text 22 px bold (see §6.5)
</td>
</tr>
<tr>
<td>  
11
</td>
<td>  
Divider
</td>
<td>  
1 px --vl-divider
</td>
</tr>
<tr>
<td>  
12
</td>
<td>  
Disclaimer
</td>
<td>  
Indicateur de dynamique, pas une prédiction. 13 px, --vl-text-muted, centered
</td>
</tr>
</table>

  
When k \< N, tiles keep a constant size based on N (8 slots); unused slots on the **left** are rendered as empty outlined placeholders (--vl-neutral border, no fill) so that the most recent point always stays on the right.

#### 6.4 Headline rules

<table>
<tr>
<th>  
Condition
</th>
<th>  
Arrow
</th>
<th>  
Text
</th>
<th>  
Color
</th>
</tr>
<tr>
<td>  
homeShare ≥ advantageThreshold
</td>
<td>  
↗ (up-right)
</td>
<td>  
Avantage {HOME name}
</td>
<td>  
Arrow cyan, text white
</td>
</tr>
<tr>
<td>  
awayShare ≥ advantageThreshold
</td>
<td>  
↗ (up-right)
</td>
<td>  
Avantage {AWAY name}
</td>
<td>  
Arrow --vl-away-momentum-text, text white
</td>
</tr>
<tr>
<td>  
Otherwise
</td>
<td>  
↔ (horizontal)
</td>
<td>  
Équilibré
</td>
<td>  
Arrow --vl-text-secondary, text white
</td>
</tr>
</table>

  
Team names in the headline use the display name casing from the JSON (e.g. "Fréjus", "AS Cannes"), not uppercase.

#### 6.5 Streak rules
  
The streak is computed on **the whole current set** (not limited to the window).
<table>
<tr>
<th>  
Streak length s
</th>
<th>  
Text
</th>
</tr>
<tr>
<td>  
s = 1
</td>
<td>  
Dernier point · {team}
</td>
</tr>
<tr>
<td>  
s ≥ 2
</td>
<td>  
{s} points consécutifs · {team}
</td>
</tr>
</table>

- Streak text: number and words white; team name white.
- If s ≥ 5, the pill label stays SÉRIE EN COURS but the pill background becomes cyan at 15 % opacity (subtle emphasis). No other effect.

#### 6.6 Momentum states

<table>
<tr>
<th>  
State
</th>
<th>  
Condition
</th>
<th>  
Display
</th>
</tr>
<tr>
<td>  
**Active**
</td>
<td>  
Current set has ≥ minPoints points
</td>
<td>  
Full card as above
</td>
</tr>
<tr>
<td>  
**Not enough data**
</td>
<td>  
Current set has 1 to minPoints − 1 points
</td>
<td>  
Subtitle Momentum disponible après {minPoints} points; headline NA gray; bar fully --vl-neutral; percentages NA gray; counts show real values in gray; tiles show the real points (with left placeholders); streak row active (real data).
</td>
</tr>
<tr>
<td>  
**New set, 0 point**
</td>
<td>  
Set started, no point recorded
</td>
<td>  
Subtitle Nouveau set — en attente du premier point; headline NA; bar neutral; counts 0 gray; 8 placeholders; streak text — gray.
</td>
</tr>
<tr>
<td>  
**Set finished**
</td>
<td>  
Last set finished, next not started
</td>
<td>  
Card keeps the momentum of the finished set; subtitle Fin du set {n} · {k} derniers points; streak pill label becomes SÉRIE FINALE.
</td>
</tr>
<tr>
<td>  
**Match finished**
</td>
<td>  
Match over
</td>
<td>  
Same as _Set finished_ for the last set.
</td>
</tr>
<tr>
<td>  
**No match loaded**
</td>
<td>  
No JSON / empty
</td>
<td>  
Everything in gray: NA headline, 0 counts, NA %, 8 placeholders, streak —.
</td>
</tr>
</table>


### 7. Data Source & Mapping
  
The component consumes the **official VolleyLive match JSON (already specified)**. No new field is required. The implementation needs, per recorded point/rally, the following information already present in the JSON:
<table>
<tr>
<th>  
Required information
</th>
<th>  
Use
</th>
</tr>
<tr>
<td>  
Set index of the point
</td>
<td>  
Restrict computation to the current set
</td>
</tr>
<tr>
<td>  
Chronological order (index / timestamp)
</td>
<td>  
Window ordering
</td>
</tr>
<tr>
<td>  
Team that won the point (HOME / AWAY)
</td>
<td>  
Counts, tiles, streak
</td>
</tr>
<tr>
<td>  
Score after the point
</td>
<td>  
Scoreboard current set score
</td>
</tr>
<tr>
<td>  
Team serving for the next rally (or derivable: winner of last rally serves)
</td>
<td>  
Service indicator
</td>
</tr>
<tr>
<td>  
Set results / set winners
</td>
<td>  
Sets score, status pill
</td>
</tr>
<tr>
<td>  
Team names (and optional logo) for HOME / AWAY
</td>
<td>  
Names, monograms, crests
</td>
</tr>
</table>

  
Implementation note: access JSON fields through the **existing match JSON adapter / selectors** already used by the Live Timeline. Do not duplicate parsing logic. If serving team is not stored explicitly, derive it: the team that won the last rally serves; for the first rally of a set, use the set's initial serving team from the JSON. If neither is available, hide the service indicator.  
Points that are **cancelled / undone** in the JSON history must be excluded (same rule as the Live Timeline).

### 8. View-Model & Algorithm

#### 8.1 View-model (TypeScript notation, implementation language may differ)
type Side = 'HOME' \| 'AWAY';
interface ScoreboardVM {
  home: { name: string; monogram: string; logoUrl?: string };
  away: { name: string; monogram: string; logoUrl?: string };
  currentScore: { home: number; away: number };
  setsScore: { home: number; away: number };
  servingSide: Side \| null;
  status: 'NO\_MATCH' \| 'NOT\_STARTED' \| 'IN\_PROGRESS' \| 'SET\_FINISHED' \| 'MATCH\_FINISHED';
  setNumber: number \| null;
}
interface MomentumVM {
  state: 'ACTIVE' \| 'NOT\_ENOUGH' \| 'NEW\_SET' \| 'SET\_FINISHED' \| 'MATCH\_FINISHED' \| 'NO\_MATCH';
  setNumber: number \| null;
  windowSize: number;             // N (slots displayed)
  sequence: Side\[\];               // k points, oldest → most recent
  homeCount: number;
  awayCount: number;
  homePct: number \| null;         // integer, null → "NA"
  awayPct: number \| null;
  leader: Side \| 'BALANCED' \| null; // null → NA
  streak: { side: Side; length: number } \| null;
}

#### 8.2 Momentum computation (pure function)
function computeMomentum(points: PointEvent\[\], setNumber: number, cfg = {
  windowSize: 8, minPoints: 4, advantageThreshold: 0.70,
}): Omit\<MomentumVM, 'state'\> {
  const setPoints = points
    .filter(p =\> p.set === setNumber && !p.cancelled)
    .sort(byChronologicalOrder);
  const sequence = setPoints.slice(-cfg.windowSize).map(p =\> p.winner);
  const k = sequence.length;
  const homeCount = sequence.filter(s =\> s === 'HOME').length;
  const awayCount = k - homeCount;
  let homePct = null, awayPct = null, leader = null;
  if (k \>= cfg.minPoints) {
    homePct = Math.round((homeCount / k) \* 100);
    awayPct = 100 - homePct;                    // guarantees sum = 100
    const h = homeCount / k, a = awayCount / k;
    leader = h \>= cfg.advantageThreshold ? 'HOME'
           : a \>= cfg.advantageThreshold ? 'AWAY'
           : 'BALANCED';
  }
  // Streak over the whole set
  let streak = null;
  if (setPoints.length \> 0) {
    const last = setPoints\[setPoints.length - 1\].winner;
    let length = 0;
    for (let i = setPoints.length - 1; i \>= 0 && setPoints\[i\].winner === last; i--) length++;
    streak = { side: last, length };
  }
  return { setNumber, windowSize: cfg.windowSize, sequence,
           homeCount, awayCount, homePct, awayPct, leader, streak };
}  
setNumber = current set if in progress; otherwise the last finished set (states _SET\_FINISHED_ / _MATCH\_FINISHED_).

#### 8.3 Update behaviour
- Recompute the full view-models **from the JSON history on every match update** (new point, correction, undo, set change). No incremental state that could drift.
- Complexity is trivial (≤ ~50 points per set); no memoization required, but a selector memoized on the JSON revision is acceptable.
- Animations on update:
- Bar segments: width transition 300 ms.
- New tile: the sequence shifts left; the new rightmost tile fades/scales in (200 ms).
- Score digits: no animation required (optional 150 ms fade).
- Respect prefers-reduced-motion: disable all transitions.

### 9. Worked Example (reference mockup)
  
Current set 2, last 8 points (oldest → newest): H A H H A H H H
<table>
<tr>
<th>  
Output
</th>
<th>  
Value
</th>
</tr>
<tr>
<td>  
homeCount / awayCount
</td>
<td>  
6 / 2
</td>
</tr>
<tr>
<td>  
homePct / awayPct
</td>
<td>  
75 % / 25 %
</td>
</tr>
<tr>
<td>  
leader
</td>
<td>  
HOME (0.75 ≥ 0.70) → ↗ Avantage Fréjus
</td>
</tr>
<tr>
<td>  
streak
</td>
<td>  
HOME, 3 → 3 points consécutifs · Fréjus
</td>
</tr>
<tr>
<td>  
Scoreboard
</td>
<td>  
24 : 21, sets 0 – 1, SET 2 · EN COURS, ball under FRÉJUS (Fréjus won last rally)
</td>
</tr>
</table>


### 10. Responsiveness

<table>
<tr>
<th>  
Viewport
</th>
<th>  
Behaviour
</th>
</tr>
<tr>
<td>  
Phone portrait (320–430 px)
</td>
<td>  
Layout as specified. At \< 360 px: score 52 px, tile height 48 px, headline 26 px.
</td>
</tr>
<tr>
<td>  
Tablet portrait
</td>
<td>  
Max content width 640 px, centered.
</td>
</tr>
<tr>
<td>  
Tablet / phone landscape
</td>
<td>  
Scoreboard and Momentum cards **side by side** (50 / 50), Live Timeline below.
</td>
</tr>
</table>

  
Long team names: wrap on 2 lines in the scoreboard; in the counts row, truncate with ellipsis (keep the count always visible).

### 11. Accessibility
- Color is never the only carrier of information: tiles carry H / A letters, headline is textual.
- Contrast ≥ 4.5:1 for all text (dark text on cyan tiles).
- ARIA:
- Scoreboard: aria-label="Fréjus 24, AS Cannes 21, set 2 en cours, sets 0 à 1, service Fréjus".
- Momentum card: aria-label="Momentum : avantage Fréjus, 6 points sur 8, série de 3 points pour Fréjus".
- Sequence tiles container: role="list", each tile role="listitem" with aria-label="Point {i} : {team}".
- Live region: momentum headline uses aria-live="polite" and is announced only when leader changes.

### 12. Acceptance Criteria
- No REPLAY / ARCHIVE badge or replay notion is visible anywhere in this section.
- HOME is displayed on the left and AWAY on the right in both cards.
- All values are derived from the match JSON; changing the JSON updates every value without reload.
- Momentum uses only the current set; it resets at the start of each set.
- Window displays the last min(N, pointsInSet) points, oldest left, newest right, with left placeholders when k \< N.
- Percentages are integers summing to 100.
- Headline follows §6.4 thresholds exactly.
- Streak counts consecutive points across the whole current set, singular wording for 1 point.
- Undo / correction of a point immediately recomputes score, tiles, percentages and streak.
- Empty / not-enough-data states display 0 / NA in gray as defined in §6.6.
- No green / yellow / red colors are used in this section.
- Service ball appears under exactly one team, or none if unknown.

### 13. Test Cases

<table>
<tr>
<th>  
\#
</th>
<th>  
Input (current set sequence, oldest → newest)
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
H A H H A H H H (8 pts)
</td>
<td>  
6/2, 75/25, Avantage HOME, streak HOME 3
</td>
</tr>
<tr>
<td>  
T2
</td>
<td>  
20 pts ending … A A A A A H A A
</td>
<td>  
window = last 8 → 1/7, 13/87, Avantage AWAY, streak AWAY 2
</td>
</tr>
<tr>
<td>  
T3
</td>
<td>  
H A H A H A H A
</td>
<td>  
4/4, 50/50, Équilibré, streak AWAY 1 → Dernier point · AS Cannes
</td>
</tr>
<tr>
<td>  
T4
</td>
<td>  
H H A H A H A A
</td>
<td>  
4/4 → Équilibré
</td>
</tr>
<tr>
<td>  
T5
</td>
<td>  
H H H A A H H A
</td>
<td>  
5/3 (0.625) → Équilibré
</td>
</tr>
<tr>
<td>  
T6
</td>
<td>  
H H A (3 pts)
</td>
<td>  
NOT\_ENOUGH: NA headline/percent, counts 2/1 gray, 5 placeholders + 3 tiles, streak AWAY 1
</td>
</tr>
<tr>
<td>  
T7
</td>
<td>  
New set, 0 pts
</td>
<td>  
NEW\_SET state, 8 placeholders, streak —
</td>
</tr>
<tr>
<td>  
T8
</td>
<td>  
Last point undone in T1 → H A H H A H H
</td>
<td>  
7 pts: 5/2, 71/29, Avantage HOME (0.714), streak HOME 2
</td>
</tr>
<tr>
<td>  
T9
</td>
<td>  
Set 2 just ended 25:21
</td>
<td>  
Score 25:21, sets updated, FIN DU SET 2, momentum of set 2, pill SÉRIE FINALE
</td>
</tr>
<tr>
<td>  
T10
</td>
<td>  
No JSON loaded
</td>
<td>  
Full gray empty state, status AUCUN MATCH
</td>
</tr>
<tr>
<td>  
T11
</td>
<td>  
Percent rounding: 3/7 → 43/57
</td>
<td>  
Sum = 100
</td>
</tr>
<tr>
<td>  
T12
</td>
<td>  
Set 1 ends on HOME streak 4, set 2 first point AWAY
</td>
<td>  
Streak = AWAY 1 (no carry-over between sets)
</td>
</tr>
</table>


### 14. Future Enhancements (not to implement now)
- Weighting **break points** higher than side-outs in the momentum score (candidate for the Coach view).
- User-selectable window (5 / 8 / 12 points).
- Compact sticky score bar when scrolling the Live Timeline.