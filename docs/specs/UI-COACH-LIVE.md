# UI-COACH-LIVE — Coach View: LIVE COURT and PLAYER FOCUS

| Field | Value |
|---|---|
| Spec ID | `UI-COACH-LIVE` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-28 |
| Source of truth | `js/coach-live.js`, `coach-live-config.js` (`window.VolleyCoachConfig`), `coach.css` |
| Related specs | UI-COACH (shell), UI-COACH-PLAYERS (entry to PLAYER FOCUS), DOM-STATS-09 to -14 (statuses), DOM-ROTATION, SYS-I18N-08 (terms kept in English) |

## 1. Purpose

Two full-screen views for the bench during the match: LIVE COURT shows the six players on court with a status per
player; PLAYER FOCUS details one player skill by skill.

## 2. Scope

- In scope: header, court cards, statuses and alerts, rally timeline, PLAYER FOCUS panels, navigation, portrait
  behaviour.
- Out of scope: status formulas (DOM-STATS), other tabs.

## 3. Definitions

- Status: Bon, À surveiller, Difficulté (`good`, `watch`, `difficulty`, DOM-STATS-12).

## 4. Requirements

### 4.1 LIVE COURT

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-COACH-LIVE-01` | Both views need landscape: in portrait they show « Tournez l’appareil », « LIVE COURT est optimisé pour le mode paysage. » and « Retour à Vue coach ». | SYS-DESIGN-05 |
| `UI-COACH-LIVE-02` | The header shows « VolleyLive Insight », a « VUE COACH » button (« > JOUEUR » in PLAYER FOCUS), HOME and AWAY scores with « Set n » and set dots, the rotation, the phase (RÉCEPTION / SERVICE) and, on LIVE COURT, SO and BP percentages. | Product |
| `UI-COACH-LIVE-03` | « SUR LE TERRAIN » shows the six players on court (libero included) in zones 4 3 2 / 5 6 1 under the « FILET », each card with number, name, role chip, trend arrow, PTS, ERR and EFF (« ≈ » when derived), and the status legend « ● Bon ● À surveiller ● Difficulté ». | DOM-ROTATION-06, DOM-STATS |
| `UI-COACH-LIVE-04` | A card not in good status shows an alert strip: « n erreurs d’affilée », « n erreurs de passe », « Réception instable », « Efficacité attaque n% », « 2 erreurs de service », or the status name. | DOM-STATS-14 |
| `UI-COACH-LIVE-05` | « 12 DERNIERS RALLYES » shows the last rallies of the set (W / L, rally number, the latest marked « Actuel »). | Product |
| `UI-COACH-LIVE-06` | The note reminds that the Bon / À surveiller / Difficulté thresholds are configurable (`coach-live-config.js`) and to be validated with the coach. | Transparency |
| `UI-COACH-LIVE-07` | Tapping a card opens PLAYER FOCUS for that player. | Product |

### 4.2 PLAYER FOCUS

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-COACH-LIVE-08` | « ← Terrain » returns to LIVE COURT; ‹ and › move to the previous and next player on court. | Product |
| `UI-COACH-LIVE-09` | The player card shows number, name, role, « Poste n », status, alert, PTS, ERR and EFF; « POSITION SUR LE TERRAIN » shows the player's zone on a mini court (« Avant (4-3-2) », « Arrière (5-6-1) »). | Product |
| `UI-COACH-LIVE-10` | Four panels ATTAQUE, BLOC, RÉCEPTION, DÉFENSE give the efficiency (« ≈ » when derived from events), its trend (last 5 compared with the 5 before), the skill counters (ATT / KILL / ERR / BLK, PTS / TOUCH / ERR, REC / POS / ERR, DIG / GOOD / ERR), the 5 last actions (oldest → newest) and an efficiency curve. | DOM-STATS-10, -13 |
| `UI-COACH-LIVE-11` | Without intermediate contacts (Capture v1) or contacts in the document, curves and block values show NA with the reason (« Contacts intermédiaires absents de cet export Capture v1 », « Aucun contact disponible dans le JSON »). | Transparency |
| `UI-COACH-LIVE-12` | Product names (LIVE COURT, PLAYER FOCUS), statistic codes and HOME / AWAY stay in English in both languages. | SYS-I18N-08 |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| No match | Neutral cards with 0 or NA, empty timeline (« 0 rallye »). |
| Player with fewer than 3 main-skill actions | Status Bon, no alert. |

## 6. Data

Events of the current set and rally model (DOM-ROTATION); thresholds in `coach-live-config.js`.

## 7. Interface

`[data-live-player]`, `[data-focus-court]`, `[data-focus-prev]`, `[data-focus-next]`, `.live-alert-strip`,
`.focus-stat-grid`, `.focus-curve`, `.live-landscape-gate`.

## 8. Accessibility and language

Each card is a button labelled « Ouvrir Player Focus pour nom »; previous / next have labels; status is text, not
colour only. Texts: `coach.live.*` keys.

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `UI-COACH-LIVE-01` | `tests/coach/test_live_court.py::test_live_court_requests_rotation_in_portrait` |
| `UI-COACH-LIVE-02`, `-03`, `-07`, `-08`, `-09` | `tests/coach/test_live_court.py::test_live_court_focus_navigation_and_landscape_layout` |
| `UI-COACH-LIVE-04`, `-06` | `tests/coach/test_live_court.py::test_good_watch_difficulty_and_alert_strips` |
| `UI-COACH-LIVE-05` | `tests/coach/test_live_court.py::test_empty_landscape_is_neutral_zero_or_na` |
| `UI-COACH-LIVE-10` | `tests/coach/test_live_court.py::test_v2_fixture_derived_pos_good_trend_last_five_and_curves` |
| `UI-COACH-LIVE-11` | `tests/coach/test_live_court.py::test_capture_v1_without_intermediate_contacts_uses_na_curves` |
| `UI-COACH-LIVE-12` | `tests/coach/test_live_court.py::test_good_watch_difficulty_and_alert_strips` (English module); manual check in French |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-28 | First version; replaces the LIVE COURT part of `docs/VolleyLive_Coach_View_Specification.md`. |
