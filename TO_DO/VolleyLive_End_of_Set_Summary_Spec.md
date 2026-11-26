# VolleyLive – End-of-Set Summary (Coach View) – Implementation Spec

| | |
|---|---|
| **Feature** | End-of-Set Summary card ("Fin de set") |
| **Theme** | Coach View (dark blue) |
| **Reference mockup** | `VolleyLive_Fin_de_set_CoachView_v4.html` (approved visual reference, including the green/red colour logic) |
| **Language** | Spec in English, on-screen strings in French (see §14) |
| **Status** | Ready for implementation, with the open decisions listed in §17 |

---

## 1. Purpose

After a set ends, the coach gets one scrollable screen that answers four questions in under 30 seconds:

1. **How did the set go?** Score, side-out, break point, direct errors, longest runs.
2. **When did it turn?** Score-gap curve rally by rally, with timeouts and scoring runs.
3. **Who and where?** Points by cause, targeted receiver, best scorer, weakest and best rotation, per-player table.
4. **What do we change next set?** Up to 3 suggestions, rule-based, wording always "Piste" (a lead), never a certainty.

Everything shown is **derived from the match event log**. No value is typed in, estimated, or hard-coded. If the log cannot support a value, the card shows **NA**, never an invented number.

## 2. Scope

**In scope**
- One card per completed set, switchable between completed sets.
- All metrics, rules, layout, colours, states and interactions below.

**Out of scope (this version)**
- Match-level summary (belongs to MATCH REPORTS).
- Export / share of the card.
- Any suggestion not produced by the fixed rules in §8.
- Video markers, opponent scouting across matches, season trends.
- The removed ADVANCED STATISTICS section. Analyses stay reachable from COACH VIEW, SPECTATOR VIEW, MATCH REPORTS and the match library.

## 3. Entry points and navigation

| Trigger | Behaviour |
|---|---|
| Set ends (final point recorded) | **Open decision D1:** open automatically, or show a "Set summary" button. |
| COACH VIEW | Set selector opens the card for any completed set. |
| MATCH REPORTS / match library | Same card, read-only, for a past match. |

- **Back button (top-left, "‹ Retour")** and **"Fermer"** both close the card and return to the previous screen (capture screen during a live match).
- **Primary button "Set N+1 ▶"** closes the card and opens capture for the next set. If the set just completed is the last set of the match, the button reads **"Rapport de match ▶"** and opens the match report.
- Set switcher chips ("SET 1", "SET 2", ...) list **completed sets only**. The in-progress set is never selectable.
- The card is a **view**: nothing is written back to the match log.

## 4. Data inputs

### 4.1 Rally record (one per rally, in order)

```ts
type Team = 'US' | 'OPP';           // OPP is shown as the black "A" badge

type Cause =
  // rally won by US
  | 'ATTACK_KILL'      // K  attacking point            -> credited to attacker
  | 'ACE'              // S  service ace                -> credited to server
  | 'BLOCK'            // B  block point                -> credited to blocker
  | 'OPP_ERROR'        // E  unforced error by OPP      -> no player
  // rally won by OPP
  | 'OWN_ATTACK_ERROR' // a  our attack error           -> player at fault
  | 'OWN_SERVE_ERROR'  // s  our service error          -> player at fault
  | 'OWN_RECEPTION_ERROR' // r our reception error      -> receiver at fault
  | 'OPP_KILL'         // k  OPP attacking point        -> no player required
  | 'OPP_ACE'          // c  OPP ace                    -> receiver (gets ✕)
  | 'OPP_BLOCK';       // b  OPP block point            -> attacker optional

interface RallyRecord {
  index: number;                    // 1-based within the set
  winner: Team;
  server: Team;
  rotation: 1|2|3|4|5|6;            // OUR rotation (P1..P6) when the rally started
  cause: Cause;
  playerId?: string;                // per attribution rules above
  receiver?: {                      // required when server === 'OPP' (see §11)
    playerId: string;
    quality: '✓' | 'O' | '✕';
  };
}
```

Quality symbols match the capture status buttons (✓ / O / ✕). A reception error or an OPP ace **always** records the receiver quality as ✕.

### 4.2 Other inputs

```ts
interface TimeoutRecord { set: number; team: Team; afterRally: number; }
interface Player { id: string; number: number; role: 'S'|'OH'|'OPP'|'MB'|'L'; }
interface MatchSettings { timeoutsPerSet: number; }   // drives the "1/2" display
```

Set number, set score, and match sets score come from the match state.

## 5. Derived metrics

All definitions are on the **completed set only**. `N` = number of rallies in the set.

| Metric | Definition |
|---|---|
| **Score** | Points of US and OPP at the last rally. |
| **Side-out (SO)** | Rallies won by US where `server === 'OPP'` ÷ rallies where `server === 'OPP'`. Shown as `x/y` and %. |
| **Break point (BP)** | Rallies won by US where `server === 'US'` ÷ rallies where `server === 'US'`. |
| **Direct errors (Fautes directes)** | Count of rallies won by OPP with cause `a`, `s` or `r`. Shown as `errors / OPP points` and % of OPP points. **Blocked attacks (`b`) are not counted as our errors** (coaching convention; change only by explicit decision). |
| **Runs** | Maximal sequences of consecutive rallies won by the same team. **Série max** = longest run for US `+n` and for OPP `–n`. |
| **Score gap series** | `gap[0] = 0`; `gap[i] = gap[i-1] + 1` if US wins rally *i*, else `-1`. |
| **Points won by cause** | Counts of K, S, B, E (sum = US points). |
| **Points lost by cause** | Counts of own errors (a+s+r), k, c, b (sum = OPP points). |
| **Per-rotation net** | For each P1..P6: rallies won – rallies lost, plus SO and BP computed on that rotation only. |
| **Player points** | K + S + B credited to the player. |
| **Player errors** | a + s + r attributed to the player. |
| **Player receptions** | Count, with ✓ / O / ✕ breakdown, over rallies where `server === 'OPP'` and the player is the recorded receiver. |
| **Targeted receiver ("Qui est ciblé")** | Player with the most receptions. Share = player receptions ÷ all receptions recorded in the set. |
| **Best scorer ("Ce qui marche")** | Player with the most points (ties: lowest jersey number). Share = player points ÷ (US points – OPP errors `E`). |
| **Momentum** | Last 10 rallies (or fewer if N < 10): count won by US vs OPP. |

### 5.1 Rotation naming and attribution

- Rotations are named **P1 to P6** (same as Coach View). Each rally is attributed to the rotation recorded at the start of that rally.
- Production must use the real rotation from the log. (The mockup derives rotation from serve changes only, as a stand-in.)

### 5.2 Weakest and best rotation

- **Weakest:** lowest net, only if net < 0. Ties: lowest rotation number.
- **Best:** highest net, only if net > 0. Ties: lowest rotation number.
- If no rotation qualifies, the matching card shows "—" instead of a rotation.

## 6. Screen layout (top to bottom)

Single column, max width 1080 px, centred. Sections in this exact order:

| # | Section | Content |
|---|---|---|
| 1 | **Top bar** | Back button · logo "VOLLEY LIVE" · status pill "SET TERMINÉ" (green dot if set won, red if lost). |
| 2 | **Title block** | `Fin de set N.` (cyan full stop) · subtitle `Bilan du set · {N} rallys · prépare le set N+1`. |
| 3 | **Set switcher** | Pill buttons SET 1…SET n. Active = cyan fill. |
| 4 | **Score banner** | NOUS score (cyan) · "–" · black "A" badge + OPP score (white) · set info and timeouts (`SET 2 · SETS 1–1`, `TM : NOUS 1/2 · A 1/2`) · result label `SET GAGNÉ` (green) / `SET PERDU` (red). |
| 5 | **4 KPI cards** | Side-out · Break point · Fautes directes · Série max (see §7.1). |
| 6 | **Score-gap card** | Chart (§9) · rally scrubber · live detail line · legend · "Dynamique · 10 derniers points" row (§9.4). |
| 7 | **Points by cause** | Two cards: "Nous marquons" (green bars) and "A marque" (red bars). |
| 8 | **3 constats** | "Où on perd des points" · "Qui est ciblé" · "Ce qui marche". |
| 9 | **Rotation comparison** | Six bars P1..P6 + SO/BP text, then two cards "Meilleure rotation" / "À surveiller". |
| 10 | **Players table** | Points · Fautes · Réceptions per player. |
| 11 | **À retenir pour le set N+1** | Up to 3 numbered suggestions (§8). |
| 12 | **Actions** | "Fermer" (secondary, 1/3 width) · "Set N+1 ▶" (primary, 2/3 width, min height 70 px). |
| 13 | **Footer** | Integrity check (§13) · "Fin de set · VOLLEY LIVE". |

### 6.1 Section details

**Points by cause**
- "Nous marquons": Attaques ✓ (K) · Aces (S) · Blocs (B) · Fautes de A (E). Chip shows US points.
- "A marque": Nos fautes (a+s+r) · Attaques ✓ de A (k) · Aces de A (c) · Blocs de A (b). Chip shows OPP points.
- **Colour rule (validated):** every bar in "Nous marquons" is **green**; every bar in "A marque" is **red**. The "Nos fautes" *label* is light red `#ffb2b2`.
- Bar width = value ÷ max value of its own card (min 0 %).

**3 constats**
1. *Où on perd des points:* `errors / OPP points`, `fautes sur points perdus (x %)`, breakdown `Attaque a · Service s · Réception r`. Red accent.
2. *Qui est ciblé:* `#player · share %`, `n réceptions sur M services de A`, chips `✓ n` (green) `O n` (yellow) `✕ n` (red). Neutral accent.
3. *Ce qui marche:* `#player · n pts`, `x % de nos points hors fautes de A`, `A nous a donné {E} points par ses fautes`. Positive accent.

**Rotation comparison**
- Each row: `P#` · bar · signed net (`+2`, `0`, `-3`) · `SO … · BP …`.
- Bar width = `clamp(50 + net × 10, 8, 100) %`. Weakest row = yellow bar and yellow text; best row = cyan bar and cyan text; others = light blue.
- `SO` / `BP` show a percentage when the denominator ≥ 5, otherwise the raw fraction (`2/4`).

**Players table**
- Rows sorted by points desc, then jersey number asc. Only players with at least one attributed event are listed.
- Jersey bubble: 34 px circle with 3 px white border, fill by role (§10.2).
- Points in cyan, 17 px bold. Errors ≥ 3 in red.
- Réceptions: `n · ✓a Ob ✕c` (✓ cyan, O yellow, ✕ red), or `–` when none.
- At ≤ 520 px the Fautes and Réceptions columns are hidden (mockup behaviour, see D3).

## 7. Rules and thresholds

All numbers below live in **one configuration object** so they can be tuned without code changes.

### 7.1 KPI status dot (top-right of each KPI card)

| KPI | Strong (green) | Watch (yellow) | Critical (red) | Neutral (grey) |
|---|---|---|---|---|
| Side-out | ≥ 60 % | ≥ 45 % | < 45 % | denominator < 5 |
| Break point | ≥ 40 % | ≥ 25 % | < 25 % | denominator < 5 |
| Fautes directes (% of OPP points) | < 25 % | 25–39 % | ≥ 40 % | OPP points < 5 |
| Série max (longest OPP run) | ≤ 2 | 3 | ≥ 4 | n/a |

- Value colour: cyan by default; grey `#c4daf0` in Neutral state.
- **Sample rule:** when the denominator is below 5 the KPI value is **NA** (grey) and the sub-line shows the raw fraction (`2/4 quand A sert`).

### 7.2 Run bands on the chart

- OPP runs of **3 or more** and US runs of **4 or more** get a band (see §9.2).

### 7.3 Per-rotation display

- Percentages only if denominator ≥ 5, else fraction.

## 8. Suggestions engine ("À retenir pour le set N+1")

- Deterministic rules, evaluated **in this order**. The first **3** that fire are displayed, numbered 1–3.
- Each text starts with the fact, then `Piste :` and the lead. **Never** use imperative certainty ("you must").
- The **fallback** rule (#6) is always a candidate, last in order, so the section never appears empty when there is at least one US point.

| # | Condition | Text (FR) |
|---|---|---|
| 1 | Direct errors ≥ 40 % of OPP points | `Fautes : {n} des {OPP} points perdus ({x} %). Piste : réduire les fautes d'{attaque|service|réception}.` The type is the largest of a / s / r (ties: attaque, then service). |
| 2 | Weakest rotation exists and its net ≤ –2 | `P{k} : {w}–{l}, la plus faible du set. Piste : revoir l'organisation en P{k}.` |
| 3 | Targeted receiver share ≥ 40 % | `#{p} reçoit {x} % des services. Piste : l'aider ou ajuster la réception.` |
| 4 | Longest OPP run ≥ 4 | `A a pris {n} points d'affilée. Piste : anticiper le temps mort.` |
| 5 | Best scorer share ≥ 40 % of (US points – E) | `#{p} porte {x} % de nos points hors fautes de A. Piste : varier les solutions d'attaque.` |
| 6 (fallback) | Always | `#{p} : {n} points marqués. Piste : le solliciter dans les moments clés.` |

Section header: `À RETENIR POUR LE SET N+1 · PISTES, PAS CERTITUDES`.

## 9. Score-gap chart

### 9.1 Geometry
- SVG, `viewBox 0 0 640 214`, width 100 %, margins: left 30, right 10, top 22, bottom 22.
- X axis: rally index `0..N`. Labels every 10th rally showing the score at that rally (`11–9`).
- Y axis: symmetric around 0, range `±M`, with `M = max(6, maxLead, maxDeficit)` rounded **up to an even number**. Grid lines at `±M`, `±M/2`, `0`. Zero line 1.6 px, others 0.7 px dashed `#245b80`.

### 9.2 Rendering
- **Area above 0 = green** `#19edba`, vertical gradient from opacity 0.30 at the zero line to 0.80 at the top.
- **Area below 0 = red** `#ff5a5a`, gradient from 0.35 at the zero line to 0.90 at the bottom.
- **Curve:** white `#f5f9ff`, 2.4 px, round joins.
- **Run bands:** white overlay at 5 % opacity over the run's x-range + 3 px cap on top in the run colour (green for US, red for OPP) + label (`A 3–0` in red, `4–0` in green) just under the cap. Bands must **never** tint the green/red areas.
- **Timeouts:** vertical dashed line (1.5 px) at the rally index + pill label on top. US = gold `#ffc31a` with text `TM nous`; OPP = `#a8c5e5` with text `TM A`. Pill text colour `#031a36`.
- **Cursor:** vertical white line (80 % opacity) + 5 px circle (cyan fill, white 2 px stroke) at the scrubber position.

### 9.3 Scrubber
- Range input `0..N` under the chart, label "Rally".
- Detail line (live region): `Rally {i} · {us}–{op} · service {nous|A} · P{k} · {Point pour nous|Point pour A} · {cause}[ #player]`. For `c` and `r`, show `(récep. #p)` instead.
- Rally 0 shows `Début du set · 0–0`.
- Default position on open: the first US timeout; if none, the first OPP timeout; if none, the last rally.
- Legend: `Vert : nous menons. Rouge : nous sommes derrière. Repères en haut : séries de 3 points et plus pour A, de 4 points et plus pour nous.`

### 9.4 "Dynamique · 10 derniers points"
- Row of up to 10 circles (32 px), oldest on the left.
- **Point for US = green `#19edba` with "N"; point for OPP = red `#ff6b6b` with "A"**; text colour `#031a36` on both.
- Right-hand counters: `Nous {n}` in green and `A {m}` in red, separated by "·".

## 10. Visual design (Coach View tokens)

### 10.1 Colours

| Token | Value | Use |
|---|---|---|
| `bg` | gradient `#02182f → #042746 → #031b34` + radial cyan glow top-right (`rgba(0,183,236,.18)`) | Page |
| `line` | `#0f7fb0` | Card and banner borders |
| `card` | gradient `rgba(7,47,82,.96) → rgba(4,34,61,.98)` | Cards |
| `cyan` | `#12d7f2` | Brand, US score, primary button, active chip, KPI values |
| `green` | `#19edba` | **Points for US**, strong status, set won |
| `red` | `#ff6b6b` | **Points for OPP**, errors, critical status, set lost |
| `yellow` | `#ffc31a` | Watch status, weakest rotation, O quality, US timeout |
| `text` / `muted` | `#f5f9ff` / `#a8c5e5` | Text |
| `ink` | `#031a36` | Text on bright fills |
| `A badge` | `#000` fill, white text, 1 px `rgba(255,255,255,.35)` border | Opponent badge, always |

**Colour rule that must hold everywhere:** *points scored by us are green, points scored by the opponent are red.* This applies to the gap chart areas, run bands, momentum dots and counters, and both cause-bar cards.

### 10.2 Role colours (player bubbles)

| Role | Fill |
|---|---|
| S | `#f5dc84` |
| OH | `#f2a3a3` |
| OPP | `#9ac7ed` |
| MB | `#9ed9ad` |
| L | `#cdd3d7` |

### 10.3 Typography
- System stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`.
- Title `clamp(30px, 6vw, 48px)` weight 950, letter-spacing –0.045em. Score banner numbers `clamp(28px, 6vw, 42px)`. KPI value `clamp(25px, 5vw, 41px)`. Body 13–14 px. Notes 11–12 px.

## 11. States and edge cases

| Case | Behaviour |
|---|---|
| Receiver missing on an OPP-served rally | Rally still counts for SO/score. It is excluded from reception counts; the "Qui est ciblé" denominator uses recorded receptions only. |
| Fewer than 5 recorded receptions | "Qui est ciblé" shows NA and no suggestion #3 fires. |
| Denominator < 5 for a KPI | NA (grey), fraction in sub-line (§7.1). |
| No timeout in the set | No timeout lines; counter reads `TM : NOUS 0/2 · A 0/2`; scrubber default per §9.3. |
| Set of fewer than 10 rallies | Momentum row shows all rallies. |
| No weakest / best rotation | "Meilleure rotation" or "À surveiller" card shows "—". |
| Set switched while scrubbing | Card re-renders; cursor resets to the default position of the new set. |
| Log inconsistent | Footer shows `✕` and a warning chip "Données incohérentes" (see §13). Values stay visible. |
| Match not finished and set in progress | Card not available for that set. |

## 12. Interactions

| Control | Action |
|---|---|
| Set chips | Switch displayed set. |
| Scrubber (drag, tap, keyboard arrows) | Move cursor, update detail line. |
| Hover on player row (pointer devices) | Cyan gradient highlight + 3 px left cyan bar. |
| "‹ Retour" / "Fermer" | Close the card. |
| "Set N+1 ▶" / "Rapport de match ▶" | See §3. |

No animation is required. If any is added it must respect `prefers-reduced-motion`.

## 13. Data integrity check (footer)

Computed on every render:

```
Σ won causes (K+S+B+E)            == US points
Σ lost causes (a+s+r+k+c+b)        == OPP points
Σ rotation wins                    == US points
Σ rotation losses                  == OPP points
(rallies with server OPP) + (rallies with server US) == N
```

Footer text: `Contrôle : {us} + {op} = {N} rallys · causes, rotations et services cohérents ✓` (or `✕` with the warning chip on failure).

## 14. UI strings (FR)

| Key | String |
|---|---|
| Title | `Fin de set {n}.` |
| Subtitle | `Bilan du set · {N} rallys · prépare le set {n+1}` |
| Status pill | `SET TERMINÉ` |
| Result | `SET GAGNÉ` / `SET PERDU` |
| KPI titles | `Side-out`, `Break point`, `Fautes directes`, `Série max` |
| KPI sub-lines | `{x}/{y} quand A sert`, `{x}/{y} quand on sert`, `{p} % des points perdus`, `nous / A` |
| Chart | `Écart de score` · chip `RALLY PAR RALLY` |
| Cause cards | `Nous marquons` · `A marque` |
| Constats header | `3 CONSTATS DU SET` |
| Rotations | `Comparaison des rotations` · `Rallys gagnés – perdus · side-out (SO) et break point (BP)` · `Meilleure rotation` · `À surveiller` |
| Players | `Joueurs` · columns `Joueur`, `Points`, `Fautes`, `Réceptions` · note `Points = attaques ✓, aces et blocs. Fautes = attaque, service et réception.` |
| Notes | `Sous 5 rallys, la case affiche la fraction brute.` |

## 15. Responsive and accessibility

### 15.1 Breakpoints
- **≤ 780 px:** score banner collapses to NOUS · – · A with info below; KPIs 2 × 2; "3 constats" stacks to one column.
- **≤ 520 px:** back button becomes an icon-only "‹" (44 px); cause cards stack; momentum counters move below the dots; rotation SO/BP text wraps to a second line; Fautes and Réceptions columns hidden; actions stack full width.
- No horizontal page scroll at 320 px. Dots and set chips may scroll horizontally inside their own row.

### 15.2 Accessibility
- Colour is never the only signal: dots carry "N"/"A", run bands carry text, quality chips carry ✓ / O / ✕, nets carry a sign.
- Tap targets ≥ 44 px (primary button 70 px).
- Visible focus ring (3 px white, 3 px offset) on every control.
- Detail line is `aria-live="polite"`. Chart has `role="img"` with an aria-label "Écart de score rally par rally"; the scrubber has an aria-label.
- Text contrast ≥ 4.5:1 on card backgrounds (muted text `#a8c5e5` on `#073054` meets this).
- Honour `prefers-reduced-motion`.

### 15.3 Performance
- Computation is local, from the in-memory log, and must complete in < 50 ms for a 100-rally set. No network call.

## 16. Acceptance criteria

1. All metrics in §5 are recomputed from the rally log; changing one rally in the log changes the dependent values.
2. Every bar in "Nous marquons" is green and every bar in "A marque" is red. Momentum dots and counters, chart areas and run bands follow the same US-green / OPP-red rule.
3. Chart green and red areas remain clearly visible when a run band is shown on top (bands never tint them).
4. KPI status dots and NA behaviour match §7.1 at the boundary values (59 / 60, 44 / 45, 39 / 40, 24 / 25 %).
5. At most 3 suggestions, in the order of §8, always worded as "Piste".
6. Switching sets re-renders every section and resets the scrubber.
7. Footer integrity check shows ✓ on both fixtures in §18 and ✕ when a fixture is deliberately corrupted.
8. No horizontal page scroll at 320, 390, 820 and 1080 px.
9. The black "A" badge is used for the opponent everywhere on the card.
10. Close, back, set switch and "Set N+1 ▶" behave as in §3.

## 17. Open decisions

| ID | Question | Default until decided |
|---|---|---|
| **D1** | Open the card automatically at set end, or show a button? | Button. |
| **D2** | Keep the rotation block on this card, or move it to a dedicated side-out / break view? | Keep on the card. |
| **D3** | Hide Fautes and Réceptions columns on phones, or replace with an expandable row? | Hide (as in mockup). |
| **D4** | Should blocked attacks (`b`) count as our direct errors? | No (§5). |
| **D5** | Final thresholds (§7, §8). | Values in this spec; kept in configuration. |

## 18. Test fixtures

Fixtures are the two sets used by the mockup. Player numbers and roles are **invented demonstration data**; no value comes from a real match.

### 18.1 Log encoding

One token per rally, in order:

```
[W|L] [cause letter] [playerId?] [x | @receiverId + quality(v=✓, o=O)]
W = won by US, L = won by OPP
cause letters: K S B E (US win) · a s r k c b (OPP win)
"x" after a player id (for c, r) = that player is the receiver and quality is ✕
"@9v" = OPP served, receiver #9, quality ✓
First server in each set: OPP. Rotation starts at P1 and advances after each side-out.
```

Timeouts: Set 1: US after rally 9, A after rally 24. Set 2: US after rally 11, A after rally 31.

### 18.2 Set 1 log (21–25, 46 rallies)

```
Lk@5o Lk@5v WK9@9o Lk WK9@5o WS12 Ls12 Lc2x Lc9x WK9@2o Lk La9@2o WK14@5o WK12 Ls5 WK9@2v Ls14 Lk@5v La14@9v WB12@9o La12 WE@9v WK12 Lk Lr2x WE@5v La7 WE@5o WK12 WS7 La7 Lc2x WK12@9o Ls5 WE@5o Lk Lr5x WE@2v WE La5 WB14@5v Lk WK9@5v Lb Lk@5v WK9@2v
```

### 18.3 Set 2 log (25–21, 46 rallies)

```
Lc5x Lc2x WK9@2v Ls9 WK9@5v WK9 Ls12 WB7@5v Lk Lk@9o Lc2x WE@9v WS5 WB12 WS5 La12 WK7@2o WK9 La5 WK9@5v WK14 Lk WK9@5o Ls9 WK12@2o WK5 Lk WE@5o La12 WE@2v WS5 Lk Lr9x WB7@9o Lk WE@5o WK9 Lk Lr9x WE@5o La7 WE@5v Lk WK12@2o Lb WK9@5v
```

### 18.4 Expected values

| Value | Set 1 | Set 2 |
|---|---|---|
| Score / result | 21–25, SET PERDU | 25–21, SET GAGNÉ |
| Sets score | 0–1 | 1–1 |
| Side-out | 58 % (15/26) | 73 % (16/22) |
| Break point | 30 % (6/20) | 38 % (9/24) |
| Direct errors | 12 / 25 (48 %) · attack 6, serve 4, reception 2 | 9 / 21 (43 %) · attack 4, serve 3, reception 2 |
| Longest runs (US / OPP) | +3 / –3 | +4 / –3 |
| Points won by cause | K 11 · S 2 · B 2 · E 6 | K 13 · S 3 · B 3 · E 6 |
| Points lost by cause | own errors 12 · k 9 · c 3 · b 1 | own errors 9 · k 8 · c 3 · b 1 |
| Targeted receiver | #5 · 46 % (12 of 26) · ✓6 O5 ✕1 | #5 · 45 % (10 of 22) · ✓5 O4 ✕1 |
| Best scorer | #9 · 6 pts · 40 % | #9 · 8 pts · 42 % |
| Rotation net P1..P6 | 0, 0, –2, 0, +1, –3 | 0, 0, +2, –2, +3, +1 |
| Rotation SO / BP strings | P1 60 % / 1/3 · P2 3/4 / 1/4 · P3 50 % / 1/4 · P4 2/4 / 2/4 · P5 2/2 / 1/3 · P6 40 % / 0/2 | P1 50 % / 2/4 · P2 3/3 / 0/3 · P3 3/3 / 40 % · P4 60 % / 0/3 · P5 2/3 / 67 % · P6 2/2 / 1/3 |
| Best / weakest rotation | P5 (3–2) / P6 (2–5) | P5 (6–3) / P4 (3–5) |
| Momentum (last 10) | N: 5 · A: 5 | N: 5 · A: 5 |
| Suggestions (in order) | 1. errors 48 % (attaque) · 2. P6 2–5 · 3. #5 receives 46 % | 1. errors 43 % (attaque) · 2. P4 3–5 · 3. #5 receives 45 % |
| Integrity footer | `21 + 25 = 46 rallys … ✓` | `25 + 21 = 46 rallys … ✓` |

Players (points · errors · receptions):

| Set 1 | Set 2 |
|---|---|
| #9 OH 6 · 1 · 6 (✓2 O3 ✕1) | #9 OH 8 · 4 · 5 (✓1 O2 ✕2) |
| #12 OPP 6 · 2 · – | #5 OH 4 · 1 · 10 (✓5 O4 ✕1) |
| #14 MB 2 · 2 · – | #7 MB 3 · 1 · – |
| #7 MB 1 · 2 · – | #12 OPP 3 · 3 · – |
| #2 L 0 · 1 · 8 (✓3 O2 ✕3) | #14 MB 1 · 0 · – |
| #5 OH 0 · 4 · 12 (✓6 O5 ✕1) | #2 L 0 · 0 · 7 (✓2 O3 ✕2) |

## 19. Known differences between the mockup and this spec

The mockup is a visual and logic reference. Where it differs, **this spec wins**:

| Topic | Mockup | Spec |
|---|---|---|
| Rotation per rally | Derived from serve changes only | Real rotation from the log (§5.1) |
| KPI with denominator < 5 | Shows the % in grey | Shows **NA** in grey with the fraction (§7.1) |
| "Meilleure rotation" when no positive net | Shows P1 | Shows "—" (§5.2) |
| Timeout counter | Fixed `1/2` | From the log and `MatchSettings` |
| Timeout positions, set scores | Hard-coded per fixture | From the log |
| Last-set button | "Set N+1 ▶" | "Rapport de match ▶" (§3) |
| Integrity failure | `✕` in footer only | `✕` plus "Données incohérentes" chip (§11) |
| Player numbers and roles | Invented | From the team roster |

## 20. Out of scope for this card, noted for later

- Live "series alert" banner and timeout suggestion during play (separate feature).
- Per-player shareable card.
- Opponent profile across matches.
