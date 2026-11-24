# VolleyLive v1.26.0 validation plan

## SPECTATOR VIEW v1.26.0

| ID | Requirement |
|---|---|
| SPT-01 | SCORES, TIMELINE, GRAPH, and RANKING share the selected set |
| SPT-02 | Initial load selects the current set and includes its last point; reload does not restore a stale historical set |
| SPT-03 | Previous sets are selectable and Retour au direct restores the current set in one action |
| SPT-04 | RANKING uses only official events from the selected set |
| SPT-05 | HOME SCORE momentum cells/bar are green and AWAY cells/bar are red |
| SPT-06 | TIMELINE player names are complete; connector lengths are equal/compact; action rows have reduced spacing |
| SPT-07 | Delta bars remain score-adjacent and maximum score gaps have a dotted accessible outline |

## Navigation and access modes

| ID | Requirement |
|---|---|
| NAV-01 | Home exposes SETUP & CAPTURE, INSIGHTS & VIEWING, and separate SETTINGS only |
| NAV-02 | SETUP & CAPTURE visibly carries WRITE ACCESS and contains MATCH CAPTURE and TEAM MANAGEMENT |
| NAV-03 | INSIGHTS & VIEWING visibly carries READ ONLY and contains MATCH LIBRARY, COACH VIEW, SPECTATOR VIEW, and MATCH REPORTS |
| NAV-04 | MATCH CAPTURE contains NEW MATCH and CONTINUE CAPTURE only |
| NAV-05 | No Advanced Statistics button, route, cache entry, dedicated page, or visual baseline remains |

## Shared Match Library

| ID | Requirement |
|---|---|
| LIB-01 | ACTIVE, FINISHED, and IMPORTED filters show accurate counts |
| LIB-02 | Imported JSON is validated, conflict-safe, and stored as read-only without replacing the active official match |
| LIB-03 | Selected match, state, and READ ONLY mode are visible |
| LIB-04 | Coach, Spectator, and Reports use the same selected raw JSON/event history |
| LIB-05 | Empty filters show 0 matches and never inject demonstration data |
| LIB-06 | Active match can return to CONTINUE CAPTURE; consumption views expose no capture controls |

## Team and match imports

| ID | Requirement |
|---|---|
| IMP-01 | Team CSV import remains in TEAM MANAGEMENT and accepts Numero, Nom, Poste |
| IMP-02 | Match JSON import exists only in MATCH LIBRARY |
| IMP-03 | Unsafe JSON keys, invalid syntax, unsupported schema, duplicate IDs, wrong type, and oversize files are rejected or resolved explicitly |

## Conserved workflows

| ID | Requirement |
|---|---|
| REG-01 | Capture actions, HISTORY Delete, HOME | ERREUR | AWAY, substitutions, rotations, and team management pass |
| REG-02 | Coach View, Live Court, Player Focus, team/player analysis, and neutral 0/NA states pass |
| REG-03 | Spectator SCORES, TIMELINE, GRAPH, RANKING, Score and Fault Evolution, and Momentum in SCORES pass |
| REG-04 | HTML report, event CSV, and official JSON export entry points are available locally |
| REG-05 | Pastel role colours, navy/cyan Coach theme, official JSON/event history, and offline PWA behavior pass |

## Accessibility and visual validation

| ID | Requirement |
|---|---|
| A11Y-01 | Interactive targets are at least 44 px and keyboard focus is visible |
| A11Y-02 | Status regions, headings, filters, dialogs, and selected state have accessible labels/semantics |
| VIS-01 | 390×844 phone, 768×1024 tablet, and 844×390 landscape render without horizontal overflow or overlap |
| VIS-02 | Write and read navigation use distinct cyan/violet accents; red/green/yellow remain reserved for sports data |
| VIS-03 | Reduced-motion and offline behavior remain supported |

## Release gate

- JavaScript syntax checks pass.
- Every service-worker asset exists; cache is `volley-live-capture-v1.26.0`.
- Full automated suite passes: 156 tests.
- Delta applied to a clean v1.25.0 tree is byte-identical to the complete v1.26.0 tree.
- Complete package, delta package, and artifact SHA-256 manifests are generated and independently rechecked.
