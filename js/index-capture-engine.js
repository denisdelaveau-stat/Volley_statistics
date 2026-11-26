/* VolleyLive capture screen bootstrap.
   Loads the active match (window.VOLLEY_MATCH), sets the capture title and shows the serving team on the score board
   (window.updateScoreService). The court, the action input and substitutions are rendered by runtime-input.js. */
(function () {
  'use strict';
  var m = null;
  try {
    m = JSON.parse(localStorage.getItem(window.VolleyDomain.STORAGE.captureMatch) || 'null');
  } catch (e) {}
  window.VOLLEY_MATCH = m;
  // side: 'A' (our team serves), 'B' (the opponent serves) or nothing.
  window.updateScoreService = function (side) {
    var board = document.getElementById('liveScore');
    if (!board) return;
    board.setAttribute('data-serving', side || '');
    board.querySelectorAll('.score-side').forEach(function (x) {
      x.classList.remove('serving');
    });
    var target = side === 'A' ? board.querySelector('.side-a') : side === 'B' ? board.querySelector('.side-b') : null;
    if (target) target.classList.add('serving');
  };
  if (m) {
    document.getElementById('captureTitle').textContent =
      m.team.name + ' vs ' + m.opponent.name + ' · Set ' + m.currentSet;
  }
})();
