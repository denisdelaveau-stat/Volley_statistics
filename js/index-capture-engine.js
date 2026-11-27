/* VolleyLive capture screen bootstrap: creates window.VolleyCapture, the contract shared by the capture scripts.
   - set here: match (the active match, or null) and updateScoreService(side);
   - set by js/index-capture-tools.js: commit(player, action, result), logSubstitution(event), deleteLastAction(),
     buildReport() and deletesBlocked (taps refused by the delete guard);
   - set by runtime-input.js: refreshCourt(events) and runtimeContext (input mode and event id of the current commit).
   The court, the action input and substitutions are rendered by runtime-input.js. */
(function () {
  'use strict';
  var m = window.VolleyDomain.readStored(window.VolleyDomain.STORAGE.captureMatch, null);
  window.VolleyCapture = {
    match: m,
    // side: 'A' (our team serves), 'B' (the opponent serves) or nothing.
    updateScoreService: function (side) {
      var board = document.getElementById('liveScore');
      if (!board) return;
      board.setAttribute('data-serving', side || '');
      board.querySelectorAll('.score-side').forEach(function (x) {
        x.classList.remove('serving');
      });
      var target = side === 'A' ? board.querySelector('.side-a') : side === 'B' ? board.querySelector('.side-b') : null;
      if (target) target.classList.add('serving');
    },
    commit: null,
    logSubstitution: null,
    deleteLastAction: null,
    buildReport: null,
    deletesBlocked: 0,
    refreshCourt: null,
    runtimeContext: null,
  };
  if (m) {
    document.getElementById('captureTitle').textContent =
      m.team.name + ' vs ' + m.opponent.name + ' · Set ' + m.currentSet;
  }
})();
