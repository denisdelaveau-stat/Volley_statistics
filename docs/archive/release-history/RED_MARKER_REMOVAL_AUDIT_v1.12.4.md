# Red-marker removal audit — Volley Live Capture v1.12.4

## Scope

The audit covers **Coach View** and **Advanced Statistics** with the bundled demonstration fixture and with a real Capture v1 match history.

## Result

- No `demo-only-indicator`, `json-audit-badge`, `stats-demo-only` or `coach-demo-only` visual marker is emitted at runtime.
- Provenance/source information remains visible in a neutral theme.
- Demo/reference classification remains available in the shared adapter and diagnostic attributes.
- COACH VIEW and ADVANCED STATISTICS remain present and functional on Home.
- Existing tactical/error colours are preserved because they communicate match meaning rather than data provenance.
