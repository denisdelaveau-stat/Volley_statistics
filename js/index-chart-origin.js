/* VolleyLive capture charts: point origin pies (points won vs points from opponent errors). */
(function () {
  'use strict';
  function renderOriginPie(containerId, legendId, earned, given) {
    var c = document.getElementById(containerId),
      l = document.getElementById(legendId);
    if (!c || !l) return;
    var total = earned + given,
      green = '#16a34a',
      orange = '#f59e0b';
    if (total === 0) {
      c.innerHTML =
        '<svg viewBox="0 0 240 240" role="img" aria-label="No points"><circle cx="120" cy="120" r="82" fill="#e5e7eb"/><circle cx="120" cy="120" r="52" fill="#fff"/><text x="120" y="116" text-anchor="middle" font-size="30" font-weight="800" fill="#64748b">0</text><text x="120" y="140" text-anchor="middle" font-size="13" fill="#64748b">points</text></svg>';
      l.innerHTML = '';
      return;
    }
    var ep = (earned / total) * 100,
      gp = (given / total) * 100,
      r = 82,
      circ = 2 * Math.PI * r,
      elen = (circ * ep) / 100,
      glen = (circ * gp) / 100;
    c.innerHTML =
      '<svg viewBox="0 0 240 240" role="img" aria-label="' +
      earned +
      ' points won, ' +
      given +
      ' points given by opponent">' +
      '<circle cx="120" cy="120" r="' +
      r +
      '" fill="none" stroke="#e5e7eb" stroke-width="42"/>' +
      '<circle cx="120" cy="120" r="' +
      r +
      '" fill="none" stroke="' +
      green +
      '" stroke-width="42" stroke-dasharray="' +
      elen +
      ' ' +
      (circ - elen) +
      '" transform="rotate(-90 120 120)"/>' +
      '<circle cx="120" cy="120" r="' +
      r +
      '" fill="none" stroke="' +
      orange +
      '" stroke-width="42" stroke-dasharray="' +
      glen +
      ' ' +
      (circ - glen) +
      '" stroke-dashoffset="' +
      -elen +
      '" transform="rotate(-90 120 120)"/>' +
      '<text x="120" y="116" text-anchor="middle" font-size="32" font-weight="800" fill="#1f2937">' +
      total +
      '</text><text x="120" y="140" text-anchor="middle" font-size="13" fill="#64748b">classified points</text></svg>';
    l.innerHTML =
      '<div class="pie-legend-item"><span class="pie-color" style="background:' +
      green +
      '"></span>Points won <strong>' +
      earned +
      ' (' +
      ep.toFixed(0) +
      '%)</strong></div><div class="pie-legend-item"><span class="pie-color" style="background:' +
      orange +
      '"></span>Points from opponent errors <strong>' +
      given +
      ' (' +
      gp.toFixed(0) +
      '%)</strong></div>';
  }
  function updateOriginPies(events) {
    var aWon = 0,
      aGiven = 0,
      bWon = 0,
      bGiven = 0;
    (events || []).forEach(function (e) {
      if (e.winningTeam === 'team1' && e.pointOrigin === 'earned') aWon++;
      else if (e.winningTeam === 'team1' && e.pointOrigin === 'opponent_error') aGiven++;
      else if (e.winningTeam === 'team2' && e.pointOrigin === 'earned') bWon++;
      else if (e.winningTeam === 'team2' && e.pointOrigin === 'opponent_error') bGiven++;
    });
    renderOriginPie('teamAPie', 'teamAPieLegend', aWon, aGiven);
    renderOriginPie('teamBPie', 'teamBPieLegend', bWon, bGiven);
  }
  window.VolleyCaptureCharts.updateOriginPies = updateOriginPies;
})();
