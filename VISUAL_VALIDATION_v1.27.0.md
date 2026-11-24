# Visual validation — MATCH LIBRARY v1.27.0

Reference: `IMG_5746.PNG` and `VolleyLive_Match_Library_Redesign_Spec.md`.

Validated at 390 × 844 and 360 × 800:

- title/subtitle and top-right Import action;
- All / Live / Finished segmented control with inline counters;
- one non-wrapping row per match with aligned HOME, score, and AWAY columns;
- status dot, live context or finished date, details control, and selected check;
- status legend;
- fixed, safe-area-aware bottom action bar;
- context hidden first below 380 px;
- no horizontal overflow and row height within the 56–58 px target.

Automated browser coverage: `tests/test_match_library_v1_27.py`.
