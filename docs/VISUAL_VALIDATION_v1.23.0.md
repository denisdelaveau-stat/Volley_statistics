# Visual validation — v1.23.0

## Deterministic checks

Validated at 320×568, 390×844, and 768×1024:

- Home has no horizontal overflow.
- Home renders five first-level buttons in the required order.
- Every Home button is at least 44 CSS px high.
- MATCH HUB opens a separate visible screen while Home becomes hidden.
- Match Hub has no horizontal overflow.
- Match Hub renders exactly three primary action cards plus Recent Matches and Import match.
- Back returns to Home and restores focus to MATCH HUB.
- MATCH HUB, New Match, Continue Match, View Match, and Import match targets are at least 44 CSS px high.

## Screenshot note

The browser's `full_page` capture mode extends beyond the fixed overlay viewport and can expose the underlying capture document below the overlay. This does not occur in normal viewport rendering and does not indicate functional overlap. The retained PNGs are viewport-specific validation captures; acceptance is based on the deterministic geometry and visibility assertions above.
