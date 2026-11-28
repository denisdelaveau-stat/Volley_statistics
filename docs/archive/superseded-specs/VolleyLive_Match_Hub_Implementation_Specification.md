
## VolleyLive — Match Hub Implementation Specification
  
**Document status:** Approved for implementation**Feature:** Match Hub on the Home page**Target:** Mobile-first web application, phone and tablet**Language of the UI:** English**Reference:** User-approved Match Hub visual supplied on 23 November 2026

### 1. Purpose
  
The Match Hub is the primary match-access area on the VolleyLive Home page. It must let a user immediately:
- create a new match;
- resume the match currently in progress;
- open an existing match in read-only viewing/analysis mode;
- access recent completed matches;
- import a match from a valid VolleyLive JSON file.  
The component must feel like one coherent module embedded in the Home page, not like a separate page. The visual hierarchy must prioritize **New Match**, then **Continue Match**, then **View Match**.

### 2. Approved Scope
  
Implement the following elements in this order:
- Match Hub heading and subtitle
- New Match action card
- Continue Match action card
- Current live-match summary inside Continue Match
- View Match action card
- Recent Matches section and “See all” action
- Two most recent match rows by default
- Import Match action  
The reference contains example values such as HOME, AWAY, 18–16, and 22 Nov 2026. These are visual examples only. The implementation must never hard-code these values as application data.

### 3. Information Architecture
Home page
└── Match Hub
    ├── Header
    │   ├── MATCH HUB
    │   └── Your match starts here
    ├── New Match
    ├── Continue Match
    │   └── Active match summary
    ├── View Match
    ├── Recent Matches
    │   ├── See all
    │   └── Recent match rows, maximum 2 on Home
    └── Import Match

### 4. Functional Requirements

#### 4.1 New Match
  
**Label:** NEW MATCH**Supporting text:** Set up teams and start tracking

##### Behaviour
- The entire card is interactive, not only the chevron.
- Selecting the card starts the existing new-match workflow.
- The application must open the first required match setup step.
- Existing unsaved or active match data must not be overwritten silently.
- If an active match already exists, show a decision dialog before continuing:
- Continue current match
- Start another match
- Cancel
- If the product supports only one active local match, Start another match must explain that the current match must first be saved, completed, or discarded.
- No demo teams or scores may be preloaded unless explicitly selected as sample data by the user.

##### Visual treatment
- Highest-priority card.
- Orange background using the VolleyLive accent colour.
- White court-plus icon on the left.
- White right chevron.
- Large, high-contrast title.

#### 4.2 Continue Match
  
**Label:** CONTINUE MATCH**Supporting text:** Resume your match in progress

##### Visibility rules
- Show the full enabled card only when a valid resumable match exists.
- A resumable match is a match whose status is one of:
- live
- paused
- in\_progress
- an equivalent status already defined by the official VolleyLive JSON model.
- Do not infer an active match only from a non-final score. Use the persisted match status.
- When multiple resumable matches exist, select the most recently updated one for the embedded summary. Selecting the card may either resume that match directly or open a resumable-match selector if the existing product supports concurrent matches.

##### Empty state
  
When no resumable match exists:
- keep the card in the same position to preserve Home-page layout;
- use a subdued blue/grey treatment;
- replace the supporting text with No match in progress;
- hide the live-score summary;
- disable navigation;
- expose aria-disabled="true";
- do not show fabricated teams, scores, set numbers, or timestamps.

##### Interaction
- Selecting any enabled area of the card resumes the active match in data-entry mode.
- Restore the latest persisted match state, including:
- teams;
- current set;
- set scores;
- current rally score;
- serving team, when stored;
- rotations and player positions, when stored;
- match history and action log;
- active match clock or saved timing state, when applicable.
- Persist before route changes where required by the current application architecture.

#### 4.3 Active Match Summary
  
The summary appears inside the enabled Continue Match card.

##### Required content
- Green LIVE status pill for a live match.
- Home team display name.
- Away team display name.
- Current Home score.
- Current Away score.
- Current set number.
- Relative or absolute save status.  
Example format:LIVE       HOME vs AWAY
             18 – 16
        Set 2 • Saved just now

##### Data rules
- Use the official loaded match JSON as the source of truth.
- Use team short names when available and sufficiently distinct.
- Fall back to full team names with truncation.
- Fall back to HOME and AWAY only when the JSON does not contain usable team names.
- Scores must be derived from the current set state, not from placeholder values.
- The set number must come from the active set.
- The save label must use the last successful persistence timestamp.
- If the last-save timestamp is absent, show Save status unavailable, not a fabricated relative time.

##### Suggested relative-time labels
- under 60 seconds: Saved just now
- 1–59 minutes: Saved {n} min ago
- same day and 60 minutes or more: Saved at HH:mm
- previous date: localized short date and time

##### Truncation
- Team names: single line with ellipsis.
- Never truncate scores, set number, or the LIVE pill.
- On narrow screens, reduce team-name size before reducing score size.

#### 4.4 View Match
  
**Label:** VIEW MATCH**Supporting text:** Explore scores, timeline and stats

##### Behaviour
- Selecting the card opens the match selection interface.
- The destination lists available live, paused, and completed matches according to current application permissions and storage.
- Selecting a match opens the read-only match experience.
- The read-only experience may expose:
- Live Score;
- set scores;
- graphical Timeline;
- Coach statistics;
- rankings;
- player, role, rotation, and phase analysis.
- The card must never silently open a demo match.
- If no match exists, open a useful empty state with actions to create or import a match.

##### Visual treatment
- Blue gradient or solid-blue card.
- White analytics/eye icon.
- White right chevron.
- Same external dimensions as the New Match action where possible.

#### 4.5 Recent Matches

##### Header
- Section title: RECENT MATCHES
- Secondary action: See all with right chevron.
- See all opens the complete match history.

##### Home-page list
- Display a maximum of two matches.
- Sort by effective match date descending.
- When match dates are equal, sort by updatedAt descending.
- Prefer completed matches. If the intended product behaviour includes paused matches, visually identify the status and do not present a partial score as a final result.

##### Match row fields
  
Each row must include:
- calendar icon;
- Home team name;
- vs separator;
- Away team name;
- match date;
- final set score for a completed match;
- right chevron.

##### Row interaction
- The whole row opens the selected match in read-only mode.
- The selected match ID must be passed through routing/state, not inferred from the displayed names.

##### Empty state
  
When no recent match exists:No matches yet
Start a new match or import an existing one.  
Show compact actions for New match and Import match if the Home-page space permits. Do not insert fake recent matches.

#### 4.6 Import Match
  
**Label:** Import match

##### Behaviour
- Open the platform file picker.
- Accept .json files only by default.
- Read the file locally unless the existing architecture explicitly requires server upload.
- Validate the JSON before saving or opening it.
- Never replace an existing match merely because IDs collide.

##### Validation sequence
- Confirm that the selected file can be read.
- Parse JSON safely.
- Validate the root structure.
- Validate required match identity and team fields.
- Validate sets, scores, events/history, and timestamps when present.
- Validate or migrate the schema version.
- Reject impossible or structurally unsafe values.
- Detect an existing match with the same stable ID.
- Present a concise import summary before committing when migration or conflicts require user awareness.

##### Import outcomes
- **Success:** persist the match and open its summary or viewer.
- **Unsupported version:** explain the supported versions and do not partially import.
- **Invalid JSON:** identify the validation category without exposing a stack trace.
- **Duplicate ID:** offer Open existing, Import as a copy, and Cancel when supported.
- **Partial optional data:** import only if core validity is preserved, and report omitted optional sections.

##### Security
- Treat imported JSON as untrusted input.
- Never execute content found in imported fields.
- Escape all team names, player names, notes, and labels before rendering.
- Apply a practical file-size limit, recommended default: 10 MB, configurable.
- Prevent prototype-pollution keys during object merges.

### 5. Data Contract
  
The Match Hub must consume the existing official VolleyLive match model. It must not create a parallel data structure solely for this screen.

#### 5.1 Minimum view model
interface MatchHubViewModel {
  activeMatch: MatchSummary \| null;
  recentMatches: MatchSummary\[\]; // Home screen displays max 2
  isLoading: boolean;
  error: MatchHubError \| null;
}
interface MatchSummary {
  id: string;
  status: 'live' \| 'paused' \| 'in\_progress' \| 'completed' \| 'cancelled' \| string;
  homeTeam: TeamSummary;
  awayTeam: TeamSummary;
  currentSetNumber: number \| null;
  currentHomePoints: number \| null;
  currentAwayPoints: number \| null;
  homeSetsWon: number \| null;
  awaySetsWon: number \| null;
  matchDate: string \| null;   // ISO 8601
  updatedAt: string \| null;   // ISO 8601
  schemaVersion: string \| null;
}
interface TeamSummary {
  id: string \| null;
  name: string \| null;
  shortName: string \| null;
}  
The adapter that builds MatchSummary must map fields from the current official JSON schema. Field names in the interface above are presentation-level names, not a requirement to rename persisted JSON properties.

#### 5.2 Score derivation
- Current point scores come from the active set.
- Final recent-match scores represent sets won, not the final rally points.
- A completed best-of-five match should display, for example, 3–1.
- Do not derive match completion only from one team reaching three sets if the competition format is configurable.
- Use the match format/rules available in the JSON.

#### 5.3 Persistence
- Use the application’s existing repository/service layer.
- Do not access browser storage directly from presentational components.
- Match Hub data must refresh after:
- creating a match;
- saving or resuming a match;
- completing a match;
- importing a match;
- deleting or archiving a match;
- returning to Home after a match update.

### 6. Navigation Contract
  
Route names below are semantic examples. Reuse the project’s existing router conventions.
<table>
<tr>
<th>  
Action
</th>
<th>  
Destination
</th>
<th>  
Mode
</th>
</tr>
<tr>
<td>  
New Match
</td>
<td>  
/matches/new
</td>
<td>  
Edit/setup
</td>
</tr>
<tr>
<td>  
Continue Match
</td>
<td>  
/matches/{id}/live
</td>
<td>  
Data entry
</td>
</tr>
<tr>
<td>  
View Match
</td>
<td>  
/matches
</td>
<td>  
Selection
</td>
</tr>
<tr>
<td>  
Recent Match row
</td>
<td>  
/matches/{id}
</td>
<td>  
Read-only
</td>
</tr>
<tr>
<td>  
See all
</td>
<td>  
/matches?scope=history
</td>
<td>  
Read-only list
</td>
</tr>
<tr>
<td>  
Successful import
</td>
<td>  
/matches/{id}
</td>
<td>  
Summary/read-only
</td>
</tr>
</table>


#### Browser history
- Back from setup returns to Home unless setup navigation already defines an earlier step.
- Back from a resumed match must not discard newly captured events.
- Back from a viewed recent match returns to the same Home scroll position where practical.

### 7. Visual Specification

#### 7.1 Overall layout
- Mobile-first single-column layout.
- Match Hub sits within the Home-page content area.
- Recommended content width: 100% up to an application maximum width of approximately 720px on tablets.
- Horizontal page padding:
- compact phone: 16px;
- regular phone: 20px;
- tablet: 24–32px.
- Vertical gap between major cards: 12–16px.
- Minimum interactive height: 48px; primary cards should be substantially taller.

#### 7.2 Header
- Title: MATCH HUB
- Subtitle: Your match starts here
- Title uses bold uppercase styling.
- Subtitle uses a lower-emphasis cool grey/blue-white.
- Keep the title and subtitle left aligned.
- Do not use the title as a button.

#### 7.3 Suggested design tokens
  
Use existing VolleyLive tokens where available. The values below describe the approved visual direction and may be mapped to the current design system.\--match-hub-bg: #062E57;
\--match-hub-surface: #0C4A86;
\--match-hub-surface-strong: #125DA7;
\--match-hub-surface-deep: #062C55;
\--match-hub-border: #2D8EF0;
\--match-hub-accent: #FF8A24;
\--match-hub-accent-light: #FFA34D;
\--match-hub-live: #2DAA67;
\--match-hub-text: #FFFFFF;
\--match-hub-text-secondary: #BFD5EA;
\--match-hub-focus: #8BC4FF;
\--match-hub-disabled: #60758A;
\--match-hub-danger: #E55757;
\--match-hub-radius-card: 16px;
\--match-hub-radius-inner: 12px;  
Final colours must be checked against WCAG 2.2 AA contrast requirements.

#### 7.4 Card hierarchy

##### New Match
- Solid orange or restrained orange gradient.
- Largest visual emphasis.
- White icon, title, subtitle, and chevron.
- Avoid additional status content inside this card.

##### Continue Match
- Blue outer card.
- Header row contains the play icon, text, and chevron.
- Active-match summary appears in a darker inset panel.
- The inset panel must not look like a separate unrelated button.

##### View Match
- Blue card consistent with Continue Match.
- No nested score area.
- Use an analytics-plus-eye icon matching the reference intent.

#### 7.5 Recent match rows
- Dark-blue surface with a subtle lighter-blue border.
- Left icon area, flexible text area, score pill, and chevron.
- Score pill uses neutral blue, not the live green or action orange.
- Keep both team names visible when possible.

#### 7.6 Import button
- Full-width outlined button.
- Transparent/dark-blue fill.
- Light-blue border.
- Upload-document icon.
- Lower visual priority than all match navigation actions.

#### 7.7 Typography
  
Use the application font stack. Recommended relative scale:
<table>
<tr>
<th>  
Element
</th>
<th>  
Size
</th>
<th>  
Weight
</th>
</tr>
<tr>
<td>  
Match Hub title
</td>
<td>  
28–34 px
</td>
<td>  
700–800
</td>
</tr>
<tr>
<td>  
Card title
</td>
<td>  
20–24 px
</td>
<td>  
700
</td>
</tr>
<tr>
<td>  
Supporting text
</td>
<td>  
14–17 px
</td>
<td>  
400–500
</td>
</tr>
<tr>
<td>  
Current score
</td>
<td>  
36–44 px
</td>
<td>  
700–800
</td>
</tr>
<tr>
<td>  
Recent Matches title
</td>
<td>  
18–22 px
</td>
<td>  
700
</td>
</tr>
<tr>
<td>  
Recent row team names
</td>
<td>  
16–18 px
</td>
<td>  
600–700
</td>
</tr>
<tr>
<td>  
Metadata
</td>
<td>  
13–15 px
</td>
<td>  
400–500
</td>
</tr>
</table>

  
Use responsive clamp() values if already supported by the codebase. Avoid reducing body text below 14px on phone layouts.

#### 7.8 Icons
- Use one consistent icon library already present in the project.
- Required concepts:
- court plus: New Match;
- play in circle: Continue Match;
- analytics plus eye: View Match;
- calendar: recent match;
- upload document: Import Match;
- chevron right: navigation.
- Mark decorative icons aria-hidden="true".
- Do not rely on icons alone to communicate actions.

### 8. Responsive Behaviour

#### Up to 359 px
- Preserve a single column.
- Keep card padding at least 14px.
- Allow subtitle wrapping to two lines.
- Team names may truncate with ellipsis.
- Score and chevron must remain fully visible.

#### 360–599 px
- Use the approved phone composition.
- All cards remain stacked.
- Continue Match inset summary uses one horizontal summary when space allows.

#### 600 px and above
- Keep Match Hub as a coherent Home-page module.
- Do not stretch text lines across the full tablet width.
- Optionally use a two-column internal layout only if it preserves the approved hierarchy:
- New Match and Continue Match remain more prominent than View Match.
- Recent matches may remain full width for readability.

#### Landscape
- Avoid forcing the user to see all content without scrolling.
- Preserve natural vertical scrolling.
- Ensure the primary actions are reachable without horizontal scrolling.

### 9. Accessibility
  
Target **WCAG 2.2 AA**.
- Use semantic \<button\> or \<a\> elements, according to navigation behaviour.
- Do not implement cards as clickable \<div\> elements.
- Minimum touch target: 44 × 44 CSS px; preferred: 48 × 48 CSS px.
- Provide visible keyboard focus using the focus token.
- Preserve logical tab order matching visual order.
- Provide accessible names that include purpose, for example:
- Start a new match
- Continue HOME versus AWAY, Set 2, score 18 to 16
- View matches
- Open HOME versus AWAY played 22 November 2026, final score 3 to 1
- Do not use colour as the only status indicator. The green status must also contain LIVE.
- Respect prefers-reduced-motion.
- Support browser zoom to 200% without loss of content or functionality.
- Announce import validation results through an aria-live region.
- Localize dates for display while preserving ISO timestamps in data.

### 10. Loading, Error, and Offline States

#### Initial loading
- Show stable skeletons matching card dimensions.
- Do not flash demo scores before real data loads.
- Keep New Match available unless the application requires initialization that blocks all actions.

#### Repository error
- Keep New Match available where safe.
- Disable Continue Match if active-match validity cannot be established.
- Show a compact message: Matches could not be loaded.
- Provide Try again.
- Log the technical error through the existing observability mechanism, without exposing internal details in the UI.

#### Offline
  
If VolleyLive supports local-first operation:
- New Match and Continue Match remain available from local storage.
- Display a non-blocking offline indicator.
- Queue remote synchronization according to the existing sync strategy.  
If the data source requires connectivity:
- explain which actions are unavailable;
- never imply that a remote save succeeded while offline.

### 11. Analytics and Telemetry
  
Use the project’s existing telemetry layer. Do not include personal player data in event properties.  
Recommended events:match\_hub\_viewed
match\_hub\_new\_match\_selected
match\_hub\_continue\_selected
match\_hub\_view\_match\_selected
match\_hub\_recent\_match\_selected
match\_hub\_see\_all\_selected
match\_hub\_import\_selected
match\_hub\_import\_succeeded
match\_hub\_import\_failed  
Suggested safe properties:
- source: "home"
- hasActiveMatch: boolean
- recentMatchCount: number
- matchStatus
- schemaVersion
- errorCategory  
Do not send team names, player names, raw JSON, or full match history unless explicitly permitted by the product privacy specification.

### 12. Suggested Component Structure
  
Framework names are illustrative. Follow the existing project architecture.MatchHub/
├── MatchHub.tsx
├── MatchHubHeader.tsx
├── MatchHubActionCard.tsx
├── ActiveMatchSummary.tsx
├── RecentMatches.tsx
├── RecentMatchRow.tsx
├── ImportMatchButton.tsx
├── MatchHubEmptyState.tsx
├── useMatchHubData.ts
├── matchHub.adapter.ts
├── matchHub.types.ts
├── matchHub.module.css
└── \_\_tests\_\_/
    ├── MatchHub.test.tsx
    ├── ActiveMatchSummary.test.tsx
    ├── RecentMatches.test.tsx
    └── importMatch.test.ts

#### Separation of responsibilities
- Presentational components receive display-ready data.
- The hook/controller retrieves repository data and handles refresh.
- The adapter converts the official JSON model to the display view model.
- Routing remains outside purely presentational components where practical.
- Import parsing and validation must be isolated and independently tested.

### 13. Acceptance Criteria

#### Layout and content
-  Match Hub appears on the Home page in the approved visual order.
-  The title is MATCH HUB.
-  The subtitle is Your match starts here.
-  New Match is the primary orange action.
-  Continue Match is the second action.
-  View Match is the third action.
-  Recent Matches appears below the three actions.
-  Import Match appears below Recent Matches.

#### Real-data requirements
-  No team name, score, set number, date, or save time is hard-coded as live application data.
-  Continue Match uses the official persisted match JSON.
-  Recent Matches uses real stored match records.
-  A missing value is represented honestly, never replaced with demo data.
-  Final recent-match score means sets won, not rally points.

#### Interaction
-  New Match opens setup.
-  Continue Match restores the correct active match.
-  View Match opens the match-selection/view flow.
-  Each recent row opens the correct match by stable ID.
-  See all opens complete match history.
-  Import Match validates before persistence.

#### States
-  No-active-match state is implemented.
-  No-recent-match state is implemented.
-  Loading state is implemented without placeholder data.
-  Repository error state is implemented.
-  Invalid import state is implemented.
-  Duplicate import handling is implemented.

#### Quality
-  Works at 320 px CSS width without horizontal scrolling.
-  Keyboard navigation follows visual order.
-  Focus is visible.
-  Touch targets meet the minimum size.
-  Contrast passes WCAG 2.2 AA.
-  Browser zoom at 200% remains usable.
-  Long team names do not break the layout.

### 14. Test Plan

#### Unit tests
- active match selection by latest updatedAt;
- current-set score mapping;
- completed match set-score mapping;
- team-name fallback rules;
- saved-time formatting thresholds;
- recent-match sorting and two-item limit;
- import JSON parsing and schema validation;
- unsupported schema version;
- duplicate match ID handling;
- malicious/untrusted string escaping.

#### Component tests
- renders approved labels and hierarchy;
- enabled Continue Match with real summary;
- disabled Continue Match without active match;
- no recent matches;
- one recent match;
- two recent matches;
- more than two records displayed as only two on Home;
- keyboard activation for each card;
- correct accessible names;
- loading skeleton;
- recoverable repository error.

#### Integration tests
- create and return to Home;
- pause a match and resume it from Match Hub;
- complete a match and verify appearance in Recent Matches;
- import a valid match and open it;
- import invalid JSON and preserve existing data;
- open a recent match and return to the Home scroll position.

#### Visual regression sizes
- 320 × 568
- 375 × 667
- 390 × 844
- 430 × 932
- 768 × 1024
- representative phone landscape size  
Test light/dark browser settings only if the application supports both. The approved Match Hub itself uses the VolleyLive dark blue theme.

### 15. Definition of Done
  
The Match Hub is complete when:
- the approved Home-page visual hierarchy is implemented;
- every value comes from the official VolleyLive JSON/repository or an explicit empty state;
- all navigation actions work end to end;
- active and recent match states refresh correctly after data changes;
- JSON import is validated and safe;
- responsive, accessibility, unit, integration, and visual-regression tests pass;
- no demo data appears in production behaviour;
- the implementation has been verified on at least one phone-sized viewport and one tablet-sized viewport.

### 16. Explicit Non-Goals
  
This implementation does not redefine:
- the official VolleyLive JSON schema;
- match scoring rules;
- the detailed New Match setup workflow;
- the internal Coach View layout;
- the internal Live Timeline layout;
- the detailed full match-history page;
- cloud synchronization architecture.  
Those existing capabilities must be reused and connected to Match Hub rather than duplicated.