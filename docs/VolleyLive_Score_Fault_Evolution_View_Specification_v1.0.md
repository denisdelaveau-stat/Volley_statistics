# VolleyLive — Score and Fault Evolution View

**Document type:** Functional and UI implementation specification  
**Target:** VolleyLive spectator experience  
**Version:** 1.0  
**Status:** Approved layout baseline  
**Language:** English specification with approved French UI labels  
**Data contract:** Existing official VolleyLive match JSON specification. This document does not introduce or redefine the match JSON schema.

---

## 1. Purpose

The **Score and Fault Evolution View** gives spectators a synchronized, rally-by-rally view of:

1. the score recorded after each rally;
2. the score differential between HOME and AWAY;
3. Side-out and Break Point context through the approved score-cell colors;
4. cumulative faults committed by each team;
5. the cumulative fault differential between HOME and AWAY.

The page is read-only. It shall derive every displayed value from the existing official VolleyLive match JSON and its ordered records. No demonstration value, UI constant, duplicated match state, or hard-coded statistic may be used in production.

The experience shall answer, at a glance:

- What is the current score?
- How did the lead evolve?
- Which rallies were Side-outs or Break Points?
- Which team accumulated more faults?
- At which rally did the balance change?

---

## 2. Scope

### 2.1 In scope

- Live and replay display.
- Selection of a set already present in the match JSON.
- HOME and AWAY score rows.
- Score-differential curve.
- HOME and AWAY cumulative-fault rows.
- Fault-differential curve.
- Shared rally alignment across all rows and charts.
- Responsive horizontal history window.
- Empty, loading, incomplete-data, live-follow and history-browse states.
- Accessibility and keyboard/touch operation.

### 2.2 Out of scope

- Editing match data.
- Defining a new JSON schema.
- Recalculating the official match score independently from the existing match engine.
- Player-performance analytics.
- Coach alerts.
- Chat and reactions.
- Changing the approved Side-out / Break Point definitions already used by VolleyLive.

---

## 3. Approved visual configuration

The implementation shall preserve the approved configuration:

1. The score section appears first.
2. The fault section appears immediately below it.
3. Each section has two distinct horizontal rows: **HOME above AWAY**.
4. Chronology runs from left to right.
5. One timeline column represents one rally.
6. Every value and chart point for a rally shares the same horizontal center.
7. Side-out / Break Point information is shown in the score cells only.
8. The score curve uses one uniform cyan style.
9. The fault curve uses one uniform amber style.
10. The two sections use the same rally window and the same timeline columns.

---

## 4. Page structure

```text
SpectatorEvolutionView
├── SpectatorHeader
│   ├── VolleyLiveBrand
│   ├── LiveStatus
│   └── CurrentScoreSummary
├── SetSelector
├── ScoreEvolutionPanel
│   ├── SectionHeader
│   ├── TimelineRows
│   │   ├── HomeScoreRow
│   │   └── AwayScoreRow
│   ├── ScoreDeltaChart
│   └── ScoreColorLegend
├── FaultEvolutionPanel
│   ├── SectionHeader
│   ├── TimelineRows
│   │   ├── HomeFaultRow
│   │   └── AwayFaultRow
│   ├── FaultDeltaChart
│   └── FaultDeltaExplanation
└── SpectatorBottomNavigation
```

The score and fault panels shall use a shared timeline-layout component or the same computed column geometry. They shall not be positioned independently using unrelated chart margins.

---

## 5. Header and current score

The header shall display:

- the VolleyLive product identity;
- a `LIVE` indicator when the loaded match is live;
- HOME label and current HOME score;
- AWAY label and current AWAY score;
- selected set number.

Approved visual order:

```text
HOME <home score>     SET <number>     <away score> AWAY
```

The header score shall represent the latest official score for the selected live context. Browsing an older timeline window shall not replace the pinned live score with the score of the oldest or selected visible rally.

When replaying a completed set, the header may show that set's final score, according to the existing replay-navigation rules.

---

## 6. Existing JSON integration

### 6.1 Source of truth

The implementation shall consume the **already specified official VolleyLive match JSON**. The established JSON structure, record names, enumerations, action types, scoring rules, server information, set boundaries, Undo behavior and team identifiers remain authoritative.

This specification intentionally does not provide substitute field names. Implementation shall use the existing application parser, normalizer and selectors.

### 6.2 Mandatory integration rule

```text
Official match JSON
        ↓
Existing VolleyLive parser / normalizer
        ↓
Selected-set ordered records
        ↓
Evolution timeline selector
        ↓
Score and fault presentation components
```

The view shall not parse an alternative private format and shall not create a second match engine.

### 6.3 Record ordering

Records shall be processed in the official chronological order defined by the existing JSON specification. If records contain an established sequence identifier, timestamp and/or rally identifier, the existing ordering policy shall be reused.

Undo, correction and restored-match behavior shall be inherited from the existing normalized match history. A removed record shall not remain visible in either chart.

### 6.4 Set filtering

Before deriving the timeline, records shall be filtered using the selected set according to the existing JSON set identity. Cumulated score and fault values shall restart at the set boundary.

No score or fault from another set may be included.

---

## 7. Derived timeline model

The UI shall consume one normalized timeline array. The following interface is conceptual and does not redefine the persisted JSON:

```ts
interface EvolutionTimelineItem {
  rallyKey: string;
  rallyOrdinal: number;

  homeScore: number;
  awayScore: number;
  scoreDelta: number;

  scoringTeam: 'HOME' | 'AWAY' | null;
  pointClassification: 'SIDE_OUT' | 'BREAK_POINT' | null;

  cumulativeHomeFaults: number;
  cumulativeAwayFaults: number;
  faultDelta: number;
  faultTeam: 'HOME' | 'AWAY' | null;
}
```

The implementation may use the application's existing types. The requirement is that both panels consume the same ordered rally items.

### 7.1 Invariants

For every timeline item `i`:

```text
scoreDelta[i] = homeScore[i] - awayScore[i]

faultDelta[i] =
  cumulativeHomeFaults[i] - cumulativeAwayFaults[i]
```

And:

```text
cumulativeHomeFaults[i] >= cumulativeHomeFaults[i - 1]
cumulativeAwayFaults[i] >= cumulativeAwayFaults[i - 1]
```

Fault counters shall never decrease inside a set unless the official history itself has been corrected by Undo or record replacement and the entire derived timeline is recomputed.

---

## 8. Score evolution panel

### 8.1 Labels

- Title: `Évolution du score`
- Subtitle: `Derniers points • lecture de gauche à droite`
- Positive region: `HOME devant`
- Zero line: `Égalité`
- Negative region: `AWAY devant`
- X-axis: `Points joués`

All UI labels shall use the application's translation layer. The French strings above are the approved default labels.

### 8.2 Two score rows

The section shall display two independent rows:

```text
HOME  [value] [value] [value] ...
AWAY  [value] [value] [value] ...
```

HOME shall always be above AWAY.

Each column shall show the official score **after the corresponding rally**. The score shall not be reconstructed from the number of rendered columns because the visible window may start after the beginning of the set.

### 8.3 Score-cell state

Only the cell belonging to the team that scored the displayed rally is highlighted. The other team's cell remains dark.

| Rally classification | Highlighted cell | Color |
|---|---|---|
| Side-out won by HOME | HOME | Yellow |
| Side-out won by AWAY | AWAY | Yellow |
| Break Point won by HOME | HOME | Green |
| Break Point won by AWAY | AWAY | Red |
| No valid classification | Scoring cell or neither, according to existing fallback policy | Neutral |

Approved semantic colors:

- Side-out: yellow.
- HOME Break Point: green.
- AWAY Break Point: red.
- Unchanged/non-scoring cell: near-black or dark navy.

The classification shall reuse the existing VolleyLive Side-out / Break Point logic based on serving team and rally winner. It shall not be inferred from color, score parity, or rally position.

### 8.4 Typography and contrast

- Yellow and green cells: dark text.
- Dark and red cells: white text.
- Numeric values shall use tabular numerals.
- Minimum text contrast shall meet WCAG 2.2 AA.
- Color shall not be the only accessible indication. Each highlighted cell shall expose an accessible name such as `HOME 17, Break Point` or `AWAY 17, Side-out`.

---

## 9. Score-differential chart

### 9.1 Calculation

For every visible rally:

```ts
scoreDelta = homeScore - awayScore;
```

Interpretation:

- positive: HOME leads;
- zero: tie;
- negative: AWAY leads.

### 9.2 Rendering

The chart shall use:

- a cyan polyline;
- straight segments between points;
- one uniform cyan marker per rally;
- a subtle translucent cyan area between the curve and zero;
- a dashed horizontal zero line;
- subtle horizontal and vertical grid lines.

Side-out and Break Point colors shall not appear on the curve or markers.

### 9.3 Y-axis

The Y-axis shall be symmetric around zero whenever practical. Its extent shall include every visible delta plus a small visual margin.

Recommended calculation:

```ts
const magnitude = Math.max(
  minimumMagnitude,
  ...visibleItems.map(item => Math.abs(item.scoreDelta))
);

yDomain = [-magnitude, magnitude];
```

Recommended `minimumMagnitude`: `2`.

Tick intervals shall use whole points only.

### 9.4 X-axis

The X-axis shall show the established rally ordinal or point-played index from the derived timeline. Labels may be thinned when space is limited, but every marker shall remain aligned to its timeline column.

---

## 10. Fault evolution panel

### 10.1 Labels

- Title: `Évolution des fautes`
- Subtitle: `Fautes cumulées • Δ = HOME − AWAY`
- Positive region: `HOME : plus de fautes`
- Zero line: `Égalité`
- Negative region: `AWAY : plus de fautes`
- X-axis: `Points joués`
- Explanation: `Un delta positif indique davantage de fautes HOME.`

### 10.2 Fault definition

The set of records counted as faults shall be the fault definition already established by the official VolleyLive JSON and statistics rules.

The page shall call the existing domain selector or classifier. It shall not maintain a second UI-specific list of action names considered to be faults.

If the current application does not yet expose a reusable selector, the implementation shall extract the existing rule into one shared domain function and use that function in all statistics and evolution views.

### 10.3 Cumulative fault rows

The panel shall display:

```text
HOME  [cumulative count] [cumulative count] ...
AWAY  [cumulative count] [cumulative count] ...
```

The rows shall use the same rally columns as the score panel.

When a fault is added on rally `i`:

```ts
homeFaults[i] = homeFaults[i - 1] + (homeFaultOnRally ? 1 : 0);
awayFaults[i] = awayFaults[i - 1] + (awayFaultOnRally ? 1 : 0);
```

If the official JSON permits more than one countable team fault in one rally, the increment shall follow the existing statistics definition rather than assuming a maximum of one.

### 10.4 Fault-cell highlighting

- The cell whose cumulative value increased at that rally shall use an orange highlight.
- The other cell remains dark.
- If neither count changed, both cells remain dark.
- The orange fault highlight is separate from the score's yellow/green/red semantics.

Accessible names shall include the increment, for example: `HOME, 6 fautes cumulées, nouvelle faute sur ce rallye`.

---

## 11. Fault-differential chart

### 11.1 Calculation

```ts
faultDelta = cumulativeHomeFaults - cumulativeAwayFaults;
```

Interpretation:

- positive: HOME has committed more faults;
- zero: both teams have committed the same number of faults;
- negative: AWAY has committed more faults.

A positive value is not a positive performance indicator.

### 11.2 Rendering

The chart shall use:

- an amber/orange polyline;
- straight segments;
- uniform amber/orange markers;
- a dashed zero line;
- the same grid geometry and column centers as the score chart.

The chart shall not use `HOME devant` or `AWAY devant`. It shall use the fault-specific region labels defined above.

### 11.3 Scale

The fault-delta Y-axis shall be symmetric around zero and contain the visible data. Use integer ticks and a recommended minimum magnitude of `2`.

---

## 12. Shared timeline alignment

Alignment is a mandatory implementation contract.

For every visible item `i`:

```text
x(homeScoreCell[i])
= x(awayScoreCell[i])
= x(scoreDeltaPoint[i])
= x(homeFaultCell[i])
= x(awayFaultCell[i])
= x(faultDeltaPoint[i])
= x(rallyLabel[i])
```

### 12.1 Recommended layout method

Use one shared CSS Grid for timeline columns:

```css
.evolution-grid {
  display: grid;
  grid-template-columns:
    var(--label-column-width)
    repeat(var(--visible-rally-count), minmax(var(--rally-min-width), 1fr));
}
```

The chart plotting region shall begin after the same fixed label-column width. Chart libraries with independent internal left/right padding shall be configured so their plot area exactly matches the score/fault timeline grid.

### 12.2 Prohibited implementation

Do not align separate elements by manually tuned pixel offsets that vary by viewport. Do not use unrelated chart margins for the two panels.

---

## 13. Responsive behavior

### 13.1 Large landscape tablet and desktop

Recommended visible range: `11–15` rallies.

Both panels may be visible in one vertically scrollable page. Horizontal scrolling should not be necessary when the selected visible count can fit with readable cells.

### 13.2 Smartphone landscape

Recommended visible range: `9–12` rallies.

### 13.3 Smartphone portrait

Recommended visible range: `6–8` rallies.

The conceptual layout remains horizontal. The page shall not automatically convert the approved view into a vertical timeline.

### 13.4 Minimum touch and text sizes

- Interactive controls: at least `44 × 44 CSS px`.
- Score and fault cells: recommended minimum width `48 CSS px`.
- Body text: minimum `14 CSS px`.
- Numeric cells: recommended `16–20 CSS px`, depending on viewport.

---

## 14. Live behavior and history navigation

### 14.1 Follow-live mode

When the view is at the latest rally and a valid new record arrives:

1. normalize the updated official match JSON;
2. recompute the selected-set timeline;
3. append or update the final rally item;
4. keep the latest rally visible at the right;
5. animate only if motion preferences permit it.

### 14.2 Browsing history

The user may swipe or scroll horizontally toward older rallies.

While the user is browsing history:

- a new live rally shall not forcibly move the viewport;
- the header current score may continue to reflect live state;
- a `Retour au direct` control shall appear;
- activating it shall restore the latest timeline window.

### 14.3 Undo and corrections

After Undo or correction, the timeline shall be rebuilt from normalized official records. The implementation shall not subtract values opportunistically from rendered UI state.

---

## 15. Set selection

The set selector shall list only sets available under the existing match JSON rules.

Changing the selected set shall atomically refresh:

- header context;
- HOME and AWAY score rows;
- score classifications;
- score-delta curve;
- cumulative fault rows;
- fault-delta curve;
- Y-axis domains;
- timeline position.

The default selection in Live mode shall be the current set. In Replay mode, it shall follow the application's existing replay policy.

---

## 16. Empty, loading and degraded states

### 16.1 No match loaded

Display:

- score `0 – 0`;
- neutral gray cells or placeholders;
- no fabricated curve;
- values `0` or `NA` according to the existing VolleyLive empty-state convention.

### 16.2 Set with no completed rally

Display the axes and neutral empty-state content, but no data marker.

### 16.3 One completed rally

Display the two rows and one chart marker. Do not fabricate a preceding point or line segment.

### 16.4 Missing optional classification

If official score data exists but Side-out / Break Point classification cannot be derived:

- preserve the score;
- use a neutral score-cell state;
- expose a diagnostic in development mode;
- do not guess the classification.

### 16.5 Invalid record

Invalid records shall follow the existing JSON validation/error policy. The UI shall not silently reinterpret unsupported values.

---

## 17. Accessibility

The page shall meet WCAG 2.2 AA where applicable.

Requirements:

- All controls keyboard-operable.
- Visible focus indicator.
- Chart meaning available without relying only on visual position.
- Screen-reader summary for each panel.
- Color-independent accessible labels for SO/BP and new faults.
- Reduced-motion support through `prefers-reduced-motion`.
- Adequate contrast in dark mode.
- Logical reading order: header, set selector, score rows, score chart summary, fault rows, fault chart summary, navigation.

Recommended screen-reader summaries:

```text
Score evolution, Set 1. HOME leads 19 to 17. Current score delta plus 2.

Fault evolution, Set 1. HOME 6 faults, AWAY 6 faults. Fault delta zero.
```

The actual values shall come from the derived timeline.

---

## 18. Performance

Targets for a typical completed set:

- Timeline selector computation: under `16 ms` on a modern desktop/tablet for normal set sizes.
- Interaction response: under `100 ms`.
- No full-page rerender when only one rally is appended.
- No repeated parsing of the same unchanged JSON during a render cycle.
- Charts shall remain responsive for extended sets beyond 25 points.

Recommended implementation:

- memoized set selector keyed by normalized match revision and selected set;
- stable rally keys;
- virtualized or windowed display only if unusually long histories require it;
- `ResizeObserver` for chart geometry;
- one shared scale/geometry calculation per panel width.

Correctness takes precedence over micro-optimization after Undo or correction; recomputing the selected set is preferred to maintaining inconsistent incremental state.

---

## 19. Suggested component API

```ts
interface EvolutionViewProps {
  match: OfficialVolleyLiveMatch;
  selectedSetId: ExistingSetIdentifier;
  mode: 'LIVE' | 'REPLAY';
}

interface TimelineRowsProps {
  items: EvolutionTimelineItem[];
  homeValue: (item: EvolutionTimelineItem) => number;
  awayValue: (item: EvolutionTimelineItem) => number;
  homeCellState: (item: EvolutionTimelineItem) => CellState;
  awayCellState: (item: EvolutionTimelineItem) => CellState;
}

interface DeltaChartProps {
  items: EvolutionTimelineItem[];
  value: (item: EvolutionTimelineItem) => number;
  colorToken: 'score-cyan' | 'fault-amber';
  positiveLabel: string;
  zeroLabel: string;
  negativeLabel: string;
}
```

`OfficialVolleyLiveMatch` and `ExistingSetIdentifier` represent the existing application types and shall not be replaced by types defined only for this screen.

---

## 20. Visual design tokens

The view shall reuse the current VolleyLive design system. If tokens are not yet centralized, use semantic tokens rather than raw colors inside components.

Recommended semantic token names:

```css
--evolution-bg
--evolution-panel-bg
--evolution-grid-line
--evolution-zero-line
--evolution-score-line
--evolution-fault-line
--score-cell-neutral
--score-cell-sideout
--score-cell-break-home
--score-cell-break-away
--fault-cell-new-fault
--text-primary
--text-secondary
```

The approved semantic mapping is:

- score curve: cyan;
- fault curve: amber/orange;
- Side-out: yellow;
- HOME Break Point: green;
- AWAY Break Point: red;
- neutral cells: dark navy/near-black.

Exact color values shall reuse the existing VolleyLive palette to remain coherent with Coach View and Live Timeline.

---

## 21. Validation and tests

### 21.1 Unit tests

Test at minimum:

1. Score delta for HOME lead, tie and AWAY lead.
2. Fault delta for HOME higher, equal and AWAY higher.
3. Score and fault reset at a set boundary.
4. SIDE_OUT classification from the existing domain selector.
5. BREAK_POINT classification from the existing domain selector.
6. Cumulative faults with no fault on a rally.
7. Cumulative faults after HOME fault.
8. Cumulative faults after AWAY fault.
9. Undo removes the derived final point and restores prior cumulations.
10. Invalid/missing classification produces a neutral state, not a guess.

### 21.2 Integration tests

Using existing official JSON fixtures:

- Open a match and select each available set.
- Verify final row scores against the official set result.
- Verify final cumulative faults against the existing statistics output.
- Verify both chart deltas using their formulas.
- Verify the selected set never contains records from another set.
- Verify saved/reopened JSON produces the same timeline.
- Verify Live and Replay views derive identical values for the same records.

### 21.3 Visual regression tests

Capture at least:

- desktop/tablet landscape with 11 columns;
- smartphone landscape;
- smartphone portrait;
- HOME lead;
- AWAY lead;
- equality;
- long set;
- no match;
- one rally;
- history-browse state with `Retour au direct`.

### 21.4 Alignment test

For every visible rally column, assert within an implementation tolerance of `1 CSS px`:

```text
score-cell center
score-chart marker center
fault-cell center
fault-chart marker center
```

---

## 22. Acceptance criteria

The page is accepted when all of the following are true:

1. Two score rows are displayed, HOME above AWAY.
2. Two fault rows are displayed, HOME above AWAY.
3. Chronology is left to right.
4. One column corresponds to one official rally.
5. Score and fault panels use the same rally window.
6. Every score/fault cell and chart point for a rally is vertically aligned.
7. Score cells show values after each rally.
8. Side-out is yellow in the scoring team's score cell.
9. HOME Break Point is green in the HOME score cell.
10. AWAY Break Point is red in the AWAY score cell.
11. SO/BP colors do not appear on the score curve.
12. The score curve is uniformly cyan.
13. `scoreDelta = HOME score − AWAY score` for every point.
14. Positive score delta is labeled as HOME leading.
15. Negative score delta is labeled as AWAY leading.
16. Fault rows show cumulative, non-decreasing counts within the uncorrected set history.
17. A newly increased fault cell is highlighted in orange.
18. The fault curve is uniformly amber/orange.
19. `faultDelta = cumulative HOME faults − cumulative AWAY faults` for every point.
20. Positive fault delta is described as HOME having more faults, not HOME leading.
21. Set changes recompute both panels from the same selected-set records.
22. Undo/correction rebuilds both panels without stale points.
23. No production value is hard-coded from the reference mockup.
24. No new or competing persisted JSON schema is introduced.
25. Empty state shows neutral `0` or `NA` values and no fabricated data.
26. The page is usable by touch, keyboard and screen reader.

---

## 23. Implementation notes

The key implementation decision is to treat `rallyKey` as the common join key for every element of the page. The implementation should derive one timeline and render multiple synchronized views of that timeline.

Do not create separate arrays by independently walking the JSON for score, score colors and faults. Separate traversals can produce ordering differences after corrections, substitutions, incomplete records or Undo.

Preferred approach:

```text
normalize official JSON once
        ↓
select ordered records for one set
        ↓
build one rally timeline
        ↓
derive score and fault values on each item
        ↓
render both synchronized panels
```

---

## 24. Final implementation constraint

The reference mockup defines the layout and visual hierarchy, not demonstration data. The implementation shall use the official existing VolleyLive JSON, the application's established volleyball rules, and real match history for every value shown.
