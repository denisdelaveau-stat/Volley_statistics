# Volley Live Capture v1.5.0 - Functional Specification

## 1. Purpose
Touch-first volleyball match capture for iPhone/tablet with offline-capable PWA operation, JSON match persistence, HTML report generation, live statistics and three input detail levels.

## 2. Match creation
1. HOME: NEW MATCH, CONTINUE / VIEW MATCH, OPEN MATCH .JSON.
2. SETUP 1: team/opponent/match name, match format, detail level and roster for Intermediate/Advanced.
3. SETUP 2: starting seven (Intermediate/Advanced).
4. SETUP 3: initial P1-P6 rotation and first service/reception (Intermediate/Advanced).
5. Capture screen.

## 3. Saved setup library - new in v1.5.0
The setup library is independent from match data and uses `localStorage` key `volleyCapture.library.v1`.

### 3.1 Saved teams
SETUP 1 can SAVE, LOAD, DELETE and update a named team. A team stores team name, player numbers, player names, positions and Focus state. Loading a team removes unavailable players from a current starting seven and resets the rotation. Saving with an existing name updates it after confirmation.

### 3.2 Saved starting seven
SETUP 2 can SAVE, LOAD, DELETE and update a named starting seven: OH1, OH2, MB1, MB2, SET, OPP and LIB. Loading validates player numbers against the current roster. Unavailable players leave an empty slot and are reported to the user.

### 3.3 Saved initial rotations
SETUP 3 can SAVE, LOAD, DELETE and update named P1-P6 rotations. Loading validates the rotation against the current starting-seven pool.

### 3.4 ROTATE +1
SETUP 3 provides ROTATE +1. Clockwise mapping: P2->P1, P1->P6, P6->P5, P5->P4, P4->P3, P3->P2. Six rotations restore the same composition. A rotated composition can be saved under a new name.

## 4. Detail levels
- Basic: one split team button above the NET and one below it; left X = Error, right O = Point; one tap records the rally.
- Intermediate: focused player / TEAM / ADVERSE split buttons; one tap records Point or Error. Non-focused players use TEAM.
- Advanced: Player -> Action -> Neutral / Point / Error.

## 5. Scoring and match rules
Normal sets finish at >=25 with a two-point margin. The deciding set finishes at >=15 with a two-point margin. Match win is based on the configured winning-set count. A completed set locks normal rally capture until the next set starts. A completed match is marked completed.

## 6. Rotation, libero and substitutions
Rotation is clockwise after side-out. Starting positions P1-P6 and libero replacement rules are retained from the existing implementation. Substitutions are available during the match and are persisted with set/action position.

## 7. Persistence and export
- Match state/events: localStorage.
- Setup library: independent localStorage key `volleyCapture.library.v1`.
- SAVE .JSON exports portable match data.
- OPEN MATCH .JSON restores portable match data.
- REPORT .HTML exports a self-contained report.

## 8. Statistics
Current-set point origin, error evolution/differential, set progression, and attacker statistics for OH/MB/OPP are retained.

## 9. Acceptance criteria
v1.5.0 acceptance requires: setup library save/load/update/delete, missing-player validation, ROTATE +1 and six-rotation round trip, Basic capture, split input, double-tap protection, match creation from loaded setups, JSON/report/statistics continuity, and no uncaught JavaScript errors in automated browser tests.
