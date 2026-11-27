# SYS-DESIGN — Visual design system

| Field | Value |
|---|---|
| Spec ID | `SYS-DESIGN` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-27 |
| Source of truth | `css/index-theme.css` (role palette `--role-*`), `runtime-input.css`, `coach.css` (`--coach-*`), `team-management.css` (`--tm-*`), `match-hub.css`, `spectator.css` (`--vl-*`), `icons/` |
| Related specs | SYS-PWA (icons), every UI-* spec (layout of each screen) |

## 1. Purpose

Defines the visual rules shared by every screen: colours, role palette, touch targets, responsive behaviour and
motion, so that the application looks and behaves as one product.

## 2. Scope

- In scope: colour families, role palette, contrast, touch targets, breakpoints, reduced motion, icons.
- Out of scope: the layout of each screen (UI-*).

## 3. Definitions

- Role palette: one colour per player role, used for player circles, chips and court cards everywhere.
- Touch target: the area that reacts to a tap.

## 4. Requirements

| ID | Requirement | Rule / source |
|---|---|---|
| `SYS-DESIGN-01` | The application uses a dark navy theme (page `#071a34`, cards in darker or lighter blues), cyan accents for the selected or active state, green for positive actions and confirmation, red for errors and destructive actions, orange for the court. | Product identity |
| `SYS-DESIGN-02` | Each player role has one colour and one text colour, identical on every screen: OPP `#4FA8E8` / `#0A3555`, SET `#F2C94C` / `#4A3600`, OH `#EB6F7A` / `#50141B`, MB `#63C985` / `#123D24`, LIB `#9AA5B1` / `#26313D` (`--role-*` variables). | Recognition |
| `SYS-DESIGN-03` | Text and its background meet WCAG AA contrast (4.5:1 for normal text); the five role pairs reach 4.86:1 to 7.28:1. | WCAG 2.2 1.4.3 |
| `SYS-DESIGN-04` | Every control used during a match is at least 44 × 44 CSS pixels. | WCAG 2.2 2.5.5, Apple HIG |
| `SYS-DESIGN-05` | Every screen works without horizontal scrolling from 360 px wide phones to desktop, in portrait and landscape (heights down to 480 px), except where a view scrolls a timeline or chart on purpose. LIVE COURT and PLAYER FOCUS need landscape and ask to rotate the device in portrait. | Mobile first |
| `SYS-DESIGN-06` | Animations and smooth scrolling are disabled when the system asks for reduced motion (`prefers-reduced-motion: reduce`). | WCAG 2.2 2.3.3 |
| `SYS-DESIGN-07` | The application icons are square, opaque and borderless, derived from one master (SYS-PWA-06). | Platform rules |
| `SYS-DESIGN-08` | Colours that carry a meaning (status, role, win or loss) are always completed by a text, a symbol or a position, never colour alone. | WCAG 2.2 1.4.1 |

Known gap (to address in a later change, not a requirement yet): colour and spacing variables are defined per area
(`--coach-*`, `--tm-*`, `--vl-*`) and the breakpoints vary from one stylesheet to another (360, 380, 430, 480, 520,
620, 780, 800, 1100 px); only the role palette is shared.

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| Very narrow phone (< 360 px) | Best effort; labels may shorten (icon-only back buttons below 390 px). |
| Disabled control | Lower contrast and no pointer, still readable. |

## 6. Data

No data. Configuration lives in the stylesheets listed in the header.

## 7. Interface

CSS custom properties: `--role-opp`, `--role-opp-surface`, `--role-opp-text` and the same for `setter`, `oh`, `mb`,
`libero` (`css/index-theme.css`); area variables `--coach-*`, `--tm-*`, `--vl-*`.

## 8. Accessibility and language

See `SYS-DESIGN-03`, `-04`, `-06`, `-08`. Texts never live in images (except the app icon), so they are translated
(SYS-I18N).

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `SYS-DESIGN-01`, `-02` | `tests/shared/test_visual_theme.py::test_saturated_role_palette_and_coach_setup_background`, `::test_theme_css_preserves_orange_courts_and_coloured_actions`; `tests/capture/test_player_court_palette.py` |
| `SYS-DESIGN-03` | `tests/capture/test_player_court_palette.py::test_five_role_colors_are_saturated_and_wcag_aa` |
| `SYS-DESIGN-04` | `tests/home/test_home.py::test_home_workspaces_library_and_landscape_are_responsive_with_touch_targets` |
| `SYS-DESIGN-05` | `tests/home/test_navigation_visual.py::test_home_visual_geometry_at_phone_tablet_and_landscape`; `tests/capture/test_history_delete.py::test_history_delete_fits_390_by_844_without_horizontal_overflow`; `tests/library/test_match_library.py::test_rows_stay_single_line_at_narrow_phone_width`; `tests/coach/test_live_court.py::test_live_court_requests_rotation_in_portrait` |
| `SYS-DESIGN-06` | `tests/spectator/test_score_fault_evolution.py::test_empty_one_rally_accessibility_keyboard_touch_and_reduced_motion` |
| `SYS-DESIGN-07` | `tests/shared/test_icon.py::test_icons_are_full_square_opaque_and_borderless` |
| `SYS-DESIGN-08` | Manual review of each screen (status text next to colours, for example Live Court alerts and the Spectator legend) |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-27 | First version; replaces `docs/ROLE_PALETTE_CONTRAST_v1.15.0.md`. |
