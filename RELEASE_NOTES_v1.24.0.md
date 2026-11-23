# Release notes — v1.24.0

## Team Management

- Rebuilt **TEAM MANAGEMENT** as a dedicated, mobile-first screen using the Match Hub hierarchy and the dark blue/cyan Coach View visual system.
- Added a prominent **NEW TEAM** action, a **REGISTERED TEAMS** library, and **IMPORT NEW TEAM** for CSV files.
- New-team creation now begins with the team name and a validated player form: **Numero**, **Nom**, and **Poste**.
- A player appears in the roster only after all three fields are valid; duplicate jersey numbers are rejected.
- Players can be sorted ascending or descending by **NUMBER**, **NAME**, or **POSITION**.
- Registered teams can be reopened, updated, removed, and reused by the existing New Match workflow.
- CSV import accepts comma, semicolon, or tab separators, French or English headers, quoted fields, and common French/English position labels. Imported rosters remain in review until explicitly saved.

## Compatibility and offline use

- Existing team storage remains compatible with `volleyCapture.library.v1`.
- Existing New Match, Match Hub, Coach View, Advanced Statistics, Settings, capture, spectator, and JSON match-import workflows are unchanged.
- Offline cache is bumped to `volley-live-capture-v1.24.0` and includes `team-management.css`.

## Validation

- Broad regression run: **150 passed** with one unstable cross-Chromium spectator pixel-diff check; that check was replaced by deterministic geometry/contrast assertions, and the final essential targeted set completed **7 passed**, no failures.
- Runtime and inline JavaScript syntax checks passed.
- Deterministic geometry passed at 390×844 and 1024×768: no horizontal overflow; cards remain ordered without overlap; primary fields and actions stay inside the viewport; principal touch targets are at least 44 px.
- Viewport screenshots and the geometry report are stored in `docs/screens_v1.24.0/`.
