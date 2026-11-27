# SYS-QA — Quality: tests, gate and continuous integration

| Field | Value |
|---|---|
| Spec ID | `SYS-QA` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-27 |
| Source of truth | `.github/workflows/tests.yml`, `tests/run_gate.sh`, `tests/conftest.py`, `tests/support/`, `tests/unit/`, `package.json`, `eslint.config.js`, `.prettierrc.json`, `tools/ci_annotate_failures.py`, `tools/generate_manifest.py` |
| Related specs | SYS-ARCH, SYS-I18N (test language), every spec (section 9) |

## 1. Purpose

Defines how VolleyLive is verified before a change is accepted: the kinds of tests, how they are organised, what the
continuous integration runs, and what "done" means for a change.

## 2. Scope

- In scope: static checks, unit tests, browser tests, visual baselines, specification checks, CI, release gate.
- Out of scope: what each test verifies (section 9 of each spec).

## 3. Definitions

- Gate: `tests/run_gate.sh`, the whole browser test suite (pytest + Playwright); a release requires it green.
- Visual baseline: a reference screenshot (`tests/visual_baselines/`) compared with the current rendering.

## 4. Requirements

### 4.1 Test organisation

| ID | Requirement | Rule / source |
|---|---|---|
| `SYS-QA-01` | Browser tests are organised by screen: `tests/capture/`, `setup/`, `teams/`, `home/`, `library/`, `coach/`, `spectator/`, `shared/`; a file is named after the feature it tests (`test_<feature>.py`). | Maintainability |
| `SYS-QA-02` | Code shared by tests lives in `tests/support/` (`helpers.py`, `capture_support.py`, `spectator_support.py`); a test file never imports another test file. | Maintainability |
| `SYS-QA-03` | Unit tests (`tests/unit/*.test.js`, `node:test`) cover the pure modules (rules, adapter, storage, translations, specifications) in a Node `vm` context without DOM (`load-browser-scripts.js`). | SYS-ARCH-09 |
| `SYS-QA-04` | Each browser test module declares the interface language of its assertions (`UI_LANGUAGE = "en"`; French when omitted; `None` for the language tests); the language is written like the test's own data, never from an init script. | SYS-I18N |
| `SYS-QA-05` | A browser test fails on any page error (`pageerror`) it collects. | Robustness |
| `SYS-QA-06` | Visual baselines are produced and compared on Linux, the CI reference; a different operating system may show font differences that are not regressions. | Determinism |

### 4.2 Continuous integration

| ID | Requirement | Rule / source |
|---|---|---|
| `SYS-QA-07` | On every push to `main` and every pull request, the CI runs in order: JavaScript syntax check, ESLint with zero warnings, Prettier check (JavaScript and CSS), unit tests, and the gate; any failure fails the run. | Quality gate |
| `SYS-QA-08` | Every failing browser test is published as an annotation with its first error lines (`tools/ci_annotate_failures.py`), readable on the run page and through the public check-runs API. | Diagnosability |
| `SYS-QA-09` | The CI uses current runtimes (Node.js 24 LTS, Python 3.12, GitHub actions running on Node 24). | Maintenance |

### 4.3 Definition of done

| ID | Requirement | Rule / source |
|---|---|---|
| `SYS-QA-10` | A change is done when lint, Prettier, the unit tests and the gate pass, the specifications it affects are updated in the same commit, and the source manifest is regenerated. | Process |
| `SYS-QA-11` | Every requirement of every specification is traced to a test or a manual check, every cited test exists, and every specification follows the template; `tests/unit/specs.test.js` checks it. | Traceability |
| `SYS-QA-12` | A bug fixed gets a test that fails without the fix. | Process |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| Visual baseline differs on Windows | Known font difference: the Linux CI decides. |
| Flaky test | Investigated and fixed, never retried until green (see the init-script fix of 2026-11-27). |

## 6. Data

Fixtures: `tests/data/` (Capture v1 reference) and `statistics/data/` (unified v2.1 fixture). Baselines:
`tests/visual_baselines/`.

## 7. Interface

| Command | Runs |
|---|---|
| `npm run lint` | ESLint, zero warnings |
| `npm run format` / `npm run format:check` | Prettier (JavaScript and CSS) |
| `npm run test:unit` | `node --test "tests/unit/*.test.js"` |
| `bash tests/run_gate.sh [pytest options]` | `pytest -q tests` |
| `python tools/generate_manifest.py` | Regenerates `SOURCE_MANIFEST_v<VERSION>.txt` |

## 8. Accessibility and language

Browser tests check accessibility attributes, touch target sizes and phone layouts per screen (section 9 of each UI
spec).

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `SYS-QA-01`, `-02` | Manual review of `tests/`; `tests/run_gate.sh` collects every folder |
| `SYS-QA-03` | `tests/unit/court-consistency.test.js` « rotation engine and adapter give the same players on court at every event » (runs browser modules in Node) |
| `SYS-QA-04` | `tests/shared/test_i18n.py::test_french_by_default_and_english_from_settings` (`UI_LANGUAGE = None`); `tests/conftest.py` |
| `SYS-QA-05` | Every browser test asserts `not errors` (for example `tests/capture/test_set_lineup.py::test_cancelling_the_line_up_sheet_keeps_the_finished_set`) |
| `SYS-QA-06` | `tests/spectator/test_ranking.py::test_v1_20_visual_baselines_for_ranking` (CI, Linux) |
| `SYS-QA-07` to `-09` | `.github/workflows/tests.yml` (each run of the CI) |
| `SYS-QA-10` | Manual review of each commit (checklist in `README.md`, contributor rules) |
| `SYS-QA-11` | `tests/unit/specs.test.js` |
| `SYS-QA-12` | Manual review (for example `tests/capture/test_chart_data.py` fails when the chart data is not saved) |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-27 | First version; replaces `tests/TEST_PLAN.md` (v1.26.0). |
