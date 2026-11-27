# Handoff — VolleyLive refactoring (2026-11-25, updated 2026-11-27)

Purpose: let another machine or another assistant resume the work without the chat history.

## 0. Update 2026-11-26 (read first)

| Commit | Content | CI |
|---|---|---|
| `5743927` | Point 1 done: `js/index-capture-engine.js` split into `js/index-match-rules.js` (`VolleySets`, `VolleyStats`) and `js/index-rotation.js` (`VolleyRotation`); the engine keeps court rendering, focus and substitution mode | green |
| `066a17c` | Point 2 (Spectator): `spectator.js` split into `js/spectator-core.js`, `-live-score.js`, `-ranking.js`, `-timeline.js`, `-graph.js`; shared private namespace `window.VolleySpectatorParts` (mutable state in `.state`) | green |
| `923fe34` | Point 2 (Coach): `coach.js` split into `js/coach-core.js`, `-rotations.js`, `-overview.js`, `-players.js`, `-live.js`; shared private namespace `window.VolleyCoachParts` (state object `C`) | green |
| `859ce79`, `7d3cb8d` | Point 3: (a) ESLint + Prettier tooling (`package.json`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`), lint fixes, ESLint step in CI; (b) Prettier formatting of all JavaScript, `prettier --check` step in CI | green |

### Audit of 2026-11-26 and follow-up (all green in CI)

| Commit | Content |
|---|---|
| `3f731e9`, `0a7e0ed` | HTML injection fixed in the capture screen; one shared `VolleyDom.esc()` (`js/shared-dom.js`); `tests/test_html_escaping.py` |
| `bdc8400` | `js/shared-domain.js` (`VolleyDomain`: storage keys, role labels, court geometry); one rotation engine (`VolleyRotation.trace()`) for capture and Coach View |
| `a55e379` | One libero rule everywhere (capture, Coach View, Spectator matrix), FIVB Rule 19, applied rally after rally; unit tests `tests/unit/` (`npm run test:unit`, run by CI) |
| `e42fb33` | Capture charts split out of `js/index-capture-tools.js` into `js/index-chart-*.js` (`VolleyCaptureCharts`) |
| `90ef86f` | Substitutions restored in the capture screen (they could not be recorded since v1.28), FIVB Rule 15 (`js/index-substitution-rules.js`, `tests/test_substitutions.py`) |
| `f245c1e` | Dead capture UI layers removed (`js/index-normative-capture.js`, legacy court and substitution sheet of the engine, legacy step markup) |
| `f9ecb63` | Capture ad-hoc globals replaced by the documented `window.VolleyCapture` contract |

Rules and contracts are documented in `docs/ARCHITECTURE.md` (sections "Capture screen contract", "Rotation and libero rules", "Substitution rules").

### Points to verify later

- **Capture screen charts (decided 2026-11-26: keep for now).** `css/index-result-grammar.css` hides the whole statistics panel of the capture screen (`#statsToggle,#statsPanel{display:none!important}`). The panel holds the score progression, point origin pies, error charts and attacker cards (`js/index-chart-*.js` and `renderAttackers` in `js/index-capture-tools.js`). They are still recomputed and redrawn after every action, about 1,000 lines of work that nobody sees. The chart data (`volleyCapture.chartData.v1`) must stay either way: it is exported with the match and read by the Match Hub and `statistics/adapter.js`. Options: remove the drawing code (if these statistics now live in the Coach and Spectator views), show the panel again, or keep as is.
- Starting players are taken from `match.startingRotation` for every set (substitution rules, Rule 15): a different line-up per set needs a data-format change.
- Second libero and libero re-designation (FIVB 19.1.1, 19.4) are not modelled: one libero per match in the data.

### Remaining audit step

- Step 6: CSS done on 2026-11-27 (format-independent CSS assertions, all stylesheets formatted by Prettier, 34 screens compared pixel by pixel: identical). Left: tests organised by feature instead of by version.

### Interface translation FR/EN (2026-11-27, all green in CI)

French is the default language; English is chosen in Settings (page reloaded). How it works: `docs/ARCHITECTURE.md` (i18n row) and the contributor rules of `README.md`.

| Commit | Content |
|---|---|
| `a35dd97` | Step 5 hygiene done: no silent errors, strict lint (0 warnings), lighter assets, up-to-date docs |
| `a3d6a59` | Lot 1: translation layer (`js/shared-i18n.js`, `js/i18n/fr.js`, `js/i18n/en.js`), language choice in Settings, `tests/unit/i18n.test.js`, `tests/test_i18n.py` |
| `fa04e4b`, `d56a72a`, `c2aa42a` | Lots 2–4: Home, navigation, Team Management, New Match wizard, capture screen, Match Hub, Match Library, reports |
| `44b3d33` | Intermittent Linux CI failures fixed (see "Known pitfalls" below); static text translated by an explicit `VolleyI18n.apply()` before the app scripts |
| `b0f8959`, `794e4ad` | Lot 5: Coach View, including LIVE COURT and PLAYER FOCUS |
| `a9109c2` | Lot 6: Spectator View and the match file messages of `statistics/adapter.js` |

- Test language: `tests/conftest.py` gives each test module the language of its assertions (`UI_LANGUAGE = "en"` at the top of a module, French otherwise; `None` for `tests/test_i18n.py`). French writes nothing; another language is written to localStorage after the first navigation and before each reload. **Never** from `page.add_init_script`: a localStorage access at document start made the data a test writes just before a reload get lost, intermittently, on the Linux CI only (different tests failed on each run).
- Failing tests are published as CI annotations (`tools/ci_annotate_failures.py`), readable through the public API `/repos/<owner>/<repo>/check-runs/<job id>/annotations` without authentication.
- Kept as they are in both languages (decided 2026-11-27: some English terms are fine in the French interface): product names (VolleyLive, LIVE COURT, PLAYER FOCUS), stat codes (PTS, ERR, EFF, SO, BP, KILL...), HOME/AWAY, and the Spectator View labels already in English (SCORES, TIMELINE, GRAPH, RANKING, Roster Ranking, Highlight/Lowlight/Delta, ranking categories). Translating those labels later would change the screenshots of the visual-baseline tests, to be regenerated on Linux (the CI reference), not on Windows.
- Hidden capture charts (`js/index-chart-*.js`, attacker cards) are not translated: see the first point below.

### Points to verify later


- Point 4 (docs) is up to date for these splits in `docs/ARCHITECTURE.md`.
- Public globals (`VolleySets`, `VolleyStats`, `VolleyRotation`, `VolleySpectator`, `VolleyCoach`) are unchanged.
- Method used for each split: code moved verbatim by line range (only imports/exports and state access change), then an old-vs-new comparison in headless Chrome on the reference fixtures (identical DOM and API output, no JS errors), then the CI gate.
- Cross-module calls that point to a module loaded later use a deferred wrapper (`function render(){return P.render.apply(this,arguments)}`); the later module must export the function to the shared namespace.
- The Windows machine used on 2026-11-26 has no `gh`. Node.js LTS and Python 3.12 were installed there with winget; the test venv is `C:\Users\denis\.venvs\volley-tests` (outside the repository). On Windows the gate shows only the 6 known visual-baseline failures. CI status was read from the public GitHub API (job logs need authentication); the manifest was regenerated with an equivalent shell loop (`git cat-file blob :<path> | sha256sum`, paths sorted with `LC_ALL=C`).
- Git has no identity configured on that machine; commits used the same author as the earlier ones via `git -c user.name=... -c user.email=...`.
- Point 3 details: Prettier formats JavaScript and, since 2026-11-27, CSS (`printWidth` 120, single quotes, `trailingComma: es5`); HTML is excluded because tests assert exact markup. CSS assertions use `compact_css()` in `tests/helpers.py`. Formatting was checked with `prettier --debug-check` (AST unchanged) and the headless Chrome comparisons. ESLint runs `js.configs.recommended` with browser globals and the project globals listed in `eslint.config.js`; 0 errors, 12 warnings left on purpose (unused locals in existing code, harmless `var` re-declarations, and `exportReport()` in `js/index-capture-tools.js`, which is defined but never called).
- After point 3, run `npm run format` before committing JavaScript changes, or CI fails on `prettier --check`.
- Remaining: the Mobile Coach View OPP rotation spec, and the new specs added to `TO_DO/` after this handoff (Coach Intelligence, Capture 2 portrait, Matrix full capture, Physical gamepad input, Timeout card, Match report generation, End-of-set summary, Match summary JSON, Consolidated report, Real-time sharing).

## 1. Repository and branch

- Remote: `https://github.com/denisdelaveau-stat/Volley_statistics.git`
- Working branch: `refactoring` (pushed, tracks `origin/refactoring`). `main` is untouched.
- Pull request #2 targets `main` and runs the `Tests` workflow.
- Latest commit at handoff: `fdc9a72` (TO_DO folder). Latest commit after the 2026-11-26 work: see section 0.

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
| 3 | Formatting and lint | Done (2026-11-26): ESLint and Prettier set up, all JavaScript formatted, both checked in CI (see section 0) |
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
- **Tests and localStorage:** never touch localStorage from `page.add_init_script` (it runs at document start on every navigation): on the Linux CI, data written by a test just before `page.reload()` was then lost intermittently. Write test data with `page.evaluate`, then reload.
- **Translations and rendering order:** a page calls `VolleyI18n.apply()` once its markup is parsed and before its app scripts (`index.html`, `spectator.html`); otherwise the static French/English text would overwrite what the scripts already rendered. Keep French text identical when touching the Spectator View, or its Linux visual baselines change.
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

Points 1 to 4 are done; see section 0.

1. Check CI for the two point 3 commits. If red, fix before anything else.
2. Optional clean-up of the 12 ESLint warnings (unused locals, dead `exportReport()`), in its own commit.
3. Mobile Coach View OPP rotation (`TO_DO/`): compare the spec with `js/coach-live.js` and `js/coach-core.js` first, then plan the implementation.
4. Triage the other `TO_DO/` specs and agree an order with the product owner.

## 10. Where the other context lives

- Repository docs: `docs/ARCHITECTURE.md` (module map), `docs/VolleyLive_Navigation_Home_Specification.md`, `docs/VolleyLive_Team_Management_Specification.md`, `docs/VolleyLive_Match_Library_Specification.md`, `docs/VolleyLive_Coach_View_Specification.md`, `docs/VolleyLive_Spectator_Timeline_Specification.md`, `docs/VolleyLive_Spectator_Ranking_Specification.md`.
- Requirements to implement later: `TO_DO/`.
- The session progress log (todo list and last checkpoint) lived in the original assistant session and is not in the repository; this file replaces it.
