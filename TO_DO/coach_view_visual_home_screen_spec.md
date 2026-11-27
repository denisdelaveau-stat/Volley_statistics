# Coach View Visual Home Screen Specification

**Product:** VolleyLive  
**Feature:** Coach View Visual Home Screen  
**Document type:** Functional and UX specification  
**Status:** Proposed  
**Version:** 1.0.0  

## 1. Purpose

The Coach View home screen shall provide a fast, visual entry point to all coach-facing analysis pages during a live volleyball match.

Instead of displaying a conventional text menu, icon grid, or sidebar as the primary navigation, the home screen shall present each Coach View page as a **visual thumbnail card**. Each thumbnail shall reproduce the recognizable structure and current state of the corresponding destination page at a reduced scale.

The coach should be able to identify the desired page visually, understand where attention may be required, and open the page with a single tap.

## 2. Product Objectives

The home screen shall:

1. Reduce the time needed to find an analysis page during a match.
2. Make navigation possible through visual recognition, with minimal reading.
3. Preserve the established Coach View visual language.
4. Provide a compact overview of the main analytical areas.
5. Surface important live situations without turning the home screen into another full dashboard.
6. Remain quick to read and operate on a tablet under match conditions.

## 3. Core UX Principle

Each navigation item shall be represented by a **page preview card**, not by a generic icon.

A card shall contain:

- a visual thumbnail of the actual destination page;
- the page name below the thumbnail;
- an optional live attention indicator;
- a full-card touch target.

The thumbnail must remain visually consistent with the destination page. Its purpose is recognition, not decoration.

The coach should progressively learn to recognize each page by its layout, charts, colors, and information structure before reading its title.

## 4. Scope

### 4.1 Included

- Coach View home screen layout;
- thumbnail card component;
- responsive tablet behavior;
- live thumbnail data refresh;
- optional attention states;
- sorting and stable card positioning rules;
- loading, empty, unavailable, and error states;
- accessibility and touch interaction requirements;
- navigation from the home screen to Coach View pages.

### 4.2 Excluded

- redesign of the individual Coach View destination pages;
- modification of event capture workflows;
- Advanced Statistics navigation;
- match report generation;
- automatic tactical recommendations;
- user-defined dashboard construction.

## 5. Information Architecture

The initial home screen should support the following cards, subject to the actual pages available in the implemented Coach View:

1. **Overview**
2. **Rotations**
3. **Players**
4. **Match Flow**
5. **Attack**
6. **Serve / Reception**

Additional Coach View pages may use the same component and layout rules.

The home screen shall not include an **Advanced Statistics** section. Coach-relevant analysis must remain accessible through Coach View pages, Match Reports, Spectator View where applicable, or the match library.

## 6. Home Screen Layout

### 6.1 Header

The header shall remain compact and visible above the cards. It should include:

- `COACH VIEW` context label;
- current match identification;
- current set score;
- current point score;
- match status, if relevant;
- access to existing global Coach View controls.

The header must not dominate the available vertical space.

### 6.2 Card Grid

Recommended layout:

- **Landscape tablet:** 3 columns;
- **Portrait tablet:** 2 columns;
- **Narrow mobile fallback:** 1 column if the available width cannot support readable previews;
- consistent horizontal and vertical spacing;
- no horizontal page scrolling;
- vertical scrolling permitted when all cards do not fit on screen.

At typical tablet landscape resolution, the first six cards should be visible with little or no scrolling whenever practical.

### 6.3 Stable Positioning

Card positions shall remain stable throughout the match.

Live alerts, values, and data refreshes must not reorder cards automatically. Stable positioning is essential for muscle memory and rapid navigation.

If configurable ordering is added later, it shall be changed only through an explicit configuration action and never as an automatic live behavior.

## 7. Thumbnail Card Component

### 7.1 Structure

Each card shall contain, from top to bottom:

1. optional attention marker;
2. visual page thumbnail;
3. page title;
4. optional short status line, only when it provides immediate live value.

The complete card shall be tappable.

### 7.2 Page Title

The page name shall be displayed below the thumbnail.

Requirements:

- short and unambiguous wording;
- high contrast;
- consistent position on every card;
- maximum of two lines;
- no truncation for supported page names at the intended tablet widths.

### 7.3 Optional Status Line

A short secondary line may be shown below the page title when it communicates useful live context, for example:

- `R4 needs attention`;
- `3-point opponent run`;
- `Reception efficiency falling`;
- `No attack data yet`.

The status line shall not be used as a permanent descriptive subtitle if the title and thumbnail already explain the page.

### 7.4 Touch Target

- the full card surface shall open the page;
- minimum interactive target size: **48 × 48 CSS pixels**;
- touch feedback shall appear immediately;
- accidental double activation shall be prevented;
- opening a card shall require only one tap;
- no essential action shall depend on hover.

## 8. Thumbnail Content

### 8.1 General Rule

A thumbnail shall be a simplified, scaled representation of the corresponding real page.

It shall preserve the destination page's:

- dominant layout;
- section positions;
- chart type;
- main visual hierarchy;
- semantic colors;
- significant labels when still readable;
- current live data context.

It shall not attempt to reproduce every text label or minor control.

### 8.2 Recognition Before Detail

At thumbnail size, the priority order shall be:

1. page layout recognition;
2. dominant chart or data structure;
3. alert state;
4. key live value;
5. secondary labels.

Unreadable miniature text shall be removed rather than rendered as visual noise.

### 8.3 Page-Specific Guidance

#### Overview

The thumbnail should show the same high-level KPI structure as the Overview page, such as:

- side-out performance;
- break-point performance;
- overall efficiency;
- compact trend or comparison visualization.

#### Rotations

The thumbnail should clearly show the R1 to R6 structure and their relative performance states.

It may highlight:

- current rotation;
- best-performing rotation;
- rotation requiring attention;
- side-out or break-point condition, depending on the page context.

#### Players

The thumbnail should reproduce the recognizable player comparison structure, such as compact rows, role colors, or player performance blocks.

It shall use real player and match data. It must not display invented demonstration values during a live or recorded match.

#### Match Flow

The thumbnail should show the match-flow curve or rally sequence and emphasize meaningful runs or momentum changes.

#### Attack

The thumbnail should preserve the main attack representation, including relevant concepts such as:

- attack share;
- attack efficiency;
- rotation context;
- side-out versus transition when displayed by the destination page.

#### Serve / Reception

The thumbnail should show the dominant serve and reception structure, for example:

- serve pressure;
- aces and errors;
- reception quality or efficiency;
- opponent scoring run when linked to serve pressure.

## 9. Live Data Behavior

### 9.1 Data Source

Thumbnail content shall be generated from the same authoritative match state and computed metrics used by the corresponding destination page.

No separate calculation logic shall be introduced for thumbnails when the metric already exists in the destination page.

This avoids inconsistencies between the home preview and the opened page.

### 9.2 Refresh

A thumbnail should refresh after a validated match event changes its underlying data.

Recommended behavior:

- update after event confirmation rather than during incomplete event entry;
- apply the update without moving or resizing the card;
- avoid distracting animations;
- batch rapid consecutive updates when required to preserve rendering performance;
- target visible-thumbnail refresh within **500 ms** after the authoritative match state is updated.

### 9.3 Data Integrity

- Live and recorded matches shall use real stored match data.
- Preview values must match the destination page values for the same match state.
- Rounding rules must be shared with the destination page.
- If a metric cannot be calculated, the thumbnail shall show an explicit unavailable or insufficient-data state.
- Synthetic values may only be used in a clearly identified demo mode.

## 10. Attention Indicators

### 10.1 Purpose

Attention indicators shall help answer:

> Where should the coach look now?

They shall remain discreet. The home screen is navigation-first and must not become an alarm panel.

### 10.2 States

Recommended semantic states:

- **Neutral:** no specific attention required;
- **Positive:** notable favorable situation;
- **Warning:** developing issue worth checking;
- **Critical:** strong, time-sensitive performance issue;
- **Unavailable:** insufficient or unavailable data.

Colors shall follow the existing Coach View theme and semantic color system.

### 10.3 Indicator Presentation

The indicator may be represented by:

- a thin colored card border;
- a small status marker in the card corner;
- a short status line;
- a restrained highlight inside the thumbnail.

Do not use all mechanisms simultaneously unless required for accessibility.

Color must not be the only way to communicate the state. Warning and critical states shall also use a symbol, label, or distinct border treatment.

### 10.4 Trigger Rules

Alert thresholds shall rely on configured Coach View metrics and sufficient sample sizes.

Examples may include:

- a rotation falling below a configured side-out threshold after a minimum number of relevant rallies;
- a multi-point opponent run;
- a sustained drop in reception efficiency;
- unusually low attack efficiency for a rotation or player with sufficient attempts;
- a server generating a significant break-point run.

Thresholds and sample-size rules shall be centrally configured and documented. A card must not generate a strong alert from an isolated action unless the event itself is explicitly considered critical.

## 11. Navigation Behavior

When the user taps a card:

1. the selected Coach View page shall open;
2. the current match, set, score, filters, and live context shall be preserved;
3. the destination should open without an intermediate menu;
4. returning to the home screen shall preserve the previous scroll position;
5. the card grid shall reflect any data changes that occurred while another page was open.

The standard Coach View navigation shall include a clear way to return to this visual home screen.

## 12. Visual Design

### 12.1 Theme

The screen shall use the validated Coach View visual language:

- dark, professional background;
- high contrast;
- clear distinction between surfaces;
- semantic action and performance colors;
- restrained decoration;
- quick readability from normal tablet viewing distance.

### 12.2 Card Styling

Recommended card characteristics:

- dark elevated surface;
- subtle border separating the card from the background;
- rounded corners consistent with the rest of Coach View;
- compact internal padding;
- clearly separated thumbnail and title areas;
- visible pressed and keyboard-focus states.

### 12.3 Aspect Ratio

All thumbnails should use a consistent preview frame ratio within a given layout.

A ratio close to **16:9** is recommended for landscape-oriented destination pages. If the underlying page is structurally different, the preview shall adapt its content inside the shared frame rather than changing the external card dimensions.

### 12.4 Avoided Patterns

The design shall avoid:

- generic icons replacing page previews;
- decorative screenshots disconnected from live state;
- unreadable miniature tables;
- excessive text below cards;
- automatic card reordering;
- flashing alerts;
- large empty card areas;
- inconsistent preview styles;
- duplicated navigation controls inside the thumbnail.

## 13. Responsive Behavior

### 13.1 Landscape Tablet

- 3-column grid;
- thumbnails large enough to expose each page's recognizable structure;
- compact header;
- priority on viewing six main cards with minimal scrolling.

### 13.2 Portrait Tablet

- 2-column grid;
- same card order as landscape;
- no removal of essential information;
- titles and alerts remain readable;
- vertical scrolling expected when necessary.

### 13.3 Smaller Screens

- 1 or 2 columns depending on available width;
- minimum touch dimensions preserved;
- thumbnail simplification may increase;
- no horizontal overflow.

## 14. Loading, Empty, and Error States

### 14.1 Loading

During initial load:

- preserve the complete grid structure;
- show stable skeleton previews;
- do not shift cards as data arrives;
- keep page titles visible whenever possible.

### 14.2 Insufficient Data

When too little match data exists:

- keep the card available;
- show the real page structure with a clear `Not enough data` state;
- do not invent bars, curves, percentages, or trends;
- allow the coach to open the destination page.

### 14.3 Page Unavailable

If a page is unavailable for the current match configuration:

- keep its position stable if temporary availability is expected;
- visually disable the card;
- show a concise reason;
- prevent navigation only when the page truly cannot be opened.

### 14.4 Refresh or Rendering Error

If only the preview fails:

- preserve the card and title;
- show a neutral preview fallback;
- keep navigation to the full page enabled if the destination remains available;
- log the rendering failure for diagnostics.

## 15. Accessibility

- every card shall have an accessible name matching its page title;
- attention state and live summary shall be exposed to assistive technology;
- keyboard focus shall be visible;
- logical focus order shall follow the visual card order;
- semantic states shall not depend on color alone;
- text and controls shall meet applicable WCAG 2.2 contrast requirements;
- reduced-motion preferences shall be respected;
- live thumbnail refreshes shall not repeatedly interrupt screen-reader users.

Suggested accessible label format:

`Open Rotations. Warning: Rotation 4 side-out is below the configured target.`

## 16. Performance Requirements

The thumbnail grid must remain responsive during live capture and analysis.

Recommended targets on supported tablets:

- home screen interactive within **1 second** when match data is already locally available;
- card tap visual feedback within **100 ms**;
- navigation initiated immediately after tap;
- visible thumbnail refresh completed within **500 ms** after match-state update;
- no visible grid layout shift during routine data refresh;
- thumbnail rendering must not delay or block match event capture.

Complex destination charts should use simplified thumbnail renderers or cached render output where necessary, while retaining the same data and recognizable visual structure.

## 17. Technical Design Requirements

### 17.1 Reusable Card Definition

Each Coach View page should expose a thumbnail definition containing at least:

```ts
interface CoachViewThumbnailDefinition {
  id: string;
  title: string;
  route: string;
  order: number;
  availability: ThumbnailAvailability;
  attentionState: AttentionState;
  attentionLabel?: string;
  accessibleSummary: string;
  renderPreview: (context: CoachViewContext) => PreviewModel;
}
```

### 17.2 Shared Data and Metrics

`renderPreview` shall consume the same normalized match state and metric services as the destination page.

Business metrics must not be recalculated independently inside the card UI component.

### 17.3 Rendering Strategy

Preferred rendering order:

1. use a dedicated simplified preview component backed by shared page data;
2. preserve the page's visual identity and chart type;
3. cache preview models where useful;
4. avoid screenshot capture of the live DOM as the primary runtime solution.

A dedicated preview component is preferred over a literal screenshot because it provides better text control, responsiveness, accessibility, consistency, and performance.

### 17.4 Telemetry

The following non-sensitive events may be recorded:

- Coach View home opened;
- thumbnail card opened;
- page identifier;
- attention state at the time of opening;
- render failure;
- navigation duration.

Telemetry must not alter live match behavior.

## 18. Acceptance Criteria

### AC-01: Visual navigation

Given that the Coach View home screen is open, each available Coach View page is represented by a visual thumbnail card with its page name underneath.

### AC-02: Recognizable preview

Each thumbnail preserves the main layout and visual identity of its destination page and is not replaced by a generic icon.

### AC-03: Single-tap access

Tapping anywhere on an enabled card opens the corresponding Coach View page in one action.

### AC-04: Context preservation

Opening a page preserves the current match, set, score, filters, and live context.

### AC-05: Responsive columns

The grid displays three columns in supported landscape tablet layouts and two columns in supported portrait tablet layouts, subject to available width.

### AC-06: Stable location

Cards do not automatically change position when live data or attention states change.

### AC-07: Real data

All live thumbnail values are derived from the same authoritative match data and metric definitions as the destination page.

### AC-08: No invented values

When data is insufficient, the card displays an explicit insufficient-data state instead of fabricated metrics or curves.

### AC-09: Attention state

A configured warning or critical condition is visible on the relevant card without relying only on color.

### AC-10: Live refresh

After a validated event changes a visible metric, the affected thumbnail refreshes without changing card size or grid position.

### AC-11: Preview failure resilience

If a thumbnail cannot render but the destination page remains available, the card still allows navigation and displays a neutral fallback preview.

### AC-12: Accessibility

Every card provides an accessible title, state, and summary, and all cards can be reached and activated with keyboard navigation.

### AC-13: Theme consistency

The home screen and every thumbnail use the established Coach View dark, high-contrast visual language.

### AC-14: Return behavior

Returning from a Coach View page restores the previous home-screen scroll position.

## 19. Test Scenarios

At minimum, validate:

1. a new match with no recorded rallies;
2. a match with partial first-set data;
3. a full live match with frequent event updates;
4. a completed match opened from the match library;
5. insufficient sample size for rotation metrics;
6. warning and critical attention states;
7. unavailable destination page;
8. thumbnail rendering failure;
9. landscape-to-portrait rotation;
10. tablet width near a grid breakpoint;
11. keyboard-only navigation;
12. screen reader output;
13. reduced-motion environment;
14. delayed local data computation;
15. rapid consecutive event validations;
16. comparison of every thumbnail value with its destination page.

## 20. Future Extensions

The architecture may later support:

- user-configurable card order;
- favorite pages;
- role-specific Coach View home layouts;
- configurable attention rules;
- pre-match and post-match thumbnail variants;
- long-press quick actions;
- a compact card size option;
- page-level freshness indicators.

These extensions must preserve the core principles of real-data previews, visual recognition, stable navigation, and rapid one-tap access.

## 21. Definition of Done

The feature is complete when:

- all implemented Coach View pages have a thumbnail definition;
- thumbnails visually match their destination pages;
- the layout is validated in tablet landscape and portrait modes;
- live refresh behavior is tested with real match data;
- attention states use centralized documented rules;
- accessibility checks pass;
- preview rendering does not interfere with live event capture;
- every acceptance criterion is covered by automated or documented manual tests;
- the final screen is visually reviewed against the approved Coach View theme.
