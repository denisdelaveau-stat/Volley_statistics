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

  window.VolleyDomain = Object.freeze({
    STORAGE: STORAGE,
    ROLE_CODES: ROLE_CODES,
    ROLE_NAMES: ROLE_NAMES,
    court: Object.freeze({ POS: POS, NEXT: NEXT, LIBERO_ZONES: LIBERO_ZONES, rotate: rotate }),
  });
})();
