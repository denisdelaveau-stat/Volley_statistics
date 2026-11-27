/* VolleyLive Coach View controller: render, open/close, event wiring and the public window.VolleyCoach API. Views live in js/coach-*.js. */
(function () {
  'use strict';
  var P = window.VolleyCoachParts;
  if (!P) return;
  var screen = P.screen,
    C = P.C,
    num = P.num,
    load = P.load,
    buildRallies = P.buildRallies,
    metrics = P.metrics,
    renderEmpty = P.renderEmpty,
    renderLiveCourt = P.renderLiveCourt,
    focusNavigate = P.focusNavigate,
    renderEmptyPlayerFocus = P.renderEmptyPlayerFocus,
    renderPlayerFocus = P.renderPlayerFocus,
    renderOverview = P.renderOverview,
    renderRotations = P.renderRotations,
    renderPlayers = P.renderPlayers,
    currentPlayerStats = P.currentPlayerStats,
    actionLabel = P.actionLabel,
    renderDetail = P.renderDetail,
    KR = P.KR,
    KRS = P.KRS,
    KU = P.KU,
    content = P.content;
  function updateShell() {
    var immersive = C.view === 'live-court' || C.view === 'player-focus';
    screen.classList.toggle('coach-empty-state', !!C.data.empty);
    screen.classList.toggle('coach-live-mode', immersive);
    screen.querySelectorAll('[data-coach-tab]').forEach(function (b) {
      if (b.dataset.coachTab === 'player-focus') b.hidden = C.view !== 'player-focus';
      var active = b.dataset.coachTab === C.view || (C.view === 'detail' && b.dataset.coachTab === 'players');
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    var lb = document.getElementById('coachLiveLabel');
    if (lb)
      lb.textContent = C.data.empty
        ? 'AUCUN MATCH'
        : C.data.replay
          ? 'REPLAY · MATCH'
          : C.data.explicitContext
            ? 'V2.1 · MATCH'
            : 'LIVE · MATCH';
  }
  function render() {
    C.data = load();
    var token = C.data.empty ? 'empty' : C.data.replay ? 'replay' : C.data.sourceFormat;
    if (C.sourceToken !== token) {
      C.sourceToken = token;
      C.period = 'set';
      C.phase = 'all';
      C.rotation = null;
      C.playerScope = 'court';
      C.role = 'all';
      C.player = null;
      C.skill = 'summary';
    }
    if (!C.data.rallies) C.data.rallies = buildRallies(C.data.match, C.data.events);
    updateShell();
    if (C.data.empty) {
      if (C.view === 'live-court') renderLiveCourt();
      else if (C.view === 'player-focus') renderEmptyPlayerFocus();
      else renderEmpty();
      return;
    }
    if (C.view === 'overview') renderOverview();
    else if (C.view === 'live-court') renderLiveCourt();
    else if (C.view === 'rotations') renderRotations();
    else if (C.view === 'players') renderPlayers();
    else if (C.view === 'player-focus') renderPlayerFocus();
    else renderDetail();
  }
  function focusHeading() {
    setTimeout(function () {
      var h = content.querySelector('.coach-title');
      if (h) h.focus();
    }, 0);
  }
  function openCoach() {
    C.data = load();
    if (!C.data.rallies) C.data.rallies = buildRallies(C.data.match, C.data.events);
    [
      'homeScreen',
      'setupCaptureScreen',
      'insightsScreen',
      'matchHubScreen',
      'matchLibraryScreen',
      'setupScreen',
      'teamsScreen',
      'settingsScreen',
    ].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.hidden = true;
    });
    screen.hidden = false;
    C.view = 'overview';
    render();
    screen.scrollTop = 0;
    focusHeading();
  }
  function closeCoach() {
    screen.hidden = true;
    var target =
      document.getElementById(screen.dataset.returnScreen || 'insightsScreen') || document.getElementById('homeScreen');
    target.hidden = false;
    var focus = document.getElementById(
      target.id === 'matchLibraryScreen'
        ? 'matchLibraryBack'
        : target.id === 'insightsScreen'
          ? 'insightsCoach'
          : 'homeInsights'
    );
    if (focus) focus.focus();
  }
  var coachFileInput = document.createElement('input');
  coachFileInput.type = 'file';
  coachFileInput.accept = '.json,application/json';
  coachFileInput.hidden = true;
  coachFileInput.id = 'coachFileInput';
  document.body.appendChild(coachFileInput);
  coachFileInput.addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var raw = JSON.parse(reader.result),
          check = window.VolleyStatsAdapter.validate(raw);
        if (!check.valid) throw new Error(check.errors.join(' '));
        sessionStorage.setItem(KR, JSON.stringify(raw));
        sessionStorage.setItem(KRS, file.name);
        sessionStorage.removeItem(KU);
        C.view = 'overview';
        C.sourceToken = null;
        render();
      } catch (error) {
        alert('Fichier invalide : ' + error.message);
      }
    };
    reader.readAsText(file);
  });
  var legacyCoach = document.getElementById('homeCoach');
  if (legacyCoach) legacyCoach.addEventListener('click', openCoach);
  document.getElementById('coachHome').addEventListener('click', closeCoach);
  window.VolleyCoach = { open: openCoach, close: closeCoach, render: render };
  screen.querySelector('.coach-nav').addEventListener('click', function (e) {
    var b = e.target.closest('[data-coach-tab]');
    if (!b) return;
    C.view = b.dataset.coachTab;
    render();
    screen.scrollTop = 0;
    focusHeading();
  });
  content.addEventListener('click', function (e) {
    var b = e.target.closest('button,[data-player]');
    if (!b) return;
    if (b.dataset.livePlayer !== undefined) {
      C.player = b.dataset.livePlayer;
      C.focusOrigin = 'live-court';
      C.view = 'player-focus';
      history.pushState({ volleyCoachFocus: true }, '', location.href.split('#')[0] + '#player-focus');
      C.detailHistory = true;
      render();
      screen.scrollTop = 0;
      return;
    }
    if (b.dataset.focusCourt !== undefined) {
      C.view = 'live-court';
      render();
      screen.scrollTop = 0;
      return;
    }
    if (b.dataset.focusPrev !== undefined) {
      focusNavigate(-1);
      return;
    }
    if (b.dataset.focusNext !== undefined) {
      focusNavigate(1);
      return;
    }
    if (b.dataset.coachLoadFile !== undefined) {
      coachFileInput.value = '';
      coachFileInput.click();
      return;
    }
    if (b.dataset.coachLive !== undefined && !b.disabled) {
      sessionStorage.removeItem(KR);
      sessionStorage.removeItem(KRS);
      sessionStorage.removeItem(KU);
      C.view = 'overview';
      C.sourceToken = null;
      render();
      return;
    }
    if (b.dataset.coachUnload !== undefined) {
      sessionStorage.removeItem(KR);
      sessionStorage.removeItem(KRS);
      sessionStorage.setItem(KU, '1');
      C.view = 'overview';
      C.sourceToken = null;
      render();
      return;
    }
    if (b.dataset.emptyDetail !== undefined) {
      C.focusOrigin = 'players';
      C.view = 'player-focus';
      render();
      return;
    }
    if (b.dataset.emptyPlayers !== undefined) {
      C.view = 'players';
      render();
      return;
    }
    if (b.dataset.period) {
      C.period = b.dataset.period;
      render();
      return;
    }
    if (b.dataset.coachGo) {
      C.view = b.dataset.coachGo;
      render();
      screen.scrollTop = 0;
      focusHeading();
      return;
    }
    if (b.dataset.phase) {
      C.phase = b.dataset.phase;
      render();
      return;
    }
    if (b.dataset.rotation) {
      C.rotation = b.dataset.rotation;
      render();
      return;
    }
    if (b.dataset.playerScope) {
      C.playerScope = b.dataset.playerScope;
      render();
      return;
    }
    if (b.dataset.role) {
      C.role = b.dataset.role;
      render();
      return;
    }
    if (b.matches('tr[data-player]')) {
      C.player = +b.dataset.player;
      render();
      return;
    }
    if (b.id === 'playerDetailCta') {
      if (!C.player) {
        b.disabled = true;
        b.title = 'Sélectionnez un joueur pour voir le détail';
        return;
      }
      b.classList.add('loading');
      b.disabled = true;
      b.setAttribute('aria-busy', 'true');
      var old = b.querySelector('span:nth-child(2)').textContent;
      b.querySelector('span:nth-child(2)').textContent = 'Ouverture du détail joueur';
      setTimeout(function () {
        try {
          C.focusOrigin = 'players';
          C.view = 'player-focus';
          history.pushState({ volleyCoachFocus: true }, '', location.href.split('#')[0] + '#player-focus');
          C.detailHistory = true;
          render();
          screen.scrollTop = 0;
        } catch (err) {
          b.disabled = false;
          b.classList.remove('loading');
          b.removeAttribute('aria-busy');
          b.querySelector('span:nth-child(2)').textContent = old;
          b.title = 'Impossible d’ouvrir PLAYER FOCUS. Réessayez.';
        }
      }, 90);
      return;
    }
    if (b.hasAttribute('data-detail-back')) {
      if (C.detailHistory) {
        C.detailHistory = false;
        history.back();
      } else {
        C.view = 'players';
        render();
        focusHeading();
      }
      return;
    }
    if (b.dataset.skill) {
      C.skill = b.dataset.skill;
      render();
      return;
    }
    if (b.hasAttribute('data-all-actions')) {
      var p = currentPlayerStats(),
        msg = p.events.length
          ? p.events
              .map(function (x) {
                return 'Set ' + (x.set || 1) + ' · ' + num(x.scoreA) + '–' + num(x.scoreB) + ' · ' + actionLabel(x);
              })
              .join('\n')
          : 'Aucune action enregistrée.';
      alert(msg);
    }
  });
  content.addEventListener('keydown', function (e) {
    var r = e.target.closest && e.target.closest('tr[data-player]');
    if (r && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      C.player = +r.dataset.player;
      render();
    }
  });
  window.addEventListener('popstate', function () {
    if (!screen.hidden && (C.view === 'detail' || C.view === 'player-focus')) {
      C.detailHistory = false;
      C.view = C.focusOrigin || 'players';
      render();
      focusHeading();
    }
  });
  P.render = render;
  window.VolleyCoach = {
    open: openCoach,
    close: closeCoach,
    render: render,
    buildRallies: buildRallies,
    metrics: metrics,
  };
})();
