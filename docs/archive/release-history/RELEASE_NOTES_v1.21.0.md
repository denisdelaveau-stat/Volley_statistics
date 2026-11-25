# Volley Live Capture v1.21.0 — Match Hub

## Home Match Hub

- Replaced the separate New / Continue / Spectator match entry points with one coherent **MATCH HUB** module on Home.
- Added the approved hierarchy: **NEW MATCH**, **CONTINUE MATCH**, **VIEW MATCH**, **RECENT MATCHES**, then **Import match**.
- Kept Coach View, Advanced Statistics, Teams, and Settings available below the Match Hub.

## Real data and navigation

- Continue Match is enabled only for persisted `live`, `paused`, or `in_progress` matches.
- The active summary derives team names, current set, point score, and save state from the current persisted match and event log.
- Completed/imported matches are stored in the Match Hub repository, sorted by effective match date, and limited to two Home rows.
- View Match opens a read-only selector and routes the chosen stable match ID/archive to the existing spectator experience.
- New Match reuses the existing setup workflow and protects an active match with Continue / Save and start / Discard and start / Cancel choices.

## JSON import and safety

- Accepts `.json` files up to 10 MB and validates them with the existing VolleyLive Capture v1 / unified v2 adapter.
- Rejects invalid syntax, unsupported structures, unsafe prototype-pollution keys, and missing stable identity/team fields.
- Duplicate IDs offer **Open existing**, **Import as a copy**, or **Cancel** without silently replacing data.

## Quality

- Mobile-first 320 px to tablet layout, no horizontal page scrolling, 44 px minimum targets, visible keyboard focus, reduced-motion support, honest empty/error states, and contrast-adjusted primary colors.
- `match-hub.js` and `match-hub.css` are included in the v1.21.0 offline cache.
- Full regression result: **146 passed**, no failures.
