# VolleyLive — Navigation, Home and Settings Specification

Status: current as of v1.28.0. Source of truth: `index.html` (inline navigation controller), `settings.js` (Settings), `match-hub.js` (`displayScreen`).
Acceptance tests: `tests/test_navigation_visual_v1_25.py`, `tests/test_v1_7_home.py`, `tests/test_rotation_setup_v1_6_4.py`.

## 1. Purpose

The application shell separates **write** work (official match data) from **read-only** work (analysis, viewing, export). Every screen is an overlay inside `index.html`, except Spectator View (`spectator.html`).

## 2. Screen map

```
Home (#homeScreen)
├── SETUP & CAPTURE (#setupCaptureScreen)          WRITE ACCESS
│   ├── MATCH CAPTURE (#matchHubScreen)            → see VolleyLive_Match_Hub_Implementation_Specification.md
│   │   ├── NEW MATCH → New match wizard (#setupScreen) → Live capture (#capturePanel)
│   │   └── CONTINUE CAPTURE → Live capture         → see specification_saisie_action.md
│   └── TEAM MANAGEMENT (#teamsScreen)             → see VolleyLive_Team_Management_Specification.md
├── INSIGHTS & VIEWING (#insightsScreen)           READ ONLY
│   ├── MATCH LIBRARY     (data-library-mode="library")   → see VolleyLive_Match_Library_Specification.md
│   ├── COACH VIEW        (data-library-mode="coach")     → Match Library, then Coach View
│   ├── SPECTATOR VIEW    (data-library-mode="spectator") → Match Library, then spectator.html
│   └── MATCH REPORTS     (data-library-mode="reports")   → Match Library, then Reports dialog
└── SETTINGS (#settingsScreen)
```

Coach View, Spectator View and Match Reports are always reached through a match selected in MATCH LIBRARY.

## 3. Home

| Element | ID | Content |
|---|---|---|
| Brand | `#homeTitle` | `VolleyLive Insight`, tagline `Capture once. Use everywhere.` |
| Write zone card | `#homeSetupCapture` | Kicker `WRITE ACCESS`, title `SETUP & CAPTURE`, subtitle `Prepare teams and record matches` |
| Read zone card | `#homeInsights` | Kicker `READ ONLY`, title `INSIGHTS & VIEWING`, subtitle `View, analyse and share match data` |
| Settings card | `#homeSettings` | `SETTINGS` · `MATCH FORMAT` |
| iOS install hint | `#homeInstall` | Shown only when not running as an installed PWA |
| Version | `#appVersion` | Must equal `VERSION` prefixed with `v` (e.g. `v1.28.0`) |

Rules:
- Home background uses `Font_app_ref.jpg` (cached by `sw.js`).
- No Advanced Statistics entry (`#homeStatistics`) and no `statistics/index.html` route may exist (removed in v1.25.0).

## 4. Workspace screens

Both workspace screens share the `.navigation-screen` layout: top bar with back button (`‹ HOME`) and brand, a heading with mode kicker, a list of `.navigation-card` buttons and a `.navigation-principle` reminder.

| Screen | Mode kicker | Cards | Principle text |
|---|---|---|---|
| SETUP & CAPTURE | `WRITE ACCESS` | `#setupMatchCapture`, `#setupTeamManagement` | Score, service, rotation and events can only be changed in Match Capture. |
| INSIGHTS & VIEWING | `READ ONLY` | `#insightsMatchLibrary`, `#insightsCoach`, `#insightsSpectator`, `#insightsReports` | No score, service, rotation or event can be changed from these views. |

Colour coding: cyan identifies write navigation, violet identifies read-only navigation. Red, green and yellow are not used for navigation.

## 5. Navigation behaviour

- Exactly one overlay is visible at a time. `displayScreen()` hides `homeScreen`, `setupCaptureScreen`, `insightsScreen`, `matchHubScreen`, `matchLibraryScreen`, `setupScreen`, `teamsScreen`, `settingsScreen` before showing the target and resets its scroll position.
- Back buttons return to the parent screen and move focus to the card that opened the child (e.g. Match Hub back → focus `#setupMatchCapture`).
- MATCH CAPTURE refreshes `window.VolleyMatchHub` on every entry.

## 6. Settings

Stored in `localStorage['volleyCapture.settings.v1']`.

| Setting | Values | Notes |
|---|---|---|
| Match format (`setsToWin`) | `2` = 2 WINNING SETS (best of 3, set 3 to 15) / `3` = 3 WINNING SETS (best of 5, set 5 to 15) | Default format for new matches |

Rules:
- `SAVE SETTINGS` persists and shows `Settings saved.`; `← HOME` returns without saving.
- Runtime input modes FOCUS / SPEED+ / FLOW are **not** configurable here; they are switched during live capture (see `specification_saisie_action.md`).

## 7. Accessibility and responsive behaviour

- Touch targets ≥ 44 px; visible focus outlines; `aria-labelledby` on every overlay; reduced-motion respected.
- Validated layouts: phone 390×844, short landscape 844×390, tablet 768×1024; no horizontal overflow (`scrollWidth == innerWidth`).

## 8. Acceptance

1. Home shows the two workspace cards and Settings, with the current version.
2. Each workspace lists exactly the cards in §4, in that order.
3. Back navigation restores the parent screen and focus.
4. No route or button to Advanced Statistics exists.
