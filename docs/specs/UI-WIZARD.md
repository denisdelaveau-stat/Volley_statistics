# UI-WIZARD — New Match wizard

| Field | Value |
|---|---|
| Spec ID | `UI-WIZARD` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-28 |
| Source of truth | `js/index-navigation-new-match.js` (NEW MATCH part), `index.html` (`#setupScreen`), `css/index-theme.css` |
| Related specs | UI-HUB (entry), UI-TEAMS (teams), DOM-LINEUP (set 1 line-up), DOM-MATCH (format, first serve), UI-CAPTURE (next screen), SYS-DATA |

## 1. Purpose

The three-step wizard that creates a match: which team plays whom, which players are present, and the starting line-up
of set 1. It ends on the capture screen.

## 2. Scope

- In scope: the three steps, their checks, and the match it creates.
- Out of scope: creating or editing a team (UI-TEAMS), the line-up of later sets (UI-SETLINEUP).

## 3. Definitions

See DOM-LINEUP (roles, setter zone).

## 4. Requirements

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-WIZARD-01` | The wizard « Nouveau match » has three steps shown as « 1 MATCH », « 2 ÉQUIPE », « 3 ROTATION »; « ← RETOUR » goes back one step without losing what was entered. | Product |
| `UI-WIZARD-02` | Step 1: the scorer chooses a team of the team library (« Sélectionne ton équipe »), types the opponent's name and may change the match name (a name is proposed from both teams); without a team or an opponent, « Sélectionne une équipe. » or « Entre le nom de l’adversaire. ». | Product |
| `UI-WIZARD-03` | Without any team in the library, step 1 says « Aucune équipe configurée. Crée d’abord une équipe. » and offers « OUVRIR LA GESTION DES ÉQUIPES ». | UI-TEAMS |
| `UI-WIZARD-04` | Step 2 (« JOUEURS PRÉSENTS ») lists the roster, sortable by number, position or name; the scorer marks each player present or absent. At least 7 present players are required, including 1 setter, 2 outside hitters, 2 middle blockers, 1 opposite and 1 libero; otherwise « Sélectionne au moins 7 joueurs présents. » or « Postes manquants : … ». | FIVB 4.1, product |
| `UI-WIZARD-05` | Step 3 (« Rotation initiale »): the scorer picks the setter's starting zone (P1…P6) and a present player for each role (setter, OH 1, MB 1, opposite, OH 2, MB 2) and for the libero; the court shows the resulting rotation (DOM-LINEUP-05); a player can hold one role only. | DOM-LINEUP |
| `UI-WIZARD-06` | Step 3 also asks « Premier rôle du match »: RÉCEPTION or SERVICE; « DÉMARRER LE MATCH » appears once it is chosen and stays disabled while a role is missing (« Sélectionne : … »). | DOM-MATCH-11 |
| `UI-WIZARD-07` | « DÉMARRER LE MATCH » creates the active match (identifier, name, date, team and roster with presence, opponent, set 1 line-up and rotation, first phase, match format from Settings, set 1, no substitution), empties the events and opens the capture screen. | SYS-DATA 6.2 |
| `UI-WIZARD-08` | The libero is chosen on a separate bench seat below the court, grey when empty, never inside the six court positions. | DOM-LINEUP-06 |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| A match is already in progress | The Match Hub asks first (UI-HUB); the wizard never overwrites the active match silently. |
| A player assigned to a role becomes absent | The assignment is cleared. |
| Team edited after the match is created | The match keeps its own copy of the roster. |

## 6. Data

Reads the team library and the settings; writes `volleyCapture.match.v1`, `volleyCapture.events.v1` (empty) and
`volleyCapture.chartData.v1` (empty) (SYS-DATA).

## 7. Interface

`#setupScreen`: steps `#suS0`…`#suS2`, title `#suTitle`, body `#suBody`, message `#suMsg`, buttons `#suBack`,
`#suNext`; step 1 `#suTeamSelect`, `#suOpp`, `#suName`, `#suOpenTeams`; step 3 `[data-setter-zone]`, `[data-rotation-role]`,
`[data-first]`.

## 8. Accessibility and language

Setter zone tabs use `role="tab"` and `aria-selected`; messages are shown in `#suMsg`. Texts: `wizard.*` keys.

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `UI-WIZARD-01`, `-02`, `-06`, `-07` | `tests/setup/test_rotation_setup.py::test_settings_and_new_match_sequence` |
| `UI-WIZARD-03` | Manual: empty the team library, open NEW MATCH; the message and the button appear |
| `UI-WIZARD-04` | `tests/setup/test_rotation_setup.py::test_settings_and_new_match_sequence` (present players); missing positions: manual |
| `UI-WIZARD-05` | `tests/setup/test_rotation_setup.py::test_settings_and_new_match_sequence`; `tests/unit/set-lineup.test.js` « rotationFromRoles follows the New Match wizard… » |
| `UI-WIZARD-08` | `tests/setup/test_rotation_setup.py::test_initial_rotation_has_default_grey_libero_circle_on_centred_bench`; `tests/setup/test_libero_bench.py::test_initial_rotation_libero_bench_is_compact_centred_and_label_removed` |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-28 | First version; replaces the setup sections of `docs/FUNCTIONAL_SPEC.md` and `docs/IMPLEMENTATION_SPEC.md` (v1.6.x). |
