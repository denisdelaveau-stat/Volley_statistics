/* VolleyLive rotation engine (pure functions): window.VolleyRotation.
   Single source of the rotation rules for the capture screen and the Coach View.
   Rules: clockwise rotation P2>P1>P6>P5>P4>P3>P2, only when our team wins a rally while the opponent was serving
   (side-out). Libero: back row only, never serves (replaces the middle blocker in P6/P5) and leaves when that
   middle blocker's slot reaches P4. */
(function () {
  'use strict';
  var court = window.VolleyDomain.court;
  var POS = court.POS,
    LIBERO_ZONES = court.LIBERO_ZONES,
    rotate = court.rotate;

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
  function applySub(state, sub) {
    var zone = null;
    POS.forEach(function (k) {
      if (sameNumber(state.rot[k], sub.out)) zone = k;
    });
    if (zone) {
      state.rot[zone] = sub['in'];
      state.mbs.forEach(function (mb, i) {
        if (sameNumber(mb, sub.out)) state.mbs[i] = sub['in'];
      });
    } else if (sameNumber(sub.out, state.lib)) {
      state.lib = sub['in'];
    }
  }

  // Replays one set. steps[i] is the state (rotation, serving team) when event i is logged, after the substitutions
  // made before it. The other fields are the state after the last event.
  function trace(match, evs, setNo) {
    setNo = setNo || match.currentSet || 1;
    var lineup = match.startingLineup || {},
      start = match.startingRotation || {},
      rot = {};
    POS.forEach(function (k) {
      rot[k] = start[k];
    });
    var subs = setSubs(match, setNo),
      ordered = subs.slice().sort(function (a, b) {
        return (+a.at || 0) - (+b.at || 0);
      }),
      state = { rot: rot, mbs: [lineup.mb1, lineup.mb2], lib: lineup.libero },
      serving = initialServing(match, setNo),
      rotations = 0,
      steps = [];
    function subsAt(i) {
      ordered.forEach(function (sub) {
        if ((+sub.at || 0) === i) applySub(state, sub);
      });
    }
    (evs || []).forEach(function (e, i) {
      subsAt(i);
      steps.push({ rot: Object.assign({}, state.rot), serving: serving });
      if (e.winningTeam === 'team1') {
        if (serving === 'B') {
          state.rot = rotate(state.rot);
          serving = 'A';
          rotations++;
        }
      } else if (e.winningTeam === 'team2') {
        serving = 'B';
      }
    });
    subsAt((evs || []).length);
    return {
      steps: steps,
      rot: state.rot,
      serving: serving,
      rotations: rotations,
      mbs: state.mbs,
      lib: state.lib,
      subs: subs,
    };
  }
  // State after the events of the current set (match.currentSet).
  function replay(match, evs) {
    var t = trace(match, evs);
    return { rot: t.rot, serving: t.serving, rotations: t.rotations, mbs: t.mbs, lib: t.lib, subs: t.subs };
  }
  // Court as displayed: the libero replaces the middle blocker standing in P6 or P5.
  function courtFrom(match, rot, stt) {
    var c = {},
      lib = (stt && stt.lib) || match.startingLineup.libero,
      mbs = (stt && stt.mbs) || [match.startingLineup.mb1, match.startingLineup.mb2],
      bench = lib;
    POS.forEach(function (k) {
      c[k] = { num: rot[k], libero: false, forNum: null };
    });
    LIBERO_ZONES.some(function (k) {
      if (mbs.indexOf(rot[k]) > -1) {
        c[k] = { num: lib, libero: true, forNum: rot[k] };
        bench = rot[k];
        return true;
      }
      return false;
    });
    c.bench = bench;
    return c;
  }
  window.VolleyRotation = {
    rotate: rotate,
    replay: replay,
    trace: trace,
    initialServing: initialServing,
    court: courtFrom,
    POS: POS,
    LIBERO_ZONES: LIBERO_ZONES,
  };
})();
