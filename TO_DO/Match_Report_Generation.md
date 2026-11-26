# Match Report Generation

**Product:** VolleyLive
**Module:** Match Reports → Report Generator
**Status:** Draft v1.0 (working specification)
**Language:** English
**Companion spec:** *End-of-Match Report* v1.1 (content, layout and metrics of the report). This document specifies **how the report is generated**, in two formats: **interactive HTML** and **PDF**.
**Also depends on:** Unified JSON match action log; *Physical Gamepad Input* (point attribution, section 4.4); *Timeout Card* (rule engine for takeaways).

---

## 1. Purpose and scope

Define the generation pipeline that turns a finished match (the unified JSON action log) into:

1. an **interactive HTML report** (single self-contained file), and
2. a **PDF report** (paginated, A4),

with **identical figures** in both, produced from **one data model and one template**.

### 1.1 In scope

- Input validation and normalisation of the log.
- Metric computation (shared with Coach View).
- The intermediate **Report Model** (single source for both renderers).
- HTML and PDF rendering, pagination, bookmarks, fonts, metadata.
- Generation triggers, progress, errors, performance, versioning and tests.

### 1.2 Out of scope

- Report content and visual design (see *End-of-Match Report*).
- Data capture (see *Physical Gamepad Input*).
- Cloud storage, accounts, e-mail delivery (only the device share sheet / download is used).

### 1.3 Non-goals

- No network call during generation. The generator works fully offline.
- No data of its own: nothing is stored beyond the generated files and optional cached settings.
- No demo or fake values. Not computable → `NA` (grey). No match loaded → generation is unavailable.

---

## 2. Principles

| Principle | Consequence |
|---|---|
| Log is the single source of truth | Every figure is recomputed from the log at generation time; no cached metric is trusted |
| One model, two renderers | HTML and PDF read the same Report Model; no figure is computed in a renderer |
| Deterministic | Same log + same settings + same app version ⇒ same Report Model and same visible content (only the generation timestamp differs) |
| Same numbers as Coach View | Metrics come from the shared metric engine, not from report-specific code |
| Fail visible, not silent | Missing data produces `NA` and a data-quality note, never an invented value |
| Offline and self-contained | All fonts, styles, scripts and data are embedded |

---

## 3. Inputs and outputs

### 3.1 Inputs

| Input | Description |
|---|---|
| Match log | Unified JSON log of the match (actions, timeouts, set boundaries, substitutions, rotations) |
| Match metadata | Teams, date, competition, venue, line-ups, jersey numbers, names, positions |
| Settings | Report settings (section 14) |
| App version | Used for compatibility and printed in the footer |

### 3.2 Outputs

| Output | Format | Naming |
|---|---|---|
| Interactive report | `.html` | `VolleyLive_Report_<date>_<ourTeam>_vs_<opponent>.html` |
| PDF report | `.pdf` | `VolleyLive_Report_<date>_<ourTeam>_vs_<opponent>.pdf` |
| Player page (HTML) | `.html` | `VolleyLive_Player_<date>_<jersey>_<name>.html` |
| Player page (PDF) | `.pdf` | `VolleyLive_Player_<date>_<jersey>_<name>.pdf` |

Names are sanitised: no accents-sensitive characters in the file name beyond a safe set (`A–Z a–z 0–9 _ -`), spaces replaced by `_`, length ≤ 120.

The HTML and the PDF of a same generation share a **generation ID**, a **log hash** and a **timestamp**.

---

## 4. Pipeline overview

```
Unified JSON log + match metadata + settings
        │
        ▼
[1] LOAD & VALIDATE      schema check, version check, data-quality counters
        │
        ▼
[2] NORMALISE            drop cancelled/undone entries, order, recompute `derived`
        │
        ▼
[3] COMPUTE METRICS      shared metric engine (match / set / player scopes)
        │
        ▼
[4] BUILD REPORT MODEL   one JSON structure: sections, tables, charts, takeaways
        │
        ├──────────────┬───────────────────────┐
        ▼              ▼                       ▼
[5a] HTML RENDERER   [5b] PDF RENDERER     [5c] PLAYER-PAGE EXPORT
 (interactive)        (paginated A4)        (one player, HTML or PDF)
        │              │
        ▼              ▼
[6] FINALISE   hash, metadata, size check, consistency check
        │
        ▼
[7] DELIVER    download / share sheet / save to match library
```

Stages 1–4 run **once**. Stages 5a and 5b consume the same Report Model.

---

## 5. Stage 1 – Load and validate

### 5.1 Checks

| Check | Failure behaviour |
|---|---|
| Log present and non-empty | Generation unavailable: message *"No match loaded"*, counters `0`, values `NA` |
| Log schema version supported | If older: migrate in memory; if newer than the app: stop with a clear error |
| Required fields per entry: `set`, `team`, `action`, `status`, `timestamp` | Entry flagged; excluded from metrics; counted in data quality |
| Recommended fields: `scoreBefore`, `rotation`, `player` (our team) | If missing: the dependent cells show `NA`; counted in data quality |
| Opponent entries | `player` may be `null` (opponent `A`) |
| Unknown action / status value | Entry flagged and excluded; counted in data quality |

### 5.2 Data-quality counters

Computed here and printed in the report appendix:

```json
{
  "entriesTotal": 0,
  "entriesUsed": 0,
  "entriesExcluded": { "cancelled": 0, "invalid": 0, "unknownValue": 0 },
  "missingScoreBefore": 0,
  "missingRotation": 0,
  "rallyEnds": 0,
  "rallyEndsWithOpponentData": 0
}
```

---

## 6. Stage 2 – Normalise

1. **Exclude** entries marked `cancelled` and entries removed by UNDO.
2. **Order** entries by `timestamp`, then by the log sequence number (stable).
3. **Recompute `derived`** (`rallyEnded`, `pointFor`, `cause`) from `team + action + status` using the single attribution function of the match engine. Any stored `derived` value that differs is **overwritten** and counted as a data-quality warning.
4. **Rebuild the running score** from the rally ends. If a stored `scoreBefore` conflicts with the rebuilt score, the **rebuilt score wins** and the conflict is counted.
5. **Rebuild the rotation** per entry from the recorded rotation/substitution events, when `rotation` is missing.
6. **Assign each entry** a global sequence number `seq` and, for each player, a per-player sequence number `pseq` (used by the sequential table).
7. **Group** entries by set and by player.

Attribution rule (single source, recalled):

| Status | Effect |
|---|---|
| ✓ POSITIVE | Ends the rally only for `SERVE`, `ATTACK`, `BLOCK`; point for the acting team |
| O NEUTRAL | Rally continues |
| ✕ NEGATIVE | Rally ends; point for the other team |

---

## 7. Stage 3 – Metric computation

### 7.1 Shared metric engine

Metrics are computed by the **same module** used by Coach View and the Timeout Card (`MetricsEngine`). The report adds no metric logic of its own. This guarantees that a figure in the report equals the same figure in Coach View for the same scope.

### 7.2 Scopes

| Scope | Key | Example |
|---|---|---|
| Match | `match` | All used entries |
| Set | `set:n` | Entries with `set = n` |
| Player | `player:id` | Entries of one player (`team = us`) |
| Player × set | `player:id/set:n` | Used by the per-set mini table |
| Rotation | `rot:n` | Entries by rotation |

### 7.3 Metric registry

Every metric is declared once, with its formula, minimum sample and display rule:

```json
{
  "id": "attack.killPct",
  "label": "Kill %",
  "formula": "kills / attackAttempts",
  "scope": ["match", "set", "player", "player/set"],
  "minSample": { "field": "attackAttempts", "value": 5 },
  "format": "percent0",
  "belowSample": "NA"
}
```

The registry drives: computation, `NA` handling, tooltips in the HTML, and the definitions appendix in both formats. A metric cannot appear in the report if it is not in the registry.

### 7.4 Rules

- **Counters** with no data are `0`. **Ratios** with no denominator or below their minimum sample are `NA` (grey), with `n` kept for display.
- Percentages are rounded to the nearest integer for display; the raw value stays in the model.
- Efficiency formula: `(kills − errors) / attempts` (see open question 3 of *End-of-Match Report*; the formula is a registry entry and can be changed without touching renderers).
- Cards that do not apply to a player's position are marked `applicable: false` and **not rendered** (rather than rendered as zero).

### 7.5 Takeaways

Up to 5 (setting) takeaways, produced by the **Timeout Card rule engine** applied to the match scope and, where it differs, to a set scope. Each takeaway:

- is one sentence of at most 120 characters,
- is worded as a suggestion,
- is **omitted** (not padded) when its sample is insufficient.

---

## 8. Stage 4 – Report Model

The Report Model is the **only** input of the renderers. It is plain JSON, serialisable, versioned.

### 8.1 Top-level structure

```json
{
  "schemaVersion": "1.0",
  "generation": {
    "id": "uuid",
    "timestamp": "2026-11-26T21:05:00Z",
    "appVersion": "x.y.z",
    "logHash": "sha256:...",
    "settingsHash": "sha256:..."
  },
  "match": { "ourTeam": "", "opponent": "A", "date": "", "competition": "", "venue": null,
             "result": { "sets": [3, 1], "setScores": [[25,21],[22,25],[25,19],[25,23]] } },
  "dataQuality": { },
  "sections": [ ],
  "players": [ ],
  "definitions": [ ]
}
```

### 8.2 Section object

```json
{
  "id": "points-won-lost",
  "title": "How points were won and lost",
  "order": 3,
  "blocks": [
    { "type": "cardGrid | barChart | stackedBar | table | lineChart | rotationStrip | takeawayList | kpi",
      "id": "", "title": "", "scope": "match", "data": { }, "perSet": [ ],
      "tooltips": ["metricId"], "printHints": { "keepTogether": true } }
  ]
}
```

- Block types are a **closed list**. Both renderers must implement every type.
- `perSet` carries per-set values. HTML uses it for the scope toggle; PDF prints it as side-by-side columns.
- `printHints` are read only by the PDF renderer (`keepTogether`, `pageBreakBefore`, `repeatHeader`).

### 8.3 Player object

```json
{
  "id": "p12",
  "jersey": 12,
  "name": "",
  "position": "OH",
  "positionColor": "#ef4444",
  "setsPlayed": [1, 2],
  "rotationsPlayed": ["R1","R2","R5","R6"],
  "summary": { "cards": [ { "metricId": "", "value": 0, "display": "", "n": 0, "na": false } ] },
  "timeline": [ { "pseq": 1, "set": 1, "scoreBefore": "2-1", "scoreAfter": "3-1",
                  "rotation": "R1", "action": "ATTACK", "status": "POSITIVE",
                  "rallyOutcome": "WON_US | WON_A | CONTINUES", "cause": "KILL" } ],
  "table": { "rows": [ ], "footer": { "positive": 0, "neutral": 0, "negative": 0, "scored": 0, "errors": 0 } },
  "bySet": [ ],
  "byRotation": [ ]
}
```

**Single list rule:** `timeline` and `table.rows` are **the same array of entries**. The footer and the summary counters are computed from that array. Renderers must not recompute them.

### 8.4 Model validation

Before rendering, the Report Model is validated (schema + invariants):

1. For each player, `table.footer` equals the summary counters.
2. For each player, `timeline.length == table.rows.length`.
3. Sum of points won + points lost equals the rally ends of the match, and equals the sum of set scores.
4. Per-set values add up to the match value for every additive metric.
5. No `NaN`, `Infinity` or `undefined` in any value.

A failed invariant **aborts generation** with a diagnostic (section 13); it does not produce a report with wrong numbers.

---

## 9. Stage 5a – HTML renderer (interactive)

### 9.1 Artefact structure

One `.html` file, composed at build time of:

```
<html>
  <head>
    <meta charset> <meta name="viewport"> <title>
    <style id="report-css">   screen + print CSS, light and dark tokens
  </head>
  <body>
    <header> cover and navigation shell
    <main id="report-root">   server-side (generation-time) rendered content
    <script type="application/json" id="report-model">  the Report Model (escaped)
    <script id="report-js">    interaction layer (vanilla JS)
  </body>
</html>
```

### 9.2 Rendering approach

- **Content is rendered into static HTML at generation time** (progressive enhancement). The file is readable with JavaScript disabled, and its default state equals the PDF content.
- The embedded JSON Report Model is used by the interaction layer to re-render **only** the parts that depend on the scope filter and table filters.
- The renderer and the interaction layer use the **same templating functions** (one template source), so default-state output and re-rendered output are identical.

### 9.3 Interaction layer

Vanilla JavaScript, no framework, no external script. Features are those in *End-of-Match Report* section 3.1:

| Feature | Implementation note |
|---|---|
| Scope toggle (Match / Set n) | Reads `perSet`; swaps block data; updates in place; `aria-live="polite"` |
| Player selector | Shows the selected player section; deep links via `#player-12` |
| Timeline ↔ table link | Shared `pseq` key; selection state kept in one object |
| Table filters and sort | Filters over `table.rows`; footer totals recomputed from the **visible** rows by the same function used at generation time; reset button |
| Tooltips | From the `definitions` list |
| Theme toggle | Switches a CSS class on the root; preference not persisted unless storage is available |
| Collapsible sections | Native `<details>` where possible |
| Print button | Calls `window.print()` with the print stylesheet |
| Share player page | Builds a new single-player HTML from the embedded model (see 11) |

### 9.4 Constraints

- No `fetch`, no external URL, no remote fonts/images, no `eval`, no inline event attributes.
- No dependency on cookies or `localStorage` for correctness (optional for the theme only).
- Keyboard-operable controls, visible focus, labelled controls, contrast ≥ 4.5:1.
- Responsive from 320 px; tablet portrait and landscape.
- **Size budget:** ≤ 3 MB for a 5-set match with all players (target ≤ 1.5 MB).

### 9.5 Safety of the embedded data

- The JSON in `<script type="application/json">` escapes `<`, `>`, `&`, U+2028 and U+2029, so `</script>` can never appear in data.
- All text from user input (team and player names, notes) is **HTML-escaped** on output; no `innerHTML` with raw data.
- A Content-Security-Policy `<meta>` forbids network access: `default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:;` (adapted to what the file really needs).

---

## 10. Stage 5b – PDF renderer

### 10.1 Principle

The PDF is a **static, paginated rendering of the same Report Model**, fully expanded, with the print stylesheet. It is never produced by screenshotting the interactive HTML.

### 10.2 Generation method

Two methods are specified behind one interface (`PdfRenderer.render(reportModel, options) → Blob`). The method is a build/runtime choice.

| | **Method A – Browser print engine** | **Method B – Dedicated PDF engine** |
|---|---|---|
| How | Render a **print document** (HTML + print CSS) and print it to PDF through the browser/OS print dialog or the print-to-PDF API | Build the PDF programmatically, or render the print document through a headless engine, then post-process |
| Offline | Yes | Yes (if bundled or on the device) |
| Pagination control | Good (CSS paged media: `break-inside`, `break-before`, repeated `<thead>`) | Full |
| Bookmarks (outline) | **Limited / engine-dependent** | Full (added by post-processing) |
| Tagged (accessible) PDF | Engine-dependent | Possible |
| Fonts | Subset by the browser | Embedded explicitly |
| Footer `Page x / y` | Engine-dependent (paged-media margin boxes) | Full control |
| Cost and complexity | Low | Higher |
| User interaction | Print dialog appears on most platforms | One-tap download possible |

**Recommendation for v1:** implement **Method A** as the baseline (it reuses the same templates and works offline with no extra dependency), behind the `PdfRenderer` interface, and **add Method B** only if the target tablet and browser cannot provide, through Method A, the **bookmarks, page numbers, one-tap download and file size** required by the acceptance criteria. The decision is taken after a **proof of concept on the real tablet** (section 20, question 1).

### 10.3 Print document

A dedicated print document is built from the Report Model, not by hiding parts of the screen HTML:

| Property | Value |
|---|---|
| Page | A4 portrait (Letter selectable), margins 12 mm |
| Theme | Light (default); dark selectable in settings |
| State | Everything expanded; no tooltip-only information (moved to the definitions appendix) |
| Scope | Match scope; per-set data printed as side-by-side columns or small tables |
| Colour | Status colours kept; meaning also carried by symbols (✓ O ✕), labels and border styles |
| Charts | Inline **vector SVG**, no raster |
| Text | Real text, selectable and searchable |

### 10.4 Pagination rules

| Element | Rule |
|---|---|
| Cover | Page 1 only |
| Cards, charts, small tables | `break-inside: avoid` |
| Section headings | Never alone at the bottom of a page (`break-after: avoid`) |
| Team sections | Flow continuously; a section may start mid-page if its first block fits |
| **Player sections** | `break-before: page`; each player starts on a new page |
| Sequential table | May split across pages; `<thead>` repeats on each page; each **set sub-header stays with its first row**; **no row is split** |
| Table footer (totals) | Kept with at least the last 2 rows |
| Orphans / widows | Minimum 2 lines |
| Timeline | Wraps; set dividers kept with the following markers; the legend is repeated on every page where the timeline appears |
| Appendix | Starts on a new page |

If a block is taller than a page, it is split at its natural sub-element (card row, table row), never mid-element.

### 10.5 Header, footer, numbering

| Zone | Content |
|---|---|
| Header | `VolleyLive · End-of-match report`, teams, date, final score |
| Footer left | App version, log hash (short) |
| Footer right | `Page x / y` |
| Cover | No running header |

The total page count `y` is known only after layout. Method A uses paged-media counters; Method B computes it in a second pass.

### 10.4.1 Table of contents

The cover contains a table of contents with **clickable internal links and page numbers**. Page numbers are resolved after layout (two-pass: layout, then fill the numbers; if numbers cannot be resolved with the chosen method, the TOC shows sections without page numbers and this is logged as a limitation).

### 10.6 Bookmarks (outline)

Target outline:

```
Cover and contents
Team report
   1 Match summary
   2 Score evolution and momentum
   3 How points were won and lost
   4 Position and rotation
   5 Service, reception, attack
   6 Timeouts, series, key moments
   7 Debrief takeaways
Players
   #2 Libero
   #5 OH
   #9 MB
   #12 OH
Appendix
```

Bookmarks require Method B, or a post-processing step on the Method A output. If neither is available, the PDF is delivered without bookmarks and the TOC links remain.

### 10.7 Fonts and text

- Fonts are **embedded** (subset). A system-safe fallback stack is defined; ✓ ✕ ○ □ △ symbols must be present in the embedded font or drawn as vector glyphs.
- Latin accents and common French characters are verified in tests.

### 10.8 Metadata and accessibility

| Item | Value |
|---|---|
| Title | `End-of-match report – <ourTeam> vs <opponent> – <date>` |
| Author | `VolleyLive` |
| Language | From settings (`fr` or `en`) |
| Creation date | Generation timestamp |
| Custom properties | `logHash`, `generationId`, `appVersion` |
| Tagged PDF | If supported by the method (open question 3) |
| Alternative text | Charts carry a text description (e.g. biggest lead, timeouts) |

### 10.9 Size and performance

- Target PDF size ≤ **5 MB** for a 5-set match with every player.
- Generation time target ≤ **10 s** on the target tablet (see section 15).

---

## 11. Stage 5c – Player-page export

A single player's section can be exported alone:

| Output | Content |
|---|---|
| HTML | The player section only, cover header (teams, date, result), summary, timeline, sequential table, definitions of the metrics used. Self-contained and interactive (timeline ↔ table, filters) |
| PDF | The same content, paginated; starts with a one-line match header; table header repeated; footer with log hash |

- Built from the **same Report Model** (`players[i]`), never from a second computation.
- The player page carries the **same log hash and generation ID** as the full report, so it can be traced back.
- Team-wide data in the player page is limited to what is needed for context (final score, set scores). Other players' individual data is **not** included.

---

## 12. Stage 6 – Finalise

### 12.1 Log hash

- `logHash` = **SHA-256** of the canonical serialisation of the **normalised** log (stage 2): keys sorted, no whitespace, UTF-8.
- Computed with the Web Crypto API when available, otherwise with an embedded implementation.
- The generation timestamp is **not** part of the hash.

### 12.2 Consistency checks (run before delivery)

| Check | Rule |
|---|---|
| Model invariants | Section 8.4 |
| HTML ↔ PDF | The set of figures in the HTML default state equals the PDF: each figure has a stable `data-figure-id`, and the check compares model values, not text |
| Header/footers | Same `logHash`, `generationId`, `timestamp` in both files |
| Player coherence | For each player: summary = table footer; markers = rows |
| Size budget | Within section 9.4 / 10.9, else a warning is shown |

If a check fails, generation stops (blocking invariants) or continues with a **visible warning** printed in the appendix (non-blocking, e.g. size).

### 12.3 Appendix content

Definitions of every metric used, data-quality counters (section 5.2), generation metadata (date, app version, log hash, settings hash), and the list of **warnings** produced during generation.

---

## 13. Triggers, UX and errors

### 13.1 Triggers

| Trigger | Where |
|---|---|
| End of capture | Prompt: *"Generate the match report?"* |
| Match library | Action on a match: `Generate report` |
| Re-generate | After correcting the log; always recomputed from the log |
| Player page | Action in the report, or from the match library |

### 13.2 Progress and result

Generation shows a **progress indicator** with stages: *Validating → Computing → Building → HTML → PDF → Checking*. On success, the user gets `Download HTML`, `Download PDF`, `Export all` (the pair), and the device share sheet where available.

HTML and PDF can be generated **independently** (settings: HTML only / PDF only / both). When both are requested, the Report Model is built once.

### 13.3 Errors

| Situation | Behaviour |
|---|---|
| No match / empty log | Unavailable; no demo values |
| Unsupported log version | Clear message with the minimum app version |
| Model invariant failed | Generation aborted; diagnostic with the failing check; no file produced |
| PDF engine unavailable | HTML is still produced; the user is told the PDF could not be generated and why |
| Out of memory or timeout | Message; suggest HTML only or fewer player sections; partial results are **not** delivered as complete |
| Cancelled by the user | Generation stops; no file is written |

Diagnostics are written to a small **generation log** (stages, durations, warnings), downloadable from the appendix or the settings.

---

## 14. Configuration

`Settings > Match Reports > Generation`

| Setting | Default | Range |
|---|---|---|
| Output formats | HTML + PDF | HTML only / PDF only / both |
| Default HTML theme | Dark | Dark / Light |
| PDF theme | Light | Light / Dark |
| PDF page size | A4 | A4 / Letter |
| PDF method | Auto | Auto / A (print engine) / B (dedicated engine) |
| Report language | App language | `fr` / `en` |
| Include sections | All | Per section |
| Player sections | All players with ≥ 1 action | Selected players |
| Minimum sample for % | 5 | 3 – 10 |
| Series threshold | 3 | 2 – 8 |
| Max takeaways | 5 | 3 – 8 |
| Timeline density | Full | Full / Compact |
| Include data-quality appendix | On | On / Off |

The settings hash is stored in the generation metadata, so the same report can be reproduced.

---

## 15. Performance and limits

| Item | Target |
|---|---|
| Entries per match | Up to 1 500 |
| Players per team | Up to 14 |
| Sets | Up to 5 |
| Stages 1–4 (compute and model) | < 1 s on the target tablet |
| HTML render | < 2 s |
| PDF render | < 10 s (whole report) |
| HTML size | ≤ 3 MB (target ≤ 1.5 MB) |
| PDF size | ≤ 5 MB |
| Memory | Rendering must not block the UI thread longer than 50 ms at a time (chunked work or a worker) |

Heavy work (metrics, model building, HTML/PDF string building) runs in a **Web Worker** where available; otherwise it is chunked.

---

## 16. Versioning and compatibility

| Item | Rule |
|---|---|
| Log schema version | Read, migrate in memory, never modify the stored log |
| Report Model `schemaVersion` | Semver. A renderer refuses a model with a higher major version |
| Report template version | Printed in the footer with the app version |
| Opening an old report | An HTML report embeds its own model and interaction layer, so it keeps working regardless of the app version |
| Re-generating an old match | Uses the **current** metric registry; the report states the app version and a note if registry definitions changed since the original report |

---

## 17. Security and privacy

- Fully offline; no telemetry, no external request, no remote font or script.
- All user-provided text is escaped; the embedded JSON is escaped against `</script>` injection.
- The file contains **player names and performance data**. The share action shows a short reminder before sharing outside the device.
- A player page contains only that player's individual data (section 11).
- No credentials, tokens or file paths are ever written to the report.

---

## 18. Testing

### 18.1 Automated tests

| Test | Description |
|---|---|
| **Golden model tests** | A set of fixed logs (3-set, 5-set, tie-break, missing fields) with expected Report Models stored in the repository |
| **Metric parity** | For the same log and scope, report metrics equal the Coach View metrics, metric by metric |
| **Invariants** | Every rule of section 8.4 on all fixtures |
| **Determinism** | Two generations of the same log give identical models and identical content (timestamp excluded) |
| **HTML ↔ PDF parity** | The `data-figure-id` values and their model values are identical in both outputs |
| **Single-list rule** | Each player: markers = rows, footer = summary |
| **NA handling** | Samples below the threshold yield `NA`; empty log yields unavailable; no `NaN` anywhere |
| **Escaping** | Names containing `<`, `&`, quotes, `</script>` are rendered safely |
| **Offline** | The generated HTML issues zero network requests |
| **Size and time** | Budgets of section 15 on the large fixture |
| **PDF checks** | Page size, page count, bookmarks present (if Method B), fonts embedded, text extractable |

### 18.2 Fixtures

At minimum: a short match with 1 set; a 4-set match; a 5-set match with all 14 players; a log with missing `scoreBefore`/`rotation`; a log with undone entries; a log with a player substituted out and back in; a log with no opponent entries.

### 18.3 Manual tests

| Device | Browser | Check |
|---|---|---|
| Android tablet | Chrome | HTML offline; PDF generation; share sheet |
| iPad | Safari | HTML offline; PDF generation; share sheet |
| Windows laptop | Chrome / Edge | HTML; print to PDF; bookmarks |

Visual review of the PDF on paper in **black and white**.

---

## 19. Acceptance criteria

1. One action generates the HTML and the PDF from the same log, offline.
2. Both files are produced from one Report Model; no figure is computed in a renderer.
3. Every figure can be recomputed from the log; the report has no separate data store.
4. The HTML is a single self-contained file that issues no network request and is readable with JavaScript disabled.
5. In the HTML, the scope toggle, player selector, timeline ↔ table link, table filters and sort, tooltips, theme toggle and print button work; footer totals follow the active filter.
6. The PDF is A4 portrait, fully expanded, with no split blocks, repeated table headers, each player on a new page, headers and footers with `Page x / y`.
7. The PDF has a clickable table of contents; bookmarks are present when the selected method supports them, and their absence is reported otherwise.
8. HTML and PDF carry the same `logHash`, `generationId` and `timestamp`; the parity test finds no figure difference.
9. For every player, summary = table footer, and timeline markers = table rows.
10. Unavailable values show `NA` in grey, empty counters show `0`; an empty log makes generation unavailable.
11. A failed model invariant aborts generation with a diagnostic and produces no file.
12. A player page (HTML and PDF) can be exported alone, with the same hash, and contains only that player's individual data.
13. PDF ≤ 5 MB and HTML ≤ 3 MB on the large fixture; PDF generated in ≤ 10 s on the target tablet.
14. Names containing special characters or `</script>` never break the output.
15. The report is readable in a black-and-white print.

---

## 20. Open questions

1. **PDF method:** is Method A (browser print engine) sufficient on the real tablet for page numbers, one-tap download and size, or is Method B required? A proof of concept on the target tablet decides.
2. **Bookmarks:** mandatory in v1, or acceptable only when Method B is available?
3. **Tagged (accessible) PDF:** required in v1, or deferred?
4. **Where is generation executed:** strictly on the device (assumed here), or also from a desktop/CI build of the app?
5. **Report language:** follow the app language only, or let the user choose `fr` / `en` per report?
6. **Storage:** is the generated pair saved into the match library (with its hash), or only downloaded?
7. **Efficiency formula and sample thresholds:** keep the *End-of-Match Report* defaults, or define report-specific values in the metric registry?
8. **Re-generation of old matches:** is a note on changed metric definitions enough, or should the old registry version be pinned per match?
