# Release notes — Volley Live Capture v1.19.1

## LIVE SCORE: score with crests and current momentum

- Moved the v1.19.0 **MOMENTUM ACTUEL** card from **LIVE TIMELINE** to **LIVE SCORE**.
- Replaced the old LIVE SCORE archive summary with the v1.19.0 score card: HOME crest/name on the left, large score and sets in the centre, set-status badge and service indicator, AWAY crest/name on the right.
- LIVE SCORE now has one non-duplicated sequence: VolleyLive header, score card, then MOMENTUM ACTUEL immediately below.
- Team crests still use a JSON logo when supplied, otherwise the existing JSON-derived monogram/initials fallback.
- Removed score/momentum markup from LIVE TIMELINE; its filters, board, rally ordering, scrolling and graph navigation are otherwise unchanged.

## Preserved behavior

- Momentum still uses the last 8 valid points of the current set, with a 4-point minimum and 70% advantage threshold.
- H/A sequence remains oldest to newest; percentages, counts and the current streak are unchanged.
- Score and momentum still rebuild from the loaded JSON after each point, correction, Undo and set change.
- No-match, new-set and insufficient-data states remain neutral gray.
- HOME stays on the left and AWAY on the right.
- Accessibility, responsive layouts and offline operation are preserved.

## Validation

- T1–T12 now open LIVE SCORE and verify that the score and momentum cards are present there and absent from LIVE TIMELINE.
- Visual checks cover LIVE SCORE at 390×844, 768×1024, 844×390 and 1536×1024, including two crests, score, sets, set badge, vertical card order and absence of the legacy duplicate score.
- LIVE TIMELINE visual baselines were refreshed only for removal of the score/momentum section.
- Full automated result: **133 passed in 295.60 s**, 0 failed; recorded in `tests/TEST_RESULTS_v1.19.1.txt`.

## Offline cache

- Cache name: `volley-live-capture-v1.19.1`.
