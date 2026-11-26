/* VolleyLive spectator view — shared core: storage keys, state, helpers and view-model builders. */
(function () {
  'use strict';

  var ARCHIVE_KEY = window.VolleyDomain.STORAGE.spectatorArchive;
  var ORDER_KEY = window.VolleyDomain.STORAGE.spectatorTimelineOrder;
  var WINDOW_KEY = window.VolleyDomain.STORAGE.spectatorTimelineWindow;
  var state = { raw: null, model: null, evolutionBrowsing: false };

  var I18N = {
    scorePositive: 'HOME devant',
    scoreZero: 'Égalité',
    scoreNegative: 'AWAY devant',
    faultPositive: 'HOME : plus de fautes',
    faultZero: 'Égalité',
    faultNegative: 'AWAY : plus de fautes',
    pointsPlayed: 'Points joués',
    sideOut: 'Side-out',
    breakPoint: 'Break Point',
  };

  function $(id) {
    return document.getElementById(id);
  }
  var esc = window.VolleyDom.esc;
  function num(v, d) {
    v = Number(v);
    return Number.isFinite(v) ? v : d;
  }
  function upper(v) {
    return String(v || '').toUpperCase();
  }
  function role(v) {
    var m = { SETTER: 'SET', SET: 'SET', OPPOSITE: 'OPP', OPP: 'OPP', OH: 'OH', MB: 'MB', LIBERO: 'LIB', LIB: 'LIB' };
    return m[upper(v)] || upper(v) || '—';
  }
  function roleClass(v) {
    var r = role(v);
    return ['OPP', 'SET', 'OH', 'MB', 'LIB'].indexOf(r) >= 0 ? 'role-' + r.toLowerCase() : 'role-unknown';
  }
  function detect(v) {
    return window.VolleyStatsAdapter ? VolleyStatsAdapter.detectFormat(v) : 'unknown';
  }
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
      SERVICE: 'SERVICE',
      SERVE: 'SERVICE',
      ATTACK: 'ATTAQUE',
      BLOCK: 'CONTRE',
      RECEPTION: 'RÉCEPTION',
      DEFENSE: 'DÉFENSE',
      DEFENCE: 'DÉFENSE',
      DIG: 'DÉFENSE',
      SET: 'PASSE',
      SETTER: 'PASSE',
      FREEBALL: 'RELANCE',
      FREE_BALL: 'RELANCE',
    };
    return labels[s] || (s && s !== 'GENERIC' && s !== 'TEAM' ? s.replace(/_/g, ' ') : '');
  }
  function teamV2(d) {
    var teams = d.teams || [],
      m = d.match || {};
    var home =
      teams.find(function (t) {
        return t.teamId === m.ourTeamId;
      }) ||
      teams.find(function (t) {
        return upper(t.side) === 'OUR';
      }) ||
      teams[0] ||
      {};
    var away =
      teams.find(function (t) {
        return t.teamId === m.opponentTeamId;
      }) ||
      teams.find(function (t) {
        return upper(t.side) === 'OPPONENT';
      }) ||
      teams[1] ||
      {};
    return { home: home, away: away, homeId: home.teamId || m.ourTeamId, awayId: away.teamId || m.opponentTeamId };
  }
  function sideForTeamId(teamId, teams) {
    if (teamId === teams.homeId) return 'HOME';
    if (teamId === teams.awayId) return 'AWAY';
    return null;
  }
  function isVoided(v) {
    return !!(
      v &&
      (v.cancelled === true || v.undone === true || ['VOIDED', 'CANCELLED', 'UNDONE'].indexOf(upper(v.status)) >= 0)
    );
  }
  function isFinishedStatus(v) {
    return ['COMPLETED', 'FINISHED', 'ENDED', 'CLOSED'].indexOf(upper(v)) >= 0;
  }
  function logoOf(team) {
    return (team && (team.logoUrl || team.logo || team.crestUrl || team.imageUrl)) || '';
  }
  function monogram(name) {
    var ignored = ['DE', 'DU', 'LA', 'LE', 'LES', 'DES', 'D'];
    var words = String(name || '')
      .replace(/[’']/g, ' ')
      .split(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9]+/)
      .filter(Boolean);
    var significant = words.filter(function (word) {
      return ignored.indexOf(upper(word)) < 0;
    });
    var chosen = significant.length ? significant : words,
      value = '';
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
    return window.VolleyStatsAdapter && typeof VolleyStatsAdapter.isFaultEvent === 'function'
      ? VolleyStatsAdapter.isFaultEvent(event)
      : normalizeResult(event && (event.evaluation !== undefined ? event.evaluation : event.result)) === 'error';
  }
  function availableSetNumbersV2(d) {
    var seen = {};
    (d.sets || []).forEach(function (s) {
      seen[num(s.setNumber, 1)] = true;
    });
    (d.rallies || []).forEach(function (r) {
      seen[num(r.setNumber, 1)] = true;
    });
    return Object.keys(seen)
      .map(Number)
      .sort(function (a, b) {
        return a - b;
      });
  }
  function setsWonV2(d) {
    var a = 0,
      h = 0;
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
    var list = (d.events || [])
      .filter(function (x) {
        return x.rallyId === r.rallyId && upper(x.eventType) === 'ACTION' && !isVoided(x);
      })
      .sort(function (a, b) {
        return num(a.sequenceNumber, 0) - num(b.sequenceNumber, 0);
      });
    if (!e) {
      e =
        list
          .filter(function (x) {
            return (
              ['POINT', 'ERROR', 'FAULT', 'ACE', 'KILL', 'NEUTRAL', 'CONTINUE'].indexOf(upper(x.evaluation)) >= 0 ||
              x.winnerTeamId
            );
          })
          .pop() || list[list.length - 1];
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
      teamId: e.teamId,
    };
  }
  function modelV2(d, requestedSet) {
    var t = teamV2(d),
      players = {},
      match = d.match || {};
    (d.players || []).forEach(function (p) {
      players[p.playerId] = {
        number: p.number,
        name: p.name || 'Joueur ' + p.number,
        role: role(p.role || p.position),
        teamId: p.teamId,
      };
    });
    var byEvent = {},
      eventsByRally = {};
    (d.events || []).forEach(function (e) {
      byEvent[e.eventId] = e;
      if (upper(e.eventType || 'ACTION') === 'ACTION' && !isVoided(e) && e.rallyId) {
        (eventsByRally[e.rallyId] || (eventsByRally[e.rallyId] = [])).push(e);
      }
    });
    var all = (d.rallies || [])
      .slice()
      .filter(function (r) {
        return !isVoided(r) && !!r.winnerTeamId;
      })
      .sort(function (a, b) {
        return num(a.setNumber, 1) - num(b.setNumber, 1) || num(a.rallyNumber, 0) - num(b.rallyNumber, 0);
      });
    var availableSets = availableSetNumbersV2(d);
    var liveSet = num(match.currentSetNumber, (all[all.length - 1] || {}).setNumber || availableSets[0] || 1);
    if (availableSets.indexOf(liveSet) < 0) availableSets.push(liveSet);
    availableSets.sort(function (a, b) {
      return a - b;
    });
    var requested = num(requestedSet, liveSet);
    var current = availableSets.indexOf(requested) >= 0 ? requested : liveSet;
    var selected = all.filter(function (r) {
      return num(r.setNumber, 1) === current;
    });
    var setDef =
      (d.sets || []).find(function (set) {
        return num(set.setNumber, 1) === current;
      }) || {};
    var warnings = [],
      cumulativeHomeFaults = 0,
      cumulativeAwayFaults = 0;
    var rallies = selected.map(function (r) {
      var score = r.scoreAfter || {};
      var winner = sideForTeamId(r.winnerTeamId, t);
      var serving = sideForTeamId(r.servingTeamId, t);
      var phase = winner && serving ? (winner === serving ? 'BP' : 'SO') : null;
      var event = winner ? terminalV2(d, r, byEvent, players, t, winner) : null;
      var invalid = false;
      if (
        String(match.detailLevel || '').toLowerCase() === 'basic' ||
        (event && ['GENERIC', 'TEAM'].indexOf(upper(event.skill)) >= 0)
      )
        event = null;
      if (event && ['SERVICE', 'SERVE'].indexOf(upper(event.skill)) >= 0 && event.teamId !== r.servingTeamId) {
        invalid = true;
        warnings.push('Rallye ' + r.rallyNumber + ' : action de service rejetée pour l’équipe non au service.');
      }
      var homeFaultIncrement = 0,
        awayFaultIncrement = 0;
      (eventsByRally[r.rallyId] || []).forEach(function (faultEvent) {
        if (!isFaultEvent(faultEvent)) return;
        var faultSide = sideForTeamId(faultEvent.teamId, t);
        if (faultSide === 'HOME') homeFaultIncrement++;
        if (faultSide === 'AWAY') awayFaultIncrement++;
      });
      cumulativeHomeFaults += homeFaultIncrement;
      cumulativeAwayFaults += awayFaultIncrement;
      var homeScore = num(score.our, 0),
        awayScore = num(score.opponent, 0);
      return {
        set: current,
        rally: num(r.rallyNumber, 1),
        rallyOrdinal: num(r.rallyNumber, 1),
        rallyKey: r.rallyId,
        score: { away: awayScore, home: homeScore },
        homeScore: homeScore,
        awayScore: awayScore,
        scoreDelta: homeScore - awayScore,
        winner: winner,
        scoringTeam: winner,
        serving: serving,
        phase: phase,
        code: phase,
        pointClassification: phase === 'SO' ? 'SIDE_OUT' : phase === 'BP' ? 'BREAK_POINT' : null,
        event: event,
        invalid: invalid,
        id: r.rallyId,
        cumulativeHomeFaults: cumulativeHomeFaults,
        cumulativeAwayFaults: cumulativeAwayFaults,
        homeFaultIncrement: homeFaultIncrement,
        awayFaultIncrement: awayFaultIncrement,
        faultTeam:
          homeFaultIncrement && !awayFaultIncrement
            ? 'HOME'
            : awayFaultIncrement && !homeFaultIncrement
              ? 'AWAY'
              : null,
        faultDelta: cumulativeHomeFaults - cumulativeAwayFaults,
      };
    });
    var matchFinished = isFinishedStatus(match.lifecycleStatus || match.status);
    var setFinished = isFinishedStatus(setDef.status) || current < liveSet;
    var state = statusFor(matchFinished, setFinished, rallies.length);
    var last = selected[selected.length - 1],
      score = last && last.scoreAfter;
    if (!score && setFinished && setDef.finalScore) score = setDef.finalScore;
    score = score || { our: 0, opponent: 0 };
    var sw = setsWonV2(d);
    var servingSide = null;
    if (state === 'IN_PROGRESS' || state === 'NOT_STARTED') {
      servingSide = rallies.length ? rallies[rallies.length - 1].winner : sideForTeamId(setDef.initialServingTeamId, t);
    }
    return {
      format: 'v2.1',
      name: match.name || 'Match',
      homeName: t.home.name || 'HOME',
      awayName: t.away.name || 'AWAY',
      homeLogo: logoOf(t.home),
      awayLogo: logoOf(t.away),
      currentSet: current,
      liveSet: liveSet,
      availableSets: availableSets,
      score: { away: num(score.opponent, 0), home: num(score.our, 0) },
      sets: sw,
      rallies: rallies,
      warnings: warnings,
      finished: matchFinished,
      status: state,
      servingSide: servingSide,
      noMatch: false,
    };
  }
  function groupV1(events) {
    var sets = {},
      scores = {};
    (events || []).forEach(function (e) {
      if (isVoided(e)) return;
      var s = num(e.set, 1);
      if (!sets[s]) sets[s] = [];
      var list = sets[s],
        r = list.length && !list[list.length - 1].closed ? list[list.length - 1] : null;
      if (!r) {
        r = { set: s, rally: list.length + 1, actions: [] };
        list.push(r);
      }
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
    var m = d.match || {},
      roster = {};
    ((m.team || {}).roster || []).forEach(function (p) {
      roster[String(p.number)] = {
        number: p.number,
        name: p.name || 'Joueur ' + p.number,
        role: role(p.position || p.role),
      };
    });
    var groups = groupV1(d.events || []),
      setNums = Object.keys(groups)
        .map(Number)
        .sort(function (a, b) {
          return a - b;
        });
    var liveSet = num(m.currentSet, setNums[setNums.length - 1] || 1);
    if (setNums.indexOf(liveSet) < 0) setNums.push(liveSet);
    setNums.sort(function (a, b) {
      return a - b;
    });
    var requested = num(requestedSet, liveSet);
    var current = setNums.indexOf(requested) >= 0 ? requested : liveSet,
      rows = groups[current] || [];
    var initial =
      String((m.firstRally || {}).antibesState || 'reception').toLowerCase() === 'service' ? 'HOME' : 'AWAY';
    var serving = initial,
      warnings = [],
      cumulativeHomeFaults = 0,
      cumulativeAwayFaults = 0;
    var rallies = rows
      .filter(function (r) {
        return r.closed;
      })
      .map(function (r) {
        var e = r.terminal || {};
        var isBasic =
          String(m.detailLevel || '').toLowerCase() === 'basic' ||
          String(e.action || '').toLowerCase() === 'generic' ||
          e.player === 'T';
        var side = e.player === 'A' || String(e.action).toLowerCase() === 'adverse' ? 'AWAY' : 'HOME';
        var event = null;
        if (!isBasic) {
          var outcome = normalizeResult(e.result);
          if (side === 'AWAY') outcome = r.winner === 'AWAY' ? 'point' : 'error';
          else if (!outcome) outcome = r.winner === 'HOME' ? 'point' : 'error';
          event = {
            side: side,
            player: side === 'HOME' ? roster[String(e.player)] || null : null,
            skill: e.action,
            label: actionLabel(e.action),
            outcome: outcome,
            eventId: e.id,
            teamId: side,
          };
        }
        var phase = r.winner === serving ? 'BP' : 'SO';
        var homeFaultIncrement = 0,
          awayFaultIncrement = 0;
        (r.actions || []).forEach(function (action) {
          if (!isFaultEvent(action)) return;
          var actionSide =
            action.player === 'A' || String(action.action || '').toLowerCase() === 'adverse' ? 'AWAY' : 'HOME';
          if (actionSide === 'HOME') homeFaultIncrement++;
          else awayFaultIncrement++;
        });
        cumulativeHomeFaults += homeFaultIncrement;
        cumulativeAwayFaults += awayFaultIncrement;
        var score = r.score || { away: 0, home: 0 };
        var out = {
          set: current,
          rally: r.rally,
          rallyOrdinal: r.rally,
          rallyKey: 'v1-' + current + '-' + r.rally,
          score: score,
          homeScore: score.home,
          awayScore: score.away,
          scoreDelta: score.home - score.away,
          winner: r.winner,
          scoringTeam: r.winner,
          serving: serving,
          phase: phase,
          code: phase,
          pointClassification: phase === 'SO' ? 'SIDE_OUT' : 'BREAK_POINT',
          event: event,
          invalid: false,
          id: 'v1-' + current + '-' + r.rally,
          cumulativeHomeFaults: cumulativeHomeFaults,
          cumulativeAwayFaults: cumulativeAwayFaults,
          homeFaultIncrement: homeFaultIncrement,
          awayFaultIncrement: awayFaultIncrement,
          faultTeam:
            homeFaultIncrement && !awayFaultIncrement
              ? 'HOME'
              : awayFaultIncrement && !homeFaultIncrement
                ? 'AWAY'
                : null,
          faultDelta: cumulativeHomeFaults - cumulativeAwayFaults,
        };
        serving = r.winner;
        return out;
      });
    var matchFinished = isFinishedStatus(m.status || m.lifecycleStatus),
      setFinished = matchFinished || current < liveSet;
    var state = statusFor(matchFinished, setFinished, rallies.length),
      last = rallies[rallies.length - 1];
    var sets = { away: 0, home: 0 };
    setNums.forEach(function (s) {
      var completed = s < liveSet || matchFinished;
      if (!completed) return;
      var rs = (groups[s] || []).filter(function (r) {
          return r.closed;
        }),
        l = rs[rs.length - 1];
      if (l) {
        if (l.score.home > l.score.away) sets.home++;
        else if (l.score.away > l.score.home) sets.away++;
      }
    });
    return {
      format: 'capture-v1',
      name: m.name || 'Match',
      homeName: (m.team || {}).name || 'HOME',
      awayName: (m.opponent || {}).name || 'AWAY',
      homeLogo: logoOf(m.team || {}),
      awayLogo: logoOf(m.opponent || {}),
      currentSet: current,
      liveSet: liveSet,
      availableSets: setNums,
      score: last ? last.score : { away: 0, home: 0 },
      sets: sets,
      rallies: rallies,
      warnings: warnings,
      finished: matchFinished,
      status: state,
      servingSide: state === 'IN_PROGRESS' || state === 'NOT_STARTED' ? (last ? last.winner : initial) : null,
      noMatch: false,
    };
  }
  function build(d, requestedSet) {
    var v = VolleyStatsAdapter.validate(d);
    if (!v.valid) throw new Error(v.errors.join(' '));
    return detect(d) === 'unified-v2' ? modelV2(d, requestedSet) : modelV1(d, requestedSet);
  }
  function emptyModel() {
    return {
      format: 'empty',
      name: '',
      homeName: 'HOME',
      awayName: 'AWAY',
      homeLogo: '',
      awayLogo: '',
      currentSet: null,
      liveSet: null,
      availableSets: [],
      score: { home: 0, away: 0 },
      sets: { home: 0, away: 0 },
      rallies: [],
      warnings: [],
      finished: false,
      status: 'NO_MATCH',
      servingSide: null,
      noMatch: true,
    };
  }

  var P = (window.VolleySpectatorParts = { state: state });
  P.ARCHIVE_KEY = ARCHIVE_KEY;
  P.ORDER_KEY = ORDER_KEY;
  P.WINDOW_KEY = WINDOW_KEY;
  P.I18N = I18N;
  P.$ = $;
  P.esc = esc;
  P.num = num;
  P.upper = upper;
  P.role = role;
  P.roleClass = roleClass;
  P.detect = detect;
  P.normalizeResult = normalizeResult;
  P.actionLabel = actionLabel;
  P.teamV2 = teamV2;
  P.sideForTeamId = sideForTeamId;
  P.isVoided = isVoided;
  P.isFinishedStatus = isFinishedStatus;
  P.logoOf = logoOf;
  P.monogram = monogram;
  P.statusFor = statusFor;
  P.isFaultEvent = isFaultEvent;
  P.availableSetNumbersV2 = availableSetNumbersV2;
  P.setsWonV2 = setsWonV2;
  P.terminalV2 = terminalV2;
  P.modelV2 = modelV2;
  P.groupV1 = groupV1;
  P.modelV1 = modelV1;
  P.build = build;
  P.emptyModel = emptyModel;
})();
