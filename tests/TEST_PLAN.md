# v1.5.0 Test Plan

## Automated suites in package
- `test_library_v1_5_0.py`: team/lineup/rotation library lifecycle, ROTATE +1, missing-player handling, match creation and persistence.
- `test_basic_split.py`: Basic one-tap capture, NET layout, score and undo.
- `test_double_tap.py`: fast-double-tap guard in capture flows.

## Expected baseline from v1.5.0 build session
- Setup library: 19/19.
- Basic: 9/9.
- Double-tap: 11/11.

## Manual iPhone acceptance
1. Install/update PWA and check Home displays v1.5.0.
2. Save a team, kill/reopen app, load team, edit one player, save and reload.
3. Save/load a starting seven.
4. Save rotation, press ROTATE +1 six times, verify original positions restored.
5. Start Basic/Intermediate/Advanced matches and record rallies.
6. Verify set 25+2, deciding set 15+2 and match completion.
7. Perform substitution and undo.
8. Export/open JSON and generate HTML report.
9. Enable Airplane mode after online activation and verify the app launches and captures offline.
