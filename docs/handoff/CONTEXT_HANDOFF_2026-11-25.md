# Handoff — VolleyLive refactoring (2026-11-25, updated 2026-11-26)

Purpose: let another machine or another assistant resume the work without the chat history.

## 0. Update 2026-11-26 (read first)

| Commit | Content | CI |
|---|---|---|
| `5743927` | Point 1 done: `js/index-capture-engine.js` split into `js/index-match-rules.js` (`VolleySets`, `VolleyStats`) and `js/index-rotation.js` (`VolleyRotation`); the engine keeps court rendering, focus and substitution mode | green |
| `066a17c` | Point 2 (Spectator): `spectator.js` split into `js/spectator-core.js`, `-live-score.js`, `-ranking.js`, `-timeline.js`, `-graph.js`; shared private namespace `window.VolleySpectatorParts` (mutable state in `.state`) | green |
| next commit | Point 2 (Coach): `coach.js` split into `js/coach-core.js`, `-rotations.js`, `-overview.js`, `-players.js`, `-live.js`; shared private namespace `window.VolleyCoachParts` (state object `C`) | check |

- Point 4 (docs) is up to date for these splits in `docs/ARCHITECTURE.md`.
- Public globals (`VolleySets`, `VolleyStats`, `VolleyRotation`, `VolleySpectator`, `VolleyCoach`) are unchanged.
- Method used for each split: code moved verbatim by line range (only imports/exports and state access change), then an old-vs-new comparison in headless Chrome on the reference fixtures (identical DOM and API output, no JS errors), then the CI gate.
- Cross-module calls that point to a module loaded later use a deferred wrapper (`function render(){return P.render.apply(this,arguments)}`); the later module must export the function to the shared namespace.
- The Windows machine used on 2026-11-26 has neither Python nor Node and no `gh`: CI status was read from the public GitHub API; the manifest was regenerated with an equivalent shell loop (`git cat-file blob :<path> | sha256sum`, paths sorted with `LC_ALL=C`).
- Git has no identity configured on that machine; commits used the same author as the earlier ones via `git -c user.name=... -c user.email=...`.
- Remaining: point 3 (Prettier/ESLint, needs Node), the Mobile Coach View OPP rotation spec, and the new specs added to `TO_DO/` after this handoff (Coach Intelligence, Capture 2 portrait, Matrix full capture, Physical gamepad input, Timeout card, Match report generation, End-of-set summary, Match summary JSON, Consolidated report, Real-time sharing).

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
| 1 | Split capture engine into modules | Done: report (`47f124c`), rules and rotation (`5743927`). Court rendering and substitution mode stay in `index-capture-engine.js`. |
| 2 | Split `spectator.js` and `coach.js` by view | Done (2026-11-26): Spectator `066a17c`, Coach in the following commit |
| 3 | Formatting and lint | Not started. Node.js is not installed on the Windows machine; Prettier and ESLint not run. |
| 4 | Update docs for modules | Done for points 1 and 2 in `docs/ARCHITECTURE.md` |
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

Steps 1 to 4 of the original list (CI check, point 1, point 2, docs) are done; see section 0.

1. Check CI for the Coach split commit. If red, fix before anything else.
2. Point 3, once Node.js is available for Prettier and ESLint. Formatting rewrites whole files: do it in a dedicated commit, separate from any behaviour change.
3. Mobile Coach View OPP rotation (`TO_DO/`): compare the spec with `js/coach-live.js` and `js/coach-core.js` first, then plan the implementation.
4. Triage the other `TO_DO/` specs and agree an order with the product owner.

## 10. Where the other context lives

- Repository docs: `docs/ARCHITECTURE.md` (module map), `docs/VolleyLive_Navigation_Home_Specification.md`, `docs/VolleyLive_Team_Management_Specification.md`, `docs/VolleyLive_Match_Library_Specification.md`, `docs/VolleyLive_Coach_View_Specification.md`, `docs/VolleyLive_Spectator_Timeline_Specification.md`, `docs/VolleyLive_Spectator_Ranking_Specification.md`.
- Requirements to implement later: `TO_DO/`.
- The session progress log (todo list and last checkpoint) lived in the original assistant session and is not in the repository; this file replaces it.
