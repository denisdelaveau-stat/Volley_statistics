# Implementation report — Volley Live Capture v1.6.8

## Scope
v1.6.8 starts from the published complete `Volley_statistics_v1.6.7.zip` package and corrects the two requested presentation details without changing match data or scoring behaviour.

## Delivered changes
1. The compact volleyball net no longer uses a dark background fill. Its field is transparent, so the light page background remains visible through grey mesh lines.
2. The existing 28 px net height, top tape, lower edge, blue posts, red/white antennas and layout proportions are retained.
3. All six player-silhouette SVGs are removed from the Advanced action-label column.
4. Attack/Block remain light orange, Defence/Reception light green and Service/Set light blue.
5. Rare legal rows retain reduced opacity; blocked Libero actions remain disabled.
6. Label layout now explicitly preserves complete names without ellipsis or clipping, including `Reception` at the 390 px reference viewport.
7. Visible version and service-worker cache are advanced to v1.6.8.

## Documentation and evidence
- English UI functional specification advanced to document version 1.8, with a v1.6.8 correction section and acceptance criteria.
- All 11 original inline images and all 22 original media entries are retained.
- Four current iPhone screenshots and a four-page PDF cover Basic, Intermediate, Advanced and expanded-History states.
- Automated tests verify transparent net background, retained net construction/proportions, absence of action silhouettes, full label visibility, semantic colours and rare-action attenuation.

## Compatibility
Portable match JSON remains format version 1. Scoring, rotation, substitution, saved-team and PWA icon data are unchanged.

## Verification
See `tests/TEST_RESULTS_v1.6.8.txt` for final automated and artifact verification results.
