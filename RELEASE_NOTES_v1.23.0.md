# Release notes — v1.23.0

## Home navigation

- Replaced the embedded Match Hub on Home with a dedicated **MATCH HUB** button.
- Home now exposes exactly five first-level sections: **MATCH HUB**, **COACH VIEW**, **TEAMS MANAGEMENT**, **ADVANCED STATISTICS**, and **SETTINGS**.
- MATCH HUB opens a separate full-screen interface with a deterministic Back-to-Home path.
- The approved Match Hub hierarchy is preserved: **NEW MATCH**, **CONTINUE MATCH**, **VIEW MATCH**, **RECENT MATCHES**, and **Import match**.
- New Match returns to Match Hub when the setup is cancelled from its first step.

## Compatibility

- Existing match persistence, safe JSON import, active-match restore, recent-match selection, Coach View, team management, Advanced Statistics, Settings, capture, and spectator workflows are unchanged.
- Offline cache is bumped to `volley-live-capture-v1.23.0`.

## Validation

- Complete automated suite: **147 passed**, no failures.
- Node syntax checks passed for all runtime JavaScript files.
- Deterministic responsive geometry passed at 320×568, 390×844, and 768×1024: no horizontal overflow, five Home actions, three Match Hub actions, and touch targets at least 44 px high.
- Phone and tablet viewport screenshots are stored in `docs/screens_v1.23.0/`.
