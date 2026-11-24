/* VolleyLive spectator view v1.26.1 — spectator Timeline geometry aligned to the reference captures. */
(function () {
  'use strict';

  var ARCHIVE_KEY = 'volleySpectator.archive.v1';
  var ORDER_KEY = 'volleySpectator.timeline.order';
  var WINDOW_KEY = 'volleySpectator.timeline.window';
  var raw = null;
  var model = null;
  var announcedLeader = null;
  var momentumCfg = Object.assign({ windowSize: 8, minPoints: 4, advantageThreshold: 0.70 },
    (window.VolleySpectatorConfig && window.VolleySpectatorConfig.momentum) || {});
  var selectedSetNumber = null;
  var evolutionBrowsing = false;

  var I18N = {
    scorePositive: 'HOME devant', scoreZero: 'Égalité', scoreNegative: 'AWAY devant',
    faultPositive: 'HOME : plus de fautes', faultZero: 'Égalité', faultNegative: 'AWAY : plus de fautes',
    pointsPlayed: 'Points joués', sideOut: 'Side-out', breakPoint: 'Break Point'
  };

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
  function sideForTeamId(teamId, teams) {
    if (teamId === teams.homeId) return 'HOME';
    if (teamId === teams.awayId) return 'AWAY';
    return null;
  }
  function isVoided(v) {
    return !!(v && (v.cancelled === true || v.undone === true || ['VOIDED', 'CANCELLED', 'UNDONE'].indexOf(upper(v.status)) >= 0));
  }
  function isFinishedStatus(v) { return ['COMPLETED', 'FINISHED', 'ENDED', 'CLOSED'].indexOf(upper(v)) >= 0; }
  function logoOf(team) { return team && (team.logoUrl || team.logo || team.crestUrl || team.imageUrl) || '';
  }
  function monogram(name) {
    var ignored = ['DE', 'DU', 'LA', 'LE', 'LES', 'DES', 'D'];
    var words = String(name || '').replace(/[’']/g, ' ').split(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9]+/).filter(Boolean);
    var significant = words.filter(function (word) { return ignored.indexOf(upper(word)) < 0; });
    var chosen = significant.length ? significant : words, value = '';
    chosen.forEach(function (word) {
      if (value.length >= 3) return;
      var token = /^[A-ZÀ-ÖØ-Þ]{2,3}$/.test(word) ? upper(word) : upper(word.charAt(0));
      value += token;
    });
    return value.slice(0, 3) || 'NA';
  }
  function statusFor(matchFinished, setFinished, pointCount) {
    if (matchFinished) return 'MATCH_FINISHED';
    if (setFinished) return 'SET_FINISHED';
    return pointCount ? 'IN_PROGRESS' : 'NOT_STARTED';
  }
  function isFaultEvent(event) {
    return window.VolleyStatsAdapter && typeof VolleyStatsAdapter.isFaultEvent === 'function' ?
      VolleyStatsAdapter.isFaultEvent(event) : normalizeResult(event && (event.evaluation !== undefined ? event.evaluation : event.result)) === 'error';
  }
  function availableSetNumbersV2(d) {
    var seen = {};
    (d.sets || []).forEach(function (s) { seen[num(s.setNumber, 1)] = true; });
    (d.rallies || []).forEach(function (r) { seen[num(r.setNumber, 1)] = true; });
    return Object.keys(seen).map(Number).sort(function (a, b) { return a - b; });
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
    if (isVoided(e)) e = null;
    var list = (d.events || []).filter(function (x) {
      return x.rallyId === r.rallyId && upper(x.eventType) === 'ACTION' && !isVoided(x);
    }).sort(function (a, b) { return num(a.sequenceNumber, 0) - num(b.sequenceNumber, 0); });
    if (!e) {
      e = list.filter(function (x) {
        return ['POINT', 'ERROR', 'FAULT', 'ACE', 'KILL', 'NEUTRAL', 'CONTINUE'].indexOf(upper(x.evaluation)) >= 0 || x.winnerTeamId;
      }).pop() || list[list.length - 1];
    }
    if (!e) return null;
    var side = sideForTeamId(e.teamId, t);
    if (!side) return null;
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
  function modelV2(d, requestedSet) {
    var t = teamV2(d), players = {}, match = d.match || {};
    (d.players || []).forEach(function (p) {
      players[p.playerId] = { number: p.number, name: p.name || ('Joueur ' + p.number), role: role(p.role || p.position), teamId: p.teamId };
    });
    var byEvent = {}, eventsByRally = {};
    (d.events || []).forEach(function (e) {
      byEvent[e.eventId] = e;
      if (upper(e.eventType || 'ACTION') === 'ACTION' && !isVoided(e) && e.rallyId) {
        (eventsByRally[e.rallyId] || (eventsByRally[e.rallyId] = [])).push(e);
      }
    });
    var all = (d.rallies || []).slice().filter(function (r) { return !isVoided(r) && !!r.winnerTeamId; }).sort(function (a, b) {
      return num(a.setNumber, 1) - num(b.setNumber, 1) || num(a.rallyNumber, 0) - num(b.rallyNumber, 0);
    });
    var availableSets = availableSetNumbersV2(d);
    var liveSet = num(match.currentSetNumber, (all[all.length - 1] || {}).setNumber || availableSets[0] || 1);
    if (availableSets.indexOf(liveSet) < 0) availableSets.push(liveSet);
    availableSets.sort(function (a, b) { return a - b; });
    var requested = num(requestedSet, liveSet);
    var current = availableSets.indexOf(requested) >= 0 ? requested : liveSet;
    var selected = all.filter(function (r) { return num(r.setNumber, 1) === current; });
    var setDef = (d.sets || []).find(function (set) { return num(set.setNumber, 1) === current; }) || {};
    var warnings = [], cumulativeHomeFaults = 0, cumulativeAwayFaults = 0;
    var rallies = selected.map(function (r) {
      var score = r.scoreAfter || {};
      var winner = sideForTeamId(r.winnerTeamId, t);
      var serving = sideForTeamId(r.servingTeamId, t);
      var phase = winner && serving ? (winner === serving ? 'BP' : 'SO') : null;
      var event = winner ? terminalV2(d, r, byEvent, players, t, winner) : null;
      var invalid = false;
      if (String(match.detailLevel || '').toLowerCase() === 'basic' || (event && ['GENERIC', 'TEAM'].indexOf(upper(event.skill)) >= 0)) event = null;
      if (event && ['SERVICE', 'SERVE'].indexOf(upper(event.skill)) >= 0 && event.teamId !== r.servingTeamId) {
        invalid = true;
        warnings.push('Rallye ' + r.rallyNumber + ' : action de service rejetée pour l’équipe non au service.');
      }
      var homeFaultIncrement = 0, awayFaultIncrement = 0;
      (eventsByRally[r.rallyId] || []).forEach(function (faultEvent) {
        if (!isFaultEvent(faultEvent)) return;
        var faultSide = sideForTeamId(faultEvent.teamId, t);
        if (faultSide === 'HOME') homeFaultIncrement++;
        if (faultSide === 'AWAY') awayFaultIncrement++;
      });
      cumulativeHomeFaults += homeFaultIncrement;
      cumulativeAwayFaults += awayFaultIncrement;
      var homeScore = num(score.our, 0), awayScore = num(score.opponent, 0);
      return {
        set: current, rally: num(r.rallyNumber, 1), rallyOrdinal: num(r.rallyNumber, 1), rallyKey: r.rallyId,
        score: { away: awayScore, home: homeScore }, homeScore: homeScore, awayScore: awayScore,
        scoreDelta: homeScore - awayScore, winner: winner, scoringTeam: winner, serving: serving,
        phase: phase, code: phase, pointClassification: phase === 'SO' ? 'SIDE_OUT' : phase === 'BP' ? 'BREAK_POINT' : null,
        event: event, invalid: invalid, id: r.rallyId,
        cumulativeHomeFaults: cumulativeHomeFaults, cumulativeAwayFaults: cumulativeAwayFaults,
        homeFaultIncrement: homeFaultIncrement, awayFaultIncrement: awayFaultIncrement,
        faultTeam: homeFaultIncrement && !awayFaultIncrement ? 'HOME' : awayFaultIncrement && !homeFaultIncrement ? 'AWAY' : null,
        faultDelta: cumulativeHomeFaults - cumulativeAwayFaults
      };
    });
    var matchFinished = isFinishedStatus(match.lifecycleStatus || match.status);
    var setFinished = isFinishedStatus(setDef.status) || current < liveSet;
    var state = statusFor(matchFinished, setFinished, rallies.length);
    var last = selected[selected.length - 1], score = last && last.scoreAfter;
    if (!score && setFinished && setDef.finalScore) score = setDef.finalScore;
    score = score || { our: 0, opponent: 0 };
    var sw = setsWonV2(d);
    var servingSide = null;
    if (state === 'IN_PROGRESS' || state === 'NOT_STARTED') {
      servingSide = rallies.length ? rallies[rallies.length - 1].winner : sideForTeamId(setDef.initialServingTeamId, t);
    }
    return {
      format: 'v2.1', name: match.name || 'Match',
      homeName: t.home.name || 'HOME', awayName: t.away.name || 'AWAY', homeLogo: logoOf(t.home), awayLogo: logoOf(t.away),
      currentSet: current, liveSet: liveSet, availableSets: availableSets,
      score: { away: num(score.opponent, 0), home: num(score.our, 0) }, sets: sw,
      rallies: rallies, warnings: warnings, finished: matchFinished, status: state, servingSide: servingSide,
      noMatch: false
    };
  }
  function groupV1(events) {
    var sets = {}, scores = {};
    (events || []).forEach(function (e) {
      if (isVoided(e)) return;
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
  function modelV1(d, requestedSet) {
    var m = d.match || {}, roster = {};
    ((m.team || {}).roster || []).forEach(function (p) {
      roster[String(p.number)] = { number: p.number, name: p.name || ('Joueur ' + p.number), role: role(p.position || p.role) };
    });
    var groups = groupV1(d.events || []), setNums = Object.keys(groups).map(Number).sort(function (a, b) { return a - b; });
    var liveSet = num(m.currentSet, setNums[setNums.length - 1] || 1);
    if (setNums.indexOf(liveSet) < 0) setNums.push(liveSet);
    setNums.sort(function (a, b) { return a - b; });
    var requested = num(requestedSet, liveSet);
    var current = setNums.indexOf(requested) >= 0 ? requested : liveSet, rows = groups[current] || [];
    var initial = String((m.firstRally || {}).antibesState || 'reception').toLowerCase() === 'service' ? 'HOME' : 'AWAY';
    var serving = initial, warnings = [], cumulativeHomeFaults = 0, cumulativeAwayFaults = 0;
    var rallies = rows.filter(function (r) { return r.closed; }).map(function (r) {
      var e = r.terminal || {};
      var isBasic = String(m.detailLevel || '').toLowerCase() === 'basic' || String(e.action || '').toLowerCase() === 'generic' || e.player === 'T';
      var side = e.player === 'A' || String(e.action).toLowerCase() === 'adverse' ? 'AWAY' : 'HOME';
      var event = null;
      if (!isBasic) {
        var outcome = normalizeResult(e.result);
        if (side === 'AWAY') outcome = r.winner === 'AWAY' ? 'point' : 'error';
        else if (!outcome) outcome = r.winner === 'HOME' ? 'point' : 'error';
        event = { side: side, player: side === 'HOME' ? roster[String(e.player)] || null : null,
          skill: e.action, label: actionLabel(e.action), outcome: outcome, eventId: e.id, teamId: side };
      }
      var phase = r.winner === serving ? 'BP' : 'SO';
      var homeFaultIncrement = 0, awayFaultIncrement = 0;
      (r.actions || []).forEach(function (action) {
        if (!isFaultEvent(action)) return;
        var actionSide = action.player === 'A' || String(action.action || '').toLowerCase() === 'adverse' ? 'AWAY' : 'HOME';
        if (actionSide === 'HOME') homeFaultIncrement++; else awayFaultIncrement++;
      });
      cumulativeHomeFaults += homeFaultIncrement;
      cumulativeAwayFaults += awayFaultIncrement;
      var score = r.score || { away: 0, home: 0 };
      var out = {
        set: current, rally: r.rally, rallyOrdinal: r.rally, rallyKey: 'v1-' + current + '-' + r.rally,
        score: score, homeScore: score.home, awayScore: score.away, scoreDelta: score.home - score.away,
        winner: r.winner, scoringTeam: r.winner, serving: serving, phase: phase, code: phase,
        pointClassification: phase === 'SO' ? 'SIDE_OUT' : 'BREAK_POINT', event: event, invalid: false,
        id: 'v1-' + current + '-' + r.rally,
        cumulativeHomeFaults: cumulativeHomeFaults, cumulativeAwayFaults: cumulativeAwayFaults,
        homeFaultIncrement: homeFaultIncrement, awayFaultIncrement: awayFaultIncrement,
        faultTeam: homeFaultIncrement && !awayFaultIncrement ? 'HOME' : awayFaultIncrement && !homeFaultIncrement ? 'AWAY' : null,
        faultDelta: cumulativeHomeFaults - cumulativeAwayFaults
      };
      serving = r.winner;
      return out;
    });
    var matchFinished = isFinishedStatus(m.status || m.lifecycleStatus), setFinished = matchFinished || current < liveSet;
    var state = statusFor(matchFinished, setFinished, rallies.length), last = rallies[rallies.length - 1];
    var sets = { away: 0, home: 0 };
    setNums.forEach(function (s) {
      var completed = s < liveSet || matchFinished;
      if (!completed) return;
      var rs = (groups[s] || []).filter(function (r) { return r.closed; }), l = rs[rs.length - 1];
      if (l) { if (l.score.home > l.score.away) sets.home++; else if (l.score.away > l.score.home) sets.away++; }
    });
    return {
      format: 'capture-v1', name: m.name || 'Match',
      homeName: (m.team || {}).name || 'HOME', awayName: (m.opponent || {}).name || 'AWAY',
      homeLogo: logoOf(m.team || {}), awayLogo: logoOf(m.opponent || {}), currentSet: current, liveSet: liveSet,
      availableSets: setNums, score: last ? last.score : { away: 0, home: 0 }, sets: sets,
      rallies: rallies, warnings: warnings, finished: matchFinished, status: state,
      servingSide: (state === 'IN_PROGRESS' || state === 'NOT_STARTED') ? (last ? last.winner : initial) : null,
      noMatch: false
    };
  }
  function build(d, requestedSet) {
    var v = VolleyStatsAdapter.validate(d);
    if (!v.valid) throw new Error(v.errors.join(' '));
    return detect(d) === 'unified-v2' ? modelV2(d, requestedSet) : modelV1(d, requestedSet);
  }
  function emptyModel() {
    return { format: 'empty', name: '', homeName: 'HOME', awayName: 'AWAY', homeLogo: '', awayLogo: '',
      currentSet: null, liveSet: null, availableSets: [], score: { home: 0, away: 0 }, sets: { home: 0, away: 0 },
      rallies: [], warnings: [], finished: false, status: 'NO_MATCH', servingSide: null, noMatch: true };
  }
  function computeMomentum(points, setNumber, cfg) {
    cfg = Object.assign({}, momentumCfg, cfg || {});
    var setPoints = (points || []).filter(function (point) {
      return !isVoided(point) && (setNumber == null || num(point.set, setNumber) === setNumber) && ['HOME', 'AWAY'].indexOf(point.winner) >= 0;
    }).slice().sort(function (a, b) { return num(a.rallyOrdinal, a.rally) - num(b.rallyOrdinal, b.rally); });
    var sequence = setPoints.slice(-cfg.windowSize).map(function (point) { return point.winner; });
    var k = sequence.length, homeCount = sequence.filter(function (side) { return side === 'HOME'; }).length;
    var awayCount = k - homeCount, homePct = null, awayPct = null, leader = null;
    if (k >= cfg.minPoints) {
      homePct = Math.round(homeCount / k * 100); awayPct = 100 - homePct;
      var h = homeCount / k, a = awayCount / k;
      leader = h >= cfg.advantageThreshold ? 'HOME' : a >= cfg.advantageThreshold ? 'AWAY' : 'BALANCED';
    }
    var streak = null;
    if (setPoints.length) {
      var last = setPoints[setPoints.length - 1].winner, length = 0;
      for (var i = setPoints.length - 1; i >= 0 && setPoints[i].winner === last; i--) length++;
      streak = { side: last, length: length };
    }
    return { setNumber: setNumber, windowSize: cfg.windowSize, sequence: sequence, homeCount: homeCount, awayCount: awayCount,
      homePct: homePct, awayPct: awayPct, leader: leader, streak: streak };
  }
  function momentumView(m) {
    var value = computeMomentum(m.rallies, m.currentSet, momentumCfg), state;
    if (m.status === 'NO_MATCH') state = 'NO_MATCH';
    else if (m.status === 'MATCH_FINISHED') state = 'MATCH_FINISHED';
    else if (m.status === 'SET_FINISHED') state = 'SET_FINISHED';
    else if (!m.rallies.length) state = 'NEW_SET';
    else if (m.rallies.length < momentumCfg.minPoints) state = 'NOT_ENOUGH';
    else state = 'ACTIVE';
    value.state = state;
    return value;
  }
  function statusLabel(m) {
    if (m.status === 'NO_MATCH') return 'AUCUN MATCH';
    if (m.status === 'MATCH_FINISHED') return 'MATCH TERMINÉ';
    if (m.status === 'SET_FINISHED') return 'FIN DU SET ' + m.currentSet;
    if (m.status === 'NOT_STARTED') return 'SET ' + (m.currentSet || 1) + ' · À VENIR';
    return 'SET ' + m.currentSet + ' · EN COURS';
  }
  function setLogo(img, mono, url, name) {
    mono.textContent = monogram(name);
    img.removeAttribute('src');
    img.hidden = true;
    if (!url) return;
    img.onload = function () { img.hidden = false; mono.hidden = true; };
    img.onerror = function () { img.hidden = true; mono.hidden = false; img.removeAttribute('src'); };
    mono.hidden = false;
    img.src = url;
  }
  function renderScoreboard(m) {
    var label = statusLabel(m), noMatch = m.status === 'NO_MATCH';
    $('headerHome').textContent = m.score.home; $('headerAway').textContent = m.score.away;
    $('setsHome').textContent = m.sets.home; $('setsAway').textContent = m.sets.away; $('headerSet').textContent = label;
    $('homeTeamDisplay').textContent = m.homeName; $('awayTeamDisplay').textContent = m.awayName;
    setLogo($('homeTeamLogo'), $('homeMonogram'), m.homeLogo, m.homeName);
    setLogo($('awayTeamLogo'), $('awayMonogram'), m.awayLogo, m.awayName);
    if (m.servingSide === 'HOME') $('serviceHome').removeAttribute('hidden'); else $('serviceHome').setAttribute('hidden', '');
    if (m.servingSide === 'AWAY') $('serviceAway').removeAttribute('hidden'); else $('serviceAway').setAttribute('hidden', '');
    $('liveScoreboard').classList.toggle('state-no-match', noMatch);
    var service = m.servingSide ? ', service ' + (m.servingSide === 'HOME' ? m.homeName : m.awayName) : '';
    $('liveScoreboard').setAttribute('aria-label', noMatch ? 'Aucun match chargé, score 0 à 0' :
      m.homeName + ' ' + m.score.home + ', ' + m.awayName + ' ' + m.score.away + ', ' + label.toLowerCase() + ', sets ' + m.sets.home + ' à ' + m.sets.away + service);
  }
  function renderMomentum(m) {
    var vm = momentumView(m), card = $('momentumCard'), k = vm.sequence.length;
    card.className = 'live-card momentum-card state-' + vm.state.toLowerCase().replace('_', '-');
    if (vm.leader) card.classList.add('leader-' + vm.leader.toLowerCase());
    var subtitle = 'Aucun match chargé';
    if (vm.state === 'NEW_SET') subtitle = 'Nouveau set — en attente du premier point';
    else if (vm.state === 'NOT_ENOUGH') subtitle = 'Momentum disponible après ' + momentumCfg.minPoints + ' points';
    else if (vm.state === 'SET_FINISHED' || vm.state === 'MATCH_FINISHED') subtitle = 'Fin du set ' + m.currentSet + ' · ' + k + ' derniers points';
    else if (vm.state === 'ACTIVE') subtitle = 'Sur les ' + k + ' derniers points';
    $('momentumSubtitle').textContent = subtitle;
    var arrow = '—', headline = 'NA';
    if (vm.leader === 'HOME') { arrow = '↗'; headline = 'Avantage ' + m.homeName; }
    else if (vm.leader === 'AWAY') { arrow = '↗'; headline = 'Avantage ' + m.awayName; }
    else if (vm.leader === 'BALANCED') { arrow = '↔'; headline = 'Équilibré'; }
    $('momentumArrow').textContent = arrow; $('momentumLeader').textContent = headline;
    if (announcedLeader === vm.leader) $('momentumHeadline').setAttribute('aria-live', 'off');
    else { $('momentumHeadline').setAttribute('aria-live', 'polite'); announcedLeader = vm.leader; }
    $('homePct').textContent = vm.homePct == null ? 'NA' : vm.homePct + ' %';
    $('awayPct').textContent = vm.awayPct == null ? 'NA' : vm.awayPct + ' %';
    $('homeMomentumBar').style.width = (vm.homePct == null ? 0 : vm.homePct) + '%';
    $('awayMomentumBar').style.width = (vm.awayPct == null ? 100 : vm.awayPct) + '%';
    $('momentumBar').setAttribute('aria-label', vm.homePct == null ? 'Répartition indisponible' : m.homeName + ' ' + vm.homePct + ' pour cent, ' + m.awayName + ' ' + vm.awayPct + ' pour cent');
    $('momentumHomeName').textContent = upper(m.homeName); $('momentumAwayName').textContent = upper(m.awayName);
    $('homeCount').textContent = vm.homeCount; $('awayCount').textContent = vm.awayCount;
    var placeholders = Math.max(0, vm.windowSize - k), html = '';
    for (var i = 0; i < placeholders; i++) html += '<span class="momentum-tile placeholder" role="listitem" aria-label="Emplacement vide"></span>';
    vm.sequence.forEach(function (side, index) {
      var team = side === 'HOME' ? m.homeName : m.awayName;
      html += '<span class="momentum-tile ' + side.toLowerCase() + '" role="listitem" aria-label="Point ' + (index + 1) + ' : ' + esc(team) + '">' + (side === 'HOME' ? 'H' : 'A') + '</span>';
    });
    $('momentumSequence').style.setProperty('--momentum-slots', vm.windowSize);
    $('momentumSequence').innerHTML = html;
    var streakText = '—';
    if (vm.streak) {
      var streakTeam = vm.streak.side === 'HOME' ? m.homeName : m.awayName;
      streakText = vm.streak.length === 1 ? 'Dernier point · ' + streakTeam : vm.streak.length + ' points consécutifs · ' + streakTeam;
    }
    $('streakText').textContent = streakText;
    $('streakPill').textContent = (vm.state === 'SET_FINISHED' || vm.state === 'MATCH_FINISHED') ? 'SÉRIE FINALE' : 'SÉRIE EN COURS';
    $('streakPill').classList.toggle('emphasis', !!vm.streak && vm.streak.length >= 5);
    var ariaLeader = vm.leader === 'HOME' ? 'avantage ' + m.homeName : vm.leader === 'AWAY' ? 'avantage ' + m.awayName : vm.leader === 'BALANCED' ? 'équilibré' : 'indisponible';
    card.setAttribute('aria-label', 'Momentum : ' + ariaLeader + (k ? ', ' + vm.homeCount + ' points sur ' + k + ' pour ' + m.homeName : '') + (vm.streak ? ', série de ' + vm.streak.length + ' point' + (vm.streak.length > 1 ? 's' : '') + ' pour ' + (vm.streak.side === 'HOME' ? m.homeName : m.awayName) : ''));
  }
  var RANKING_CATEGORIES = [
    { key: 'attack', title: 'Attack' },
    { key: 'block', title: 'Block' },
    { key: 'defence', title: 'Defence' },
    { key: 'reception', title: 'Reception' },
    { key: 'service', title: 'Service' }
  ];
  function rankingCategoryForAction(value) {
    var action = upper(value).replace(/[ÉÈÊË]/g, 'E').replace(/[ÀÂÄ]/g, 'A');
    if (['A', 'ATTACK', 'ATTAQUE', 'SPIKE'].indexOf(action) >= 0) return 'attack';
    if (['B', 'BLOCK', 'CONTRE'].indexOf(action) >= 0) return 'block';
    if (['D', 'DEFENCE', 'DEFENSE', 'DIG'].indexOf(action) >= 0) return 'defence';
    if (['R', 'RECEPTION', 'RECEIVE'].indexOf(action) >= 0) return 'reception';
    if (['SV', 'SERVICE', 'SERVE'].indexOf(action) >= 0) return 'service';
    return null;
  }
  function rankingSource(d, setNumber) {
    var players = {}, entries = [], format = detect(d), rallySets = {};
    if (format === 'unified-v2') {
      var teams = teamV2(d);
      (d.rallies || []).forEach(function (rally) { rallySets[rally.rallyId] = num(rally.setNumber, null); });
      (d.players || []).forEach(function (player) {
        if (player.teamId !== teams.homeId) return;
        players[player.playerId] = {
          id: player.playerId,
          number: player.number == null ? '—' : player.number,
          name: player.name || ('Joueur ' + (player.number == null ? 'NA' : player.number)),
          role: role(player.role || player.position)
        };
      });
      (d.events || []).forEach(function (event) {
        if (isVoided(event) || upper(event.eventType || 'ACTION') !== 'ACTION') return;
        var eventSet = num(event.setNumber, rallySets[event.rallyId]);
        if (setNumber != null && eventSet !== setNumber) return;
        var player = players[event.playerId], category = rankingCategoryForAction(event.actionType || event.action);
        if (!player || !category) return;
        entries.push({ player: player, category: category, outcome: normalizeResult(event.evaluation !== undefined ? event.evaluation : event.result) });
      });
    } else {
      (((d.match || {}).team || {}).roster || []).forEach(function (player) {
        players[String(player.number)] = {
          id: String(player.number), number: player.number == null ? '—' : player.number,
          name: player.name || ('Joueur ' + (player.number == null ? 'NA' : player.number)),
          role: role(player.position || player.role)
        };
      });
      (d.events || []).forEach(function (event) {
        if (isVoided(event)) return;
        if (setNumber != null && num(event.set, 1) !== setNumber) return;
        var player = players[String(event.player)], category = rankingCategoryForAction(event.action);
        if (!player || !category) return;
        entries.push({ player: player, category: category, outcome: normalizeResult(event.result !== undefined ? event.result : event.evaluation) });
      });
    }
    return { players: players, entries: entries };
  }
  function rankingRows(source, category, mode) {
    var rows = {};
    source.entries.forEach(function (entry) {
      if (entry.category !== category) return;
      var row = rows[entry.player.id] || (rows[entry.player.id] = {
        player: entry.player, points: 0, errors: 0, total: 0, first: Object.keys(rows).length
      });
      row.total++;
      if (entry.outcome === 'point') row.points++;
      if (entry.outcome === 'error') row.errors++;
    });
    return Object.keys(rows).map(function (id) {
      var row = rows[id]; row.delta = row.points - row.errors; return row;
    }).sort(function (a, b) {
      if (mode === 'highlight') return b.points - a.points || a.errors - b.errors || b.total - a.total || a.first - b.first;
      if (mode === 'lowlight') return b.errors - a.errors || b.points - a.points || b.total - a.total || a.first - b.first;
      return b.delta - a.delta || b.points - a.points || a.errors - b.errors || b.total - a.total || a.first - b.first;
    });
  }
  function rankingCard(category, source, mode) {
    var rows = rankingRows(source, category.key, mode);
    if (!rows.length) return '<article class="ranking-card empty-ranking"><h3>' + category.title + '</h3><div class="ranking-empty"><span>0</span><strong>NA</strong><small>0 action</small></div></article>';
    var body = rows.map(function (row, index) {
      var main = mode === 'highlight' ? row.points : mode === 'lowlight' ? row.errors : row.delta;
      var detail = mode === 'highlight' ? row.points + ' pts · ' + row.errors + ' err' :
        mode === 'lowlight' ? row.errors + ' erreurs · ' + row.points + ' pts' : row.points + ' pts − ' + row.errors + ' err';
      return '<div class="ranking-row"><span class="ranking-rank">#' + (index + 1) + '</span>' +
        '<span class="ranking-player"><b>' + esc(row.player.name) + '</b><small>#' + esc(row.player.number) + ' · ' + esc(row.player.role) + '</small></span>' +
        '<span class="ranking-value"><b>' + main + '</b><small>' + detail + '</small></span></div>';
    }).join('');
    return '<article class="ranking-card"><h3>' + category.title + '</h3><div class="ranking-list">' + body + '</div></article>';
  }
  function renderRanking() {
    var mode = $('rankingView').value, categoryValue = $('rankingCategory').value;
    var source = raw ? rankingSource(raw, model && model.currentSet) : { players: {}, entries: [] };
    var categories = categoryValue === 'all' ? RANKING_CATEGORIES : RANKING_CATEGORIES.filter(function (category) { return category.key === categoryValue; });
    var playerCount = {}, relevantActions = 0;
    source.entries.forEach(function (entry) {
      if (categoryValue !== 'all' && entry.category !== categoryValue) return;
      playerCount[entry.player.id] = true; relevantActions++;
    });
    $('rankingModeTitle').textContent = mode === 'highlight' ? 'Highlight' : mode === 'lowlight' ? 'Lowlight' : 'Delta';
    $('rankingSummary').textContent = Object.keys(playerCount).length + ' joueur' + (Object.keys(playerCount).length > 1 ? 's' : '') + ' · ' + relevantActions + ' action' + (relevantActions > 1 ? 's' : '');
    $('rankingSection').className = 'ranking-section mode-' + mode + (relevantActions ? '' : ' is-empty');
    $('rankingCards').classList.toggle('single-category', categoryValue !== 'all');
    $('rankingCards').innerHTML = categories.map(function (category) { return rankingCard(category, source, mode); }).join('');
  }
  function prefs() {
    var order = localStorage.getItem(ORDER_KEY), size = localStorage.getItem(WINDOW_KEY);
    return {
      order: order === 'newestFirst' ? 'newestFirst' : 'oldestFirst',
       size: ['5', '10', '11', '20', 'all'].indexOf(size) >= 0 ? size : '5'
    };
  }
  function visibleRows() {
    var p = prefs(), rows = model.rallies.slice(), n = p.size === 'all' ? rows.length : num(p.size, 5);
    rows = rows.slice(Math.max(0, rows.length - n));
    if (p.order === 'newestFirst') rows.reverse();
    var maxGap = rows.reduce(function (mx, r) { return Math.max(mx, Math.abs(r.score.away - r.score.home)); }, 0);
    return { rows: rows, p: p, maxGap: maxGap, scale: Math.max(5, maxGap) };
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
  function renderRow(r, isLast, scale, maxGap, order) {
    var d = r.score.away - r.score.home, side = d > 0 ? 'away' : d < 0 ? 'home' : '', value = Math.abs(d);
    var isMaxGap = value > 0 && value === maxGap;
    var delta = side ? '<div class="delta-bar ' + side + (isMaxGap ? ' max-gap' : '') + '" role="img" aria-label="' +
      (side === 'away' ? 'AWAY' : 'HOME') + ' mène de ' + value + ' points' + (isMaxGap ? ', écart maximum du set' : '') + '" title="' +
      (side === 'away' ? 'AWAY' : 'HOME') + ' +' + value + ' (' + r.score.away + '–' + r.score.home + ')"><span class="delta-badge">+' + value + '</span></div>' : '';
    var accent = r.phase === 'SO' ? 'so' : r.winner === 'HOME' ? 'bp-home' : 'bp-away';
    var awayScoreClass = r.winner === 'AWAY' ? ' score-accent ' + accent : '';
    var homeScoreClass = r.winner === 'HOME' ? ' score-accent ' + accent : '';
    var awayEvent = r.event && r.event.side === 'AWAY' ? eventCard(r.event) : '';
    var homeEvent = r.event && r.event.side === 'HOME' ? eventCard(r.event) : '';
    return '<div class="tl-row ' + (isLast ? 'is-last ' : '') + (r.invalid ? 'invalid-row ' : '') +
      (order === 'newestFirst' ? 'newest-first' : '') + '" data-rally="' + r.rally + '" data-code="' + r.phase +
      '" data-winner="' + r.winner + '" data-score-accent="' + accent + '" data-valid="' + (!r.invalid) + '">' +
      '<div class="timeline-side home"><div class="event-slot home-slot ' + (homeEvent ? 'has-event' : '') + '">' + homeEvent + '</div>' +
      '<div class="timeline-connector home"' + (homeEvent ? '' : ' hidden') + ' aria-hidden="true"></div>' +
      '<div class="delta-lane home">' + (side === 'home' ? delta : '') + '</div></div>' +
      '<div class="score-node"><div class="rally-caption"><span>Rallye ' + r.rally + '</span></div>' +
      '<div class="score-pill ' + (isLast ? 'latest' : '') + '"><span class="score-half home' + homeScoreClass + '">' + r.score.home +
      '</span><b>:</b><span class="score-half away' + awayScoreClass + '">' + r.score.away + '</span></div>' +
      (isLast ? '<span class="last-point">DERNIER POINT</span>' : '') +
      (r.invalid ? '<span class="invalid-note">DONNÉE À VÉRIFIER</span>' : '') + '</div>' +
      '<div class="timeline-side away"><div class="delta-lane away">' + (side === 'away' ? delta : '') + '</div>' +
      '<div class="timeline-connector away"' + (awayEvent ? '' : ' hidden') + ' aria-hidden="true"></div>' +
      '<div class="event-slot away-slot ' + (awayEvent ? 'has-event' : '') + '">' + awayEvent + '</div></div></div>';
  }

  function svgLine(x1, y1, x2, y2, className) {
    return '<line class="' + className + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"></line>';
  }
  function svgText(x, y, text, anchor, className) {
    return '<text class="' + (className || 'graph-label') + '" x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'middle') + '">' + esc(text) + '</text>';
  }
  function scoreCellState(item, side) {
    if (item.scoringTeam !== side || !item.pointClassification) return 'neutral';
    if (item.pointClassification === 'SIDE_OUT') return 'so';
    return side === 'HOME' ? 'bp-home' : 'bp-away';
  }
  function scoreCellAria(item, side) {
    var value = side === 'HOME' ? item.homeScore : item.awayScore;
    var state = scoreCellState(item, side);
    var suffix = state === 'so' ? ', ' + I18N.sideOut : state.indexOf('bp-') === 0 ? ', ' + I18N.breakPoint : '';
    return side + ' ' + value + suffix + ', rallye ' + item.rallyOrdinal;
  }
  function faultCellAria(item, side) {
    var home = side === 'HOME', value = home ? item.cumulativeHomeFaults : item.cumulativeAwayFaults;
    var increment = home ? item.homeFaultIncrement : item.awayFaultIncrement;
    return side + ', ' + value + ' fautes cumulées' + (increment ? ', ' + increment + ' nouvelle' + (increment > 1 ? 's' : '') + ' faute' + (increment > 1 ? 's' : '') + ' sur ce rallye' : '') + ', rallye ' + item.rallyOrdinal;
  }
  function renderValueRows(items, kind) {
    var value = function (item, side) {
      if (kind === 'score') return side === 'HOME' ? item.homeScore : item.awayScore;
      return side === 'HOME' ? item.cumulativeHomeFaults : item.cumulativeAwayFaults;
    };
    return ['HOME', 'AWAY'].map(function (side) {
      var cells = items.map(function (item) {
        var state, aria;
        if (kind === 'score') {
          state = scoreCellState(item, side);
          aria = scoreCellAria(item, side);
        } else {
          var increment = side === 'HOME' ? item.homeFaultIncrement : item.awayFaultIncrement;
          state = increment ? 'new-fault' : 'neutral';
          aria = faultCellAria(item, side);
        }
        return '<div class="evolution-cell ' + kind + '-cell ' + state + '" data-rally-key="' + esc(item.rallyKey) + '" role="img" aria-label="' + esc(aria) + '"><span aria-hidden="true">' + value(item, side) + '</span></div>';
      }).join('');
      return '<div class="evolution-grid value-row ' + kind + '-row ' + side.toLowerCase() + '"><strong class="row-label">' + side + '</strong>' + cells + '</div>';
    }).join('');
  }
  function deltaChartMarkup(items, valueKey, chartKind, labels, accessibleLabel, measuredWidth) {
    var n = items.length, width = Math.max(100, measuredWidth || n * 100), height = 178, top = 13, bottom = 31;
    var plotH = height - top - bottom, zeroY = top + plotH / 2;
    var magnitude = Math.max(2, items.reduce(function (mx, item) { return Math.max(mx, Math.abs(num(item[valueKey], 0))); }, 0));
    var y = function (v) { return zeroY - (v / magnitude) * (plotH / 2 - 7); };
    var columnWidth = width / Math.max(1, n);
    var x = function (i) { return i * columnWidth + columnWidth / 2; };
    var markup = '';
    for (var tick = -magnitude; tick <= magnitude; tick++) {
      markup += svgLine(0, y(tick), width, y(tick), tick === 0 ? 'graph-zero' : 'graph-grid horizontal');
    }
    items.forEach(function (item, i) {
      markup += svgLine(x(i), top, x(i), top + plotH, 'graph-grid vertical');
      markup += svgText(x(i), height - 10, item.rallyOrdinal, 'middle', 'rally-label');
    });
    if (items.length) {
      var path = items.map(function (item, i) { return (i ? 'L' : 'M') + x(i) + ' ' + y(item[valueKey]); }).join(' ');
      if (chartKind === 'score') {
        var area = 'M' + x(0) + ' ' + zeroY + ' ' + items.map(function (item, i) { return 'L' + x(i) + ' ' + y(item[valueKey]); }).join(' ') + ' L' + x(items.length - 1) + ' ' + zeroY + ' Z';
        markup += '<path class="delta-area score-area" d="' + area + '"></path>';
      }
      if (items.length > 1) markup += '<path class="delta-series ' + chartKind + '-series" d="' + path + '"></path>';
      items.forEach(function (item, i) {
        var value = item[valueKey];
        markup += '<circle class="delta-point ' + chartKind + '-point" data-rally-key="' + esc(item.rallyKey) + '" data-value="' + value + '" cx="' + x(i) + '" cy="' + y(value) + '" r="5"><title>Rallye ' + item.rallyOrdinal + ' · delta ' + value + '</title></circle>';
      });
    }
    var yLabels = '<div class="chart-y-labels" aria-hidden="true"><span>' + esc(labels.positive) + '</span><span>' + esc(labels.zero) + '</span><span>' + esc(labels.negative) + '</span></div>';
    return '<div class="evolution-grid evolution-chart-grid">' + yLabels + '<svg class="delta-line-chart ' + chartKind + '-delta-chart" viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none" role="img" aria-label="' + esc(accessibleLabel) + '"><title>' + esc(accessibleLabel) + '</title>' + markup + '</svg></div><div class="axis-title">' + I18N.pointsPlayed + '</div>';
  }
  function updateSetSelector() {
    var select = $('evolutionSet');
    var options = (model.availableSets || []).map(function (setNo) { return '<option value="' + setNo + '">Set ' + setNo + '</option>'; }).join('');
    if (select.innerHTML !== options) select.innerHTML = options;
    if (model.currentSet != null) select.value = String(model.currentSet);
    select.disabled = !model.availableSets.length;
    var atLive = model.currentSet == null || model.currentSet === model.liveSet;
    $('returnToLive').hidden = atLive || model.noMatch;
    $('liveSetStatus').textContent = model.noMatch ? 'AUCUN MATCH' : atLive ? 'DIRECT · SET ' + model.liveSet : 'REPLAY · SET ' + model.currentSet;
    $('liveSetStatus').classList.toggle('is-replay', !atLive && !model.noMatch);
  }
  function renderGraphs(v) {
    var empty = model.rallies.length === 0, scroll = $('graphContent'), previousScroll = scroll.scrollLeft;
    $('graphContent').hidden = empty;
    $('graphEmpty').hidden = !empty;
    updateSetSelector();
    if (empty) {
      $('scoreRows').innerHTML = '';
      $('faultRows').innerHTML = '';
      $('scoreChart').innerHTML = deltaChartMarkup([], 'scoreDelta', 'score', { positive: I18N.scorePositive, zero: I18N.scoreZero, negative: I18N.scoreNegative }, 'Évolution du score, Set ' + model.currentSet + ', aucun rallye terminé.');
      $('faultChart').innerHTML = deltaChartMarkup([], 'faultDelta', 'fault', { positive: I18N.faultPositive, zero: I18N.faultZero, negative: I18N.faultNegative }, 'Évolution des fautes, Set ' + model.currentSet + ', aucun rallye terminé.');
      return;
    }
    var rows = v.rows;
    $('evolutionCanvas').style.setProperty('--visible-rally-count', rows.length);
    $('evolutionCanvas').style.setProperty('--evolution-min-width', (96 + rows.length * 58) + 'px');
    $('scoreRows').innerHTML = renderValueRows(rows, 'score');
    $('faultRows').innerHTML = renderValueRows(rows, 'fault');
    var finalItem = model.rallies[model.rallies.length - 1];
    var scoreLabel = 'Évolution du score, Set ' + model.currentSet + '. HOME ' + finalItem.homeScore + ', AWAY ' + finalItem.awayScore + '. Delta ' + (finalItem.scoreDelta >= 0 ? 'plus ' : 'moins ') + Math.abs(finalItem.scoreDelta) + '.';
    var faultLabel = 'Évolution des fautes, Set ' + model.currentSet + '. HOME ' + finalItem.cumulativeHomeFaults + ' fautes, AWAY ' + finalItem.cumulativeAwayFaults + ' fautes. Delta ' + (finalItem.faultDelta === 0 ? 'zéro' : (finalItem.faultDelta > 0 ? 'plus ' : 'moins ') + Math.abs(finalItem.faultDelta)) + '.';
    function fillCharts(plotWidth) {
      $('scoreChart').innerHTML = deltaChartMarkup(rows, 'scoreDelta', 'score', { positive: I18N.scorePositive, zero: I18N.scoreZero, negative: I18N.scoreNegative }, scoreLabel, plotWidth);
      $('faultChart').innerHTML = deltaChartMarkup(rows, 'faultDelta', 'fault', { positive: I18N.faultPositive, zero: I18N.faultZero, negative: I18N.faultNegative }, faultLabel, plotWidth);
    }
    fillCharts(0);
    requestAnimationFrame(function () {
      var row = document.querySelector('.score-row'), label = row && row.querySelector('.row-label');
      if (!row || !label || !row.offsetWidth) return;
      var plotWidth = row.getBoundingClientRect().width - label.getBoundingClientRect().width;
      if (plotWidth > 1) fillCharts(plotWidth);
    });
    $('scoreSummary').textContent = scoreLabel;
    $('faultSummary').textContent = faultLabel;
    if (evolutionBrowsing) scroll.scrollLeft = previousScroll;
    else if (v.p.order === 'oldestFirst') requestAnimationFrame(function () { scroll.scrollLeft = scroll.scrollWidth; });
    $('returnLive').hidden = model.finished || model.currentSet !== model.liveSet || !evolutionBrowsing;
  }
  function render() {
    if (!model) return;
    var last = model.rallies[model.rallies.length - 1], v = visibleRows();
    renderScoreboard(model); renderMomentum(model); renderRanking();
    $('archiveBadge').textContent = model.finished ? 'TERMINÉ' : 'LIVE';
    $('awayName').textContent = 'AWAY'; $('homeName').textContent = 'HOME';
    $('timelineSet').textContent = model.currentSet == null ? 'AUCUN MATCH · Fil du match' : 'SET ' + model.currentSet + ' · Fil du match';
    $('timelineOrder').textContent = v.p.order === 'oldestFirst' ? 'Ancien → récent' : 'Récent → ancien';
    document.querySelectorAll('[data-order],[data-graph-order]').forEach(function (b) {
      var choice = b.dataset.order || b.dataset.graphOrder;
      b.classList.toggle('active', choice === v.p.order); b.setAttribute('aria-pressed', choice === v.p.order ? 'true' : 'false');
    });
    document.querySelectorAll('[data-window-size]').forEach(function (select) { select.value = v.p.size; });
    $('timelineList').innerHTML = v.rows.map(function (r) { return renderRow(r, last && r.id === last.id, v.scale, v.maxGap, v.p.order); }).join('');
    requestAnimationFrame(function () {
      var board = document.querySelector('.timeline-board'), card = board && board.querySelector('.event-card.home');
      if (!board || !card || board.scrollWidth <= board.clientWidth || board.scrollLeft > 1) return;
      var boardBox = board.getBoundingClientRect(), cardBox = card.getBoundingClientRect();
      board.scrollLeft = Math.max(0, cardBox.left - boardBox.left + board.scrollLeft - 20);
    });
    $('timelineEmpty').hidden = model.rallies.length !== 0;
    $('timelineEmpty').textContent = model.noMatch ? 'Aucun match chargé' : 'Le set n’a pas encore commencé';
    $('timelineWarning').hidden = !model.warnings.length; $('timelineWarning').textContent = model.warnings.join(' ');
    renderGraphs(v);
  }
  function activate(name) {
    document.querySelectorAll('[data-tab]').forEach(function (b) {
      var on = b.dataset.tab === name;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('[data-panel]').forEach(function (p) { p.hidden = p.dataset.panel !== name; });
    location.hash = name;
    if (name === 'live-graph' && model) requestAnimationFrame(function () { renderGraphs(visibleRows()); });
    if (name === 'ranking') renderRanking();
  }
  function setArchive(d) {
    var v = VolleyStatsAdapter.validate(d);
    if (!v.valid) throw new Error(v.errors.join(' '));
    raw = d;
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(d));
    sessionStorage.setItem('volleyAnalysis.replay.v1', JSON.stringify(d));
    model = build(d, null);
    selectedSetNumber = model.currentSet;
    render();
    return model;
  }
  function fatal(message) { $('spectatorApp').hidden = true; $('fatal').hidden = false; $('fatalText').textContent = message; }
  function init() {
    try {
      raw = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || 'null');
      selectedSetNumber = null;
      model = raw ? build(raw, null) : emptyModel();
      selectedSetNumber = model.currentSet;
      render();
    } catch (e) { fatal(e.message); return; }
    document.querySelectorAll('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { activate(b.dataset.tab); }); });
    document.querySelectorAll('[data-order],[data-graph-order]').forEach(function (b) {
      b.addEventListener('click', function () { localStorage.setItem(ORDER_KEY, b.dataset.order || b.dataset.graphOrder); render(); });
    });
    document.querySelectorAll('[data-window-size]').forEach(function (select) {
      select.addEventListener('change', function () { localStorage.setItem(WINDOW_KEY, this.value); render(); });
    });
    $('rankingView').addEventListener('change', renderRanking);
    $('rankingCategory').addEventListener('change', renderRanking);
    $('evolutionSet').addEventListener('change', function () {
      if (!raw) return;
      selectedSetNumber = num(this.value, model.liveSet);
      evolutionBrowsing = false;
      model = build(raw, selectedSetNumber);
      render();
    });
    $('returnToLive').addEventListener('click', function () {
      if (!raw) return;
      selectedSetNumber = model.liveSet;
      evolutionBrowsing = false;
      model = build(raw, selectedSetNumber);
      render();
      var activePanel = document.querySelector('[data-panel]:not([hidden])');
      if (activePanel) activePanel.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
    $('graphContent').addEventListener('scroll', function () {
      if (model.finished || model.currentSet !== model.liveSet) return;
      var p = prefs(), latestEdge = p.order === 'oldestFirst' ? this.scrollWidth - this.clientWidth : 0;
      evolutionBrowsing = Math.abs(this.scrollLeft - latestEdge) > 8;
      $('returnLive').hidden = !evolutionBrowsing;
    }, { passive: true });
    $('returnLive').addEventListener('click', function () {
      evolutionBrowsing = false;
      var p = prefs(), scroll = $('graphContent');
      scroll.scrollTo({ left: p.order === 'oldestFirst' ? scroll.scrollWidth : 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      this.hidden = true;
    });
    window.addEventListener('storage', function (e) {
      if (e.key === ARCHIVE_KEY) {
        try { raw = e.newValue ? JSON.parse(e.newValue) : null; model = raw ? build(raw, selectedSetNumber) : emptyModel(); render(); } catch (x) { fatal(x.message); }
      }
    });
    activate(location.hash === '#live-score' ? 'live-score' : location.hash === '#live-graph' ? 'live-graph' : location.hash === '#ranking' ? 'ranking' : 'live-timeline');
  }

  window.VolleySpectator = {
    buildViewModel: build,
    setArchive: setArchive,
    refresh: function () { model = raw ? build(raw, selectedSetNumber) : emptyModel(); render(); },
    getModel: function () { return model; },
    visibleRows: visibleRows,
    computeMomentum: computeMomentum,
    momentumView: momentumView,
    rankingSource: rankingSource,
    rankingRows: rankingRows,
    monogram: monogram,
    config: momentumCfg
  };
  init();
})();
