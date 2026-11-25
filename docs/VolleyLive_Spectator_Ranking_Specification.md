# VolleyLive — Spectator View RANKING Specification

Status: current as of v1.28.0 (implementation last changed in v1.26.x). Source of truth: `spectator.js` (`RANKING_CATEGORIES`, `rankingCategoryForAction`, `rankingSource`, `rankingRows`, `rankingCard`, `renderRanking`), `spectator.html` (`[data-panel="ranking"]`), `spectator.css` (`SPECTATOR VIEW RANKING v1.20.0` block).
Acceptance tests: `tests/test_spectator_ranking_v1_20.py`, `tests/test_spectator_view_v1_26.py`, `tests/test_spectator_view_v1_26_1.py`. Visual baselines: `tests/visual_baselines/ranking_{phone_390x844,tablet_768x1024,desktop_1536x1024}_v1_26_0.png`.
Related: `VolleyLive_Statistics_Implementation_Specification.md` §9 (ranking metric definitions), `VolleyLive_Match_Library_Specification.md` (entry point), `VolleyLive_Spectator_Timeline_Specification.md` (shared set navigation).
Supersedes: the ranking parts of `ADVANCED_STATISTICS_RANKING_v1.20.0.md` (its Advanced Statistics page was removed in v1.25.0).

## 1. Purpose

RANKING is the fourth tab of the Spectator View. It ranks the **HOME (our team) roster** per skill category with three read-only views — Highlight, Lowlight and Delta — computed exclusively from the official match JSON loaded in the spectator archive. It never writes match data and never shows demonstration values.

## 2. Entry and navigation

- Spectator View is opened from MATCH LIBRARY (`Spectator` action, or INSIGHTS → `SPECTATOR VIEW` card `#insightsSpectator`, subtitle `Scores · Timeline · Graph · Ranking`, which opens the library in spectator mode). The library stores the raw document in `localStorage['volleySpectator.archive.v1']` and navigates to `spectator.html#live-score`.
- Navigation tabs are exactly, in order: `SCORES` (`live-score`), `TIMELINE` (`live-timeline`), `GRAPH` (`live-graph`), `RANKING` (`ranking`), preceded by the `⌂` home link to `index.html`.
- Selecting the RANKING tab sets `aria-selected="true"` on it, hides every other `[data-panel]`, sets `location.hash = 'ranking'` and re-renders the ranking. Loading `spectator.html#ranking` opens the tab directly. Without a recognised hash the default tab is TIMELINE.
- The shared set bar (`#evolutionSet`, `#liveSetStatus`, `#returnToLive`) stays visible above every tab, including RANKING (see §4).

## 3. Layout and elements

| Zone | Element / ID | Content |
|---|---|---|
| Panel | `section.ranking-panel[data-panel="ranking"]`, `aria-labelledby="rankingTitle"` | Max width 1180 px |
| Heading card | `.ranking-heading` | Eyebrow `SPECTATOR VIEW`, title `#rankingTitle` = `Roster Ranking`, subtitle `Classement calculé uniquement depuis le JSON officiel chargé.` |
| Filters | `.ranking-filters` (`aria-label="Filtres du classement"`) | `Vue` → `#rankingView`; `Catégorie` → `#rankingCategory` |
| Result section | `#rankingSection.ranking-section` (`aria-live="polite"`) | Class `mode-<view>` plus `is-empty` when no relevant action |
| Section title | `#rankingModeTitle` | `Highlight`, `Lowlight` or `Delta` |
| Summary | `#rankingSummary` | `<n> joueur(s) · <m> action(s)` (§6.4) |
| Cards | `#rankingCards.ranking-cards` | One `article.ranking-card` per displayed category; class `single-category` when one category is selected |
| Note | `.ranking-note` | `Highlight : points marqués. Lowlight : erreurs. Delta : points marqués − erreurs. Les actions neutres restent comptées dans le total.` |

### 3.1 Filters

| Control | Options (value → label), in order | Default |
|---|---|---|
| `#rankingView` | `highlight` → Highlight, `lowlight` → Lowlight, `delta` → Delta | Highlight |
| `#rankingCategory` | `all` → All, `attack` → Attack, `block` → Block, `defence` → Defence, `reception` → Reception, `service` → Service | All |

- A `change` on either select re-renders the ranking immediately.
- The application does not persist these filters (no storage key); unlike the Timeline order/window preferences they are not shared with other tabs.

## 4. Data scope

1. **Source document**: the raw archive in `volleySpectator.archive.v1`, validated by `VolleyStatsAdapter.validate`. An invalid archive shows the fatal screen `Archive indisponible`; no ranking is rendered.
2. **Set scope**: the ranking uses only actions of the set currently selected in `#evolutionSet` (`model.currentSet`). It defaults to the live set (`DIRECT · SET n`); choosing another set (`REPLAY · SET n`) or `Retour au direct` re-renders the ranking for that set. There is no whole-match aggregation.
3. **Team scope**: only HOME (our team) players are ranked.
   - Unified v2.1: players whose `teamId` equals the HOME team id (`match.ourTeamId`, else the team with `side: OUR`, else `teams[0]`).
   - Capture v1: `match.team.roster`, keyed by jersey `number`.
   - Opponent players and actions without a known HOME player are ignored.
4. **Eligible events**:
   - v2.1: `events[]` with `eventType` `ACTION` (missing `eventType` is treated as `ACTION`); set = `event.setNumber`, else the `setNumber` of its rally; player = `playerId`; action = `actionType` (fallback `action`); outcome = `evaluation` (fallback `result`).
   - v1: `events[]`; set = `event.set` (default 1); player = `String(event.player)` matched to the roster number; action = `action`; outcome = `result` (fallback `evaluation`).
   - Voided events are excluded in both formats: `cancelled === true`, `undone === true` or `status` in `VOIDED`, `CANCELLED`, `UNDONE`. Rally status is not checked.
5. Live refresh: the ranking is recomputed on every spectator render — archive change in another tab (`storage` event on `volleySpectator.archive.v1`), `VolleySpectator.setArchive()`, `VolleySpectator.refresh()`, set change — as well as on filter change and on tab activation.

## 5. Categories and outcomes

### 5.1 Category mapping (`rankingCategoryForAction`)

The action value is upper-cased and accents are folded (`É È Ê Ë → E`, `À Â Ä → A`) before matching.

| Category key | Card title | Accepted action values |
|---|---|---|
| `attack` | Attack | `A`, `ATTACK`, `ATTAQUE`, `SPIKE` |
| `block` | Block | `B`, `BLOCK`, `CONTRE` |
| `defence` | Defence | `D`, `DEFENCE`, `DEFENSE`, `DIG` |
| `reception` | Reception | `R`, `RECEPTION`, `RECEIVE` |
| `service` | Service | `SV`, `SERVICE`, `SERVE` |

Any other action (for example `SET`, `PASSE`, `FREEBALL`, `GENERIC`, `TEAM`) has no category and is ignored by RANKING. Card order is always Attack, Block, Defence, Reception, Service.

### 5.2 Outcome normalisation (`normalizeResult`)

| Outcome | Accepted values (case-insensitive) |
|---|---|
| point | `POINT`, `KILL`, `ACE`, `WIN`, `WINNER`, `POSITIVE`, `SUCCESS` |
| error | `ERROR`, `FAULT`, `OUT`, `NET`, `NEGATIVE`, `FAIL` |
| neutral | `NEUTRAL`, `CONTINUE`, `CONTINUOUS`, `IN_PLAY`, `PLAY`, `ZERO` |
| unclassified | any other value (e.g. `BLOCKED`) |

Neutral and unclassified actions count only in the action total.

## 6. Metrics and sorting

### 6.1 Per-player counters (per category)

| Counter | Definition |
|---|---|
| `points` | Eligible actions with outcome *point* |
| `errors` | Eligible actions with outcome *error* |
| `total` | All eligible actions of the category (point, error, neutral, unclassified) |
| `delta` | `points − errors` |
| `first` | Order in which the player first appears among the category's eligible events (JSON event order) |

Only players with at least one eligible action in the category appear in that category's card. There is no row limit.

### 6.2 Views

| View | Main value | Detail text | Sort keys (in order) |
|---|---|---|---|
| Highlight | `points` | `<p> pts · <e> err` | points ↓, errors ↑, total ↓, first ↑ |
| Lowlight | `errors` | `<e> erreurs · <p> pts` | errors ↓, points ↓, total ↓, first ↑ |
| Delta | `delta` (may be negative or `0`, no `+` sign) | `<p> pts − <e> err` | delta ↓, points ↓, errors ↑, total ↓, first ↑ |

Ranks are sequential (`#1`, `#2`, …); tied players receive distinct ranks in sort order.

### 6.3 Row content (`.ranking-row`)

| Element | Content |
|---|---|
| `.ranking-rank` | `#<rank>`; rank 1 gold `#d99a00`, rank 2 silver `#7a8594`, rank 3 bronze `#a75b2a`, others `#34516b` |
| `.ranking-player b` | Player name (fallback `Joueur <number>` / `Joueur NA`), single line with ellipsis |
| `.ranking-player small` | `#<number> · <role>`; number `—` when missing; role abbreviated `SET`, `OPP`, `OH`, `MB`, `LIB` (other values upper-cased, `—` when empty) |
| `.ranking-value b` | Main value of the selected view |
| `.ranking-value small` | Detail text of the selected view |

### 6.4 Summary

`#rankingSummary` counts, over the selected category (or all five when `All`), the distinct ranked players and the eligible actions: `<n> joueur` / `<n> joueurs` and `<m> action` / `<m> actions` (plural when greater than 1), joined by ` · `. Example: `0 joueur · 0 action`.

## 7. Empty states

- A category without eligible actions renders `article.ranking-card.empty-ranking`: title, a gray `0` disc, `NA` (colour `#9aa7b6`, i.e. `rgb(154, 167, 182)`) and `0 action`.
- With `All` and no eligible action, five empty cards are shown, the summary is `0 joueur · 0 action` and the section gets `is-empty`.
- With no archive loaded (`AUCUN MATCH`), RANKING renders the same empty state.
- No demonstration, placeholder or opponent value is ever injected.

## 8. Visual rules

| Element | Rule |
|---|---|
| Mode colours | Section title and main values: Highlight cyan `--vl-accent` (`#5fd8f5`); Lowlight `#ff8d9f`; Delta `#f4fbff` |
| Card header | Background `#113c61` (Highlight), `#64283a` (Lowlight), `#17365d` (Delta) |
| Card grid | `All`: two columns; single category: one centred column, max 720 px |
| Row | Grid columns `42px minmax(0, 1fr) auto`, min height 68 px; value column min width 96 px, right-aligned |

## 9. Responsive and accessibility rules

| Width | Behaviour |
|---|---|
| > 780 px | Heading text left, filters right (side by side, each ≥ 160 px wide); two card columns |
| ≤ 780 px | Heading stacks vertically; filters in a 2-column grid; cards in one column |
| ≤ 480 px | Filters in one column; section padding 10 px; title and summary stacked; row grid columns `38px minmax(0, 1fr) auto`, value min width 80 px; nav buttons 9 px text |

- Filter selects are at least 44 px high and are labelled by their wrapping `<label>` (`Vue`, `Catégorie`).
- `#rankingSection` is a polite live region, so filter and set changes are announced.
- Rank is always written as text (`#1`); medal colours are decorative only.
- Spectator navigation stays inside the viewport at 390, 768 and 1536 px widths (no document-level horizontal overflow).

## 10. Out of scope (not implemented in Spectator RANKING)

- Advanced Statistics page (removed in v1.25.0).
- Role comparison, `Attack + Block` and `Overall` category, and Playing-Time ranking (`VolleyLive_Statistics_Implementation_Specification.md` §9.1 and §9.3).
- Opponent (AWAY) player ranking.
- Whole-match aggregation across sets.

## 11. Acceptance

1. Tabs read `SCORES`, `TIMELINE`, `GRAPH`, `RANKING`; TIMELINE is selected by default; RANKING shows the panel with the filter options of §3.1 and five cards for `All`.
2. With the `ranking_fixture` (`test_spectator_ranking_v1_20.py`), Attack/Highlight lists Alex `2` then Blair `1`; Lowlight puts Blair `1` first; Delta shows Alex `2` then Blair `0`; Service/Lowlight shows only Alex `2`; the opponent never appears.
3. An archive without actions shows five empty cards with gray `0` / `NA` and `0 joueur · 0 action`.
4. Selecting set 1 in the shared set selector scopes the ranking to set 1 (`… 3 actions` in `test_spectator_view_v1_26.py`); `Retour au direct` restores the live set.
5. Visual output matches the `ranking_*_v1_26_0.png` baselines at 390×844, 768×1024 and 1536×1024 (mean channel difference < 3.0).
6. No RANKING control writes to `volleyCapture.*` keys or modifies the archive.
