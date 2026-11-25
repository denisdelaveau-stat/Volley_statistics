# Implementation report — Volley Live Capture v1.10.1

## Scope

Visual alignment of the New Match setup with the Coach View theme. No data model or interaction logic was changed.

## Role palette

| Role | Pastel colour | Light surface | Text |
|---|---:|---:|---:|
| OPP | `#8FC8F8` | `#EAF5FF` | `#0B3558` |
| SET | `#F7D774` | `#FFF8D8` | `#5A4300` |
| OH | `#F4A6A6` | `#FFF0F0` | `#5B2020` |
| MB | `#9FD8B5` | `#EEF9F2` | `#16452B` |
| LIB | `#C7CED8` | `#F3F5F8` | `#253142` |

The same semantic palette is defined once as global CSS variables and used by the team editor, roster validation, initial-rotation circles, player pickers, Coach View and rotation-analysis courts. Coach court roles are resolved from the roster position supplied by the reference JSON adapter.

## Setup theme

Team selection, player-presence validation and initial rotation now share the dark-blue Coach View treatment across every previously white structural surface: page backgrounds, cards, panels, headers and form fields. Existing semantic controls retain their own colours. Both the roster court and initial-rotation court remain orange; only player circles use the pastel role palette.

## Compatibility

Storage keys, match JSON, live capture, Coach View and Advanced Statistics are unchanged.
