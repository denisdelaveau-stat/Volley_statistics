# Volley Live Capture v1.6.5 — Implementation Report

Date: 17 November 2026

## Baseline
The published complete v1.6.4 package was used as the baseline. Its 13-test Playwright/pytest suite passed before modification.

## Implemented corrections
1. Removed `UI-ADV-POS-01` and `UI-ADV-POS-02` from section 8 Target UI Matrix of the English Word specification.
2. Inserted both scenarios after `UI-ADV-03` in section 10 Automated Acceptance Test Catalogue.
3. Advanced document control from 1.4 to 1.5 and package/application/cache version from v1.6.4 to v1.6.5.
4. Preserved the 11 original inline images and all 22 `word/media` entries byte-for-byte.
5. Copied the corrected Word file to both `docs/` and package root.
6. Replaced the obsolete v1.3.2 screenshot PDF with five current UI captures: Basic, Intermediate, Advanced, compact live header and Setup 1.
7. Added an automated document/package regression test and regenerated release documentation and SHA-256 manifests.

## Compatibility
No capture logic or match-data schema changed. Portable match JSON remains format version 1.

## Verification
See `tests/TEST_RESULTS_v1.6.5.txt` for the final automated result and package checks.
