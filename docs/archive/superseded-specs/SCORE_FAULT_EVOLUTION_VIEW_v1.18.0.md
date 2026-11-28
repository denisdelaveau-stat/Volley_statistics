# LIVE GRAPH — Score and Fault Evolution (v1.18.0)

## Source and scope

This release implements the approved `VolleyLive – Score & Fault Evolution View Specification v1.0` from the verified v1.17.0 complete package. LIVE SCORE, LIVE TIMELINE, archive loading, Capture v1 migration, Advanced Statistics, Coach View and offline behavior remain present.

## Domain model

`modelV2` and `modelV1` each build one ordered selected-set rally timeline. Every item owns the common `rallyKey` and contains official post-rally score, score delta, SO/BP classification, cumulative HOME/AWAY fault counts, fault increments and fault delta. Both visible panels render the same array.

Faults use the shared `VolleyStatsAdapter.isFaultEvent` rule. It accepts active ACTION records whose canonical evaluation is `ERROR`/`FAULT`; statistics normalization and the spectator evolution view therefore share the same domain rule. Voided records are ignored. Corrections and Undo rebuild the full selected-set timeline.

## Alignment contract

Both value rows and both SVG charts use `--label-column-width` followed by the same `repeat(--visible-rally-count, minmax(--rally-min-width, 1fr))` CSS grid. Chart view boxes are measured from the rendered plot width. Automated geometry tests compare score cell, score point, fault cell and fault point centers with a one-CSS-pixel tolerance.

## Accessibility and interaction

Controls meet the 44 CSS pixel target, remain keyboard operable and expose visible focus. Score/fault cells have value-plus-state accessible names. Each chart has a computed screen-reader summary. Reduced motion is honored. Set selection, window size and ordering are persisted; live-history browsing exposes `Retour au direct` without forcing the viewport when new data arrives.

## Evidence

Automated coverage is in `tests/spectator/test_score_fault_evolution.py`. Visual regression baselines cover desktop/tablet landscape, smartphone landscape and smartphone portrait. Additional screenshots cover HOME/AWAY lead, equality, a long set, no rally, one rally and history browse with `Retour au direct`.
