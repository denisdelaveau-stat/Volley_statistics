# Volley Live Capture v1.5.3 - Functional Specification

## Scope
v1.5.3 retains v1.5.0 saved teams, saved starting seven, saved initial rotations, ROTATE +1, Basic/Intermediate/Advanced capture, scoring, substitutions, statistics, JSON and HTML report.

## New and consolidated behavior
1. Team setup jersey selector offers numbers 1-30 inclusive; maximum roster remains 12.
2. Focus=false: during normal Intermediate/Advanced capture, no small grey TEAM placeholder appears on court or bench. P1-P6 geometry remains unchanged. All generic input is performed through the one large TEAM split button below the court.
3. Focus=false players remain available in SUBSTITUTION mode.
4. HOME includes USER GUIDE. It opens package-local `user_guide.pdf` in a new window/tab.
5. `user_guide.pdf` must be included in the service-worker application shell for offline use.

## Acceptance
- 30 number choices exist, 21-30 selectable, 13th roster player refused.
- No Focus=false grey placeholders in normal capture; Focus=true players visible.
- Exactly one large TEAM button when generic TEAM input is required.
- Substitution restores Focus=false selectors.
- User Guide button opens the bundled PDF online and offline.
- Existing v1.5.0 libraries and ROTATE +1 remain unchanged.

## Consolidated reusable setup library
SETUP 1 supports named SAVE/LOAD/DELETE for teams (number, name, position, Focus). SETUP 2 supports named starting-seven templates. SETUP 3 supports named P1-P6 rotations plus ROTATE +1 (P2→P1→P6→P5→P4→P3→P2). Team jersey-number choices are 1..30 inclusive; the roster-size maximum remains 12.
