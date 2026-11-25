# Advanced Statistics and SPECTATOR VIEW Ranking — v1.20.0

## Home

The Home archive action is named **SPECTATOR VIEW** and displays:

- white outline eye;
- white uppercase title `SPECTATOR VIEW`;
- cyan subtitle `SCORE - TIMELINE - GRAPH - RANKING`;
- white right chevron;
- navy rounded card with cyan luminous border.

Selecting it opens the existing JSON file picker. A valid archive is stored for the spectator interface and opens on TIMELINE.

## Spectator navigation

The tabs are exactly: **SCORES**, **TIMELINE**, **GRAPH**, **RANKING**.

## Ranking filters

Primary filter:

- Highlight — points marked;
- Lowlight — errors;
- Delta — points marked minus errors.

Category filter:

- Attack;
- Block;
- Defence;
- Reception;
- Service;
- All.

`All` renders one card per category. A selected category renders one centered card. Ranking is calculated only from official loaded JSON actions for the HOME/our-team roster. Empty cards use gray `0` and `NA`.

## Advanced Statistics

Advanced Statistics contains only the complete default Set Timeline plus detailed text metrics. Rotation metrics, Roster Ranking, Temps de jeu, efficiency curves, donuts, chart zoom, and chart modals are not rendered.

## Responsive and accessibility contract

- Home SPECTATOR VIEW card and every interactive control has a minimum 44 px touch area.
- The Home title remains on one line at 390×844, 768×1024 and 844×390.
- The exact subtitle remains on one line where space permits and may wrap cleanly to at most two lines on narrower devices.
- The Home button and hidden archive file input have explicit accessible names.
- Spectator navigation remains inside the viewport; Timeline and Graph preserve their controlled internal scrolling.
