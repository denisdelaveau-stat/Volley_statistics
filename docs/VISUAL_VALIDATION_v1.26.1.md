# Visual validation — VolleyLive v1.26.1

The v1.26.1 Timeline geometry was checked against the captures embedded in `Dans la vue spectator2.docx`.

## Verified details

- complete player names on one line;
- equal 40 px HOME/AWAY connectors with direct joins;
- fixed 38 × 28 px delta squares for every non-zero delta;
- delta square attached to the score;
- HOME/AWAY title boxes at half width;
- preserved score spine, rally label, latest-point marker, colour semantics and maximum-gap outline;
- horizontal accessibility on narrow screens.

## Baselines

Ten PNG baselines are stored under `tests/visual_baselines/`:

- `timeline_{1536x1024,1024x768,412x915}_v1_26_1.png`;
- `away_alignment_{1536x1024,1024x768,412x915}_v1_26_1.png`;
- `compact_timeline_{1536x1024,1024x768,844x390,390x844}_v1_26_1.png`.

All baselines are deterministic Chromium captures after the row-entry animation has settled.
