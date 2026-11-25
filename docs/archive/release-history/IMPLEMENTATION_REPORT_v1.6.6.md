# Implementation report — Volley Live Capture v1.6.6

Date: 17 November 2026
Source request: `Modification UI 5.docx`
Baseline: full v1.6.4 package with the v1.6.5 modified-files overlay applied.

## Implemented
1. BENCH replacement and SUBSTITUTION controls reduced to 66×36 and 122×36 CSS px at 390×844.
2. Setup roster maximum extended from 20 to 30; jersey buttons now cover 1–30.
3. Black NET band vertical padding reduced from 8 px to 4 px.
4. Rotation line changed to `Rot. Pn | Rn | Cn`; setter position is derived from the live rotation, R is `(side-outs mod 6)+1`, C is `floor(side-outs/6)+1`, with equal score/phase spacing.
5. RECEPTION changed to blue and both phase states reduced in height.
6. Undo changed to light orange.
7. TEAM/ADVERSE result bars reduced from 76 px to 60 px.
8. Advanced action labels grouped by requested light colours; rare legal actions retain reduced opacity.
9. Live History reduced to `#`, `Player`, `Action`, `Result`, `Score`; event `time` and integer `rotation` persistence is unchanged.

## Updated deliverables
- Application code, service-worker cache and VERSION.
- English Word UI specification version 1.6, preserving the original embedded visuals.
- Functional specification, README, release notes and changelog.
- Browser acceptance tests and test plan.
- Current v1.6.6 screenshot PDF.
- Full and modified-files ZIP packages with SHA-256 manifests.

## Compatibility
Portable match JSON remains schema version 1. Existing saved matches and events remain readable. The history change is presentation-only; no event fields were removed.
