/* VolleyLive spectator view — GRAPH: score and fault evolution charts. */
(function () {
  'use strict';
  var P = window.VolleySpectatorParts, st = P.state;
  var I18N = P.I18N, $ = P.$, esc = P.esc, num = P.num;

  function svgLine(x1, y1, x2, y2, className) {
    return '<line class="' + className + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"></line>';
  }
  function svgText(x, y, text, anchor, className) {
    return '<text class="' + (className || 'graph-label') + '" x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'middle') + '">' + esc(text) + '</text>';
  }
  function scoreCellState(item, side) {
    if (item.scoringTeam !== side || !item.pointClassification) return 'neutral';
    if (item.pointClassification === 'SIDE_OUT') return 'so';
    return side === 'HOME' ? 'bp-home' : 'bp-away';
  }
  function scoreCellAria(item, side) {
    var value = side === 'HOME' ? item.homeScore : item.awayScore;
    var state = scoreCellState(item, side);
    var suffix = state === 'so' ? ', ' + I18N.sideOut : state.indexOf('bp-') === 0 ? ', ' + I18N.breakPoint : '';
    return side + ' ' + value + suffix + ', rallye ' + item.rallyOrdinal;
  }
  function faultCellAria(item, side) {
    var home = side === 'HOME', value = home ? item.cumulativeHomeFaults : item.cumulativeAwayFaults;
    var increment = home ? item.homeFaultIncrement : item.awayFaultIncrement;
    return side + ', ' + value + ' fautes cumulées' + (increment ? ', ' + increment + ' nouvelle' + (increment > 1 ? 's' : '') + ' faute' + (increment > 1 ? 's' : '') + ' sur ce rallye' : '') + ', rallye ' + item.rallyOrdinal;
  }
  function renderValueRows(items, kind) {
    var value = function (item, side) {
      if (kind === 'score') return side === 'HOME' ? item.homeScore : item.awayScore;
      return side === 'HOME' ? item.cumulativeHomeFaults : item.cumulativeAwayFaults;
    };
    return ['HOME', 'AWAY'].map(function (side) {
      var cells = items.map(function (item) {
        var state, aria;
        if (kind === 'score') {
          state = scoreCellState(item, side);
          aria = scoreCellAria(item, side);
        } else {
          var increment = side === 'HOME' ? item.homeFaultIncrement : item.awayFaultIncrement;
          state = increment ? 'new-fault' : 'neutral';
          aria = faultCellAria(item, side);
        }
        return '<div class="evolution-cell ' + kind + '-cell ' + state + '" data-rally-key="' + esc(item.rallyKey) + '" role="img" aria-label="' + esc(aria) + '"><span aria-hidden="true">' + value(item, side) + '</span></div>';
      }).join('');
      return '<div class="evolution-grid value-row ' + kind + '-row ' + side.toLowerCase() + '"><strong class="row-label">' + side + '</strong>' + cells + '</div>';
    }).join('');
  }
  function deltaChartMarkup(items, valueKey, chartKind, labels, accessibleLabel, measuredWidth) {
    var n = items.length, width = Math.max(100, measuredWidth || n * 100), height = 178, top = 13, bottom = 31;
    var plotH = height - top - bottom, zeroY = top + plotH / 2;
    var magnitude = Math.max(2, items.reduce(function (mx, item) { return Math.max(mx, Math.abs(num(item[valueKey], 0))); }, 0));
    var y = function (v) { return zeroY - (v / magnitude) * (plotH / 2 - 7); };
    var columnWidth = width / Math.max(1, n);
    var x = function (i) { return i * columnWidth + columnWidth / 2; };
    var markup = '';
    for (var tick = -magnitude; tick <= magnitude; tick++) {
      markup += svgLine(0, y(tick), width, y(tick), tick === 0 ? 'graph-zero' : 'graph-grid horizontal');
    }
    items.forEach(function (item, i) {
      markup += svgLine(x(i), top, x(i), top + plotH, 'graph-grid vertical');
      markup += svgText(x(i), height - 10, item.rallyOrdinal, 'middle', 'rally-label');
    });
    if (items.length) {
      var path = items.map(function (item, i) { return (i ? 'L' : 'M') + x(i) + ' ' + y(item[valueKey]); }).join(' ');
      if (chartKind === 'score') {
        var area = 'M' + x(0) + ' ' + zeroY + ' ' + items.map(function (item, i) { return 'L' + x(i) + ' ' + y(item[valueKey]); }).join(' ') + ' L' + x(items.length - 1) + ' ' + zeroY + ' Z';
        markup += '<path class="delta-area score-area" d="' + area + '"></path>';
      }
      if (items.length > 1) markup += '<path class="delta-series ' + chartKind + '-series" d="' + path + '"></path>';
      items.forEach(function (item, i) {
        var value = item[valueKey];
        markup += '<circle class="delta-point ' + chartKind + '-point" data-rally-key="' + esc(item.rallyKey) + '" data-value="' + value + '" cx="' + x(i) + '" cy="' + y(value) + '" r="5"><title>Rallye ' + item.rallyOrdinal + ' · delta ' + value + '</title></circle>';
      });
    }
    var yLabels = '<div class="chart-y-labels" aria-hidden="true"><span>' + esc(labels.positive) + '</span><span>' + esc(labels.zero) + '</span><span>' + esc(labels.negative) + '</span></div>';
    return '<div class="evolution-grid evolution-chart-grid">' + yLabels + '<svg class="delta-line-chart ' + chartKind + '-delta-chart" viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none" role="img" aria-label="' + esc(accessibleLabel) + '"><title>' + esc(accessibleLabel) + '</title>' + markup + '</svg></div><div class="axis-title">' + I18N.pointsPlayed + '</div>';
  }
  function updateSetSelector() {
    var select = $('evolutionSet');
    var options = (st.model.availableSets || []).map(function (setNo) { return '<option value="' + setNo + '">Set ' + setNo + '</option>'; }).join('');
    if (select.innerHTML !== options) select.innerHTML = options;
    if (st.model.currentSet != null) select.value = String(st.model.currentSet);
    select.disabled = !st.model.availableSets.length;
    var atLive = st.model.currentSet == null || st.model.currentSet === st.model.liveSet;
    $('returnToLive').hidden = atLive || st.model.noMatch;
    $('liveSetStatus').textContent = st.model.noMatch ? 'AUCUN MATCH' : atLive ? 'DIRECT · SET ' + st.model.liveSet : 'REPLAY · SET ' + st.model.currentSet;
    $('liveSetStatus').classList.toggle('is-replay', !atLive && !st.model.noMatch);
  }
  function renderGraphs(v) {
    var empty = st.model.rallies.length === 0, scroll = $('graphContent'), previousScroll = scroll.scrollLeft;
    $('graphContent').hidden = empty;
    $('graphEmpty').hidden = !empty;
    updateSetSelector();
    if (empty) {
      $('scoreRows').innerHTML = '';
      $('faultRows').innerHTML = '';
      $('scoreChart').innerHTML = deltaChartMarkup([], 'scoreDelta', 'score', { positive: I18N.scorePositive, zero: I18N.scoreZero, negative: I18N.scoreNegative }, 'Évolution du score, Set ' + st.model.currentSet + ', aucun rallye terminé.');
      $('faultChart').innerHTML = deltaChartMarkup([], 'faultDelta', 'fault', { positive: I18N.faultPositive, zero: I18N.faultZero, negative: I18N.faultNegative }, 'Évolution des fautes, Set ' + st.model.currentSet + ', aucun rallye terminé.');
      return;
    }
    var rows = v.rows;
    $('evolutionCanvas').style.setProperty('--visible-rally-count', rows.length);
    $('evolutionCanvas').style.setProperty('--evolution-min-width', (96 + rows.length * 58) + 'px');
    $('scoreRows').innerHTML = renderValueRows(rows, 'score');
    $('faultRows').innerHTML = renderValueRows(rows, 'fault');
    var finalItem = st.model.rallies[st.model.rallies.length - 1];
    var scoreLabel = 'Évolution du score, Set ' + st.model.currentSet + '. HOME ' + finalItem.homeScore + ', AWAY ' + finalItem.awayScore + '. Delta ' + (finalItem.scoreDelta >= 0 ? 'plus ' : 'moins ') + Math.abs(finalItem.scoreDelta) + '.';
    var faultLabel = 'Évolution des fautes, Set ' + st.model.currentSet + '. HOME ' + finalItem.cumulativeHomeFaults + ' fautes, AWAY ' + finalItem.cumulativeAwayFaults + ' fautes. Delta ' + (finalItem.faultDelta === 0 ? 'zéro' : (finalItem.faultDelta > 0 ? 'plus ' : 'moins ') + Math.abs(finalItem.faultDelta)) + '.';
    function fillCharts(plotWidth) {
      $('scoreChart').innerHTML = deltaChartMarkup(rows, 'scoreDelta', 'score', { positive: I18N.scorePositive, zero: I18N.scoreZero, negative: I18N.scoreNegative }, scoreLabel, plotWidth);
      $('faultChart').innerHTML = deltaChartMarkup(rows, 'faultDelta', 'fault', { positive: I18N.faultPositive, zero: I18N.faultZero, negative: I18N.faultNegative }, faultLabel, plotWidth);
    }
    fillCharts(0);
    requestAnimationFrame(function () {
      var row = document.querySelector('.score-row'), label = row && row.querySelector('.row-label');
      if (!row || !label || !row.offsetWidth) return;
      var plotWidth = row.getBoundingClientRect().width - label.getBoundingClientRect().width;
      if (plotWidth > 1) fillCharts(plotWidth);
    });
    $('scoreSummary').textContent = scoreLabel;
    $('faultSummary').textContent = faultLabel;
    if (st.evolutionBrowsing) scroll.scrollLeft = previousScroll;
    else if (v.p.order === 'oldestFirst') requestAnimationFrame(function () { scroll.scrollLeft = scroll.scrollWidth; });
    $('returnLive').hidden = st.model.finished || st.model.currentSet !== st.model.liveSet || !st.evolutionBrowsing;
  }

  P.svgLine = svgLine;
  P.svgText = svgText;
  P.scoreCellState = scoreCellState;
  P.scoreCellAria = scoreCellAria;
  P.faultCellAria = faultCellAria;
  P.renderValueRows = renderValueRows;
  P.deltaChartMarkup = deltaChartMarkup;
  P.updateSetSelector = updateSetSelector;
  P.renderGraphs = renderGraphs;
})();
