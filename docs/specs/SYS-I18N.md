# SYS-I18N — Interface language (French / English)

| Field | Value |
|---|---|
| Spec ID | `SYS-I18N` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-27 |
| Source of truth | `js/shared-i18n.js` (`window.VolleyI18n`), `js/i18n/fr.js`, `js/i18n/en.js` (`window.VolleyI18nMessages`), `settings.js` (language choice) |
| Related specs | UI-HOME (Settings), SYS-ARCH (load order), SYS-QA (test language), every UI-* spec (texts) |

## 1. Purpose

Defines how the interface is shown in French or English: where texts come from, how the language is chosen, and the
rules every screen follows so that no text is left untranslated.

## 2. Scope

- In scope: dictionaries, translation functions, static and dynamic texts, language choice, terms kept in English.
- Out of scope: match data (team and player names are never translated); the content of the PDF/Word reference
  documents.

## 3. Definitions

- Key: the identifier of a text, `area.name` (for example `capture.setFinished`), with optional `{placeholders}`.
- Static text: text written in the HTML; dynamic text: text produced by a script.

## 4. Requirements

| ID | Requirement | Rule / source |
|---|---|---|
| `SYS-I18N-01` | The interface is available in French and English; French is the default language. | Product decision |
| `SYS-I18N-02` | The language is chosen in Settings and stored (`volleyLive.language.v1`); saving another language reloads the page so that every screen is rendered again. Only `fr` and `en` are accepted. | Product decision |
| `SYS-I18N-03` | Every interface text comes from the dictionaries: scripts call `VolleyI18n.t('key', params)`, static HTML uses `data-i18n="key"` (text) and `data-i18n-attr="aria-label:key;title:key"` (attributes). | Maintainability |
| `SYS-I18N-04` | Both dictionaries have the same keys and the same placeholders, and no empty text; every key used by the code exists and every key is used. | Completeness |
| `SYS-I18N-05` | A key missing in English falls back to French; a key missing everywhere shows the key itself and is reported once in the console. | Robustness |
| `SYS-I18N-06` | Each page translates its static text once its markup is parsed and before its app scripts render (`VolleyI18n.apply()`), so that static text never overwrites what a script has rendered. | SYS-ARCH-03 |
| `SYS-I18N-07` | `<html lang>` follows the chosen language. | Accessibility |
| `SYS-I18N-08` | Product names (VolleyLive, LIVE COURT, PLAYER FOCUS), statistic codes (PTS, ERR, EFF, SO, BP, KILL…), HOME / AWAY and the Spectator View tab and ranking labels already in English (SCORES, TIMELINE, GRAPH, RANKING, Highlight, Lowlight, Delta) stay the same in both languages. | Decision of 2026-11-27 |
| `SYS-I18N-09` | Text inserted as HTML is escaped (`VolleyDom.esc(t(…))`) like any other value. | SYS-SEC |
| `SYS-I18N-10` | Dates and times use the chosen language (`Intl` / `toLocaleTimeString` with `VolleyI18n.lang()`). | Product rule |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| Stored language unknown or unreadable | French (`SYS-I18N-01`). |
| Key missing | Fallback of `SYS-I18N-05`; the unit test fails before release. |
| `statistics/adapter.js` in Node (no dictionaries) | Returns the key instead of the text. |

## 6. Data

`volleyLive.language.v1` (SYS-DATA). Dictionaries: `window.VolleyI18nMessages.fr` and `.en`, one object of
`key: text` each, grouped by area with a comment per area.

## 7. Interface

`window.VolleyI18n`:

| Member | Description |
|---|---|
| `SUPPORTED`, `DEFAULT` | `['fr', 'en']`, `'fr'` |
| `lang()` | Current language |
| `t(key, params)` | Text of the key, `{name}` placeholders replaced (plain text: escape before `innerHTML`) |
| `setLanguage(lang)` | Stores a supported language; the caller reloads the page |
| `apply(root)` | Translates `data-i18n` and `data-i18n-attr` under `root` (the whole page by default) |

## 8. Accessibility and language

`aria-label` and `title` attributes are translated like visible text (`data-i18n-attr`). The test modules declare the
language of their assertions (`UI_LANGUAGE`, SYS-QA).

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `SYS-I18N-01`, `-02`, `-07` | `tests/shared/test_i18n.py::test_french_by_default_and_english_from_settings`; `tests/unit/i18n.test.js` « French by default, English when chosen, unknown choices ignored », « setLanguage stores supported languages only » |
| `SYS-I18N-03`, `-04` | `tests/unit/i18n.test.js` « both dictionaries have the same keys, no empty text and the same placeholders », « every key used in the code exists, and every key is used » |
| `SYS-I18N-05` | `tests/unit/i18n.test.js` « placeholders are replaced, missing keys fall back to the key and are reported once », « a key missing in English falls back to French » |
| `SYS-I18N-06` | `tests/spectator/test_ranking.py` and the other Spectator visual baselines (French text identical after translation); `tests/capture/test_set_lineup.py::test_next_set_line_up_is_prefilled_changed_and_used_for_that_set` (French texts rendered by scripts) |
| `SYS-I18N-08` | `tests/coach/test_live_court.py::test_good_watch_difficulty_and_alert_strips` (codes and HOME/AWAY in English mode); manual check of the Spectator tabs in French |
| `SYS-I18N-09` | `tests/shared/test_html_escaping.py::test_capture_screen_escapes_names` |
| `SYS-I18N-10` | Manual: Match Library dates and times shown in the chosen language |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-27 | First version; replaces the i18n row of `docs/ARCHITECTURE.md`. |
