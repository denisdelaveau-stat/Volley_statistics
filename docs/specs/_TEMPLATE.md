# <SPEC-ID> — <Title>

| Field | Value |
|---|---|
| Spec ID | `<SPEC-ID>` (for example `UI-CAPTURE`) |
| Status | Draft · Current · Superseded |
| Version | 1.0 (spec version, independent of the app version) |
| Applies to | VolleyLive v1.28.0 |
| Last review | YYYY-MM-DD |
| Source of truth | Code files that implement this spec |
| Related specs | Other spec IDs this one depends on or is used by |

## 1. Purpose

One paragraph: what this interface or feature is for, and for whom (scorer, coach, spectator, developer).

## 2. Scope

- In scope: what this spec covers.
- Out of scope: what it does not cover, with a pointer to the spec that does.

## 3. Definitions

Terms used in this spec that a reader may not know (volleyball terms, data names). Link to the glossary in
`README.md` instead of repeating shared terms.

## 4. Requirements

Numbered, testable statements in the present tense, one behaviour each. "Shall" is not used: the requirement states
what the application does.

| ID | Requirement | Rule / source |
|---|---|---|
| `<SPEC-ID>-01` | The application … | FIVB 15.1 / product decision / … |

Group requirements under sub-headings (4.1, 4.2 …) when the spec is long. Never renumber an existing ID: retire it
("Retired in 1.1") and add a new one.

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| Empty data | … |
| Invalid input | … |

## 6. Data

What the feature reads and writes: storage keys, document fields, events. Refer to `SYS-DATA` and `SYS-JSON` for the
full formats instead of copying them.

## 7. Interface

For a screen: layout, elements and their identifiers (`#id`, `data-*`), responsive breakpoints.
For a module: public functions, inputs, outputs, errors.

## 8. Accessibility and language

Roles and labels, keyboard and focus, touch targets, reduced motion. Texts come from the translation dictionaries
(`SYS-I18N`); list the keys or key prefixes used.

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `<SPEC-ID>-01` | `tests/<screen>/test_<feature>.py::test_name` · `tests/unit/<file>.test.js` · manual check (say how) |

Every requirement is verified by at least one automated test, or marked "manual" with the procedure.

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | YYYY-MM-DD | First version of this spec (replaces …) |
