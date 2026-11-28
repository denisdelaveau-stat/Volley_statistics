# SYS-SEC — Security and data integrity

| Field | Value |
|---|---|
| Spec ID | `SYS-SEC` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-27 |
| Source of truth | `js/shared-dom.js` (`VolleyDom.esc`), `statistics/adapter.js` (`validate`), `match-hub.js` (import, `safeName`), `js/index-navigation-new-match.js` (`fileName`), `js/shared-domain.js` (`readStored`) |
| Related specs | SYS-JSON (validation rules), SYS-DATA, SYS-I18N-09, UI-LIBRARY (import), UI-TEAMS (CSV import) |

## 1. Purpose

Defines how VolleyLive protects the user and the data: text from files or from other users never runs as code, an
imported document is checked before use, and a damaged or unexpected value never corrupts the active match.

## 2. Scope

- In scope: HTML escaping, document import, generated files, absence of network and of dynamic code.
- Out of scope: device security and browser storage protection (handled by the platform).

## 3. Definitions

- Untrusted text: any value that does not come from the application code: team, player and match names, imported
  files (JSON, CSV), stored values.

## 4. Requirements

| ID | Requirement | Rule / source |
|---|---|---|
| `SYS-SEC-01` | Every untrusted value inserted with `innerHTML` or `insertAdjacentHTML` goes through `VolleyDom.esc()`, which escapes `&`, `<`, `>`, `"` and `'`; otherwise the value is set with `textContent` or as an attribute through the DOM API. | OWASP XSS prevention |
| `SYS-SEC-02` | The application never evaluates text as code (no `eval`, `new Function`, string timers, or inline handlers built from data). | OWASP |
| `SYS-SEC-03` | The application loads no third-party script and sends no data over the network (SYS-DATA-01). | Privacy |
| `SYS-SEC-04` | An imported match document is validated (SYS-JSON-14, -15) before anything is stored; an invalid document is refused with its reasons and changes nothing. | Data integrity |
| `SYS-SEC-05` | Importing a match whose identifier already exists asks the user to open the existing match or import a copy; it never silently replaces a stored match. | Data integrity |
| `SYS-SEC-06` | Viewing a document (Coach View, Spectator View, reports) never modifies the active match (SYS-ARCH-07). | Data integrity |
| `SYS-SEC-07` | An unreadable stored value falls back to its default without stopping the application, and is reported in the console (SYS-DATA-06). | Robustness |
| `SYS-SEC-08` | Generated files are built in the browser (`Blob`) and their names keep only safe characters (letters, digits, `_`, `-`). | Robustness |
| `SYS-SEC-09` | A file import accepts `.json` files only, of 10 MB at most, and rejects any object key `__proto__`, `prototype` or `constructor` at any depth (« Les clés d’objet non sûres sont interdites. »). | OWASP (prototype pollution) |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| Player named `<img src=x onerror=…>` | Shown as text on every screen (`SYS-SEC-01`). |
| JSON file that is not a match | Refused: « Format non reconnu… » (SYS-JSON-01). |
| Corrupted stored match | Default empty state; console warning naming the key. |

## 6. Data

No data of its own. Applies to every storage key (SYS-DATA) and document (SYS-JSON).

## 7. Interface

`VolleyDom.esc(value)`; `VolleyStatsAdapter.validate(document)`; `VolleyDomain.readStored(key, fallback)`.

## 8. Accessibility and language

Not applicable. Refusal reasons are translated (`adapter.*`, `library.*` keys).

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `SYS-SEC-01` | `tests/shared/test_html_escaping.py::test_capture_screen_escapes_names`, `::test_coach_view_escapes_names`, `::test_match_library_escapes_imported_names`, `::test_spectator_view_escapes_names` |
| `SYS-SEC-02` | Manual review: search the sources for `eval(`, `new Function`, `setTimeout('` (none) |
| `SYS-SEC-03` | Manual review: no `<script src="http`, no `fetch` outside `sw.js` |
| `SYS-SEC-04`, `-05` | `tests/library/test_match_library.py::test_import_validation_duplicate_and_read_only_metadata_remain_available`; `tests/unit/adapter.test.js` « rejects malformed documents with a reason » |
| `SYS-SEC-06` | `tests/library/test_match_library.py::test_selected_match_actions_keep_coach_spectator_and_reports_routes` |
| `SYS-SEC-07` | `tests/unit/storage.test.js` « returns the fallback for corrupted JSON and reports the key » |
| `SYS-SEC-08` | `tests/capture/test_capture_regressions.py::test_set_end_lock_undo_next_set_and_exports` (downloaded JSON file) |
| `SYS-SEC-09` | Manual: import a `.txt` file, a file over 10 MB and a JSON with a `__proto__` key; each is refused with its message |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-27 | First version; gathers the escaping rule of `docs/ARCHITECTURE.md` and the import rules of the former Match Library spec. |
