/* VolleyLive spectator archive view v1.16.0 — derived only from loaded official JSON. */
(function () {
  'use strict';

  var ARCHIVE_KEY = 'volleySpectator.archive.v1';
  var ORDER_KEY = 'volleySpectator.timeline.order';
  var WINDOW_KEY = 'volleySpectator.timeline.window';
  var raw = null;
  var model = null;

  function $(id) { return document.getElementById(id); }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(v, d) { v = Number(v); return Number.isFinite(v) ? v : d; }
  function upper(v) { return String(v || '').toUpperCase(); }
  function role(v) {
    var m = { SETTER: 'SET', SET: 'SET', OPPOSITE: 'OPP', OPP: 'OPP', OH: 'OH', MB: 'MB', LIBERO: 'LIB', LIB: 'LIB' };
    return m[upper(v)] || upper(v) || '—';
  }
  function roleClass(v) {
    var r = role(v);
    return ['OPP', 'SET', 'OH', 'MB', 'LIB'].indexOf(r) >= 0 ? 'role-' + r.toLowerCase() : 'role-unknown';
  }
  function detect(v) { return window.VolleyStatsAdapter ? VolleyStatsAdapter.detectFormat(v) : 'unknown'; }
  function normalizeResult(v) {
    var r = upper(v);
    if (['POINT', 'KILL', 'ACE', 'WIN', 'WINNER', 'POSITIVE', 'SUCCESS'].indexOf(r) >= 0) return 'point';
    if (['ERROR', 'FAULT', 'OUT', 'NET', 'NEGATIVE', 'FAIL'].indexOf(r) >= 0) return 'error';
    if (['NEUTRAL', 'CONTINUE', 'CONTINUOUS', 'IN_PLAY', 'PLAY', 'ZERO'].indexOf(r) >= 0) return 'neutral';
    return '';
  }
  function actionLabel(skill) {
    var s = upper(skill);
    var labels = {
      SERVICE: 'SERVICE', SERVE: 'SERVICE',
      ATTACK: 'ATTAQUE', BLOCK: 'CONTRE',
      RECEPTION: 'RÉCEPTION', DEFENSE: 'DÉFENSE', DEFENCE: 'DÉFENSE', DIG: 'DÉFENSE',
      SET: 'PASSE', SETTER: 'PASSE', FREEBALL: 'RELANCE', FREE_BALL: 'RELANCE'
    };
    return labels[s] || (s && s !== 'GENERIC' && s !== 'TEAM' ? s.replace(/_/g, ' ') : '');
  }
  function teamV2(d) {
    var teams = d.teams || [], m = d.match || {};
    var home = teams.find(function (t) { return t.teamId === m.ourTeamId; }) || teams.find(function (t) { return upper(t.side) === 'OUR'; }) || teams[0] || {};
    var away = teams.find(function (t) { return t.teamId === m.opponentTeamId; }) || teams.find(function (t) { return upper(t.side) === 'OPPONENT'; }) || teams[1] || {};
    return { home: home, away: away, homeId: home.teamId || m.ourTeamId, awayId: away.teamId || m.opponentTeamId };
  }
  function setsWonV2(d) {
    var a = 0, h = 0;
    (d.sets || []).forEach(function (s) {
      var fs = s.finalScore || {};
      if (num(fs.opponent, 0) > num(fs.our, 0)) a++;
      else if (num(fs.our, 0) > num(fs.opponent, 0)) h++;
    });
    return { away: a, home: h };
  }
  function terminalV2(d, r, byEvent, players, t, winner) {
    var e = byEvent[r.terminalEventId];
    var list = (d.events || []).filter(function (x) {
      return x.rallyId === r.rallyId && upper(x.eventType) === 'ACTION' && upper(x.status || 'ACTIVE') !== 'VOIDED';
    }).sort(function (a, b) { return num(a.sequenceNumber, 0) - num(b.sequenceNumber, 0); });
    if (!e) {
      e = list.filter(function (x) {
        return ['POINT', 'ERROR', 'FAULT', 'ACE', 'KILL', 'NEUTRAL', 'CONTINUE'].indexOf(upper(x.evaluation)) >= 0 || x.winnerTeamId;
      }).pop() || list[list.length - 1];
    }
    if (!e) return null;
    var side = e.teamId === t.homeId ? 'HOME' : 'AWAY';
    var outcome = normalizeResult(e.evaluation);
    if (side === 'AWAY') outcome = winner === 'AWAY' ? 'point' : 'error';
    else if (!outcome) outcome = winner === 'HOME' ? 'point' : 'error';
    return {
      side: side,
      player: players[e.playerId] || null,
      skill: e.actionType,
      label: actionLabel(e.actionType),
      outcome: outcome,
      eventId: e.eventId,
      teamId: e.teamId
    };
  }
  function modelV2(d) {
    var t = teamV2(d), players = {};
    (d.players || []).forEach(function (p) {
      players[p.playerId] = { number: p.number, name: p.name || ('Joueur ' + p.number), role: role(p.role || p.position), teamId: p.teamId };
    });
    var byEvent = {};
    (d.events || []).forEach(function (e) { byEvent[e.eventId] = e; });
    var all = (d.rallies || []).slice().filter(function (r) { return upper(r.status || 'CLOSED') !== 'VOIDED'; }).sort(function (a, b) {
      return num(a.setNumber, 1) - num(b.setNumber, 1) || num(a.rallyNumber, 0) - num(b.rallyNumber, 0);
    });
    var current = num((d.match || {}).currentSetNumber, (all[all.length - 1] || {}).setNumber || 1);
    var selected = all.filter(function (r) { return num(r.setNumber, 1) === current; });
    var warnings = [];
    var rallies = selected.map(function (r) {
      var score = r.scoreAfter || {};
      var winner = r.winnerTeamId === t.homeId ? 'HOME' : 'AWAY';
      var serving = r.servingTeamId === t.homeId ? 'HOME' : 'AWAY';
      var phase = winner === serving ? 'BP' : 'SO';
      var event = terminalV2(d, r, byEvent, players, t, winner);
      var invalid = false;
      if (String((d.match || {}).detailLevel || '').toLowerCase() === 'basic' || (event && ['GENERIC', 'TEAM'].indexOf(upper(event.skill)) >= 0)) event = null;
      if (event && ['SERVICE', 'SERVE'].indexOf(upper(event.skill)) >= 0 && event.teamId !== r.servingTeamId) {
        invalid = true;
        warnings.push('Rallye ' + r.rallyNumber + ' : action de service rejetée pour l’équipe non au service.');
      }
      return {
        set: current,
        rally: num(r.rallyNumber, 1),
        score: { away: num(score.opponent, 0), home: num(score.our, 0) },
        winner: winner,
        serving: serving,
        phase: phase,
        code: phase,
        event: event,
        invalid: invalid,
        id: r.rallyId
      };
    });
    var last = selected[selected.length - 1], score = last && last.scoreAfter || { our: 0, opponent: 0 }, sw = setsWonV2(d);
    return {
      format: 'v2.1', name: (d.match || {}).name || 'Match',
      homeName: t.home.name || 'HOME', awayName: t.away.name || 'AWAY', currentSet: current,
      score: { away: num(score.opponent, 0), home: num(score.our, 0) }, sets: sw,
      rallies: rallies, warnings: warnings,
      finished: ['COMPLETED', 'FINISHED', 'ENDED'].indexOf(upper((d.match || {}).lifecycleStatus || (d.match || {}).status)) >= 0
    };
  }
  function groupV1(events) {
    var sets = {}, scores = {};
    (events || []).forEach(function (e) {
      var s = num(e.set, 1);
      if (!sets[s]) sets[s] = [];
      var list = sets[s], r = list.length && !list[list.length - 1].closed ? list[list.length - 1] : null;
      if (!r) { r = { set: s, rally: list.length + 1, actions: [] }; list.push(r); }
      r.actions.push(e);
      r.score = { home: num(e.scoreA, (scores[s] || {}).home || 0), away: num(e.scoreB, (scores[s] || {}).away || 0) };
      scores[s] = r.score;
      if (e.winningTeam === 'team1' || e.winningTeam === 'team2') {
        r.closed = true;
        r.winner = e.winningTeam === 'team1' ? 'HOME' : 'AWAY';
        r.terminal = e;
      }
    });
    return sets;
  }
  function modelV1(d) {
    var m = d.match || {}, roster = {};
    ((m.team || {}).roster || []).forEach(function (p) {
      roster[String(p.number)] = { number: p.number, name: p.name || ('Joueur ' + p.number), role: role(p.position || p.role) };
    });
    var groups = groupV1(d.events || []), setNums = Object.keys(groups).map(Number).sort(function (a, b) { return a - b; });
    var current = num(m.currentSet, setNums[setNums.length - 1] || 1), rows = groups[current] || [];
    var initial = String((m.firstRally || {}).antibesState || 'reception').toLowerCase() === 'service' ? 'HOME' : 'AWAY';
    var serving = initial, warnings = [];
    var rallies = rows.filter(function (r) { return r.closed; }).map(function (r) {
      var e = r.terminal || {};
      var isBasic = String(m.detailLevel || '').toLowerCase() === 'basic' || String(e.action || '').toLowerCase() === 'generic' || e.player === 'T';
      var side = e.player === 'A' || String(e.action).toLowerCase() === 'adverse' ? 'AWAY' : 'HOME';
      var event = null;
      if (!isBasic) {
        var outcome = normalizeResult(e.result);
        if (side === 'AWAY') outcome = r.winner === 'AWAY' ? 'point' : 'error';
        else if (!outcome) outcome = r.winner === 'HOME' ? 'point' : 'error';
        event = {
          side: side, player: side === 'HOME' ? roster[String(e.player)] || null : null,
          skill: e.action, label: actionLabel(e.action), outcome: outcome, eventId: e.id, teamId: side
        };
      }
      var phase = r.winner === serving ? 'BP' : 'SO';
      var out = {
        set: current, rally: r.rally, score: r.score || { away: 0, home: 0 }, winner: r.winner,
        serving: serving, phase: phase, code: phase, event: event, invalid: false,
        id: 'v1-' + current + '-' + r.rally
      };
      serving = r.winner;
      return out;
    });
    var last = rallies[rallies.length - 1], sets = { away: 0, home: 0 };
    setNums.forEach(function (s) {
      if (s === current) return;
      var rs = (groups[s] || []).filter(function (r) { return r.closed; }), l = rs[rs.length - 1];
      if (l) { if (l.score.home > l.score.away) sets.home++; else if (l.score.away > l.score.home) sets.away++; }
    });
    return {
      format: 'capture-v1', name: m.name || 'Match',
      homeName: (m.team || {}).name || 'HOME', awayName: (m.opponent || {}).name || 'AWAY', currentSet: current,
      score: last ? last.score : { away: 0, home: 0 }, sets: sets, rallies: rallies, warnings: warnings,
      finished: String(m.status || '').toLowerCase() === 'finished'
    };
  }
  function build(d) {
    var v = VolleyStatsAdapter.validate(d);
    if (!v.valid) throw new Error(v.errors.join(' '));
    return detect(d) === 'unified-v2' ? modelV2(d) : modelV1(d);
  }
  function prefs() {
    var order = localStorage.getItem(ORDER_KEY), size = localStorage.getItem(WINDOW_KEY);
    return {
      order: order === 'newestFirst' ? 'newestFirst' : 'oldestFirst',
      size: ['5', '10', '20', 'all'].indexOf(size) >= 0 ? size : '5'
    };
  }
  function visibleRows() {
    var p = prefs(), rows = model.rallies.slice(), n = p.size === 'all' ? rows.length : num(p.size, 5);
    rows = rows.slice(Math.max(0, rows.length - n));
    if (p.order === 'newestFirst') rows.reverse();
    return { rows: rows, p: p, scale: Math.max(5, rows.reduce(function (mx, r) { return Math.max(mx, Math.abs(r.score.away - r.score.home)); }, 0)) };
  }
  function eventCard(e) {
    if (!e) return '';
    if (e.side === 'AWAY') {
      var awayOutcome = e.outcome === 'point' ? 'point' : 'error';
      var awayAria = awayOutcome === 'point' ? 'AWAY, action marquant le point' : 'AWAY, faute donnant le point à HOME';
      return '<div class="away-marker ' + awayOutcome + '" role="img" aria-label="' + awayAria + '"><span aria-hidden="true">A</span></div>';
    }
    var p = e.player, name = p && p.name || 'Joueur HOME', number = p && p.number != null ? p.number : '—';
    var playerRole = p && p.role || '—', outcome = ['point', 'error', 'neutral'].indexOf(e.outcome) >= 0 ? e.outcome : 'neutral';
    var label = e.label || actionLabel(e.skill);
    return '<article class="event-card home ' + outcome + '" title="' + esc(name) + '">' +
      '<div class="avatar ' + roleClass(playerRole) + '"><strong>' + esc(number) + '</strong><small>' + esc(playerRole) + '</small></div>' +
      '<div class="event-copy"><div class="event-name">' + esc(name) + '</div>' +
      (label ? '<div class="home-action ' + outcome + '">' + esc(label) + '</div>' : '') + '</div></article>';
  }
  function renderRow(r, isLast, scale, order) {
    var d = r.score.away - r.score.home, side = d > 0 ? 'away' : d < 0 ? 'home' : '', value = Math.abs(d);
    var w = value ? Math.max(38, Math.round(value / scale * 100)) + '%' : '0';
    var delta = side ? '<div class="delta-bar ' + side + '" style="width:' + w + '" role="img" aria-label="' +
      (side === 'away' ? 'AWAY' : 'HOME') + ' mène de ' + value + ' points" title="' +
      (side === 'away' ? 'AWAY' : 'HOME') + ' +' + value + ' (' + r.score.away + '–' + r.score.home + ')">+' + value + '</div>' : '';
    var accent = r.phase === 'SO' ? 'so' : r.winner === 'HOME' ? 'bp-home' : 'bp-away';
    var awayScoreClass = r.winner === 'AWAY' ? ' score-accent ' + accent : '';
    var homeScoreClass = r.winner === 'HOME' ? ' score-accent ' + accent : '';
    var awayEvent = r.event && r.event.side === 'AWAY' ? eventCard(r.event) : '';
    var homeEvent = r.event && r.event.side === 'HOME' ? eventCard(r.event) : '';
    return '<div class="tl-row ' + (isLast ? 'is-last ' : '') + (r.invalid ? 'invalid-row ' : '') +
      (order === 'newestFirst' ? 'newest-first' : '') + '" data-rally="' + r.rally + '" data-code="' + r.phase +
      '" data-winner="' + r.winner + '" data-score-accent="' + accent + '" data-valid="' + (!r.invalid) + '">' +
      '<div class="delta-lane away">' + (side === 'away' ? delta : '') + '</div>' +
      '<div class="event-slot away-slot ' + (awayEvent ? 'has-event' : '') + '">' + awayEvent + '</div>' +
      '<div class="score-node"><div class="rally-caption"><span>Rallye ' + r.rally + '</span></div>' +
      '<div class="score-pill ' + (isLast ? 'latest' : '') + '"><span class="score-half away' + awayScoreClass + '">' + r.score.away +
      '</span><b>:</b><span class="score-half home' + homeScoreClass + '">' + r.score.home + '</span></div>' +
      (isLast ? '<span class="last-point">DERNIER POINT</span>' : '') +
      (r.invalid ? '<span class="invalid-note">DONNÉE À VÉRIFIER</span>' : '') + '</div>' +
      '<div class="event-slot home-slot ' + (homeEvent ? 'has-event' : '') + '">' + homeEvent + '</div>' +
      '<div class="delta-lane home">' + (side === 'home' ? delta : '') + '</div></div>';
  }
  function render() {
    if (!model) return;
    var last = model.rallies[model.rallies.length - 1], v = visibleRows();
    $('headerAway').textContent = model.score.away;
    $('headerHome').textContent = model.score.home;
    $('headerSet').textContent = 'SET ' + model.currentSet + ' · ' + model.sets.away + '–' + model.sets.home;
    $('archiveBadge').textContent = model.finished ? 'TERMINÉ' : 'ARCHIVE';
    $('awayName').textContent = model.awayName;
    $('homeName').textContent = model.homeName;
    $('timelineSet').textContent = 'SET ' + model.currentSet + ' · Fil du match';
    $('timelineOrder').textContent = v.p.order === 'oldestFirst' ? 'Ancien → récent' : 'Récent → ancien';
    $('summaryAway').textContent = model.score.away;
    $('summaryHome').textContent = model.score.home;
    $('summaryMatch').textContent = model.awayName + ' — ' + model.homeName;
    $('summarySet').textContent = 'SET ' + model.currentSet + ' · sets ' + model.sets.away + '–' + model.sets.home;
    $('statsSummary').textContent = model.rallies.length + ' rallyes · ' + model.format + ' · ' + model.awayName + ' ' + model.score.away + ' : ' + model.score.home + ' ' + model.homeName;
    document.querySelectorAll('[data-order]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.order === v.p.order);
      b.setAttribute('aria-pressed', b.dataset.order === v.p.order ? 'true' : 'false');
    });
    $('windowSize').value = v.p.size;
    $('timelineList').innerHTML = v.rows.map(function (r) { return renderRow(r, last && r.id === last.id, v.scale, v.p.order); }).join('');
    $('timelineEmpty').hidden = model.rallies.length !== 0;
    $('timelineWarning').hidden = !model.warnings.length;
    $('timelineWarning').textContent = model.warnings.join(' ');
  }
  function activate(name) {
    document.querySelectorAll('[data-tab]').forEach(function (b) {
      var on = b.dataset.tab === name;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('[data-panel]').forEach(function (p) { p.hidden = p.dataset.panel !== name; });
    location.hash = name;
  }
  function setArchive(d) {
    var v = VolleyStatsAdapter.validate(d);
    if (!v.valid) throw new Error(v.errors.join(' '));
    raw = d;
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(d));
    sessionStorage.setItem('volleyAnalysis.replay.v1', JSON.stringify(d));
    model = build(d);
    render();
    return model;
  }
  function fatal(message) { $('spectatorApp').hidden = true; $('fatal').hidden = false; $('fatalText').textContent = message; }
  function init() {
    try {
      raw = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || 'null');
      if (!raw) throw new Error('Sélectionnez une archive valide depuis OPEN ARCHIVES.');
      model = build(raw);
      render();
    } catch (e) { fatal(e.message); return; }
    document.querySelectorAll('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { activate(b.dataset.tab); }); });
    document.querySelectorAll('[data-order]').forEach(function (b) {
      b.addEventListener('click', function () { localStorage.setItem(ORDER_KEY, b.dataset.order); render(); });
    });
    $('windowSize').addEventListener('change', function () { localStorage.setItem(WINDOW_KEY, this.value); render(); });
    $('openAdvancedStats').addEventListener('click', function () {
      sessionStorage.setItem('volleyAnalysis.replay.v1', JSON.stringify(raw));
      sessionStorage.setItem('volleyAnalysis.replay.source.v1', localStorage.getItem('volleySpectator.archiveName.v1') || 'archive.json');
      location.href = 'statistics/index.html';
    });
    window.addEventListener('storage', function (e) {
      if (e.key === ARCHIVE_KEY && e.newValue) {
        try { raw = JSON.parse(e.newValue); model = build(raw); render(); } catch (x) { fatal(x.message); }
      }
    });
    activate(location.hash === '#live-score' ? 'live-score' : location.hash === '#stats' ? 'stats' : 'live-timeline');
  }

  window.VolleySpectator = {
    buildViewModel: build,
    setArchive: setArchive,
    refresh: function () { model = build(raw); render(); },
    getModel: function () { return model; },
    visibleRows: visibleRows
  };
  init();
})();
