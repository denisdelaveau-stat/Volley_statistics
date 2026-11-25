# Implementation report — Volley Live Capture v1.10.0

## Scope

The New Match path was rebuilt from v1.9.1 according to `modif interface.docx`, while retaining the Home entry points for Coach View and Advanced Statistics.

## Flow

1. Team selection, opponent entry, generated/editable match name, then **VALIDE**.
2. Roster confirmation on a court with role-coloured circles, Present/Focus checkboxes and sorting.
3. Initial rotation with P1–P6 tabs, Coach View styling, direct compatible-player selection, Reception/Service and a conditional **START MATCH** action.

## Compatibility

The persisted v1 capture keys and match object fields are unchanged, so live capture, Coach View and Advanced Statistics remain compatible with the previous package.
