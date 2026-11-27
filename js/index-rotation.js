/* VolleyLive rotation engine (pure functions): window.VolleyRotation.
   Spec: docs/specs/DOM-ROTATION.md, docs/specs/DOM-LIBERO.md.
   Single source of the rotation rules for the capture screen and the Coach View.
   Rotation: clockwise P2>P1>P6>P5>P4>P3>P2, only when our team wins a rally while the opponent was serving
   (side-out).
   Libero / middle-blocker permutation, FIVB Official Volleyball Rules 2025-2028, Rule 19:
   - the Libero replaces a back-row player (19.3.1.1), here the middle blocker, and plays only in the back row
     (19.3.1.2): P6 or P5, or P1 while our team receives, because the Libero cannot serve (19.3.1.3);
   - only one Libero on court (19.1.3);
   - at least one completed rally between two Libero replacements (19.3.2.1);
   - the Libero can only be replaced by the regular player it replaced (19.3.2.2).
   trace() applies these rules rally after rally (liberoFor = the player the Libero replaces). Without that history,
   court() falls back to the first middle blocker found in an allowed zone. statistics/adapter.js applies the same
   rules for the Spectator matrix.
   Each set starts from its own line-up (FIVB 7.3.2): VolleyDomain.lineup.forSet(match, set). */
(function () {
  'use strict';
  var court = window.VolleyDomain.court;
  var POS = court.POS,
    LIBERO_ZONES = court.LIBERO_ZONES,
    rotate = court.rotate,
    lineupForSet = window.VolleyDomain.lineup.forSet;

  // Player numbers may be stored as numbers or strings (imported files): compare them as text.
  function sameNumber(a, b) {
    return a != null && b != null && String(a) === String(b);
  }
  // Team A serves first in set 1 unless it starts in reception; the first serve alternates from set to set.
  function initialServing(match, setNo) {
    var serving = match.firstRally && match.firstRally.antibesState === 'reception' ? 'B' : 'A';
    if (setNo % 2 === 0) serving = serving === 'A' ? 'B' : 'A';
    return serving;
  }
  // Substitutions: match.subs=[{set,at,out,in,ts}]; 'at' = number of events of that set before the change.
  function setSubs(match, setNo) {
    return (match.subs || []).filter(function (sub) {
      return (+sub.set || 1) === setNo;
    });
  }
  // Middle blockers tracked for the libero: the starting line-up of the set when it names them (capture), otherwise
  // the roster players whose position is MB (imported v2 documents have no mb1/mb2).
  function middleBlockers(match, setNo) {
    var lineup = lineupForSet(match, setNo || match.currentSet || 1).startingLineup || {};
    if (lineup.mb1 != null || lineup.mb2 != null) return [lineup.mb1, lineup.mb2];
    return ((match.team && match.team.roster) || [])
      .filter(function (p) {
        return String(p.position || '').toLowerCase() === 'mb';
      })
      .map(function (p) {
        return p.number;
      });
  }
  // Zones where the libero may replace a middle blocker, depending on which team serves.
  function liberoZones(serving) {
    return serving === 'B' ? ['p6', 'p5', 'p1'] : LIBERO_ZONES;
  }
  function zoneOf(rot, player) {
    var zone = null;
    POS.forEach(function (k) {
      if (sameNumber(rot[k], player)) zone = k;
    });
    return zone;
  }
  function isMiddleBlocker(mbs, player) {
    return mbs.some(function (mb) {
      return sameNumber(mb, player);
    });
  }
  // First middle blocker standing in a zone where the libero may play.
  function liberoCandidate(rot, serving, mbs) {
    var found = null;
    liberoZones(serving).some(function (k) {
      if (isMiddleBlocker(mbs, rot[k])) {
        found = rot[k];
        return true;
      }
      return false;
    });
    return found;
  }
  // Libero decision taken once per completed rally (and at the start of the set). Returns the player the libero
  // replaces, or null. The libero stays with the player it replaced while that player is in an allowed zone
  // (19.3.2.2); when that player must come back, this is the only replacement of this rally (19.3.2.1).
  function nextLiberoFor(liberoFor, rot, serving, mbs, lib) {
    if (lib == null) return null;
    if (liberoFor != null) {
      var zone = zoneOf(rot, liberoFor);
      return zone && liberoZones(serving).indexOf(zone) > -1 ? liberoFor : null;
    }
    return liberoCandidate(rot, serving, mbs);
  }
  function applySub(state, sub) {
    var zone = zoneOf(state.rot, sub.out);
    if (zone) {
      state.rot[zone] = sub['in'];
      state.mbs.forEach(function (mb, i) {
        if (sameNumber(mb, sub.out)) state.mbs[i] = sub['in'];
      });
      if (sameNumber(state.liberoFor, sub.out)) state.liberoFor = sub['in'];
    } else if (sameNumber(sub.out, state.lib)) {
      state.lib = sub['in'];
    }
  }

  // Replays one set. steps[i] is the state (rotation, serving team, acting libero, player it replaces) when event i is
  // logged, after the substitutions made before it. The other fields are the state after the last event.
  function trace(match, evs, setNo) {
    setNo = setNo || match.currentSet || 1;
    var setLineup = lineupForSet(match, setNo),
      lineup = setLineup.startingLineup || {},
      start = setLineup.startingRotation || {},
      rot = {};
    POS.forEach(function (k) {
      rot[k] = start[k];
    });
    var subs = setSubs(match, setNo),
      ordered = subs.slice().sort(function (a, b) {
        return (+a.at || 0) - (+b.at || 0);
      }),
      state = { rot: rot, mbs: middleBlockers(match, setNo), lib: lineup.libero, liberoFor: null },
      serving = initialServing(match, setNo),
      rotations = 0,
      steps = [],
      // A libero decision is allowed at the start of the set and after each completed rally, never mid-rally.
      rallyCompleted = true;
    function subsAt(i) {
      ordered.forEach(function (sub) {
        if ((+sub.at || 0) === i) applySub(state, sub);
      });
    }
    function placeLibero() {
      if (!rallyCompleted) return;
      state.liberoFor = nextLiberoFor(state.liberoFor, state.rot, serving, state.mbs, state.lib);
      rallyCompleted = false;
    }
    (evs || []).forEach(function (e, i) {
      subsAt(i);
      placeLibero();
      steps.push({ rot: Object.assign({}, state.rot), serving: serving, liberoFor: state.liberoFor, lib: state.lib });
      if (e.winningTeam === 'team1') {
        if (serving === 'B') {
          state.rot = rotate(state.rot);
          serving = 'A';
          rotations++;
        }
        rallyCompleted = true;
      } else if (e.winningTeam === 'team2') {
        serving = 'B';
        rallyCompleted = true;
      }
    });
    subsAt((evs || []).length);
    placeLibero();
    return {
      steps: steps,
      rot: state.rot,
      serving: serving,
      rotations: rotations,
      mbs: state.mbs,
      lib: state.lib,
      liberoFor: state.liberoFor,
      subs: subs,
    };
  }
  // State after the events of the current set (match.currentSet).
  function replay(match, evs) {
    var t = trace(match, evs);
    return {
      rot: t.rot,
      serving: t.serving,
      rotations: t.rotations,
      mbs: t.mbs,
      lib: t.lib,
      liberoFor: t.liberoFor,
      subs: t.subs,
    };
  }
  // Court as displayed. stt is a trace() step, a trace()/replay() result or a partial state ({serving}); when it has
  // no liberoFor (no rally history, e.g. a theoretical rotation) the first middle blocker in an allowed zone is
  // replaced. Without stt.serving the serving team is assumed to be ours (libero in P6/P5 only). Without stt.lib and
  // stt.mbs, the line-up of the current set gives the libero and the middle blockers.
  function courtFrom(match, rot, stt) {
    var lineup = lineupForSet(match, match.currentSet || 1).startingLineup || {},
      c = {},
      lib = (stt && stt.lib) || lineup.libero,
      mbs = (stt && stt.mbs) || middleBlockers(match),
      bench = lib;
    POS.forEach(function (k) {
      c[k] = { num: rot[k], libero: false, forNum: null };
    });
    if (lib != null) {
      var replaced = stt && stt.liberoFor !== undefined ? stt.liberoFor : liberoCandidate(rot, stt && stt.serving, mbs),
        zone = replaced != null ? zoneOf(rot, replaced) : null;
      if (zone) {
        c[zone] = { num: lib, libero: true, forNum: rot[zone] };
        bench = rot[zone];
      }
    }
    c.bench = bench;
    return c;
  }
  // Player numbers on court by zone, libero included (the displayed line-up).
  function onCourt(match, rot, stt) {
    var c = courtFrom(match, rot, stt),
      byZone = {};
    POS.forEach(function (k) {
      byZone[k] = c[k].num;
    });
    return byZone;
  }
  window.VolleyRotation = {
    rotate: rotate,
    replay: replay,
    trace: trace,
    initialServing: initialServing,
    court: courtFrom,
    onCourt: onCourt,
    middleBlockers: middleBlockers,
    liberoZones: liberoZones,
    POS: POS,
    LIBERO_ZONES: LIBERO_ZONES,
  };
})();
