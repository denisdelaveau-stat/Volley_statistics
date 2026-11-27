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
   Starting players are the starting rotation of match.startingRotation (the app uses one line-up for every set). */
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
  function starters(match) {
    var rot = match.startingRotation || {};
    return Object.keys(rot)
      .map(function (k) {
        return rot[k];
      })
      .filter(function (n) {
        return n != null;
      });
  }
  // Liberos are excluded from regular and exceptional substitutions (15.5.1, 15.7).
  function liberos(match) {
    var list = [],
      lib = (match.startingLineup || {}).libero;
    if (lib != null) list.push(lib);
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
    var start = starters(match),
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
    var start = starters(match),
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
    build: build,
  };
})();
