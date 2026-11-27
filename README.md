# VolleyLive v1.28.0

Offline-first volleyball capture, coach, spectator, library and reporting application. It is a progressive web app made of classic browser scripts: there is no build step.

## Run locally

```bash
python3 serve_local.py
```

## Structure

- `index.html`: Home, setup, live capture, Match Hub and Match Library, Coach View. `spectator.html`: Spectator View.
- `js/`: application modules (shared helpers and domain, capture, charts, Coach and Spectator views). Root `*.js` files are page controllers.
- `statistics/`: shared data adapter (validation and conversions) and reference fixtures.
- `docs/ARCHITECTURE.md`: module map, load order, shared contracts, storage keys, and the rotation, libero (FIVB Rule 19) and substitution (FIVB Rule 15) rules. Start there.
- `tests/`: Playwright acceptance suite and approved gate. `tests/unit/` holds the `node:test` unit tests of the pure modules.
- `tools/`: release version bump and source manifest.
- `docs/archive/`: release history and superseded specifications. `TO_DO/`: requirements not implemented yet.

## Develop and validate

JavaScript tooling (Node.js 20 or later):

```bash
npm ci
npm run lint          # ESLint, no warning allowed
npm run format        # Prettier (JavaScript only; HTML and CSS are hand-formatted)
npm run format:check
npm run test:unit     # node:test unit tests (tests/unit)
```

Acceptance gate (Python 3 with `pytest`, `playwright` (Chromium), `numpy`, `pillow`, `python-docx` and `jsonschema`):

```bash
bash tests/run_v1_28_approved.sh
```

CI (`.github/workflows/tests.yml`) runs the syntax check, ESLint, Prettier, the unit tests and the acceptance gate on every pull request and every push to `main`. Run `npm run format` before committing JavaScript changes.

Set `CHROMIUM_PATH` to use a specific Chromium binary; otherwise Playwright's bundled Chromium is used. Visual baselines in `tests/visual_baselines/` were captured with Linux Chromium. On other platforms, six pixel comparisons can exceed their thresholds because of font rendering; CI on Linux is the reference.

## Rules for contributors

- Every non-constant value inserted with `innerHTML` goes through `VolleyDom.esc()`, or use `textContent` (`tests/test_html_escaping.py`).
- Storage keys and shared role labels come from `VolleyDomain`. Read stored JSON with `VolleyDomain.readStored()`, which reports corrupted values instead of hiding them.
- Rotation, libero and substitution rules live only in `js/index-rotation.js` and `js/index-substitution-rules.js`, with their unit tests.
- Each new `js/` or `css/` file must be added to `ASSETS` in `sw.js`, or offline use breaks.

## Release

```bash
python tools/bump_version.py 1.29.0   # VERSION, service-worker cache, Home version label, this README
git add -A
python tools/generate_manifest.py     # writes SOURCE_MANIFEST_v<VERSION>.txt (hashes from the git index)
python tools/generate_manifest.py --check
```

Release documents of the current version: `RELEASE_NOTES.md`, `COPY_INSTRUCTIONS.md`, `CHANGELOG.md`, `SOURCE_MANIFEST_v1.28.0.txt`. Earlier versions are in `docs/archive/release-history/`.
