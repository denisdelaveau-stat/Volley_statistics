/* VolleyLive capture charts: cumulative errors and error differential. */
(function () {
  'use strict';
  function errorSeries(events) {
    var a = 0,
      b = 0,
      pts = [{ x: 0, a: 0, b: 0, d: 0 }];
    (events || []).forEach(function (e, i) {
      // New model: opponent_error identifies which team committed the fault.
      // Fallback to player/result keeps old locally stored events readable.
      if (e.pointOrigin === 'opponent_error') {
        if (e.winningTeam === 'team1') b++;
        else if (e.winningTeam === 'team2') a++;
      } else if (e.result === 'error') {
        if (String(e.player) === 'A') b++;
        else a++;
      }
      pts.push({ x: i + 1, a: a, b: b, d: b - a });
    });
    return pts;
  }
  function renderErrorCharts(events) {
    var pts = errorSeries(events),
      trend = document.getElementById('errorTrendChart'),
      diff = document.getElementById('errorDiffChart');
    if (!trend || !diff) return;
    var W = 900,
      H = 300,
      L = 55,
      R = 25,
      T = 45,
      B = 45,
      n = Math.max(1, pts.length - 1),
      maxErr = 1;
    pts.forEach(function (p) {
      maxErr = Math.max(maxErr, p.a, p.b);
    });
    function X(x) {
      return L + (W - L - R) * (x / n);
    }
    function Y(v) {
      return T + (H - T - B) * (1 - v / maxErr);
    }
    var grid = '',
      ticks = '';
    for (var y = 0; y <= maxErr; y++) {
      var yy = Y(y);
      grid += '<line class="error-grid" x1="' + L + '" y1="' + yy + '" x2="' + (W - R) + '" y2="' + yy + '"/>';
      ticks +=
        '<text x="' +
        (L - 10) +
        '" y="' +
        (yy + 4) +
        '" text-anchor="end" font-size="11" fill="#64748b">' +
        y +
        '</text>';
    }
    var pa = pts
        .map(function (p) {
          return X(p.x) + ',' + Y(p.a);
        })
        .join(' '),
      pb = pts
        .map(function (p) {
          return X(p.x) + ',' + Y(p.b);
        })
        .join(' ');
    var dotsA = '',
      dotsB = '';
    pts.forEach(function (p) {
      dotsA += '<circle cx="' + X(p.x) + '" cy="' + Y(p.a) + '" r="3.5" fill="#1f3864"/>';
      dotsB += '<circle cx="' + X(p.x) + '" cy="' + Y(p.b) + '" r="3.5" fill="#666"/>';
    });
    var step = Math.max(1, Math.ceil(n / 10)),
      labels = '';
    for (var i = 0; i <= n; i += step) {
      labels +=
        '<text x="' +
        X(i) +
        '" y="' +
        (H - 14) +
        '" text-anchor="middle" font-size="10" fill="#64748b">' +
        i +
        '</text>';
    }
    trend.innerHTML =
      '<svg viewBox="0 0 ' +
      W +
      ' ' +
      H +
      '" role="img" aria-label="Cumulative errors for both teams">' +
      grid +
      ticks +
      '<line class="error-axis" x1="' +
      L +
      '" y1="' +
      (H - B) +
      '" x2="' +
      (W - R) +
      '" y2="' +
      (H - B) +
      '"/>' +
      labels +
      '<polyline class="error-a" points="' +
      pa +
      '"/>' +
      dotsA +
      '<polyline class="error-b" points="' +
      pb +
      '"/>' +
      dotsB +
      '<text x="' +
      L +
      '" y="22" font-size="12" font-weight="700" fill="#1f3864">Team A errors: ' +
      pts[pts.length - 1].a +
      '</text><text x="' +
      (L + 150) +
      '" y="22" font-size="12" font-weight="700" fill="#555">Team B errors: ' +
      pts[pts.length - 1].b +
      '</text></svg>';
    var DW = 900,
      DH = 300,
      mid = 145,
      plotH = 95,
      maxD = 1;
    pts.forEach(function (p) {
      maxD = Math.max(maxD, Math.abs(p.d));
    });
    var barW = Math.max(4, ((DW - L - R) / Math.max(1, n)) * 0.65),
      bars = '';
    pts.slice(1).forEach(function (p) {
      var h = (Math.abs(p.d) / maxD) * plotH,
        x = X(p.x) - barW / 2;
      if (p.d === 0) {
        bars += '<rect class="diff-zero" x="' + x + '" y="' + (mid - 1) + '" width="' + barW + '" height="2" rx="1"/>';
        return;
      }
      var yy = p.d > 0 ? mid - h : mid;
      bars +=
        '<rect class="' +
        (p.d > 0 ? 'diff-green' : 'diff-red') +
        '" x="' +
        x +
        '" y="' +
        yy +
        '" width="' +
        barW +
        '" height="' +
        h +
        '" rx="2"/>';
    });
    var dticks =
      '<text x="' +
      (L - 10) +
      '" y="' +
      (mid - plotH + 4) +
      '" text-anchor="end" font-size="11" fill="#64748b">+' +
      maxD +
      '</text><text x="' +
      (L - 10) +
      '" y="' +
      (mid + 4) +
      '" text-anchor="end" font-size="11" fill="#64748b">0</text><text x="' +
      (L - 10) +
      '" y="' +
      (mid + plotH + 4) +
      '" text-anchor="end" font-size="11" fill="#64748b">-' +
      maxD +
      '</text>';
    diff.innerHTML =
      '<svg viewBox="0 0 ' +
      DW +
      ' ' +
      DH +
      '" role="img" aria-label="Error differential Team A versus Team B">' +
      dticks +
      '<line class="error-grid" x1="' +
      L +
      '" y1="' +
      (mid - plotH) +
      '" x2="' +
      (DW - R) +
      '" y2="' +
      (mid - plotH) +
      '"/><line x1="' +
      L +
      '" y1="' +
      mid +
      '" x2="' +
      (DW - R) +
      '" y2="' +
      mid +
      '" stroke="#374151" stroke-width="2"/><line class="error-grid" x1="' +
      L +
      '" y1="' +
      (mid + plotH) +
      '" x2="' +
      (DW - R) +
      '" y2="' +
      (mid + plotH) +
      '"/>' +
      bars +
      '<text x="' +
      L +
      '" y="22" font-size="12" font-weight="700" fill="#3f7f35">Green: Team A fewer errors</text><text x="' +
      (L + 205) +
      '" y="22" font-size="12" font-weight="700" fill="#c43b32">Red: Team A more errors</text></svg>';
  }
  window.VolleyCaptureCharts.renderErrorCharts = renderErrorCharts;
})();
