/* VolleyLive Spectator View controller: render, tabs, storage sync and the public window.VolleySpectator API. Views live in js/spectator-*.js. */
(function () {
  'use strict';
  var t = window.VolleyI18n.t;

  var P = window.VolleySpectatorParts,
    st = P.state;
  var ARCHIVE_KEY = P.ARCHIVE_KEY,
    ORDER_KEY = P.ORDER_KEY,
    WINDOW_KEY = P.WINDOW_KEY,
    $ = P.$,
    num = P.num,
    monogram = P.monogram,
    build = P.build,
    emptyModel = P.emptyModel,
    momentumCfg = P.momentumCfg,
    computeMomentum = P.computeMomentum,
    momentumView = P.momentumView,
    renderScoreboard = P.renderScoreboard,
    renderMomentum = P.renderMomentum,
    rankingSource = P.rankingSource,
    rankingRows = P.rankingRows,
    renderRanking = P.renderRanking,
    prefs = P.prefs,
    visibleRows = P.visibleRows,
    renderRow = P.renderRow,
    renderGraphs = P.renderGraphs;
  var selectedSetNumber = null;

  function render() {
    if (!st.model) return;
    var last = st.model.rallies[st.model.rallies.length - 1],
      v = visibleRows();
    renderScoreboard(st.model);
    renderMomentum(st.model);
    renderRanking();
    $('archiveBadge').textContent = st.model.finished ? t('spectator.finished') : 'LIVE';
    $('awayName').textContent = 'AWAY';
    $('homeName').textContent = 'HOME';
    $('timelineSet').textContent =
      st.model.currentSet == null
        ? t('spectator.noMatchThread')
        : t('spectator.setThread', { set: st.model.currentSet });
    $('timelineOrder').textContent =
      v.p.order === 'oldestFirst' ? t('spectator.orderOldNew') : t('spectator.orderNewOld');
    document.querySelectorAll('[data-order],[data-graph-order]').forEach(function (b) {
      var choice = b.dataset.order || b.dataset.graphOrder;
      b.classList.toggle('active', choice === v.p.order);
      b.setAttribute('aria-pressed', choice === v.p.order ? 'true' : 'false');
    });
    document.querySelectorAll('[data-window-size]').forEach(function (select) {
      select.value = v.p.size;
    });
    $('timelineList').innerHTML = v.rows
      .map(function (r) {
        return renderRow(r, last && r.id === last.id, v.scale, v.maxGap, v.p.order);
      })
      .join('');
    requestAnimationFrame(function () {
      var board = document.querySelector('.timeline-board'),
        card = board && board.querySelector('.event-card.home');
      if (!board || !card || board.scrollWidth <= board.clientWidth || board.scrollLeft > 1) return;
      var boardBox = board.getBoundingClientRect(),
        cardBox = card.getBoundingClientRect();
      board.scrollLeft = Math.max(0, cardBox.left - boardBox.left + board.scrollLeft - 20);
    });
    $('timelineEmpty').hidden = st.model.rallies.length !== 0;
    $('timelineEmpty').textContent = st.model.noMatch ? t('spectator.noMatchLoaded') : t('spectator.setNotStarted');
    $('timelineWarning').hidden = !st.model.warnings.length;
    $('timelineWarning').textContent = st.model.warnings.join(' ');
    renderGraphs(v);
  }
  function activate(name) {
    document.querySelectorAll('[data-tab]').forEach(function (b) {
      var on = b.dataset.tab === name;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('[data-panel]').forEach(function (p) {
      p.hidden = p.dataset.panel !== name;
    });
    location.hash = name;
    if (name === 'live-graph' && st.model)
      requestAnimationFrame(function () {
        renderGraphs(visibleRows());
      });
    if (name === 'ranking') renderRanking();
  }
  function setArchive(d) {
    var v = VolleyStatsAdapter.validate(d);
    if (!v.valid) throw new Error(v.errors.join(' '));
    st.raw = d;
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(d));
    sessionStorage.setItem(window.VolleyDomain.STORAGE.analysisReplay, JSON.stringify(d));
    st.model = build(d, null);
    selectedSetNumber = st.model.currentSet;
    render();
    return st.model;
  }
  function fatal(message) {
    $('spectatorApp').hidden = true;
    $('fatal').hidden = false;
    $('fatalText').textContent = message;
  }
  function init() {
    try {
      st.raw = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || 'null');
      selectedSetNumber = null;
      st.model = st.raw ? build(st.raw, null) : emptyModel();
      selectedSetNumber = st.model.currentSet;
      render();
    } catch (e) {
      fatal(e.message);
      return;
    }
    document.querySelectorAll('[data-tab]').forEach(function (b) {
      b.addEventListener('click', function () {
        activate(b.dataset.tab);
      });
    });
    document.querySelectorAll('[data-order],[data-graph-order]').forEach(function (b) {
      b.addEventListener('click', function () {
        localStorage.setItem(ORDER_KEY, b.dataset.order || b.dataset.graphOrder);
        render();
      });
    });
    document.querySelectorAll('[data-window-size]').forEach(function (select) {
      select.addEventListener('change', function () {
        localStorage.setItem(WINDOW_KEY, this.value);
        render();
      });
    });
    $('rankingView').addEventListener('change', renderRanking);
    $('rankingCategory').addEventListener('change', renderRanking);
    $('evolutionSet').addEventListener('change', function () {
      if (!st.raw) return;
      selectedSetNumber = num(this.value, st.model.liveSet);
      st.evolutionBrowsing = false;
      st.model = build(st.raw, selectedSetNumber);
      render();
    });
    $('returnToLive').addEventListener('click', function () {
      if (!st.raw) return;
      selectedSetNumber = st.model.liveSet;
      st.evolutionBrowsing = false;
      st.model = build(st.raw, selectedSetNumber);
      render();
      var activePanel = document.querySelector('[data-panel]:not([hidden])');
      if (activePanel)
        activePanel.scrollIntoView({
          block: 'start',
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        });
    });
    $('graphContent').addEventListener(
      'scroll',
      function () {
        if (st.model.finished || st.model.currentSet !== st.model.liveSet) return;
        var p = prefs(),
          latestEdge = p.order === 'oldestFirst' ? this.scrollWidth - this.clientWidth : 0;
        st.evolutionBrowsing = Math.abs(this.scrollLeft - latestEdge) > 8;
        $('returnLive').hidden = !st.evolutionBrowsing;
      },
      { passive: true }
    );
    $('returnLive').addEventListener('click', function () {
      st.evolutionBrowsing = false;
      var p = prefs(),
        scroll = $('graphContent');
      scroll.scrollTo({
        left: p.order === 'oldestFirst' ? scroll.scrollWidth : 0,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
      this.hidden = true;
    });
    window.addEventListener('storage', function (e) {
      if (e.key === ARCHIVE_KEY) {
        try {
          st.raw = e.newValue ? JSON.parse(e.newValue) : null;
          st.model = st.raw ? build(st.raw, selectedSetNumber) : emptyModel();
          render();
        } catch (x) {
          fatal(x.message);
        }
      }
    });
    activate(
      location.hash === '#live-score'
        ? 'live-score'
        : location.hash === '#live-graph'
          ? 'live-graph'
          : location.hash === '#ranking'
            ? 'ranking'
            : 'live-timeline'
    );
  }

  window.VolleySpectator = {
    buildViewModel: build,
    setArchive: setArchive,
    refresh: function () {
      st.model = st.raw ? build(st.raw, selectedSetNumber) : emptyModel();
      render();
    },
    getModel: function () {
      return st.model;
    },
    visibleRows: visibleRows,
    computeMomentum: computeMomentum,
    momentumView: momentumView,
    rankingSource: rankingSource,
    rankingRows: rankingRows,
    monogram: monogram,
    config: momentumCfg,
  };
  init();
})();
