# Release v1.6.6 — 17 November 2026

Volley Live Capture v1.6.6 implements the nine refinements in “Modification UI 5”.

## Live-capture UI
- BENCH replacement and SUBSTITUTION controls are 66×36 and 122×36 CSS px at the primary iPhone viewport.
- The black NET band uses half the previous vertical padding.
- The rotation line is equally spaced between score and phase banner and uses `Rot. Pn | Rn | Cn`.
- RECEPTION is blue; the SERVICE/RECEPTION banner is thinner.
- Undo controls use light orange.
- TEAM/ADVERSE result rows are reduced from 76 to 60 CSS px.
- Advanced action labels use light orange for Attack/Block, light green for Defence/Reception, and light blue for Service/Set; rare legal rows remain lighter.
- Live History shows only `#`, `Player`, `Action`, `Result`, `Score`.

## Setup and data
- Roster maximum values are 7–30, default 12, with jersey buttons 1–30.
- Event `time` and integer `rotation` fields remain persisted and continue to support statistics/reporting.
- Portable match JSON remains format version 1; no migration is required.

## Documentation and verification
- English Word UI specification updated to document version 1.6 with all 11 original inline images and 22 media package entries preserved.
- `docs/Volley_Live_Capture_Screens_v1.6.6.pdf` contains current captures of Setup, compact live capture, rotation/phase/NET/BENCH, Advanced semantic colours, Undo and History.
- Visible application version and PWA cache are `v1.6.6`.
- Run `python3 -m pytest -q tests`; manual iPhone Safari/Home-screen, VoiceOver and portrait/landscape checks remain recommended.
