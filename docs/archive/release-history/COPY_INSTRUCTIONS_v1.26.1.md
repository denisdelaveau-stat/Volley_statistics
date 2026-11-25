# Copy instructions — v1.26.1

## Complete package

Deploy the complete contents of the `Volley_statistics_v1.26.1` folder at the application root, replacing the previous application files while preserving the directory structure.

Open the application online once so service-worker cache `volley-live-capture-v1.26.1` is installed, then fully close and reopen the PWA.

## Delta from v1.26.0

Extract `Volley_statistics_v1.26.1_update_from_v1.26.0.zip`, then run:

```bash
python3 APPLY_UPDATE.py /path/to/Volley_statistics_v1.26.0
```

The updater verifies the v1.26.0 base tree, applies changed and new files, removes listed obsolete paths, writes `VERSION` as `1.26.1`, and verifies the resulting tree against the bundled v1.26.1 target manifest.

Verification only:

```bash
python3 APPLY_UPDATE.py /path/to/Volley_statistics_v1.26.1 --verify-only
```

## Smoke check

1. Home displays `v1.26.1` and the v1.26.0 workflows remain available.
2. In SPECTATOR VIEW → TIMELINE, a long player name is complete on one line.
3. HOME and AWAY connector lines are equal and compact.
4. Delta squares keep the same dimensions for different values and touch the score.
5. HOME and AWAY Timeline header boxes are half width.
6. Previous-set selection and **Retour au direct** still update all four Spectator tabs.
