# UI-SUBS — Substitution and libero sheet

| Field | Value |
|---|---|
| Spec ID | `UI-SUBS` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-27 |
| Source of truth | `runtime-input.js` (`subsHtml`, `liberoSwapBlock`, `liberoUnableStep`, `substitute`, `changeLibero`), `runtime-input.css` |
| Related specs | DOM-SUBS (substitution rules), DOM-LIBERO (libero rules), UI-CAPTURE (entry « ⇄ Remplacement »), SYS-DATA |

## 1. Purpose

The sheet where the scorer records a substitution, replaces the acting libero by the other libero, or declares the
libero unable to play. It only offers what the FIVB rules allow and explains every refusal.

## 2. Scope

- In scope: the sheet, its steps, its messages and how a change is recorded.
- Out of scope: the rules themselves (DOM-SUBS, DOM-LIBERO).

## 3. Definitions

- Player leaving: a player on court chosen first; player entering: chosen second.

## 4. Requirements

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-SUBS-01` | The sheet title is « Remplacement »; its subtitle gives the set, the count of regular substitutions out of 6 (« Set 1 · 0/6 remplacements ») and the exceptional ones, and « règle 15 FIVB ». | DOM-SUBS-01 |
| `UI-SUBS-02` | During a rally, or once the set is over, the sheet shows why no change is possible (« Set terminé : passez au set suivant pour effectuer un remplacement. ») and offers nothing. | DOM-SUBS-10, DOM-LIBERO-06 |
| `UI-SUBS-03` | Step 1, « Joueur qui sort »: the six players on court by zone; the player replaced by the libero is marked « remplacé par le libéro »; a player without any allowed substitute is shown disabled with « aucun remplaçant autorisé ». | DOM-SUBS-02 |
| `UI-SUBS-04` | Step 2, « Sort : #N — joueur qui entre »: only the allowed substitutes; when only an exceptional substitution is possible, a warning says so and lists the exceptional candidates; the refused players are listed in « Joueurs non autorisés (n) » with their reason. « ← Changer le joueur qui sort » goes back. | DOM-SUBS-07, DOM-SUBS-12 |
| `UI-SUBS-05` | Choosing the player entering records the substitution at once (rules checked again), closes the sheet and confirms « ⇄ #in remplace #out » (or « (exceptionnel) »). | DOM-SUBS-11 |
| `UI-SUBS-06` | When a libero is acting, a « Libéro en jeu : #N » block comes first: one button per other designated libero who may take over (« remplace le libéro #N »), disabled with the reason while not allowed, and « Libéro #N indisponible (blessure, expulsion)… ». | DOM-LIBERO-07, -08, -11 |
| `UI-SUBS-07` | « Libéro #N indisponible… » opens a step with the rule 19.4 warning (the libero will not play again in the match) and either the other libero (« prend le relais ») or the players who may be re-designated (« devient libéro »); « Retour » goes back. | DOM-LIBERO-12, -13, -14 |
| `UI-SUBS-08` | A libero change is recorded at once, closes the sheet and confirms it (« Libéro #in à la place de #out », « …devient le libéro », « …re-désigné libéro jusqu’à la fin du match »). | DOM-LIBERO |
| `UI-SUBS-09` | « FERMER » closes the sheet without recording anything and gives the focus back to « ⇄ Remplacement ». | Accessibility |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| Rules changed between display and tap | The change is checked again and refused with its reason (`UI-SUBS-05`). |
| No libero declared | No libero block. |
| Second libero absent | Only « Libéro #N indisponible… » in the libero block. |

## 6. Data

Writes a `match.subs` entry and a `SUBSTITUTION` event (SYS-DATA 6.3, 6.4) through `VolleyCapture.logSubstitution`.

## 7. Interface

`#runtimeSubs` (dialog): `[data-sub-out]`, `[data-sub-in]` (`[data-sub-exceptional]`), `[data-sub-back]`,
`[data-sub-close]`, `[data-libero-swap]`, `[data-libero-unable-open]`, `[data-libero-unable]`,
`[data-libero-redesignate]`.

## 8. Accessibility and language

The sheet is a modal dialog (`role="dialog"`, `aria-modal`, labelled by its title); the first enabled button gets the
focus; refusals are text, not colour only. Texts: `subs.*` keys.

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `UI-SUBS-01`, `-03`, `-04` | `tests/capture/test_substitutions.py::test_the_sheet_applies_fivb_rule_15` |
| `UI-SUBS-02` | `tests/capture/test_substitutions.py::test_no_substitution_during_a_rally`; set over: manual (DOM-SUBS-10) |
| `UI-SUBS-05` | `tests/capture/test_substitutions.py::test_substitution_is_recorded_and_the_court_updates` |
| `UI-SUBS-06` | `tests/capture/test_libero_swap.py::test_second_libero_replaces_the_acting_one_between_rallies` |
| `UI-SUBS-07`, `-08` | `tests/capture/test_libero_redesignation.py::test_single_libero_unable_a_bench_player_is_re_designated`, `::test_second_libero_takes_over_and_the_unable_one_never_comes_back` |
| `UI-SUBS-09` | `tests/capture/test_libero_swap.py::test_second_libero_replaces_the_acting_one_between_rallies` (« FERMER »); focus: manual (keyboard) |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-27 | First version (the sheet had no dedicated spec). |
