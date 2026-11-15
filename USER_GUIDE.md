# Volley Live Capture v1.5.2 - User Guide

## Install or update on iPhone
1. Publish the complete application folder through HTTPS.
2. Open the application in Safari while online.
3. Share > Add to Home Screen.
4. For an update, deploy the new index.html, user_guide.pdf and sw.js, open once online, close the app completely and reopen it.
5. Verify the version on HOME.

Safari and the installed Home-screen app may have separate local storage. Save teams in the application context used courtside.

## HOME
- NEW MATCH starts a new setup.
- CONTINUE / VIEW MATCH reopens the local match.
- OPEN MATCH .JSON restores an exported match.
- USER GUIDE opens this PDF in a new browser viewer.

## Saved teams
In SETUP 1, enter the team, select jersey numbers and complete player name, position and Focus. Enter a library name and select SAVE. To modify a team, LOAD it, edit it, then SAVE under the same name. DELETE removes only the reusable template.

## Focus
Focus enabled: the player is available individually. Focus disabled: no grey TEAM placeholder appears on the court or bench during normal capture. A single large TEAM split button below the court records generic team actions. Non-focus players reappear in SUBSTITUTION mode so they remain selectable.

## Saved starting seven
In SETUP 2 assign OH1, OH2, MB1, MB2, SET, OPP and LIB. SAVE under a name such as Standard. LOAD restores it. If a saved number is absent from the current roster, the slot remains empty and must be completed manually.

## Saved initial rotations
In SETUP 3 assign P1-P6 and save the rotation. ROTATE +1 applies: P2 to P1, P1 to P6, P6 to P5, P5 to P4, P4 to P3 and P3 to P2. Six rotations restore the original composition.

## Detail levels
Basic: one split button per team with NET between them; left X = Error, right O = Point.

Intermediate: focused player, TEAM and ADVERSE split buttons; one tap records Point or Error.

Advanced: Player > Action > Neutral, Point or Error.

## Double-tap protection and UNDO
Capture controls ignore a second fast tap for 400 ms. UNDO LAST removes the latest rally, or the latest substitution when applicable.

## Substitutions
Select SUBSTITUTION, then the outgoing and incoming players. A substitution does not alter the score. Focus-disabled players are visible while substitution mode is active.

## Sets and match
Normal sets finish at 25 or more with a two-point margin. The deciding set finishes at 15 or more with a two-point margin. Capture locks after a completed set until the next set starts and after match completion.

## Statistics
STATISTICS includes point origin, error evolution, error differential, set progression and attacker charts for OH, MB and OPP players present in the log.

## Save and restore
SAVE .JSON exports portable match data. From HOME, OPEN MATCH .JSON restores the match, action log and derived statistics. Saved team/lineup/rotation templates remain independent from individual match JSON files.

## HTML report
REPORT .HTML creates a self-contained match report containing teams, sets, log, substitutions and available statistics.

## Offline check
After one online launch, close the app, enable Airplane mode and reopen from the Home-screen icon. Verify saved setup templates, match creation, capture, UNDO, JSON export and report generation.

## Troubleshooting
Old version shown: update the service-worker cache identifier, open once online, then fully close and reopen the app.

Saved setups missing: verify that the same Safari/Home-screen context is used.

Offline launch fails: reconnect and allow the service worker to cache the complete application shell, including user_guide.pdf.

## v1.5.3 updates
- Team creation offers jersey numbers 1 through 30. The roster maximum remains 12 players.
- During normal Intermediate/Advanced capture, Focus-disabled players are not represented by small grey TEAM buttons. The court/bench position stays empty and the single large bicolour TEAM button below the court is used.
- In SUBSTITUTE mode, Focus-disabled players become visible/selectable again.
- HOME contains a USER GUIDE button opening `user_guide.pdf`.
