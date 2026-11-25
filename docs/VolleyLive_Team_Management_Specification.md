# VolleyLive — Team Management Specification

Status: current as of v1.28.0. Source of truth: `index.html` (`#teamsScreen` markup), `team-management.js` (controller), `team-management.css`.
Acceptance tests: `tests/test_team_management_v1_24.py`.

## 1. Purpose

TEAM MANAGEMENT creates, edits, removes and imports reusable team rosters. Saved teams are offered by the NEW MATCH wizard. It lives in the **SETUP & CAPTURE** workspace (write access).

## 2. Storage

Teams are stored in `localStorage['volleyCapture.library.v1']` under `team[<team name>]`:

```json
{
  "team": "AS Cannes",
  "maxPlayers": 40,
  "roster": [1, 7, 12],
  "info": { "7": { "name": "Player name", "pos": "oh" } },
  "savedAt": "2026-11-15T18:00:00.000Z"
}
```

The format is backward compatible with existing libraries; the team name is the key.

Positions: `setter` (SET), `oh` (OH), `mb` (MB), `opp` (OPP), `libero` (LIB). Role order for sorting: setter, oh, mb, opp, libero.

## 3. Overview screen (`#teamOverview`)

In this order:
1. Heading `TEAM MANAGEMENT` (the word `MANAGEMENT` uses the cyan accent) and subtitle `Build, organize and reuse your team rosters.`
2. **NEW TEAM** card (`#teamNew`): opens an empty editor.
3. **REGISTERED TEAMS** (`#teamsBody`) with a counter (`#teamCount`, e.g. `3 TEAMS`). Each row opens the team for editing (click, `Enter` or `Space`, or `✎`); `×` deletes it after confirmation (`Delete registered team "<name>"?`).
4. **IMPORT NEW TEAM** card (`#teamImport`) for CSV files, with the note: the first row must contain Numero, Nom and Poste.

The back button (`#teamsBack`, `‹ SETUP`, `aria-label="Back to Setup and Capture"`) returns to SETUP & CAPTURE, consistent with the Match Hub back button.

## 4. Editor (`#teamEditor`)

| Field | ID | Rule |
|---|---|---|
| Team name | `#teamName` | Required, max 80 characters |
| Numero | `#teamPlayerNumber` | Integer 1–99, unique within the team |
| Nom | `#teamPlayerName` | Required, max 80 characters |
| Poste | `#teamPlayerPosition` | One of SET / OH / MB / OPP / LIB |

- `＋` (`#teamAdd`) or `Enter` in Nom/Poste adds the player only when all three fields are valid.
- Maximum 40 players. A player can be removed from the roster with `×`.
- Roster sorting: `NUMBER`, `NAME`, `POSITION`; selecting the active key again toggles ascending/descending.
- `SAVE TEAM` (`#teamsSave`) requires a name and at least one player and re-validates the whole roster. Saving over a different existing team name asks for confirmation.
- `CANCEL` or `‹` returns to the overview without saving.

Validation messages (shown in `#teamsMsg`):
- `Numero must be a whole number from 1 to 99.`
- `Enter the player name.` / `Choose the player position.`
- `Player numbers must be unique.` / `Maximum 40 players.`
- `Enter a team name.` / `Add at least one player.` / `Every player needs Numero, Nom and Poste.`

## 5. CSV import

- Input: `.csv` file, UTF-8 (BOM tolerated), LF or CRLF line endings.
- Separator: auto-detected from the header line (comma, semicolon or tab).
- Quoted cells and escaped quotes (`""`) are supported.
- Headers are case- and accent-insensitive: `Numero`/`Number`, `Nom`/`Name`, `Poste`/`Position`.
- Accepted position labels (normalised): `set, setter, passeur, passeuse` → setter; `oh, outside, outside hitter, réceptionneur(-euse) attaquant(e), ra` → oh; `mb, middle, middle blocker, central(e)` → mb; `opp, opposite, pointu(e)` → opp; `lib, libero` → libero.
- Errors stop the import and report the line number: invalid Numero, missing Nom, unsupported Poste, duplicate Numero, more than 40 players, missing headers.
- On success, the editor opens pre-filled (team name taken from the file name) with `<n> players imported. Review the roster, then save the team.` Nothing is stored until `SAVE TEAM`.

## 6. Visual and accessibility rules

- Dark blue / cyan Coach View visual system; role colours follow `ROLE_PALETTE_CONTRAST_v1.15.0.md`.
- Touch targets ≥ 44 px (Add Player is 48×48 px).
- No horizontal overflow at 390×844 and 1024×768; overview cards are vertically ordered without overlap.

## 7. Acceptance

1. A player is added only with a valid Numero, Nom and Poste; duplicate numbers are rejected.
2. Sorting works on all three keys in both directions.
3. A saved team appears in REGISTERED TEAMS and in the NEW MATCH wizard.
4. A valid CSV opens a review editor; an invalid CSV reports the failing line.
