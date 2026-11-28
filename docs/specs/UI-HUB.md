# UI-HUB — Match Hub (Match Capture)

| Field | Value |
|---|---|
| Spec ID | `UI-HUB` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-28 |
| Source of truth | `match-hub.js` (`window.VolleyMatchHub`), `match-hub.css`, `index.html` (`#matchHubScreen`, `#matchHubDecision`) |
| Related specs | UI-HOME (entry « SAISIE DE MATCH »), UI-WIZARD, UI-CAPTURE, UI-LIBRARY (history), SYS-DATA-03 (one active match) |

## 1. Purpose

The entry of the write workspace for match data: start a new official match or continue the one in progress, without
ever losing the current match by mistake.

## 2. Scope

- In scope: the two cards, the active match summary, the decision dialog when a match is already in progress, saving
  before starting another match.
- Out of scope: the wizard (UI-WIZARD), the capture (UI-CAPTURE), the history list (UI-LIBRARY).

## 3. Definitions

See SYS-DATA (active match, history).

## 4. Requirements

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-HUB-01` | « SAISIE DE MATCH » shows « Créez et mettez à jour les données officielles du match », the card « NOUVEAU MATCH » (« Créez et démarrez un match officiel »), the card « REPRENDRE LA SAISIE » and the note « MODE ÉCRITURE » (« Les modifications sont enregistrées dans le JSON officiel et l’historique des événements. »). | Product |
| `UI-HUB-02` | With an active match, « REPRENDRE LA SAISIE » summarises it (teams, current set, last save: « Enregistré à l’instant », « Enregistré il y a N min », « Enregistré à HH:MM » or « Enregistré le date à HH:MM ») and opens the capture; without one it shows « Aucun match en cours » and is disabled. | Product |
| `UI-HUB-03` | « NOUVEAU MATCH » opens the wizard directly when no match is in progress. | UI-WIZARD |
| `UI-HUB-04` | When a match is in progress, « NOUVEAU MATCH » opens « Match déjà en cours » (« Un match est déjà en cours : nom… ») with « Continuer le match en cours », « Enregistrer et en démarrer un autre », « Abandonner et en démarrer un autre » and « Annuler », and the reminder that VolleyLive keeps one editable match at a time. | SYS-DATA-03 |
| `UI-HUB-05` | « Enregistrer et en démarrer un autre » downloads the match JSON file and adds it to the Match Library history, then clears the active match and opens the wizard; if saving fails, the active match is kept and the dialog says why (« Échec de l’enregistrement, le match en cours est conservé : … »). | Data integrity |
| `UI-HUB-06` | « Abandonner et en démarrer un autre » clears the active match without saving it and opens the wizard. | Product |
| `UI-HUB-07` | Offline, the subtitle shows « HORS LIGNE »; every action still works (local data). | SYS-PWA |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| Storage full when saving | `UI-HUB-05` failure message; nothing is cleared. |
| Finished match still active | Shown in « REPRENDRE LA SAISIE » until a new match replaces it. |

## 6. Data

Reads the active match (SYS-DATA 6.2); writes the history (`volleyMatchHub.history.v1`) and clears the active match
keys when a new match starts.

## 7. Interface

`#matchHubScreen` (`#matchHubBack`, `#homeNew`, `#homeContinue`, `#homeContinueInfo`, `#matchHubOffline`);
dialog `#matchHubDecision` (`#matchHubDecisionText`, `#matchHubContinueCurrent`, `#matchHubSaveStart`,
`#matchHubDiscardStart`).

## 8. Accessibility and language

Native `<dialog>` with a title; buttons at least 44 px; the continue card has an `aria-label` naming both teams.
Texts: `hub.*` keys.

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `UI-HUB-01`, `-02` | `tests/home/test_home.py::test_match_capture_continue_summary_uses_current_official_match` |
| `UI-HUB-03` | `tests/setup/test_rotation_setup.py::test_settings_and_new_match_sequence` |
| `UI-HUB-04`, `-05` | `tests/library/test_match_hub_save.py::test_successful_save_archives_then_clears_the_current_match`, `::test_save_failure_keeps_the_current_match` |
| `UI-HUB-06` | Manual: with a match in progress, NOUVEAU MATCH → « Abandonner et en démarrer un autre »; the wizard opens and the old match is gone |
| `UI-HUB-07` | Manual: switch the device offline; « HORS LIGNE » appears |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-28 | First version; replaces `docs/VolleyLive_Match_Hub_Implementation_Specification.md` and `docs/MATCH_HUB_v1.21.0.md`. |
