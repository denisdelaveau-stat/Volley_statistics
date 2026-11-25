# Handoff — VolleyLive refactoring (2026-11-25)

Purpose: let another machine or another assistant resume the work without the chat history.

## 1. Repository and branch

- Remote: `https://github.com/denisdelaveau-stat/Volley_statistics.git`
- Working branch: `refactoring` (pushed, tracks `origin/refactoring`). `main` is untouched.
- Pull request #2 targets `main` and runs the `Tests` workflow.
- Latest commit at handoff: `fdc9a72` (TO_DO folder). Before it: `47f124c`, `9756ba7`.

## 2. Commit history of this session (oldest first, branch `refactoring`)

| Commit | Content |
|---|---|
| `c9065a0` | Repository cleanup for v1.28.0: files relocated per `SOURCE_MANIFEST_v1.28.0.txt`, stale files removed, `docs/archive/` created, `.gitignore` added |
| `cb4113e`, `acdd46b`, `bec0bb4`, `bf9cbc2` | Remove duplicate root `.docx`; read `VERSION` in tests; `tools/bump_version.py`; Team Management and Settings extracted to `team-management.js` / `settings.js`; GitHub Actions workflow `.github/workflows/tests.yml` |
| `abcb02b` | Triage of tests missing from the approved gate; `test_history_delete_v1_28.py` added |
| `f3ff2d7`, `d0f1a67` | `tools/generate_manifest.py`; flaky Match Library import test fixed; CI triggers on PR and push to `main` |
| `e070876` | Spectator Ranking spec and consolidated Timeline spec; superseded timeline docs archived under `docs/archive/superseded-specs/` |
| `8b67e61` | Manifest regenerated |
| `9756ba7` | `index.html` inline CSS/JS moved to `css/index-*.css` and `js/index-*.js`; Basic and Intermediate capture levels and the detail-level setting removed (Advanced only) |
| `47f124c` | Match report builder extracted to `js/index-report.js` (`window.VolleyReport.build(match, events)`) |
| `fdc9a72` | `TO_DO/` folder: Mobile Coach View OPP rotation spec and mockup |

## 3. Validation status

- **`9756ba7`: CI Linux green**, full approved gate (29 test files) passed on Ubuntu, including the 6 visual baseline comparisons that fail on Windows.
- **Full approved gate on Windows before `47f124c`:** 132 passed, 6 failed (visual baselines only; known Windows rendering difference).
- **`47f124c`:** 32 targeted tests passed on Windows (`test_e2e_pwa`, `test_match_library_v1_27`, `test_v1_7_home`, `test_runtime_input_v1_28`, `test_history_delete_v1_28`). The CI run for this commit was in progress at handoff and its result was **not verified**.
- Check the CI status first on the next machine: the Actions tab for branch `refactoring`.

## 4. Approved gate

```bash
bash tests/run_v1_28_approved.sh
```

The script lists all 29 test files explicitly. It must be regenerated when test files are added or removed (see the triage commit).

## 5. Work done versus remaining

| # | Point | State |
|---|---|---|
| 1 | Split capture engine into modules | Partial: report extracted (`47f124c`). Rules, rotation, rendering and input not split. |
| 2 | Split `spectator.js` and `coach.js` by view | Not started |
| 3 | Formatting and lint | Not started. Node.js is not installed on the Windows machine; Prettier and ESLint not run. |
| 4 | Update docs for modules | Partial: `docs/ARCHITECTURE.md` lists `css/` and `js/` modules; update after points 1 and 2. |
| — | Mobile Coach View OPP rotation feature | Requirement only, in `TO_DO/`. Not implemented; not yet checked against `coach.js`. |

## 6. Decisions taken

- Capture is **Advanced only**. `detailLevel` is still written as `'advanced'` in saved matches for compatibility with existing readers.
- Spectator and Coach still **read** legacy `detailLevel: 'basic'` archives (data compatibility, not a UI mode).
- The service-worker cache name is **not** bumped on this branch: release versioning is a separate decision. Use `tools/bump_version.py` at release time.
- Visual baselines were captured on Linux. Windows failures on those 6 tests are expected; CI on Linux is the reference.
- Tests that targeted the removed Basic and Intermediate UI were deleted or rewritten for the Advanced flow. Coverage kept: Undo, double-tap guard, history delete, set end, report, settings, new match wizard.

## 7. Known pitfalls

- **Middle dot and accents through PowerShell to Python stdin** can be mis-encoded. Write the script with `\u00b7` escapes, or write the Python file first.
- **`Path.read_text()` converts CRLF to LF.** `index.html` is CRLF in the working copy; use `newline=''` when rewriting it, or diffs become whole-file.
- **Regex block removal** with `re.S` can span more lines than intended. Verify with a `difflib` comparison against `git show HEAD:<file>` before committing.
- **Global bindings:** `js/*.js` modules are classic scripts sharing `window`. Load order in `index.html` matters (`index-report.js` before `index-capture-tools.js`).
- **Cache list:** every new `css/` or `js/` file must be added to `ASSETS` in `sw.js`, or offline use breaks.
- **Manifest:** run `python tools/generate_manifest.py` after `git add -A`, then commit the manifest. `--check` detects a stale one.

## 8. Local environment (not in the repository)

- The Python test environment was created outside the repository. Recreate it on another machine:

```powershell
python -m venv .venv-tests
.venv-tests\Scripts\python.exe -m pip install pytest playwright numpy pillow python-docx jsonschema pyflakes
.venv-tests\Scripts\python.exe -m playwright install chromium
```

- If pip needs a proxy, pass `--proxy <url>`.
- Node.js is not installed locally; syntax checks were done by the CI job (`node --check`).

## 9. Next steps (recommended order)

1. Check CI for `47f124c` and `fdc9a72`. If red, fix before any new refactoring.
2. Point 1: extract the set and match result rules from `js/index-capture-engine.js` into a separate module, keeping the same global names. Validate with the 32 targeted tests, then the full gate.
3. Point 2: split coach and spectator code by view, starting with the Spectator timeline (the heaviest).
4. Point 4: update `docs/ARCHITECTURE.md` and the specs after each split.
5. Point 3 last, once Node.js is available for Prettier and ESLint.
6. Mobile Coach View OPP rotation (`TO_DO/`): compare the spec with `coach.js` first, then plan the implementation.

## 10. Where the other context lives

- Repository docs: `docs/ARCHITECTURE.md` (module map), `docs/VolleyLive_Navigation_Home_Specification.md`, `docs/VolleyLive_Team_Management_Specification.md`, `docs/VolleyLive_Match_Library_Specification.md`, `docs/VolleyLive_Coach_View_Specification.md`, `docs/VolleyLive_Spectator_Timeline_Specification.md`, `docs/VolleyLive_Spectator_Ranking_Specification.md`.
- Requirements to implement later: `TO_DO/`.
- The session progress log (todo list and last checkpoint) lived in the original assistant session and is not in the repository; this file replaces it.
