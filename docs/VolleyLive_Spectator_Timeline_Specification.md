# VolleyLive — Spectator View LIVE TIMELINE Specification

Status: current as of v1.28.0 (timeline geometry last changed in v1.26.1). Source of truth: `spectator.js` (`modelV2`, `modelV1`, `terminalV2`, `visibleRows`, `renderRow`, `eventCard`, `render`), `spectator.html` (`[data-panel="live-timeline"]`, shared `.spectator-livebar`), `spectator.css` (timeline rules and `@media` blocks), `statistics/adapter.js` (validation, format detection, fault detection).
Acceptance tests: `tests/spectator/test_timeline.py`, `tests/spectator/test_timeline_update.py`, `tests/spectator/test_timeline_layout.py`, `tests/spectator/test_timeline_alignment.py`, `tests/spectator/test_live_graph.py`, `tests/spectator/test_compact_score_delta.py`, `tests/spectator/test_set_navigation.py`, `tests/spectator/test_reference_capture.py`.
Visual baselines: `tests/visual_baselines/timeline_{1536x1024,1024x768,412x915}_v1_26_1.png`, `away_alignment_{1536x1024,1024x768,412x915}_v1_26_1.png`, `compact_timeline_{1536x1024,1024x768,844x390,390x844}_v1_26_1.png`.
Related: `VolleyLive_Spectator_Ranking_Specification.md`, `VolleyLive_Score_Fault_Evolution_View_Specification_v1.0.md` (GRAPH tab), `VolleyLive_Live_Header_Momentum_Spec.md` (SCORES tab), `VolleyLive_Match_Library_Specification.md` (entry point).
Consolidates and supersedes (archived in `archive/superseded-specs/`): `Live_Timeline_Spectator_View_Spec.md` (v1.0 draft), `LIVE_TIMELINE_UPDATE_v1.16.0.md`, `LIVE_TIMELINE_LAYOUT_v1.16.1.md`, `LIVE_TIMELINE_ALIGNMENT_v1.16.2.md`, `LIVE_TIMELINE_HOME_LEFT_v1.18.1.md`; also the timeline parts of `LIVE_GRAPH_UPDATE_v1.17.0.md` (items 1–5) and `LIVE_SCORE_MOMENTUM_PLACEMENT_v1.19.1.md` (“LIVE TIMELINE” section). Where those documents conflict with this one, this document and the code win (see §13).

## 1. Purpose

LIVE TIMELINE (tab label `TIMELINE`) is the **narrative, read-only** view of the Spectator View. It shows one row per completed rally of the selected set: the score after the rally, who scored, whether it was a side-out or a break point, the deciding HOME player/action or the AWAY outcome, and which team leads by how much. It contains no statistics, no score card and no momentum card, and it never writes match data.

## 2. Entry, navigation and data source

- Spectator View is opened from MATCH LIBRARY (`Spectator` action; INSIGHTS → `SPECTATOR VIEW` opens the library in spectator mode). The library writes the raw document to `localStorage['volleySpectator.archive.v1']` and navigates to `spectator.html#live-score`.
- Tabs, in order: `⌂` (link to `index.html`), `SCORES` (`live-score`), `TIMELINE` (`live-timeline`), `GRAPH` (`live-graph`), `RANKING` (`ranking`). Without a recognised hash (`#live-score`, `#live-graph`, `#ranking`) the TIMELINE tab is active by default; activating a tab writes its name to `location.hash`.
- Accepted documents: unified v2.1 (`VolleyStatsAdapter.detectFormat` → `unified-v2`) and capture v1. Every document is validated by `VolleyStatsAdapter.validate`; an invalid archive hides the app and shows `#fatal` (`Archive indisponible` + the validation message, e.g. `Format non reconnu`).
- No archive → empty model (`AUCUN MATCH`, §8).
- Live refresh: a `storage` event on `volleySpectator.archive.v1` (another tab rewrote the archive) rebuilds the model for the currently selected set and re-renders. `window.VolleySpectator.setArchive(doc)` (validate, store, rebuild on the live set) and `VolleySpectator.refresh()` do the same programmatically. Undo/correction therefore appears as soon as a corrected archive is stored.
- Everything displayed is derived from the loaded JSON; no value is typed, hard-coded or invented. Team names in the timeline header are the literal labels `HOME` and `AWAY`.

## 3. Screen layout

| Zone | Element / ID | Content |
|---|---|---|
| Header | `.spectator-header` | VolleyLive brand (link to `index.html`); `#archiveBadge` (visually hidden) = `LIVE` or `TERMINÉ` |
| Navigation | `.spectator-nav` | Tabs of §2; active tab has `aria-selected="true"` |
| Set bar (shared) | `.spectator-livebar` | `Set` → `#evolutionSet`; `#liveSetStatus` (`role=status`); `#returnToLive` `Retour au direct` |
| Filter bar | `.timeline-filterbar` | `En haut` segmented control; `Nombre d’actions` → `#windowSize` |
| Board | `.timeline-board` | Title, list, empty/warning messages, footer; owns horizontal scrolling |
| Title | `.timeline-title` | `#homeName` = `HOME` (left), centre block, `#awayName` = `AWAY` (right) |
| Centre block | `#timelineSet`, `p`, `#timelineOrder` | `SET <n> · Fil du match` (or `AUCUN MATCH · Fil du match`); `Score : HOME — AWAY`; `Ancien → récent` / `Récent → ancien` |
| Column guide | `.timeline-columns` (`aria-hidden`) | Legacy decorative guide, `display: none` |
| List | `#timelineList.timeline-list` (`aria-live="polite"`) | One `.tl-row` per visible rally (§5) |
| Empty | `#timelineEmpty` | `Le set n’a pas encore commencé` or `Aucun match chargé` |
| Warning | `#timelineWarning` | Data-validation warnings joined by spaces (§7.3) |
| Footer | `.timeline-footer` | `.replay-status`: amber dot + `REPLAY D’ARCHIVE` (always; there is no `Suivi en direct` pill) |

The TIMELINE panel contains no `#liveScoreboard` and no `#momentumCard`; those belong to SCORES only.

### 3.1 Title geometry

- Grid `minmax(180px, 1fr) 260px minmax(180px, 1fr)`, gap 12 px (≤ 1100 px: `minmax(160px, 1fr) 230px minmax(160px, 1fr)`, gap 8 px).
- `#homeName` and `#awayName` are equal boxes, each 50 % of its column, `justify-self: center`, min height 34 px. At 1536×1024 each box is 18–22 % of the title width and both widths are equal within 1 px.
- `#homeName` is always left of `#awayName`; names are never replaced by `model.homeName` / `model.awayName`.

## 4. Filters and set navigation

### 4.1 `En haut` — display order

| Button | `data-order` | Rows top → bottom | `#timelineOrder` |
|---|---|---|---|
| `Plus anciennes` (default) | `oldestFirst` | oldest → newest | `Ancien → récent` |
| `Plus récentes` | `newestFirst` | newest → oldest | `Récent → ancien` |

The active button has class `active` (cyan fill `#0daed0`) and `aria-pressed="true"`; the other has `aria-pressed="false"`. Changing the order only reverses the displayed rows; data are unchanged.

### 4.2 `Nombre d’actions` — window size

`#windowSize` options: `5` (default), `10`, `11`, `20`, `all` (`Tout le set`). The window is always the **N most recent** rallies of the selected set (all of them when fewer than N exist, never placeholder rows); the order control only changes direction.

### 4.3 Persistence and sharing

| Preference | Storage key | Values | Fallback |
|---|---|---|---|
| Order | `localStorage['volleySpectator.timeline.order']` | `oldestFirst`, `newestFirst` | `oldestFirst` |
| Window | `localStorage['volleySpectator.timeline.window']` | `5`, `10`, `11`, `20`, `all` | `5` |

Both preferences are shared with the GRAPH tab (`[data-graph-order]`, `#graphWindowSize`): changing either control updates both tabs. They are restored on reload and are local to the device.

### 4.4 Shared set selector

- `#evolutionSet` lists every set present in `sets[]`/`rallies[]` (v2.1) or in the events (v1), plus the live set; it is disabled when no set exists. It defaults to the **live set** (`match.currentSetNumber` for v2.1, `match.currentSet` for v1, else the last set with data).
- `#liveSetStatus`: `DIRECT · SET <live>` (green) when the live set is shown; `REPLAY · SET <n>` (amber, class `is-replay`) for another set; `AUCUN MATCH` without archive.
- `#returnToLive` is visible only in replay; it reloads the live set and scrolls the active panel into view (`smooth`, `auto` under reduced motion).
- The selected set drives every tab (SCORES, TIMELINE, GRAPH, RANKING). It is not persisted: a reload always returns to the live set.

## 5. Rally row

### 5.1 Horizontal order (HOME left, AWAY right)

`HOME event card | HOME connector | HOME delta | score pill (HOME : AWAY) | AWAY delta | AWAY connector | A marker`

| Part | Element | Rule |
|---|---|---|
| HOME side | `.timeline-side.home` (460 px track, content packed towards the score) | `.event-slot.home-slot` → `.timeline-connector.home` → `.delta-lane.home` |
| Score node | `.score-node` (156 px track) | `.rally-caption`, `.score-pill`, optional `.last-point`, optional `.invalid-note` |
| AWAY side | `.timeline-side.away` (460 px track, content packed towards the score) | `.delta-lane.away` → `.timeline-connector.away` → `.event-slot.away-slot` |

- Row grid: `460px 156px 460px`, centred; row min height 100 px (measured ≤ 105 px). `.timeline-list` is 1100 px wide (min 100 % of the board).
- The score-node centre (spine) is at 49–51 % of the board width at 1536×1024.
- Adjacent parts touch: card right = HOME connector left; HOME connector right = HOME delta left (or score left when there is no HOME delta); HOME delta right = score left; score right = AWAY delta left (or AWAY connector left); AWAY connector right = A-marker left. Tolerance 1 px; there is **no** extra gap.
- Connectors are fixed **40 px** wide, 2 px high, cyan `#22d3ee` with glow, at every viewport. Both connectors of a row are always laid out (the one without an event is `visibility: hidden`), so HOME and AWAY connectors are always equal.
- Delta lanes are `display: none` when empty; the connector then abuts the score pill. Consequently the X position of A markers (and HOME cards) is constant across rows that show a delta bar on that side and moves 38 px towards the score on rows without one.
- Event card, A marker, connectors, delta bars and score pill share the score pill’s vertical centre (tolerance 1 px).

### 5.2 Score node

| Element | Rule |
|---|---|
| Spine | `.score-node::before`: 2 px cyan vertical line, 56 px above and below the 50 px node, drawn under the pill; consecutive rows form a continuous spine |
| Rally caption | `Rallye <N>` (`N` = `rallyNumber` from v2.1, or the closed-rally ordinal within the set for v1); 82×21 px tab attached to the top of the pill (overlaps it by 2 px), narrower than the pill |
| Score pill | `.score-pill`: full width of the 156 px track (≥ 148 px), 50 px high, grid `1fr 18px 1fr`; `.score-half.home` (left) `:` `.score-half.away` (right); score **after** the rally; 25 px digits, weight 1000; background `#05070b` |
| Accent | Exactly one half is coloured: the half of the team that won the rally (`.score-accent`). The other half stays black |
| Latest | The last rally of the selected set: `.score-pill.latest` (2 px cyan outline, 3 px offset, glow) and `DERNIER POINT` label below the pill; with `Plus récentes` the label is placed above the rally caption |
| Invalid | Row class `invalid-row` (amber dashed outline), `data-valid="false"`, note `DONNÉE À VÉRIFIER` under the pill |

Score accent colours (`data-score-accent`):

| Phase (`data-code`) | Winner | Accent | Background / text |
|---|---|---|---|
| `SO` (side-out: winner ≠ serving team) | HOME or AWAY | `so` | yellow `#ffd43b` / `#352a00` |
| `BP` (break point: winner = serving team) | HOME | `bp-home` | green `#18b85a` / `#001f0d` |
| `BP` | AWAY | `bp-away` | red `#d90429` / `#ffffff` |

- SO/BP is computed for the **winning team** (not from HOME’s point of view). There is no `L` code and no SO/BP/L chip, badge or legend (`.chip` never exists).
- Serving team: v2.1 uses each rally’s recorded `servingTeamId`; v1 starts with `match.firstRally.antibesState` (`service` → HOME serves, otherwise AWAY) and then gives service to the previous rally winner. If a v2.1 rally has no resolvable serving team, `data-code` is `null` and the winner half uses its BP colour.
- Row attributes: `data-rally`, `data-code`, `data-winner` (`HOME`/`AWAY`), `data-score-accent`, `data-valid`.

### 5.3 Delta bars

| Property | HOME leads (`home > away`) | AWAY leads (`away > home`) | Tie |
|---|---|---|---|
| Lane | `.delta-lane.home`, immediately left of the score | `.delta-lane.away`, immediately right of the score | none (no bar) |
| Bar | `.delta-bar.home`, green `#18b85a`, flat edge against the score | `.delta-bar.away`, red `#d90429`, flat edge against the score | — |
| Label | `.delta-badge` `+N`, N = abs(away − home) | same | — |

- Bars have a **fixed** size of 38×28 px whatever N (no inline width style, no proportional scale); the badge is at least 38×28 px, white bold tabular digits, contrast ≥ 4.5:1.
- Only one lane is filled per row.
- Maximum gap: when N > 0 equals the largest N among the **visible** rows, the bar gets `.max-gap` (2 px dotted outline, 3 px offset) and its label ends with `, écart maximum du set`.
- Accessibility: `role="img"`, `aria-label="<HOME|AWAY> mène de N points[, écart maximum du set]"`; tooltip `title="<HOME|AWAY> +N (<away>–<home>)"`.

### 5.4 Event cards (one terminal event per rally, at most)

**HOME** (`article.event-card.home.<outcome>`, inside `.home-slot`):

| Element | Rule |
|---|---|
| Card | Content-sized (`max-content`, equal to its slot), min height 72 px, padding 8 px 14 px (8 px at ≤ 1100 px), gap 12 px between avatar and copy; `title` = full player name |
| Avatar | 62 px circle (52 px at ≤ 1100 px), 3 px white border, jersey number (23 px) over role abbreviation (`SET`, `OPP`, `OH`, `MB`, `LIB`; `—` when unknown) |
| Role colours | `OPP` `#4fa8e8`, `SET` `#f2c94c`, `OH` `#eb6f7a`, `MB` `#63c985`, `LIB` `#9aa5b1`, unknown `#d7e4ee`, each with a dark text colour giving ≥ 4.5:1 contrast |
| Name | `.event-name`: full name, 16 px weight 900, single line, `overflow: visible`, `text-overflow: clip` — never truncated |
| Action | `.home-action.<outcome>`: skill label only (no qualifier, no ✓/× icon) — `SERVICE`, `ATTAQUE`, `CONTRE`, `RÉCEPTION`, `DÉFENSE`, `PASSE`, `RELANCE`, otherwise the raw skill upper-cased with `_` → space |
| Outcome colours | `point` green (`#146c3a` / border `#37d472`), `error` red (`#9f1f2d` / `#ff626b`), `neutral` blue (`#125f91` / `#4aa9ec`) |

HOME outcome = normalised evaluation/result (`POINT/KILL/ACE/WIN…` → point, `ERROR/FAULT/OUT/NET…` → error, `NEUTRAL/CONTINUE…` → neutral); when it is not recognised, it is `point` if HOME won the rally, else `error`. A missing player shows `Joueur HOME`, number `—`, role `—`.

**AWAY** (`.away-marker.<point|error>`, inside `.away-slot`): a 58 px circle containing only `A`, 3 px white border. Green (`point`) when the AWAY terminal action won the rally; red (`error`) when it was an AWAY fault that gave the point to HOME. No AWAY card, name, skill, qualifier or icon. `role="img"`, `aria-label` = `AWAY, action marquant le point` or `AWAY, faute donnant le point à HOME`.

## 6. Derivation rules

### 6.1 Rallies

| Format | Rallies shown | Score |
|---|---|---|
| v2.1 | `rallies[]` of the selected set that are not voided and have a `winnerTeamId`, sorted by `setNumber` then `rallyNumber` | `scoreAfter.our` (HOME) / `scoreAfter.opponent` (AWAY), missing → 0 |
| v1 | Events of the selected set grouped into rallies; a rally closes on the event with `winningTeam` `team1` (HOME) or `team2` (AWAY); only closed rallies are shown | `scoreA` (HOME) / `scoreB` (AWAY) of the rally’s last event |

Voided means `cancelled === true`, `undone === true` or `status` `VOIDED` / `CANCELLED` / `UNDONE`. HOME is the team `match.ourTeamId` (else `side: OUR`, else `teams[0]`); AWAY is `match.opponentTeamId` (else `side: OPPONENT`, else `teams[1]`).

### 6.2 Terminal event

- v2.1: the rally’s `terminalEventId` if present and not voided; otherwise the last non-voided `ACTION` event of the rally (by `sequenceNumber`) whose evaluation is `POINT/ERROR/FAULT/ACE/KILL/NEUTRAL/CONTINUE` or that has `winnerTeamId`; otherwise the last action. An event whose team is neither HOME nor AWAY yields no card.
- v1: the closing event; it is AWAY when `player === 'A'` or `action === 'adverse'`, otherwise HOME (player looked up by jersey number in `match.team.roster`).
- **Basic / score-only data shows no card or marker** (score pill, accent and delta only): `match.detailLevel === 'basic'`, a `GENERIC` or `TEAM` skill (v2.1), or `action: generic` / `player: 'T'` (v1).

### 6.3 Visible rows

`rows = last N rallies of the selected set` (all with `all`), reversed for `newestFirst`; `maxGap = max(abs(away − home))` over these rows. DERNIER POINT marks the last rally of the set, which is always inside the window.

## 7. States and edge cases

| Situation | Behaviour |
|---|---|
| No archive | Title `AUCUN MATCH · Fil du match`; `#timelineEmpty` = `Aucun match chargé`; set selector disabled; status `AUCUN MATCH` |
| Set without completed rally | `#timelineEmpty` = `Le set n’a pas encore commencé`; no rows |
| Fewer rallies than N | All existing rallies, no placeholders |
| New set / live set change | The live set becomes the default selection on load; the timeline shows `Rallye` rows of that set only |
| Undo / correction in the stored archive | Rows, accents, deltas, cards and DERNIER POINT are recomputed from the new document |
| Match finished (`COMPLETED`, `FINISHED`, `ENDED`, `CLOSED`) | `#archiveBadge` = `TERMINÉ`; filters remain available |
| Tie | No delta bar |
| Long player name | Displayed in full on one line; the board scrolls horizontally if needed |
| Invalid archive | Fatal screen (§2) |

### 7.1 Row entry animation

New rows fade in with an 8 px downward slide over 200 ms (`rowIn`); disabled under `prefers-reduced-motion: reduce`.

### 7.2 Validation (v2.1 only)

A terminal `SERVICE`/`SERVE` event whose team is not the rally’s serving team marks the row invalid (§5.2) and adds `Rallye <N> : action de service rejetée pour l’équipe non au service.` to `#timelineWarning`. The row is still displayed with the available data. No other consistency checks (score + 1, single terminal action, serving continuity) are performed by the view.

### 7.3 Warning area

`#timelineWarning` is hidden when there is no warning.

## 8. Responsive behaviour

| Width | Rules |
|---|---|
| > 1100 px | Grid `460 / 156 / 460`; card padding 14 px; avatar 62 px |
| ≤ 1100 px | Title columns `minmax(160px,1fr) 230px minmax(160px,1fr)`; card padding 8 px; avatar 52 px |
| ≤ 900 px | `.timeline-list` fixed 1100 px wide; title and footer min width 1100 px |
| ≤ 780 px | Title and footer min width 690 px (the list stays 1100 px); filter buttons/select 122 px wide; board extends 10 px into the page padding on each side |

- The board (`overflow-x: auto`, `overflow-y: hidden`) owns horizontal scrolling; the document never overflows horizontally (`scrollWidth ≤ innerWidth`) at any tested viewport.
- On each render, if the board overflows and is at its initial scroll position, it scrolls so that the first HOME card starts 20 px inside the board (HOME card at x ≤ 60 px at 412×915); scrolling to the end reveals the A markers.
- Connectors stay 40 px and delta bars 38 px at every viewport.

## 9. Visual tokens

| Token | Value |
|---|---|
| Cyan accent (spine, connectors, latest outline) | `#22d3ee` |
| Score background | `#05070b` |
| Side-out | `#ffd43b` |
| HOME green (BP, delta, A-marker point) | `#18b85a` |
| AWAY red (BP, delta, A-marker error) | `#d90429` |
| Board | 1 px `#146797` border, 12 px radius, horizontal navy gradient, max width 1480 px |
| Filter controls | 136×46 px (equal widths and heights), border `#1475a7`, active `#0daed0` |

## 10. Accessibility

- Touch targets ≥ 44 px for the home link, tabs, order buttons, `#windowSize`, `#evolutionSet` and `#returnToLive`.
- `#timelineList` is a polite live region; delta bars and A markers have `role="img"` with French labels; connectors and the column guide are `aria-hidden`.
- Contrast ≥ 4.5:1 for the active tab, player names, HOME action labels (point and error), `REPLAY D’ARCHIVE`, the active order button, score accents, delta badges and role avatars.
- Point/error/neutral of HOME actions is conveyed by colour only (the label carries the skill); SO/BP is conveyed by colour and by `data-code` (not visible). This is the accepted v1.16.0 design.

## 11. Cross-tab conventions retained from v1.18.1 and v1.19.1

- HOME is always on the left and AWAY on the right: SCORES card (`HOME score : score AWAY`), TIMELINE rows and title, GRAPH rows (HOME above AWAY, deltas `HOME − AWAY`).
- SCORES owns the score card and MOMENTUM ACTUEL; TIMELINE contains neither.
- The service worker caches `spectator.html`, `spectator.css`, `spectator.js`, `spectator-live-config.js` and `statistics/adapter.js`; the timeline works offline once loaded.

## 12. Acceptance

1. A Match Library import opened in Spectator shows 5 TIMELINE rows for the reference fixture and `REPLAY D’ARCHIVE`, never `Suivi en direct`.
2. T1–T4: AWAY lead → red `+N` in the AWAY lane only; HOME lead → green `+N` in the HOME lane only; tie → no bar; bars are 38 px wide with no inline style.
3. T5: window 5 with 3 rallies → 3 rows. T10: `Plus récentes` puts the newest rally first with DERNIER POINT, and order/window survive a reload. T11: storing a trimmed archive removes the last row and moves DERNIER POINT.
4. T6–T8: SO/BP are exposed via `data-code`, no `.chip` exists; exactly one score half is coloured (yellow SO, green HOME BP, red AWAY BP), the other is `rgb(5, 7, 11)`.
5. T9: a service fault by the non-serving team gives `data-valid="false"` and a warning containing `rejetée`.
6. AWAY outcomes render only `A` circles (green point, red error); HOME shows the skill label coloured by outcome with no `GAGNANTE`, `OUT`, `✓` or `×` text.
7. Basic/score-only data (v2.1 and v1) shows score pills without cards or markers; capture v1 advanced shows one HOME card and one A marker and `TERMINÉ` for a finished match.
8. Geometry at 1536×1024: spine at 49–51 % of the board; all parts adjacent within 1 px (§5.1); connectors 40 px on both sides at 1536×1024, 1024×768, 844×390 and 390×844; HOME card padding 14 px each side and 12 px avatar–copy gap; score pill ≥ 148 px with attached rally caption; row height ≤ 105 px; full name on one line without overflow; `.max-gap` bar dotted with `écart maximum du set`.
9. Title shows literal `HOME` (left) and `AWAY` (right) in equal boxes 18–22 % of the title width; `Score : HOME — AWAY`.
10. At 412×915 and 390×844 the document does not overflow, the board scrolls horizontally, the HOME card is visible initially and the A marker after scrolling; controls are ≥ 44 px high.
11. The shared set selector defaults to the live set, switches every tab to a replay set, and `Retour au direct` / reload restore the live set.
12. Visual output matches the `timeline_*`, `away_alignment_*` (mean difference < 5.0) and `compact_timeline_*` (< 3.5) v1.26.1 baselines.

## 13. Resolved conflicts with superseded documents

| Topic | Superseded statement (document) | Current rule (code) |
|---|---|---|
| Side order | AWAY left, HOME right; score `AWAY : HOME` (v1.0 draft, v1.16.0) | HOME left, AWAY right; score `HOME : AWAY` (v1.18.1+) |
| Delta lanes | Outer lanes, proportional length with `scaleMax = max(5, …)` (v1.0); proportional AWAY delta (v1.16.2) | Lanes adjacent to the score; fixed 38 px bars; `.max-gap` outline marks the largest visible gap |
| Result code | SO/BP/L chips and outline from HOME’s point of view (v1.0) | SO/BP of the winning team; winner half coloured; no chip or `L` |
| Event content | Tags with ✓/× and labels such as `ACE`, `FAUTE AU SERVICE`; AWAY card with `AWAY` text (v1.0) | HOME skill label only; AWAY `A` circle only (v1.16.0) |
| Name overflow | Ellipsis + tooltip (v1.0) | Full name on one line, no truncation (v1.26) |
| Spine position | 61–64 % (v1.16.1), 44–48 % (v1.16.2) | 49–51 % |
| Gaps | 8 px marker gap, 12 px delta-marker gap (v1.16.2); 6 px score-delta gap (v1.18.1); shared grid gap (v1.17.0) | All adjacent parts touch; 40 px connectors separate cards/markers from delta/score |
| Connector width | Shared `minmax(…, 1fr)` track (v1.17.0); `clamp(18px, …, 112px)` (v1.18.1) | Fixed 40 px flex item |
| Narrow screens | 760 px internal minimum (v1.16.1, v1.16.2) | List 1100 px at ≤ 900 px; title/footer min 690 px at ≤ 780 px |
| Window options | 5 / 10 / 20 / Tout le set, configurable `timeline.windowSizes` (v1.0) | 5 / 10 / 11 / 20 / Tout le set, fixed in HTML |
| Footer | Legends + `Suivi en direct` / `Reconnexion…` (v1.0) | `REPLAY D’ARCHIVE` only |
| Past sets | Open point (v1.0) | Shared set selector (§4.4) |
| Serving team | Always derived from the previous winner (v1.0) | Recorded `servingTeamId` (v2.1); derived only for v1 |
| Privacy settings | `spectator.showPlayerNames`, `spectator.nameFormat` (v1.0) | Not implemented; full names always shown |
