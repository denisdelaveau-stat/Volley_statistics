# UI-HOME — Home, navigation and Settings

| Field | Value |
|---|---|
| Spec ID | `UI-HOME` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-28 |
| Source of truth | `index.html` (`#homeScreen`, `#setupCaptureScreen`, `#insightsScreen`, `#settingsScreen`), `js/index-navigation-new-match.js` (`VolleyShell`), `settings.js`, `match-hub.js` (`displayScreen`), `match-hub.css` |
| Related specs | UI-HUB, UI-TEAMS, UI-LIBRARY, UI-COACH, UI-SPECTATOR, UI-REPORTS, SYS-I18N (language), SYS-PWA (install hint), DOM-MATCH-05 (format) |

## 1. Purpose

The application shell: the Home screen, the two workspaces that separate writing official match data from reading
it, the navigation between screens, and Settings.

## 2. Scope

- In scope: Home, the PRÉPARATION & SAISIE and ANALYSE & CONSULTATION workspaces, screen switching and back paths,
  Settings (match format, language).
- Out of scope: the screens opened from the workspaces (their own UI-* specs).

## 3. Definitions

- Write workspace: PRÉPARATION & SAISIE (official data). Read workspace: ANALYSE & CONSULTATION (read only).

## 4. Requirements

### 4.1 Home and workspaces

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-HOME-01` | Home shows the brand « VolleyLive Insight » and « Saisir une fois. Utiliser partout. », a write card « ACCÈS EN ÉCRITURE · PRÉPARATION & SAISIE », a read card « LECTURE SEULE · ANALYSE & CONSULTATION », the « RÉGLAGES » card (« FORMAT DE MATCH · LANGUE ») and the application version (`v` + `VERSION`). | Product |
| `UI-HOME-02` | PRÉPARATION & SAISIE offers, in this order, « SAISIE DE MATCH » (UI-HUB) and « GESTION DES ÉQUIPES » (UI-TEAMS), and reminds that score, service, rotation and events can only be changed in Match Capture. | SYS-ARCH-07 |
| `UI-HOME-03` | ANALYSE & CONSULTATION offers, in this order, « BIBLIOTHÈQUE DE MATCHS », « VUE COACH », « VUE SPECTATEUR » and « RAPPORTS DE MATCH », and reminds that nothing can be changed from these views. Coach View, Spectator View and reports are always reached through a match chosen in the Match Library. | SYS-ARCH-07 |
| `UI-HOME-04` | Write navigation is cyan and read navigation violet; red, green and yellow are not used for navigation. | SYS-DESIGN |
| `UI-HOME-05` | No Advanced Statistics entry or route exists (removed in v1.25.0). | Product decision |

### 4.2 Navigation

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-HOME-06` | Exactly one screen is visible at a time; opening a screen hides the others and resets its scroll position. | Product |
| `UI-HOME-07` | Each back button (« ‹ ACCUEIL », « ‹ PRÉPARATION », « ‹ ANALYSE ») returns to the parent screen and puts the focus on the card that opened the child. Below 390 px the back buttons show « ‹ » only, their label staying available to screen readers. | Accessibility |
| `UI-HOME-08` | The MATCH CAPTURE entry refreshes the Match Hub each time it opens; « Reprendre la saisie » summarises the active match. | UI-HUB |

### 4.3 Settings

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-HOME-09` | « Réglages » sets the default match format: « 2 SETS GAGNANTS » (best of 3, third set to 15) or « 3 SETS GAGNANTS » (best of 5, fifth set to 15); it applies to new matches. | DOM-MATCH-05 |
| `UI-HOME-10` | « Réglages » sets the language, Français or English (SYS-I18N-02). | SYS-I18N |
| `UI-HOME-11` | « ENREGISTRER » saves and shows « Réglages enregistrés. » (and reloads when the language changed); « ← ACCUEIL » returns without saving. The capture input modes are not set here (UI-CAPTURE-11). | Product |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| Installed on iPhone | The install hint is hidden (SYS-PWA-07). |
| Active match | The Match Hub shows « Reprendre la saisie » with its summary. |

## 6. Data

Reads and writes `volleyCapture.settings.v1` and `volleyLive.language.v1` (SYS-DATA).

## 7. Interface

Home `#homeScreen` (`#homeTitle`, `#homeSetupCapture`, `#homeInsights`, `#homeSettings`, `#homeInstall`,
`#appVersion`); workspaces `#setupCaptureScreen` (`#setupMatchCapture`, `#setupTeamManagement`, `#setupCaptureBack`)
and `#insightsScreen` (`#insightsMatchLibrary`, `#insightsCoach`, `#insightsSpectator`, `#insightsReports`,
`#insightsBack`); Settings `#settingsScreen` (`[data-setting-format]`, `[data-setting-language]`, `#settingsSave`,
`#settingsBack`).

## 8. Accessibility and language

Every screen is labelled (`aria-labelledby`); touch targets at least 44 px; visible focus; reduced motion respected;
layouts validated at 390 × 844, 844 × 390 and 768 × 1024 without horizontal overflow. Texts: `home.*`, `nav.*`,
`settings.*` keys.

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `UI-HOME-01`, `-05` | `tests/home/test_home.py::test_home_separates_write_and_read_workspaces_and_keeps_settings`; `tests/shared/test_unified_json.py::test_home_keeps_shared_v2_adapter_and_removes_advanced_route` |
| `UI-HOME-02`, `-03`, `-06`, `-07` | `tests/home/test_home.py::test_home_workspace_navigation_and_back_paths` |
| `UI-HOME-04` | `tests/home/test_navigation_visual.py::test_write_and_read_navigation_have_distinct_non_semantic_accents` |
| `UI-HOME-08` | `tests/home/test_home.py::test_match_capture_continue_summary_uses_current_official_match` |
| `UI-HOME-09` | `tests/setup/test_rotation_setup.py::test_settings_and_new_match_sequence` |
| `UI-HOME-10`, `-11` | `tests/shared/test_i18n.py::test_french_by_default_and_english_from_settings`; `tests/capture/test_runtime_input.py::test_settings_screen_does_not_offer_runtime_mode` |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-28 | First version; replaces `docs/VolleyLive_Navigation_Home_Specification.md` (texts now quoted in French, language setting added). |
