# v1.5.0 - Saved teams, starting 7 and rotations

## SETUP 1 - Team (number / name / position)
- "Saved teams" card: list + LOAD + DELETE, name field + SAVE.
- Saved: team name, roster numbers, player name, position, Focus.
- Modify = LOAD, edit, SAVE with the same name (confirmation before replacing).
- Loading a team removes from the starting 7 the players no longer in the roster and resets the rotation.

## SETUP 2 - Starting 7
- "Saved starting 7" card (same controls). Saved: the 7 slots (OH1, OH2, MB1, MB2, SET, OPP, LIB).
- Loading checks each number against the current roster: missing players leave the slot empty
  and are listed in the message ("not available, to complete: #9").

## SETUP 3 - Initial rotation
- "Saved rotations" card (same controls). Saved: P1..P6.
- New **ROTATE +1** button, clockwise: P2→P1, P1→P6, P6→P5, P5→P4, P4→P3, P3→P2.
  6 rotations bring back the original position. The result can be saved as a new rotation.
- Going from SETUP 2 to SETUP 3 now keeps a rotation still valid for the current starting 7.

## Storage
- localStorage key `volleyCapture.library.v1` = `{team:{name:…}, lineup:{name:…}, rot:{name:…}}`,
  independent from the matches (not erased by NEW MATCH).
- Match data model unchanged.

## Tests
- tests/test_library_v1_5_0.py 19/19 · test_basic_split 9/9 · test_double_tap 11/11.

## Update on iPhone
Replace `index.html`, set `CACHE = 'volley-live-capture-v1.5.0'` in `sw.js`, open once with network, close and reopen.
Note: Safari and the Home-screen app have separate storage; save the library in the app you use.
