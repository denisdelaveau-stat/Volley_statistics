/* VolleyLive spectator view — TIMELINE rows and window preferences. */
(function () {
  'use strict';
  var t = window.VolleyI18n.t;
  var P = window.VolleySpectatorParts,
    st = P.state;
  var ORDER_KEY = P.ORDER_KEY,
    WINDOW_KEY = P.WINDOW_KEY,
    esc = P.esc,
    num = P.num,
    roleClass = P.roleClass,
    actionLabel = P.actionLabel;

  function prefs() {
    var order = localStorage.getItem(ORDER_KEY),
      size = localStorage.getItem(WINDOW_KEY);
    return {
      order: order === 'newestFirst' ? 'newestFirst' : 'oldestFirst',
      size: ['5', '10', '11', '20', 'all'].indexOf(size) >= 0 ? size : '5',
    };
  }
  function visibleRows() {
    var p = prefs(),
      rows = st.model.rallies.slice(),
      n = p.size === 'all' ? rows.length : num(p.size, 5);
    rows = rows.slice(Math.max(0, rows.length - n));
    if (p.order === 'newestFirst') rows.reverse();
    var maxGap = rows.reduce(function (mx, r) {
      return Math.max(mx, Math.abs(r.score.away - r.score.home));
    }, 0);
    return { rows: rows, p: p, maxGap: maxGap, scale: Math.max(5, maxGap) };
  }
  function eventCard(e) {
    if (!e) return '';
    if (e.side === 'AWAY') {
      var awayOutcome = e.outcome === 'point' ? 'point' : 'error';
      var awayAria = awayOutcome === 'point' ? 'AWAY, action marquant le point' : 'AWAY, faute donnant le point à HOME';
      return (
        '<div class="away-marker ' +
        awayOutcome +
        '" role="img" aria-label="' +
        awayAria +
        '"><span aria-hidden="true">A</span></div>'
      );
    }
    var p = e.player,
      name = (p && p.name) || t('spectator.playerHome'),
      number = p && p.number != null ? p.number : '—';
    var playerRole = (p && p.role) || '—',
      outcome = ['point', 'error', 'neutral'].indexOf(e.outcome) >= 0 ? e.outcome : 'neutral';
    var label = e.label || actionLabel(e.skill);
    return (
      '<article class="event-card home ' +
      outcome +
      '" title="' +
      esc(name) +
      '">' +
      '<div class="avatar ' +
      roleClass(playerRole) +
      '"><strong>' +
      esc(number) +
      '</strong><small>' +
      esc(playerRole) +
      '</small></div>' +
      '<div class="event-copy"><div class="event-name">' +
      esc(name) +
      '</div>' +
      (label ? '<div class="home-action ' + outcome + '">' + esc(label) + '</div>' : '') +
      '</div></article>'
    );
  }
  function renderRow(r, isLast, scale, maxGap, order) {
    var d = r.score.away - r.score.home,
      side = d > 0 ? 'away' : d < 0 ? 'home' : '',
      value = Math.abs(d);
    var isMaxGap = value > 0 && value === maxGap;
    var delta = side
      ? '<div class="delta-bar ' +
        side +
        (isMaxGap ? ' max-gap' : '') +
        '" role="img" aria-label="' +
        (side === 'away' ? 'AWAY' : 'HOME') +
        ' ' +
        t('spectator.leadsBy', { n: value }) +
        (isMaxGap ? ', ' + t('spectator.maxGap') : '') +
        '" title="' +
        (side === 'away' ? 'AWAY' : 'HOME') +
        ' +' +
        value +
        ' (' +
        r.score.away +
        '–' +
        r.score.home +
        ')"><span class="delta-badge">+' +
        value +
        '</span></div>'
      : '';
    var accent = r.phase === 'SO' ? 'so' : r.winner === 'HOME' ? 'bp-home' : 'bp-away';
    var awayScoreClass = r.winner === 'AWAY' ? ' score-accent ' + accent : '';
    var homeScoreClass = r.winner === 'HOME' ? ' score-accent ' + accent : '';
    var awayEvent = r.event && r.event.side === 'AWAY' ? eventCard(r.event) : '';
    var homeEvent = r.event && r.event.side === 'HOME' ? eventCard(r.event) : '';
    return (
      '<div class="tl-row ' +
      (isLast ? 'is-last ' : '') +
      (r.invalid ? 'invalid-row ' : '') +
      (order === 'newestFirst' ? 'newest-first' : '') +
      '" data-rally="' +
      r.rally +
      '" data-code="' +
      r.phase +
      '" data-winner="' +
      r.winner +
      '" data-score-accent="' +
      accent +
      '" data-valid="' +
      !r.invalid +
      '">' +
      '<div class="timeline-side home"><div class="event-slot home-slot ' +
      (homeEvent ? 'has-event' : '') +
      '">' +
      homeEvent +
      '</div>' +
      '<div class="timeline-connector home"' +
      (homeEvent ? '' : ' hidden') +
      ' aria-hidden="true"></div>' +
      '<div class="delta-lane home">' +
      (side === 'home' ? delta : '') +
      '</div></div>' +
      '<div class="score-node"><div class="rally-caption"><span>' +
      esc(t('spectator.rallyN', { n: r.rally })) +
      '</span></div>' +
      '<div class="score-pill ' +
      (isLast ? 'latest' : '') +
      '"><span class="score-half home' +
      homeScoreClass +
      '">' +
      r.score.home +
      '</span><b>:</b><span class="score-half away' +
      awayScoreClass +
      '">' +
      r.score.away +
      '</span></div>' +
      (isLast ? '<span class="last-point">' + esc(t('spectator.lastPoint')) + '</span>' : '') +
      (r.invalid ? '<span class="invalid-note">' + esc(t('spectator.dataToCheck')) + '</span>' : '') +
      '</div>' +
      '<div class="timeline-side away"><div class="delta-lane away">' +
      (side === 'away' ? delta : '') +
      '</div>' +
      '<div class="timeline-connector away"' +
      (awayEvent ? '' : ' hidden') +
      ' aria-hidden="true"></div>' +
      '<div class="event-slot away-slot ' +
      (awayEvent ? 'has-event' : '') +
      '">' +
      awayEvent +
      '</div></div></div>'
    );
  }

  P.prefs = prefs;
  P.visibleRows = visibleRows;
  P.eventCard = eventCard;
  P.renderRow = renderRow;
})();
