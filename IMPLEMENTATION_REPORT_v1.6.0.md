# Volley Live Capture v1.6.0 — Implementation Report

## Outcome
The approved `Volley_Live_Capture_UI_Functional_Specification_EN_With_Original_Images.docx` is implemented in the current v1.5.0 source baseline and released as v1.6.0.

## Traceability
| Specification area | Implementation | Automated verification |
|---|---|---|
| Basic one-tap team capture | Shared Error / team / Point bars around NET | `test_basic_split.py` |
| Intermediate Focus selection | One selected Focus player; TEAM fallback; ADVERSE direct | `test_ui_spec_v1_6_0.py` |
| Advanced two-tap player flow | Fixed combined action/result grid | `test_ui_spec_v1_6_0.py` |
| Continue neutral | Inline dual-arrow SVG; persisted `neutral`; no score | `test_ui_spec_v1_6_0.py` |
| Unsupported Point cells | No active Point target for Defence, Reception or Set | `test_ui_spec_v1_6_0.py` |
| Undo consistency | Neutral grey/white control, one-event removal | `test_basic_split.py`, `test_e2e_pwa.py` |
| Substitution isolation | Result controls blocked and player taps delegated to substitution | `test_ui_spec_v1_6_0.py` |
| 400 ms protection | Guard starts after accepted result | `test_double_tap.py` |
| Phase banner | Read-only SERVICE / RECEPTION derived from service | Basic and Advanced tests |
| Existing setup library | Save/load data model and ROTATE +1 retained | `test_library_v1_6_0.py` |
| Set/report/PWA regression | 26–24 set lock, Undo, report and cache version | `test_e2e_pwa.py` |

## Compatibility
- Portable match JSON remains format version 1.
- Existing `point`, `error` and `neutral` values are unchanged.
- `volleyCapture.library.v1` remains unchanged.
- No data migration is required.

## Verification result
- `pytest -q tests`: **7 passed**.
- Six inline JavaScript blocks pass `node --check`.
- No uncaught browser JavaScript errors in automated scenarios.
- Basic, Intermediate and Advanced fit a 390 px viewport without horizontal overflow.
- The updated Word specification retains all 11 embedded original images.

## Remaining target-device checks
Safari/Home-screen PWA safe areas, VoiceOver announcements and offline relaunch persistence must be confirmed on the intended iPhone before match use.
