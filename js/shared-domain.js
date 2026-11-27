/* VolleyLive shared domain constants: storage keys, role labels and court geometry.
   Loaded right after js/shared-dom.js by index.html and spectator.html. Values are frozen: never mutate them.
   statistics/adapter.js keeps its own copies because it must also run standalone (Node). */
(function () {
  'use strict';

  // localStorage / sessionStorage keys. Changing a value breaks existing saved data: add a new version instead.
  var STORAGE = Object.freeze({
    captureMatch: 'volleyCapture.match.v1',
    captureEvents: 'volleyCapture.events.v1',
    captureChartData: 'volleyCapture.chartData.v1',
    captureStage: 'volleyCapture.stage',
    teamLibrary: 'volleyCapture.library.v1',
    settings: 'volleyCapture.settings.v1',
    runtimeInputPreferences: 'volleyCapture.runtimeInput.preferences.v1',
    analysisReplay: 'volleyAnalysis.replay.v1',
    analysisReplaySource: 'volleyAnalysis.replay.source.v1',
    analysisUnloaded: 'volleyAnalysis.unloaded.v1',
    matchHistory: 'volleyMatchHub.history.v1',
    matchLibrarySelected: 'volleyMatchLibrary.selected.v1',
    libraryFilter: 'vl.library.filter',
    librarySelectedId: 'vl.library.selectedId',
    spectatorArchive: 'volleySpectator.archive.v1',
    spectatorArchiveName: 'volleySpectator.archiveName.v1',
    spectatorTimelineOrder: 'volleySpectator.timeline.order',
    spectatorTimelineWindow: 'volleySpectator.timeline.window',
    language: 'volleyLive.language.v1',
  });

  // Role labels used by the capture screens (the Coach View has its own French labels).
  var ROLE_CODES = Object.freeze({ setter: 'SET', oh: 'OH', mb: 'MB', opp: 'OPP', libero: 'LIB' });
  var ROLE_NAMES = Object.freeze({ setter: 'Setter', oh: 'OH', mb: 'MB', opp: 'OPP', libero: 'Libero' });

  // Court zones in display order (front row P4 P3 P2, back row P5 P6 P1).
  var POS = Object.freeze(['p4', 'p3', 'p2', 'p5', 'p6', 'p1']);
  // Clockwise rotation: the player in P2 moves to P1, P1 to P6, and so on.
  var NEXT = Object.freeze({ p2: 'p1', p1: 'p6', p6: 'p5', p5: 'p4', p4: 'p3', p3: 'p2' });
  // Back-row zones where the libero replaces a middle blocker.
  var LIBERO_ZONES = Object.freeze(['p6', 'p5']);

  // Returns a new rotation object after one clockwise rotation.
  function rotate(rotation) {
    var next = {};
    Object.keys(NEXT).forEach(function (zone) {
      next[NEXT[zone]] = rotation[zone];
    });
    return next;
  }

  // Rotation order of the line-up roles from the setter's zone, as the New Match wizard places them: the setter, then
  // OH1, MB1, opposite, OH2 and MB2 in the following zones (P1 -> P2 -> ... -> P6 -> P1).
  var ROTATION_ROLES = Object.freeze(['setter', 'oh1', 'mb1', 'opposite', 'oh2', 'mb2']);

  // Starting rotation {p1..p6} from the role assignment {setter, oh1, ...} and the setter's zone ('p1'..'p6').
  function rotationFromRoles(roles, setterZone) {
    var z = +String(setterZone || 'p1').slice(1) || 1,
      rotation = {};
    ROTATION_ROLES.forEach(function (role, i) {
      rotation['p' + (((z - 1 + i) % 6) + 1)] = roles[role] != null ? roles[role] : null;
    });
    return rotation;
  }

  // Zone ('p1'..'p6') of a player in a rotation, or null. Numbers may be stored as numbers or strings.
  function zoneOf(rotation, player) {
    var found = null;
    POS.forEach(function (zone) {
      if (player != null && rotation[zone] != null && String(rotation[zone]) === String(player)) found = zone;
    });
    return found;
  }

  // Starting line-up of a set. FIVB 7.3.2: the coach hands in a line-up sheet before each set, so it may change.
  // Set 1 is match.startingLineup / match.startingRotation; match.setLineups[n] = {startingLineup, startingRotation}
  // holds the line-up of a later set. A set without its own line-up keeps the line-up of the previous set, so
  // matches recorded before per-set line-ups replay unchanged. statistics/adapter.js applies the same rule.
  function lineupForSet(match, setNo) {
    var lineups = (match && match.setLineups) || {};
    for (var n = +setNo || 1; n >= 2; n--) {
      var lineup = lineups[n];
      if (lineup && lineup.startingRotation) return lineup;
    }
    return {
      startingLineup: (match && match.startingLineup) || {},
      startingRotation: (match && match.startingRotation) || {},
    };
  }

  // Reads a JSON value from storage (localStorage by default). Returns fallback when the key is missing, and also
  // when the value cannot be read, but then says so in the console: corrupted data must not disappear silently.
  function readStored(key, fallback, storage) {
    var raw;
    try {
      raw = (storage || window.localStorage).getItem(key);
    } catch (error) {
      console.warn('VolleyLive: storage unavailable while reading ' + key, error);
      return fallback;
    }
    if (raw == null || raw === '') return fallback;
    try {
      var value = JSON.parse(raw);
      return value == null ? fallback : value;
    } catch (error) {
      console.warn('VolleyLive: unreadable stored value for ' + key + ', using the default value', error);
      return fallback;
    }
  }

  window.VolleyDomain = Object.freeze({
    STORAGE: STORAGE,
    readStored: readStored,
    ROLE_CODES: ROLE_CODES,
    ROLE_NAMES: ROLE_NAMES,
    court: Object.freeze({ POS: POS, NEXT: NEXT, LIBERO_ZONES: LIBERO_ZONES, rotate: rotate, zoneOf: zoneOf }),
    lineup: Object.freeze({
      ROTATION_ROLES: ROTATION_ROLES,
      rotationFromRoles: rotationFromRoles,
      forSet: lineupForSet,
    }),
  });
})();
