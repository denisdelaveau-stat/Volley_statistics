# UI-TEAMS — Team Management

| Field | Value |
|---|---|
| Spec ID | `UI-TEAMS` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-28 |
| Source of truth | `team-management.js` (`window.VolleyTeams`), `team-management.css`, `index.html` (`#teamsScreen`) |
| Related specs | UI-WIZARD (uses the teams), UI-HOME (entry), SYS-DATA 6.6 (team library), DOM-LIBERO-01 (libero position) |

## 1. Purpose

Creates, edits, deletes and imports the reusable team rosters offered by the New Match wizard. It belongs to the write
workspace PRÉPARATION & SAISIE.

## 2. Scope

- In scope: overview, editor, validation, CSV import.
- Out of scope: the roster of a match in progress (copied into the match, UI-WIZARD).

## 3. Definitions

- Position: `setter` (SET), `oh` (OH), `mb` (MB), `opp` (OPP), `libero` (LIB); sorting order setter, oh, mb, opp,
  libero.

## 4. Requirements

### 4.1 Overview

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-TEAMS-01` | The overview shows, in this order: the title « GESTION DES ÉQUIPES » (« DES ÉQUIPES » in cyan) with « Créez, organisez et réutilisez vos effectifs. », the « NOUVELLE ÉQUIPE » card, « ÉQUIPES ENREGISTRÉES » with its counter, and « IMPORTER UNE ÉQUIPE » (CSV, first row Numero, Nom, Poste). | Product |
| `UI-TEAMS-02` | A registered team opens for editing by click, Enter, Space or ✎; × deletes it after confirmation (« Supprimer l’équipe enregistrée « nom » ? »). | Product |
| `UI-TEAMS-03` | The back button returns to PRÉPARATION & SAISIE (UI-HOME-07). | UI-HOME |

### 4.2 Editor

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-TEAMS-04` | Team name required (80 characters at most); a player needs a number 1–99 unique in the team, a name (80 characters at most) and a position; « ＋ » or Enter adds the player only when the three fields are valid. | Data integrity |
| `UI-TEAMS-05` | A team holds 40 players at most; × removes a player. | Product |
| `UI-TEAMS-06` | The roster sorts by NUMÉRO, NOM or POSTE; choosing the active key again reverses the order. | Product |
| `UI-TEAMS-07` | « ENREGISTRER L’ÉQUIPE » requires a name and at least one player and checks the whole roster again; saving under the name of another existing team asks « Remplacer l’équipe enregistrée « nom » ? ». « ANNULER » or ‹ returns without saving. | Data integrity |
| `UI-TEAMS-08` | Each error is explained in the message area: « Le numéro doit être un entier de 1 à 99. », « Saisissez le nom du joueur. », « Choisissez le poste du joueur. », « Les numéros des joueurs doivent être uniques. », « 40 joueurs au maximum. », « Saisissez le nom de l’équipe. », « Ajoutez au moins un joueur. », « Chaque joueur doit avoir un numéro, un nom et un poste. ». | Product |

### 4.3 CSV import

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-TEAMS-09` | A UTF-8 `.csv` file (BOM tolerated, LF or CRLF) is read with its separator detected from the header (comma, semicolon or tab), quoted cells and `""` supported; headers are case and accent insensitive (Numero/Number, Nom/Name, Poste/Position). | Robustness |
| `UI-TEAMS-10` | Position labels are normalised: set, setter, passeur, passeuse → SET; oh, outside, outside hitter, réceptionneur(-euse) attaquant(e), ra → OH; mb, middle, middle blocker, central(e) → MB; opp, opposite, pointu(e) → OPP; lib, libero → LIB. | Product |
| `UI-TEAMS-11` | Any error stops the import and gives the line: invalid number, missing name, unsupported position, duplicate number, more than 40 players, missing headers. | SYS-SEC-04 |
| `UI-TEAMS-12` | A valid file opens the editor filled in (team name from the file name) with the count of imported players; nothing is stored until « ENREGISTRER L’ÉQUIPE ». | Data integrity |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| No team | « ÉQUIPES ENREGISTRÉES » is empty; the wizard offers to open Team Management (UI-WIZARD-03). |
| Player name with HTML | Shown as text (SYS-SEC-01). |

## 6. Data

`volleyCapture.library.v1`, `team[<name>]` (SYS-DATA 6.6); the team name is the key.

## 7. Interface

`#teamsScreen`: overview `#teamOverview` (`#teamNew`, `#teamsBody`, `#teamCount`, `#teamImport`, `#teamsBack`);
editor `#teamEditor` (`#teamName`, `#teamPlayerNumber`, `#teamPlayerName`, `#teamPlayerPosition`, `#teamAdd`,
`#teamsSave`, `#teamCancel`); messages `#teamsMsg`.

## 8. Accessibility and language

Touch targets at least 44 px (add button 48 × 48); no horizontal overflow at 390 × 844 and 1024 × 768; rows reachable
with the keyboard. Texts: `teams.*` keys.

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `UI-TEAMS-01`, `-03` | `tests/teams/test_team_management.py::test_team_management_shell_matches_requested_information_architecture` |
| `UI-TEAMS-02`, `-04` to `-08` | `tests/teams/test_team_management.py::test_add_validate_sort_save_and_reopen_team`; `tests/teams/test_teams_library.py::test_team_management_editor_saves_reusable_team` |
| `UI-TEAMS-09` to `-12` | `tests/teams/test_team_management.py::test_csv_import_maps_french_headers_and_roles`; error lines: manual (import a file with a duplicate number) |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-28 | First version; replaces `docs/VolleyLive_Team_Management_Specification.md` (texts now quoted in French). |
