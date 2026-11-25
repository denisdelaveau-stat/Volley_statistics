# VolleyLive v1.28.0

Offline-first volleyball capture, coach, spectator, library and reporting application.

## v1.28.0 highlights

- FOCUS, SPEED+ and FLOW can be switched directly during live capture.
- Mode switching preserves the match, score, event history, selected author and selected action.
- Runtime mode selection is intentionally absent from SETTINGS.
- All modes use the same fixed action grid and immediate result commit.
- Canonical runtime fields are added without breaking the historical event schema.
- Opponent A, atomic Undo, double-tap protection, role preferences, haptics and responsive layouts are covered.

## Run locally

```bash
python3 serve_local.py
```

## Validate

```bash
bash tests/run_v1_28_approved.sh
node --check runtime-input.js
node --check match-hub.js
node --check spectator.js
node --check statistics/adapter.js
node --check coach.js
node --check sw.js
```

Requirements: Python 3 with `pytest`, `playwright` (Chromium), `numpy`, `pillow`, `python-docx` and `jsonschema`. Set `CHROMIUM_PATH` to use a specific Chromium binary; otherwise Playwright's bundled Chromium is used. The same gate runs on every push via `.github/workflows/tests.yml`.

Visual baselines in `tests/visual_baselines/` were captured with Linux Chromium; pixel comparisons can exceed their thresholds on other platforms because of font rasterisation.

## Bump the version

```bash
python tools/bump_version.py 1.29.0
```

This updates `VERSION`, the service-worker cache name, the Home version label and this README. Tests read `VERSION`.

## Regenerate the source manifest

```bash
git add -A
python tools/generate_manifest.py          # writes SOURCE_MANIFEST_v<VERSION>.txt
python tools/generate_manifest.py --check  # fails if the manifest is stale
```

Hashes are computed from the git index, so they do not depend on local line endings.

## Repository layout

- Application runtime files are at the repository root, plus `statistics/` (shared adapter and fixtures) and `icons/`.
- `docs/` holds the specifications. `docs/ARCHITECTURE.md` maps every interface to its specification.
- `tests/` holds the acceptance suite, visual baselines and the approved release gate.
- `docs/archive/` keeps historical release notes, implementation reports, manifests and test results.

## Current release documents

- `RELEASE_NOTES_v1.28.0.md`
- `IMPLEMENTATION_REPORT_v1.28.0.md`
- `COPY_INSTRUCTIONS_v1.28.0.md`
- `SOURCE_MANIFEST_v1.28.0.txt`
- `docs/VISUAL_VALIDATION_v1.28.0.md`
- `tests/TEST_RESULTS_v1.28.0.txt`
