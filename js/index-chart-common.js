/* VolleyLive capture charts: shared chart data (one point per rally), player palette and categories. */
(function () {
  'use strict';
  var DATA = [];
  var STORAGE_DATA = window.VolleyDomain.STORAGE.captureChartData,
    STORAGE_EVENTS = window.VolleyDomain.STORAGE.captureEvents;
  try {
    var storedData = JSON.parse(localStorage.getItem(STORAGE_DATA) || 'null');
    if (Array.isArray(storedData))
      DATA = storedData.map(function (p) {
        if (p && p.c === 'A') p.c = 0;
        return p;
      });
  } catch (e) {}
  var PC = { 1: '#6A1B9A', 2: '#00ACC1', 3: '#FB8C00', 4: '#1E88E5', 5: '#EC407A', 6: '#FDD835', 7: '#6D4C41' };
  var PN = { 1: 'Setter', 2: 'Libero', 3: '', 4: 'MB', 5: 'OH', 6: 'OH', 7: 'OPP' };
  (function () {
    var m = window.VolleyCapture.match,
      RN = window.VolleyDomain.ROLE_NAMES,
      PAL = [
        '#6A1B9A',
        '#00ACC1',
        '#FB8C00',
        '#1E88E5',
        '#EC407A',
        '#FDD835',
        '#6D4C41',
        '#43A047',
        '#8E24AA',
        '#F4511E',
        '#3949AB',
        '#00897B',
      ];
    if (m && m.team && m.team.roster) {
      PN = {};
      m.team.roster.forEach(function (r, i) {
        PN[r.number] = (r.name ? r.name + ' \u00B7 ' : '') + (RN[r.position] || '');
        if (!PC[r.number]) PC[r.number] = PAL[i % PAL.length];
      });
    }
  })();
  var GREY = '#9E9E9E',
    GREEN = '#2E7D32',
    RED = '#C62828';
  function cat(p) {
    if (p.w === 'A') return p.c === 0 ? 'A0' : 'A' + p.c;
    return p.c === 0 ? 'BP' : 'BE';
  }
  var ON_STATE = {};

  window.VolleyCaptureCharts = {
    DATA: DATA,
    STORAGE_DATA: STORAGE_DATA,
    STORAGE_EVENTS: STORAGE_EVENTS,
    PC: PC,
    PN: PN,
    GREY: GREY,
    GREEN: GREEN,
    RED: RED,
    cat: cat,
    ON_STATE: ON_STATE,
  };
})();
