/* VolleyLive substitution rules (pure functions): window.VolleySubstitutions.
   FIVB Official Volleyball Rules 2025-2028, Rule 15:
   - 15.1    at most six (regular) substitutions per team and per set;
   - 15.5.1  the Libero (and the player it replaces) is never part of a regular substitution;
   - 15.6.1  a starting player may leave the game only once per set and come back only once, to his/her previous
             position in the line-up, i.e. in place of the substitute who replaced him/her;
   - 15.6.2  a substitute may enter once per set, in place of a starting player, and can only be replaced by that same
             starting player;
   - 15.7    exceptional substitution (injury, illness): only when no regular substitution is possible; any player
             not on court except the Liberos may enter; it does not count as a regular substitution but is recorded;
             the replaced player cannot come back for the rest of the match;
   - 15.9.1  a substitution involving a player who is not registered is illegal;
   - 15.11.1.1 no substitution during a rally (checked by the caller: rallyInProgress()).
   Starting players are the starting rotation of the set (VolleyDomain.lineup.forSet: FIVB 7.3.2, one line-up sheet
   per set).
   Liberos, Rule 19: a team designates up to two liberos (19.1.1): the libero of the line-ups and the roster players
   registered as libero. One acting libero on court (19.1.3). Replacing the acting libero by the other one is a libero
   replacement (19.3.2): it is not a substitution, needs a completed rally since the previous libero replacement
   (19.3.2.1) and never happens during a rally. It is stored as a match.subs entry with libero: true.
   Re-designation, 19.4: the acting libero may be declared unable to play (injury, illness, expulsion). The other
   libero then becomes the acting one; without one, the coach re-designates as libero, for the rest of the match, a
   player who is not on court (not the player the libero replaced). The libero declared unable cannot play again in
   the match. Stored as a libero entry with unable: true (and redesignated: true for a new libero). */
(function () {
  'use strict';
  var REGULAR_LIMIT = 6;

  function same(a, b) {
    return a != null && b != null && String(a) === String(b);
  }
  function contains(list, value) {
    return list.some(function (x) {
      return same(x, value);
    });
  }
  function starters(match, setNo) {
    var rot = window.VolleyDomain.lineup.forSet(match, setNo || match.currentSet || 1).startingRotation || {};
    return Object.keys(rot)
      .map(function (k) {
        return rot[k];
      })
      .filter(function (n) {
        return n != null;
      });
  }
  // Liberos declared unable to play (19.4): they cannot play again in the match.
  function unableLiberos(match) {
    return (match.subs || [])
      .filter(function (s) {
        return s.libero && s.unable;
      })
      .map(function (s) {
        return s.out;
      });
  }
  // Liberos are excluded from regular and exceptional substitutions (15.5.1, 15.7): the libero of every set line-up,
  // the roster players registered as libero and the players re-designated as libero (19.4).
  function liberos(match) {
    var list = [],
      lineups = [match.startingLineup || {}];
    Object.keys(match.setLineups || {}).forEach(function (n) {
      lineups.push(match.setLineups[n].startingLineup || {});
    });
    lineups.forEach(function (lineup) {
      if (lineup.libero != null && !contains(list, lineup.libero)) list.push(lineup.libero);
    });
    (match.subs || []).forEach(function (s) {
      if (s.libero && s.redesignated && !contains(list, s['in'])) list.push(s['in']);
    });
    ((match.team && match.team.roster) || []).forEach(function (p) {
      var position = String(p.position || '').toLowerCase();
      if ((position === 'libero' || position === 'lib') && !contains(list, p.number)) list.push(p.number);
    });
    return list;
  }
  // Registered players available for the match (15.9.1).
  function registered(match) {
    return ((match.team && match.team.roster) || [])
      .filter(function (p) {
        return p.present !== false;
      })
      .map(function (p) {
        return p.number;
      });
  }
  function setSubs(match, setNo) {
    return (match.subs || [])
      .filter(function (s) {
        return (+s.set || 1) === setNo;
      })
      .slice()
      .sort(function (a, b) {
        return (+a.at || 0) - (+b.at || 0);
      });
  }

  // Substitution history of a set: counts and who left / entered with whom.
  function history(match, setNo) {
    var start = starters(match, setNo),
      h = {
        regular: 0,
        exceptional: 0,
        starterLeft: {}, // starter -> substitute who replaced him/her
        starterReturned: {}, // starter -> true
        substituteEntered: {}, // substitute -> starter he/she replaced
        barred: {}, // players replaced by an exceptional substitution (whole match)
      };
    (match.subs || []).forEach(function (s) {
      if (s.exceptional) h.barred[String(s.out)] = true;
    });
    setSubs(match, setNo).forEach(function (s) {
      if (s.libero) return; // a libero replacement is not a substitution (19.3.2)
      if (s.exceptional) {
        h.exceptional++;
        h.substituteEntered[String(s['in'])] = h.substituteEntered[String(s['in'])] || s.out;
        return;
      }
      h.regular++;
      if (contains(start, s.out) && !h.starterLeft[String(s.out)]) {
        h.starterLeft[String(s.out)] = s['in'];
        h.substituteEntered[String(s['in'])] = s.out;
      } else if (contains(start, s['in'])) {
        h.starterReturned[String(s['in'])] = true;
      }
    });
    return h;
  }

  function onCourtNumbers(rot) {
    return Object.keys(rot || {})
      .map(function (k) {
        return rot[k];
      })
      .filter(function (n) {
        return n != null;
      });
  }

  // Why `incoming` cannot replace `outgoing` in a regular substitution (a translation key, subs.refuse*), or null
  // when it is legal.
  function regularRefusal(match, setNo, rot, outgoing, incoming, h) {
    h = h || history(match, setNo);
    var start = starters(match, setNo),
      court = onCourtNumbers(rot);
    if (h.regular >= REGULAR_LIMIT) return 'subs.refuseLimit';
    if (!contains(court, outgoing)) return 'subs.refuseOutNotOnCourt';
    if (contains(liberos(match), outgoing) || contains(liberos(match), incoming)) return 'subs.refuseLibero';
    if (!contains(registered(match), incoming)) return 'subs.refuseNotRegistered';
    if (contains(court, incoming)) return 'subs.refuseOnCourt';
    if (h.barred[String(incoming)]) return 'subs.refuseBarred';
    if (contains(start, incoming)) {
      if (h.starterReturned[String(incoming)]) return 'subs.refuseStarterReturned';
      if (!same(h.starterLeft[String(incoming)], outgoing)) return 'subs.refuseStarterOwnPlace';
      return null;
    }
    if (h.substituteEntered[String(incoming)] != null) return 'subs.refuseSubEntered';
    if (!contains(start, outgoing)) return 'subs.refuseSubOwnStarter';
    if (h.starterLeft[String(outgoing)] != null) return 'subs.refuseStarterLeft';
    return null;
  }

  // Bench players who may enter for `outgoing`: regular ones, and exceptional ones only when no regular one exists.
  function options(match, setNo, rot, outgoing) {
    var h = history(match, setNo),
      court = onCourtNumbers(rot),
      libs = liberos(match),
      bench = registered(match).filter(function (n) {
        return !contains(court, n) && !contains(libs, n);
      }),
      regular = [],
      refused = [];
    bench.forEach(function (n) {
      var reason = regularRefusal(match, setNo, rot, outgoing, n, h);
      if (reason) refused.push({ number: n, reason: reason });
      else regular.push(n);
    });
    var exceptional =
      regular.length || contains(libs, outgoing) || !contains(court, outgoing)
        ? []
        : bench.filter(function (n) {
            return !h.barred[String(n)];
          });
    return { regular: regular, exceptional: exceptional, refused: refused, history: h };
  }

  // Replacement of the acting libero by the other designated libero, between two rallies (19.3.2). Returns the acting
  // libero, the liberos who may replace it and, when it is not allowed now, the reason (a translation key).
  function liberoSwap(match, setNo, setEvents) {
    var events = setEvents || [],
      t = window.VolleyRotation.trace(match, events, setNo),
      current = t.lib,
      present = registered(match),
      unable = unableLiberos(match),
      candidates = liberos(match).filter(function (n) {
        return !same(n, current) && contains(present, n) && !contains(unable, n);
      }),
      refusal = null;
    if (current == null || !candidates.length) refusal = 'subs.refuseNoSecondLibero';
    else if (rallyInProgress(events)) refusal = 'subs.blockedRally';
    else {
      // Events after the last completed rally (the break): substitution events recorded during this break.
      var breakStart = 0;
      events.forEach(function (e, i) {
        if (e.winningTeam) breakStart = i + 1;
      });
      var swappedHere = setSubs(match, setNo).some(function (s) {
          return s.libero && (+s.at || 0) >= breakStart;
        }),
        before = breakStart ? t.steps[breakStart - 1].liberoFor : null,
        replacedHere = breakStart > 0 && String(before) !== String(t.liberoFor);
      // 19.3.2.1: a libero replacement (the libero coming in or going out at this break, or another libero swap)
      // already took place since the last completed rally.
      if (swappedHere || replacedHere) refusal = 'subs.refuseLiberoRally';
    }
    return { current: current, candidates: candidates, refusal: refusal };
  }

  // The acting libero declared unable to play (19.4), between two rallies: the other liberos who may take over and,
  // when there is none, the players who may be re-designated as libero (not on court, not the player the libero
  // replaced, not a libero, not barred). refusal is a translation key when it is not possible now.
  function liberoUnable(match, setNo, setEvents) {
    var events = setEvents || [],
      t = window.VolleyRotation.trace(match, events, setNo),
      current = t.lib,
      present = registered(match),
      unable = unableLiberos(match),
      others = liberos(match).filter(function (n) {
        return !same(n, current) && contains(present, n) && !contains(unable, n);
      }),
      court = window.VolleyRotation.onCourt(match, t.rot, t),
      onCourt = Object.keys(court).map(function (k) {
        return court[k];
      }),
      h = history(match, setNo),
      players = others.length
        ? []
        : present.filter(function (n) {
            return (
              !contains(onCourt, n) &&
              !same(n, t.liberoFor) &&
              !contains(liberos(match), n) &&
              !contains(unable, n) &&
              !h.barred[String(n)]
            );
          }),
      refusal = null;
    if (current == null) refusal = 'subs.refuseNoLibero';
    else if (rallyInProgress(events)) refusal = 'subs.blockedRally';
    else if (!others.length && !players.length) refusal = 'subs.refuseNoRedesignation';
    return { current: current, liberos: others, players: players, refusal: refusal };
  }

  // A rally is in progress when the last event of the set is an action that did not end the rally.
  function rallyInProgress(setEvents) {
    var last = (setEvents || [])[setEvents.length - 1];
    return !!(last && !last.winningTeam && last.type !== 'SUBSTITUTION' && last.eventType !== 'SUBSTITUTION');
  }

  // Builds the records of a checked substitution: the match.subs entry and the SUBSTITUTION event.
  function build(match, setNo, setEvents, score, outgoing, incoming, opts) {
    opts = opts || {};
    var events = setEvents || [],
      at = events.length,
      rally =
        events.filter(function (e) {
          return !!e.winningTeam;
        }).length + 1,
      now = opts.now || new Date(),
      info = ((match.team && match.team.roster) || []).filter(function (p) {
        return same(p.number, outgoing);
      })[0],
      position = String((info && info.position) || '').toLowerCase(),
      event = {
        id: opts.eventId,
        type: 'SUBSTITUTION',
        eventType: 'SUBSTITUTION',
        set: setNo,
        rally: rally,
        timestamp: now.toISOString(),
        action: 'substitution',
        result: 'neutral',
        player: incoming,
        playerOut: outgoing,
        playerIn: incoming,
        position: position,
        winningTeam: null,
        pointOrigin: null,
        scoreA: score ? score.a : 0,
        scoreB: score ? score.b : 0,
      },
      sub = {
        set: setNo,
        at: at,
        rally: rally,
        out: outgoing,
        in: incoming,
        position: position,
        eventId: opts.eventId,
        ts: event.timestamp,
      };
    if (opts.exceptional) {
      sub.exceptional = true;
      event.exceptional = true;
    }
    if (opts.libero) {
      sub.libero = true;
      event.libero = true;
    }
    if (opts.unable) {
      sub.unable = true;
      event.unable = true;
    }
    if (opts.redesignated) {
      sub.redesignated = true;
      event.redesignated = true;
    }
    return { sub: sub, event: event };
  }

  window.VolleySubstitutions = {
    REGULAR_LIMIT: REGULAR_LIMIT,
    starters: starters,
    liberos: liberos,
    history: history,
    regularRefusal: regularRefusal,
    options: options,
    rallyInProgress: rallyInProgress,
    liberoSwap: liberoSwap,
    liberoUnable: liberoUnable,
    unableLiberos: unableLiberos,
    build: build,
  };
})();
