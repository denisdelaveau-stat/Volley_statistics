# LIVE TIMELINE update — v1.16.0

This document records the implemented override to `Live_Timeline_Spectator_View_Spec.md` from `time line.docx`.

## AWAY
- Render only a circular `A` marker.
- Green: AWAY terminal action wins the rally.
- Red: AWAY terminal error gives the rally to HOME.
- No AWAY descriptive card, name, skill, qualifier or icon.

## HOME
- Keep player number, role and name.
- Show only the action/skill name.
- POINT = green, ERROR = red, NEUTRAL/CONTINUE = blue.
- Shared role colors: OPP blue, SET yellow, OH red/pink, MB green, LIB grey.

## Score and connector
- AWAY score is left; HOME score is right.
- Color only the winner half: SO yellow, HOME BP green, AWAY BP red; the other half is black.
- No SO/BP/L badge is visible.
- The connector is centered on the score pill and ends at the pill boundary without overlap.

## Preserved behavior
- DERNIER POINT, delta lanes, oldest/newest filter, action-count filter, ARCHIVE/REPLAY state and offline support.
- All content is derived from the loaded official JSON. Basic data remains score-only.
