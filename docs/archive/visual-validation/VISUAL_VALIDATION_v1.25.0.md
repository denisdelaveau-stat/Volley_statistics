# Visual validation — VolleyLive v1.25.0

## Deterministic checks

The navigation validation uses geometry, visibility, touch-target, overflow, and colour assertions rather than browser-version-sensitive whole-image equality.

Validated viewports:

- phone portrait: 390 × 844;
- tablet portrait: 768 × 1024;
- phone landscape: 844 × 390.

Checks include:

- Home contains two separate primary cards and separate Settings;
- all interactive targets are at least 44 px;
- no horizontal overflow;
- cyan write and violet read-only accents are distinct and do not use red/green/yellow navigation semantics;
- Setup & Capture, Insights & Viewing, and Match Library fit each tested viewport;
- library actions remain usable on phone and tablet;
- empty library states show zero counts without demonstration data.

## Captured screens

`docs/screens_v1.25.0/` contains:

- `home_phone_390x844.png`;
- `home_tablet_768x1024.png`;
- `home_landscape_844x390.png`;
- `setup_phone_390x844.png`;
- `insights_phone_390x844.png`;
- `library_phone_390x844.png`;
- `library_tablet_768x1024.png`;
- `contact_sheet.png`.

The screenshots were generated from empty deterministic storage except the Match Library views, which use one locally injected active-match object to validate selected-match, LIVE, READ ONLY, and action-button presentation.
