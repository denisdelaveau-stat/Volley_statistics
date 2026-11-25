# Implementation report — Volley Live Capture v1.12.5

Implements an explicit empty analysis state. Without a live Capture match or an explicitly imported JSON replay, both analysis interfaces show only grey `0`/`NA` indicators and “Aucun match chargé”. The bundled reference fixture is no longer injected or fetched automatically. Replay, live and unload transitions clear prior rendering state before recomputation. Automated browser coverage spans every Coach and Advanced Statistics screen and verifies empty → replay → empty transitions.

The Coach `Organisation actuelle` card is compacted: its under-court P/L legend is removed, the baseline now sits just below the lower player row, and responsive geometry is tested at 390 px and 1024 px while preserving the role circles, net, dashed line and setter-position badge.
