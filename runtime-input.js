/* VolleyLive capture input: FOCUS / Matrix Full / FLOW modes, undo and substitutions.
   Spec: docs/specs/UI-CAPTURE.md, docs/specs/UI-SUBS.md. */
(function () {
  'use strict';
  var VC = window.VolleyCapture,
    M = VC && VC.match,
    panel = document.getElementById('capturePanel');
  if (!M || !VC.commit || !panel) return;
  var t = window.VolleyI18n.t;
  var SETTINGS_KEY = window.VolleyDomain.STORAGE.runtimeInputPreferences,
    EVENTS_KEY = window.VolleyDomain.STORAGE.captureEvents;
  var MODES = ['FOCUS', 'SPEED', 'FLOW', 'GAMEPAD'];
  var FIT_MODES = ['FOCUS', 'SPEED', 'FLOW', 'GAMEPAD'];
  var ACTIONS = [
    { id: 'service', code: 'SERVE', label: t('action.service'), family: 'serve' },
    { id: 'reception', code: 'RECEPTION', label: t('action.reception'), family: 'build' },
    { id: 'set', code: 'SET', label: t('action.set'), family: 'build' },
    { id: 'attack', code: 'ATTACK', label: t('action.attack'), family: 'offence' },
    { id: 'block', code: 'BLOCK', label: t('action.block'), family: 'offence' },
    { id: 'defense', code: 'DEFENCE', label: t('action.defense'), family: 'defence' },
    { id: 'freeball', code: 'RELANCE', label: t('action.freeball'), family: 'defence', full: true },
  ];
  var FOCUS_ACTION_ORDER = ['service', 'block', 'set', 'reception', 'attack', 'defense', 'freeball'];
  var SPEED_ACTION_ORDER = ['service', 'reception', 'block', 'attack', 'set', 'defense', 'freeball'];
  var RESULTS = [
    { id: 'point', code: 'POSITIVE', label: t('result.point'), css: 'positive', symbol: '+' },
    { id: 'neutral', code: 'NEUTRAL', label: t('result.neutral'), css: 'neutral', symbol: '−' },
    { id: 'error', code: 'ERROR', label: t('result.error'), css: 'error', symbol: '×' },
  ];
  var PREFERRED = {
    opp: ['service', 'attack', 'block'],
    mb: ['service', 'attack', 'block'],
    oh: ['service', 'reception', 'attack'],
    libero: ['reception', 'defense', 'freeball'],
    setter: ['service', 'set', 'defense'],
  };
  var ROLE_LABEL = window.VolleyDomain.ROLE_CODES;
  var state = {
    mode: 'FOCUS',
    stage: 'player',
    author: null,
    action: null,
    pending: false,
    lockedUntil: 0,
    error: '',
    feedback: '',
    matrixFlash: '',
  };
  // Substitution sheet (FIVB Rule 15, js/index-substitution-rules.js): out = player chosen to leave, error = refusal.
  var Subs = window.VolleySubstitutions;
  var subState = { out: null, error: '', unable: false };
  var prefs = readPrefs();
  state.mode = prefs.runtimeMode;
  document.documentElement.classList.add('runtime-capture-active');
  document.documentElement.setAttribute('data-runtime-mode', state.mode);

  var esc = window.VolleyDom.esc;
  function readObject(key, fallback) {
    try {
      var value = JSON.parse(localStorage.getItem(key) || 'null');
      return value && typeof value === 'object' ? value : fallback;
    } catch (error) {
      return fallback;
    }
  }
  function writeObject(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function defaultMode() {
    return window.matchMedia && window.matchMedia('(max-width:620px)').matches ? 'FOCUS' : 'SPEED';
  }
  function readPrefs() {
    var raw = readObject(SETTINGS_KEY, {}),
      changed = false;
    if (MODES.indexOf(raw.runtimeMode) < 0) {
      raw.runtimeMode = defaultMode();
      changed = true;
    }
    if (typeof raw.runtimeHighlights !== 'boolean') {
      raw.runtimeHighlights = true;
      changed = true;
    }
    if (typeof raw.runtimeHaptics !== 'boolean') {
      raw.runtimeHaptics = false;
      changed = true;
    }
    if (['horizontal-right', 'horizontal-left'].indexOf(raw.runtimeMatrixHorizontalLayout) < 0) {
      raw.runtimeMatrixHorizontalLayout = 'horizontal-right';
      changed = true;
    }
    if (['vertical-down', 'vertical-up'].indexOf(raw.runtimeMatrixVerticalLayout) < 0) {
      raw.runtimeMatrixVerticalLayout = 'vertical-down';
      changed = true;
    }
    if (changed) writeObject(SETTINGS_KEY, raw);
    return raw;
  }
  function savePrefs(next) {
    var raw = readObject(SETTINGS_KEY, {});
    Object.keys(next).forEach(function (k) {
      raw[k] = next[k];
    });
    writeObject(SETTINGS_KEY, raw);
    prefs = readPrefs();
  }
  function events() {
    var list = readObject(EVENTS_KEY, []);
    return Array.isArray(list) ? list : [];
  }
  function currentSetEvents() {
    return events().filter(function (e) {
      return Number(e.set || e.setNumber || 1) === Number(M.currentSet || 1);
    });
  }
  function player(number) {
    var list = (M.team && M.team.roster) || [];
    for (var i = 0; i < list.length; i++) if (String(list[i].number) === String(number)) return list[i];
    return null;
  }
  function role(playerInfo) {
    var value = String((playerInfo && playerInfo.position) || '').toLowerCase();
    return (
      {
        set: 'setter',
        setter: 'setter',
        lib: 'libero',
        libero: 'libero',
        opposite: 'opp',
        opp: 'opp',
        outside: 'oh',
        oh: 'oh',
        middle: 'mb',
        mb: 'mb',
      }[value] || value
    );
  }
  function authorRole() {
    return state.author === 'A' ? 'opponent' : role(player(state.author));
  }
  function isPreferred(actionId) {
    return !!(
      state.author &&
      state.author !== 'A' &&
      prefs.runtimeHighlights &&
      (PREFERRED[authorRole()] || []).indexOf(actionId) > -1
    );
  }
  var MATRIX_PREFERRED = {
    oh: ['reception', 'attack'],
    opp: ['attack', 'block'],
    mb: ['block', 'attack'],
    setter: ['set', 'service'],
    libero: ['reception', 'defense'],
  };
  function isMatrixPreferred(actionId) {
    return !!(
      state.author &&
      state.author !== 'A' &&
      prefs.runtimeHighlights &&
      (MATRIX_PREFERRED[authorRole()] || []).indexOf(actionId) > -1
    );
  }
  function isPortraitOrientation() {
    return !!(window.matchMedia && window.matchMedia('(orientation: portrait)').matches);
  }
  function matrixLayoutValue() {
    return isPortraitOrientation()
      ? prefs.runtimeMatrixVerticalLayout
      : prefs.runtimeMatrixHorizontalLayout;
  }
  function setMatrixLayout(value) {
    var key,
      valid = ['horizontal-right', 'horizontal-left', 'vertical-down', 'vertical-up'];
    if (valid.indexOf(value) < 0) return;
    key = value.indexOf('horizontal-') === 0 ? 'runtimeMatrixHorizontalLayout' : 'runtimeMatrixVerticalLayout';
    savePrefs((function () {
      var update = {};
      update[key] = value;
      return update;
    })());
    render();
    refreshPrefs();
  }
  function matrixLayoutOptions() {
    var portrait = isPortraitOrientation(),
      options = portrait
        ? [
            { value: 'vertical-down', label: t('runtime.matrixVerticalDown') },
            { value: 'vertical-up', label: t('runtime.matrixVerticalUp') },
          ]
        : [
            { value: 'horizontal-right', label: t('runtime.matrixHorizontalRight') },
            { value: 'horizontal-left', label: t('runtime.matrixHorizontalLeft') },
          ];
    return (
      '<fieldset class="runtime-matrix-layout-options"><legend>' +
      esc(t('runtime.matrixLayoutTitle')) +
      '</legend><div>' +
      options.map(function (option) {
        return (
          '<button type="button" data-matrix-layout="' +
          option.value +
          '" class="' +
          (matrixLayoutValue() === option.value ? 'active' : '') +
          '" aria-pressed="' +
          (matrixLayoutValue() === option.value ? 'true' : 'false') +
          '">' +
          esc(option.label) +
          '</button>'
        );
      }).join('') +
      '</div></fieldset>'
    );
  }
  function modeLabel(mode) {
    return mode === 'SPEED' ? 'BOARD' : mode === 'FLOW' ? 'POKER' : mode;
  }
  function actionMeta(id) {
    for (var i = 0; i < ACTIONS.length; i++) if (ACTIONS[i].id === id) return ACTIONS[i];
    return null;
  }
  function resultMeta(id) {
    for (var i = 0; i < RESULTS.length; i++) if (RESULTS[i].id === id) return RESULTS[i];
    return null;
  }
  function authorText() {
    if (state.author === 'A') return t('runtime.opponentAuthor');
    var p = player(state.author);
    return p
      ? '#' + p.number + ' · ' + (ROLE_LABEL[role(p)] || String(role(p) || '').toUpperCase())
      : '#' + state.author;
  }
  function scoreNow() {
    return window.VolleySets ? window.VolleySets.score(events(), M.currentSet || 1) : { a: 0, b: 0 };
  }
  function pulseMatrixScore() {
    var score = document.getElementById('liveScore');
    if (!score) return;
    score.classList.remove('runtime-matrix-score-pulse');
    void score.offsetWidth;
    score.classList.add('runtime-matrix-score-pulse');
    setTimeout(function () {
      score.classList.remove('runtime-matrix-score-pulse');
    }, 320);
  }
  function courtPlayers() {
    var out = [],
      setEvents = currentSetEvents();
    if (window.VolleyRotation && M.startingRotation) {
      var replay = window.VolleyRotation.replay(M, setEvents),
        court = window.VolleyRotation.court(M, replay.rot, replay),
        positions = ['p4', 'p3', 'p2', 'p5', 'p6', 'p1'];
      positions.forEach(function (pos) {
        var n = court[pos] && court[pos].num;
        if (n != null && out.indexOf(String(n)) < 0) out.push(String(n));
      });
    }
    if (out.length < 6) {
      var fallback = (M.team && M.team.roster) || [];
      fallback
        .filter(function (p) {
          return p.present !== false;
        })
        .forEach(function (p) {
          if (out.length < 6 && out.indexOf(String(p.number)) < 0) out.push(String(p.number));
        });
    }
    return out.slice(0, 6);
  }
  function matrixCourtPlayers() {
    var replay = window.VolleyRotation && window.VolleyRotation.replay
        ? window.VolleyRotation.replay(M, [])
        : null,
      court = replay && window.VolleyRotation.court ? window.VolleyRotation.court(M, replay.rot, replay) : null,
      slots = ['p4', 'p3', 'p2', 'p5', 'p6', 'p1'].map(function (position) {
        return court && court[position] ? court[position].num : null;
      });
    if (slots.some(function (number) { return number == null; })) return courtPlayers();
    currentSetEvents().forEach(function (event) {
      if (
        (event.type === 'SUBSTITUTION' || event.eventType === 'SUBSTITUTION' || event.action === 'substitution') &&
        event.playerOut != null &&
        event.playerIn != null
      ) {
        var index = slots.findIndex(function (number) {
          return String(number) === String(event.playerOut);
        });
        if (index >= 0) slots[index] = event.playerIn;
      }
    });
    return slots.slice(0, 6);
  }
  function playerButton(number, court) {
    var p = player(number) || { number: number, name: '', position: '' },
      r = role(p),
      selected = String(state.author) === String(number);
    return (
      '<button type="button" class="runtime-player runtime-role-' +
      esc(r) +
      (selected ? ' selected' : '') +
      '" data-runtime-author="' +
      esc(number) +
      '" aria-pressed="' +
      (selected ? 'true' : 'false') +
      '" aria-label="' +
      esc(t('runtime.playerLabel')) +
      ' ' +
      esc(number) +
      ' ' +
      esc(ROLE_LABEL[r] || r) +
      '"><span class="number">' +
      esc(number) +
      '</span><span class="role">' +
      esc(ROLE_LABEL[r] || String(r || '').toUpperCase()) +
      '</span>' +
      (court ? '' : '<span class="name">' + esc(p.name || '') + '</span>') +
      '</button>'
    );
  }
  function opponentButton() {
    var selected = state.author === 'A';
    return (
      '<button type="button" class="runtime-player runtime-opponent-tile' +
      (selected ? ' selected' : '') +
      '" data-runtime-author="A" aria-pressed="' +
      (selected ? 'true' : 'false') +
      '" aria-label="' +
      esc(t('runtime.opponent')) +
      '"><span class="number">A</span><span class="role">' +
      esc(t('runtime.opponent')) +
      '</span></button>'
    );
  }
  function matrixPlayerButton(number) {
    var p = player(number) || { number: number, position: '' },
      r = role(p),
      selected = String(state.author) === String(number);
    return (
      '<button type="button" class="runtime-matrix-player runtime-role-' +
      esc(r) +
      (selected ? ' selected' : '') +
      '" data-runtime-author="' +
      esc(number) +
      '" aria-pressed="' +
      (selected ? 'true' : 'false') +
      '" aria-label="' +
      esc(t('runtime.playerLabel')) +
      ' ' +
      esc(number) +
      ' ' +
      esc(ROLE_LABEL[r] || r) +
      '"><b>' +
      esc(number) +
      '</b></button>'
    );
  }
  function plainPlayers() {
    return (
      '<div class="runtime-panel is-focus"><div class="runtime-player-grid">' +
      courtPlayers()
        .map(function (n) {
          return playerButton(n, false);
        })
        .join('') +
      opponentButton() +
      '</div>' +
      '</div>'
    );
  }
  function authorChip(withAction) {
    var text = state.author ? authorText() : t('runtime.noAuthor');
    if (withAction && state.action) {
      var a = actionMeta(state.action);
      text += ' · ' + (a ? a.label : state.action);
    }
    return '<div class="runtime-author-chip"><span>' + esc(text) + '</span></div>';
  }
  function inlineTools(canBack) {
    return (
      '<div class="runtime-inline-tools">' +
      (canBack ? '<button type="button" data-runtime-back>' + esc(t('runtime.back')) + '</button>' : '') +
      '<button type="button" data-runtime-change>' +
      esc(t('runtime.changeAuthor')) +
      '</button></div>'
    );
  }
  function actionGrid(flow, order) {
    var actions = order
      ? order.map(function (id) {
          return ACTIONS.filter(function (action) { return action.id === id; })[0];
        })
      : ACTIONS;
    return (
      '<div class="runtime-action-grid">' +
      actions.map(function (a) {
        var pref = isPreferred(a.id),
          secondary = state.author && state.author !== 'A' && prefs.runtimeHighlights && !pref,
          disabled = flow && !state.author,
          selected = state.action === a.id;
        return (
          '<button type="button" class="runtime-action family-' +
          a.family +
          (a.full ? ' full' : '') +
          (pref ? ' preferred' : '') +
          (secondary ? ' secondary' : '') +
          (selected ? ' selected' : '') +
          '" data-runtime-action="' +
          a.id +
          '"' +
          (disabled ? ' disabled' : '') +
          ' aria-pressed="' +
          (selected ? 'true' : 'false') +
          '">' +
          esc(a.label) +
          '</button>'
        );
      }).join('') +
      '</div>'
    );
  }
  function resultGrid(flow) {
    var enabled = !!(state.author && state.action) && !state.pending && Date.now() >= state.lockedUntil;
    return (
      '<div class="runtime-result-grid">' +
      RESULTS.map(function (r) {
        return (
          '<button type="button" class="runtime-result ' +
          r.css +
          '" data-runtime-result="' +
          r.id +
          '"' +
          (enabled ? '' : ' disabled') +
          '>' +
          esc(r.label) +
          '</button>'
        );
      }).join('') +
      '</div><p class="runtime-immediate">' +
      esc(t('runtime.immediate')) +
      '</p>'
    );
  }
  function focusLayout() {
    var playerStep = state.stage === 'player',
      resultStep = state.stage === 'result',
      step = playerStep ? t('runtime.step1') : resultStep ? t('runtime.step3') : t('runtime.step2'),
      question = playerStep
      ? ''
        : resultStep
          ? t('runtime.whichResult')
          : t('runtime.whichAction'),
      context = playerStep
        ? '<div class="runtime-focus-context" aria-hidden="true"></div>'
        : '<div class="runtime-focus-context">' +
          authorChip(resultStep) +
          inlineTools(resultStep) +
          '</div>',
      content = playerStep
        ? plainPlayers()
        : '<div class="runtime-panel">' +
          (resultStep ? resultGrid(false) : actionGrid(false, FOCUS_ACTION_ORDER)) +
          '</div>';
    return (
      '<section class="runtime-stage runtime-focus-stage' +
      (resultStep ? ' runtime-focus-status' : '') +
      '">' +
      context +
      '<h2 class="runtime-question"><span class="runtime-kicker">' +
      esc(step) +
      '</span>' +
      esc(question) +
      '</h2>' +
      content +
      '</section>'
    );
  }
  function matrixLayout() {
    var actions = SPEED_ACTION_ORDER.map(actionMeta),
      resultOrder = ['error', 'neutral', 'point'];
    return (
      '<section class="runtime-stage runtime-matrix runtime-matrix-' +
      matrixLayoutValue() +
      '" aria-label="' +
      esc(t('runtime.matrixTitle')) +
      '">' +
      '<section class="runtime-matrix-section runtime-matrix-player-section"><h2><span>1</span> ' +
      esc(t('runtime.matrixSectionPlayers')) +
      '</h2><div class="runtime-matrix-player-grid">' +
      matrixCourtPlayers().map(matrixPlayerButton).join('') +
      '<button type="button" class="runtime-matrix-opponent' +
      (state.author === 'A' ? ' selected' : '') +
      '" data-runtime-author="A" aria-pressed="' +
      (state.author === 'A' ? 'true' : 'false') +
      '" aria-label="' +
      esc(t('runtime.opponent')) +
      '">A</button></div></section>' +
      '<section class="runtime-matrix-section runtime-matrix-action-section"><h2><span>2</span> ' +
      esc(t('runtime.matrixSectionActions')) +
      '</h2><div class="runtime-matrix-action-grid">' +
      actions.map(function (action) {
        var selected = state.action === action.id;
        return (
          '<button type="button" class="runtime-matrix-action' +
          (isMatrixPreferred(action.id) ? ' preferred' : '') +
          (selected ? ' selected' : '') +
          '" data-runtime-action="' +
          action.id +
          '" aria-pressed="' +
          (selected ? 'true' : 'false') +
          '">' +
          esc(action.label) +
          '</button>'
        );
      }).join('') +
      '</div></section>' +
      '<section class="runtime-matrix-section runtime-matrix-status-section"><h2><span>3</span> ' +
      esc(t('runtime.matrixSectionStatus')) +
      '</h2><div class="runtime-matrix-status-grid">' +
      resultOrder.map(function (resultId) {
        var result = resultMeta(resultId),
          label = flowStatusLabel(resultId),
          icon = resultId === 'error' ? '✕' : resultId === 'neutral' ? '↻' : '✓',
          allowed = flowStatusAllowed(resultId) && !state.pending && Date.now() >= state.lockedUntil;
        return (
          '<button type="button" class="runtime-matrix-status ' +
          result.css +
          (state.matrixFlash === resultId ? ' matrix-flash' : '') +
          '" data-runtime-result="' +
          resultId +
          '"' +
          (allowed ? '' : ' disabled') +
          ' aria-label="' +
          esc(label) +
          '"><b>' +
          icon +
          '</b><span>' +
          esc(label) +
          '</span></button>'
        );
      }).join('') +
      '</div></section></section>'
    );
  }
  function flowLayout() {
    var players = courtPlayers();
    return (
      '<section class="runtime-stage runtime-flow-screen" aria-label="Manual action capture">' +
      '<div class="runtime-flow-last">' +
      esc(flowLastEvent()) +
      '</div><div class="runtime-flow-actions">' +
      '<div class="runtime-flow-action-grid">' +
      ACTIONS.map(function (action) {
        var selected = state.action === action.id;
        return (
          '<button type="button" class="runtime-flow-action' +
          (selected ? ' selected' : '') +
          (isPreferred(action.id) ? ' preferred' : '') +
          '" data-runtime-action="' +
          action.id +
          '" aria-pressed="' +
          (selected ? 'true' : 'false') +
          '">' +
          esc(action.label) +
          '</button>'
        );
      }).join('') +
      '<div class="runtime-flow-status-grid">' +
      RESULTS.map(function (result) {
        var allowed = flowStatusAllowed(result.id);
        return (
          '<button type="button" class="runtime-flow-status ' +
          result.css +
          '" data-runtime-result="' +
          result.id +
          '"' +
          (allowed && !state.pending && Date.now() >= state.lockedUntil ? '' : ' disabled') +
          ' aria-label="' +
          esc(flowStatusLabel(result.id)) +
          '">' +
          '<b>' +
          (result.id === 'point' ? '✓' : result.id === 'neutral' ? 'O' : '✕') +
          '</b><span>' +
          esc(flowStatusLabel(result.id)) +
          '</span></button>'
        );
      }).join('') +
      '</div></div><div class="runtime-flow-players">' +
      '<div class="runtime-flow-player-grid">' +
      players.map(function (number) {
        var p = player(number) || { number: number, position: '' };
        var selected = String(state.author) === String(number);
        var playerRole = role(p);
        return (
          '<button type="button" class="runtime-flow-player runtime-role-' +
          esc(playerRole) +
          (selected ? ' selected' : '') +
          '" data-runtime-author="' +
          esc(number) +
          '" aria-pressed="' +
          (selected ? 'true' : 'false') +
          '"><b>' +
          esc(number) +
          '</b></button>'
        );
      }).join('') +
      '<button type="button" class="runtime-flow-player runtime-flow-opponent' +
      (state.author === 'A' ? ' selected' : '') +
      '" data-runtime-author="A" aria-pressed="' +
      (state.author === 'A' ? 'true' : 'false') +
      '"><b>A</b></button>' +
      '</div></div></section>'
    );
  }
  function flowStatusAllowed(resultId) {
    if (!state.author) return false;
    if (state.author === 'A' && !state.action) return resultId !== 'neutral';
    if (!state.action) return false;
    if (resultId !== 'point') return true;
    return ['service', 'attack', 'block'].indexOf(state.action) >= 0;
  }
  function flowLastEvent() {
    var list = events(),
      event = list[list.length - 1];
    if (!event) return t('runtime.noEvent');
    if (event.type === 'SUBSTITUTION')
      return t('runtime.lastSubstitution', { in: event.playerIn, out: event.playerOut });
    var who =
        event.authorSide === 'AWAY' || event.player === 'A'
          ? 'A'
          : '#' + (event.playerNumber != null ? event.playerNumber : event.player),
    actionLabel = (actionMeta(event.action) || {}).label || '',
    action = actionLabel
      ? actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1).toLowerCase()
      : '',
      actionText = action ? ' · ' + action : '';
    return t('runtime.flowLastEvent', {
      who: who,
      action: actionText,
    status: flowStatusLabel(event.result),
    });
  }
  function flowStatusLabel(resultId) {
    return resultId === 'point'
    ? t('runtime.flowStatusPoint')
    : resultId === 'neutral'
      ? t('runtime.flowStatusContinue')
      : t('runtime.flowStatusError');
  }
  function gamepadLayout() {
    return (
      '<section class="runtime-stage runtime-gamepad-layout" aria-label="Saisie type manette">' +
      '<p class="gamepad-inline-last-action" role="status">' +
      esc(lastEvent()) +
      '</p><div class="gamepad-inline-toolbar"><button type="button" class="gamepad-inline-tool" data-runtime-undo' +
      (undoDisabled() ? ' disabled' : '') +
      '>↶ ' +
      esc(t('runtime.undo')) +
      '</button>' +
      (Subs
        ? '<button type="button" class="gamepad-inline-tool" data-runtime-sub-open aria-haspopup="dialog">⇄ ' +
          esc(t('subs.title')) +
          '</button>'
        : '') +
      '</div>' +
      '<div id="gamepadInlineView"></div>' +
      '</section>'
    );
  }
  function lastEvent() {
    var list = events(),
      e = list[list.length - 1];
    if (!e) return t('runtime.noEvent');
    if (e.type === 'SUBSTITUTION') return t('runtime.lastSubstitution', { in: e.playerIn, out: e.playerOut });
    var who =
        e.authorSide === 'AWAY' || e.player === 'A' ? 'A' : '#' + (e.playerNumber != null ? e.playerNumber : e.player),
      a = (actionMeta(e.action) || {}).label || e.actionCode || String(e.action || '').toUpperCase(),
      s =
        e.status === 'POSITIVE' || e.result === 'point'
          ? '+'
          : e.status === 'ERROR' || e.result === 'error'
            ? '×'
            : '−';
    return t('runtime.lastEvent', { who: who, action: a, result: s });
  }
  function undoDisabled() {
    if (state.mode === 'SPEED' && (state.author || state.action)) return false;
    return !(state.mode === 'SPEED' ? currentSetEvents().length : events().length);
  }
  function modes() {
    return (
      '<nav class="runtime-mode-tabs" aria-label="' +
      esc(t('runtime.modeLabel')) +
      '">' +
      MODES.map(function (m) {
        return (
          '<button type="button" data-runtime-mode="' +
          m +
          '" class="' +
          (state.mode === m ? 'active' : '') +
          '" aria-pressed="' +
          (state.mode === m ? 'true' : 'false') +
          '">' +
          modeLabel(m) +
          '</button>'
        );
      }).join('') +
      '</nav>'
    );
  }
  function rootHtml() {
    var body =
      state.mode === 'FOCUS'
        ? focusLayout()
        : state.mode === 'SPEED'
          ? matrixLayout()
          : state.mode === 'GAMEPAD'
            ? gamepadLayout()
            : flowLayout();
    var lastAction = state.mode === 'SPEED' ? flowLastEvent() : lastEvent();
    return (
      '<div class="runtime-shell" data-runtime-layout="' +
      state.mode +
      '">' +
      modes() +
      body +
      '<p class="runtime-error" role="alert">' +
      esc(state.error) +
      '</p><div class="runtime-footer"><div class="runtime-last"><b>' +
      esc(lastAction) +
      '</b></div>' +
      (Subs
        ? '<button type="button" class="runtime-sub-open" data-runtime-sub-open aria-haspopup="dialog">⇄ ' +
          esc(t('subs.title')) +
          '</button>'
        : '') +
      '<button type="button" class="runtime-undo" data-runtime-undo' +
      (undoDisabled() ? ' disabled' : '') +
      '>↶ ' +
      esc(t('runtime.undo')) +
      '</button></div><div class="runtime-feedback" id="runtimeFeedback" role="status" aria-live="polite">' +
      esc(state.feedback) +
      '</div></div>'
    );
  }
  function prefsHtml() {
    return (
      '<div class="runtime-prefs-card"><h2>' +
      esc(t('runtime.optionsTitle')) +
      '</h2><p>' +
      esc(t('runtime.optionsHint')) +
      '</p><div class="runtime-pref-modes">' +
      MODES.map(function (m) {
        return (
          '<button type="button" data-runtime-pref-mode="' +
          m +
          '" class="' +
          (state.mode === m ? 'active' : '') +
          '">' +
          modeLabel(m) +
          '</button>'
        );
      }).join('') +
      '</div>' +
      (state.mode === 'SPEED' ? matrixLayoutOptions() : '') +
      '<label class="runtime-switch"><span>' +
      esc(t('runtime.highlight')) +
      '</span><input type="checkbox" data-runtime-highlight' +
      (prefs.runtimeHighlights ? ' checked' : '') +
      '></label><label class="runtime-switch"><span>' +
      esc(t('runtime.haptics')) +
      '</span><input type="checkbox" data-runtime-haptic' +
      (prefs.runtimeHaptics ? ' checked' : '') +
      '></label><button type="button" class="runtime-prefs-close" data-runtime-close-options>' +
      esc(t('runtime.done')) +
      '</button></div>'
    );
  }
  function ensureStructure() {
    var steps = panel.querySelector('.steps');
    steps.innerHTML = '<div id="runtimeInputRoot"></div>';
    var head = panel.querySelector('.capture-head');
    if (!head.querySelector('.runtime-brand'))
      head.insertAdjacentHTML(
        'afterbegin',
        '<div class="runtime-brand"><span class="runtime-brand-ball">◉</span><span>VolleyLive</span></div>'
      );
    if (!head.querySelector('.runtime-head-meta'))
      head.insertAdjacentHTML(
        'beforeend',
        '<div class="runtime-head-meta"><span class="runtime-set">S' +
          esc(M.currentSet || 1) +
          '</span><button type="button" id="gamepadCaptureIndicator" class="gamepad-indicator" data-gamepad-indicator>🎮 No controller</button><button type="button" class="runtime-options-button" data-runtime-options aria-label="' +
          esc(t('runtime.optionsLabel')) +
          '">☰</button></div>'
      );
    var overlay = document.createElement('div');
    overlay.className = 'runtime-prefs';
    overlay.id = 'runtimePrefs';
    overlay.hidden = true;
    overlay.innerHTML = prefsHtml();
    document.body.appendChild(overlay);
    var subs = document.createElement('div');
    subs.className = 'runtime-prefs runtime-subs';
    subs.id = 'runtimeSubs';
    subs.hidden = true;
    document.body.appendChild(subs);
  }
  function render() {
    var root = document.getElementById('runtimeInputRoot');
    if (!root) return;
    document.documentElement.setAttribute('data-runtime-mode', state.mode);
    // Modes whose layout is fitted to the screen height (runtime-input.css, "Fit-to-screen capture layout").
    document.documentElement.classList.toggle('runtime-fit', FIT_MODES.indexOf(state.mode) >= 0);
    root.innerHTML = rootHtml();
    var setLabel = panel.querySelector('.runtime-set');
    if (setLabel)
      setLabel.textContent =
        state.mode === 'SPEED' ? t('runtime.matrixSet', { set: M.currentSet || 1 }) : 'S' + (M.currentSet || 1);
    if (state.mode === 'GAMEPAD' && window.VolleyGamepad) {
      window.VolleyGamepad.renderInlineCapture();
    }
    if (state.feedback) {
      var f = document.getElementById('runtimeFeedback');
      if (f) {
        f.classList.remove('show');
        void f.offsetWidth;
        f.classList.add('show');
      }
      state.feedback = '';
    }
  }
  function clear(toPlayer) {
    state.author = null;
    state.action = null;
    state.stage = toPlayer === false ? 'action' : 'player';
    state.error = '';
  }
  function setMode(mode, persist) {
    if (MODES.indexOf(mode) < 0 || state.pending) return;
    state.mode = mode;
    state.stage = !state.author ? 'player' : state.action ? 'result' : 'action';
    state.error = '';
    if (persist !== false) savePrefs({ runtimeMode: mode });
    render();
    refreshPrefs();
  }
  function refreshPrefs() {
    var overlay = document.getElementById('runtimePrefs');
    if (overlay) overlay.innerHTML = prefsHtml();
  }
  function chooseAuthor(value) {
    if (
      state.pending ||
      (state.mode !== 'FLOW' && state.mode !== 'SPEED' && Date.now() < state.lockedUntil)
    )
      return;
    if (state.mode === 'FLOW' || state.mode === 'SPEED') {
      state.author = String(state.author) === String(value) ? null : String(value);
      state.error = '';
      state.stage = state.action ? 'result' : 'action';
      render();
      return;
    }
    state.author = String(value);
    state.action = null;
    state.error = '';
    state.stage = 'action';
    render();
  }
  function chooseAction(value) {
    if (state.mode === 'FLOW' || state.mode === 'SPEED') {
      state.action = state.action === value ? null : value;
      state.error = '';
      state.stage = state.author && state.action ? 'result' : state.author ? 'action' : 'player';
      render();
      return;
    }
    if (!state.author) {
      state.error = t('runtime.errorNoAuthorFirst');
      render();
      return;
    }
    state.action = value;
    state.stage = 'result';
    state.error = '';
    render();
  }
  function goBack() {
    if (state.mode === 'FOCUS' || state.mode === 'SPEED') {
      state.action = null;
      state.stage = 'action';
      state.error = '';
      render();
    }
  }
  function changePlayer() {
    clear(true);
    render();
  }
  function uniqueEventId() {
    return 'evt_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
  }
  function patchCanonicalEvent(beforeScore, eventId, inputSource) {
    var list = events(),
      e = list[list.length - 1];
    if (!e) return null;
    var p = state.author === 'A' ? null : player(state.author),
      a = actionMeta(state.action),
      r = resultMeta(e.result),
      after = { home: Number(e.scoreA || 0), away: Number(e.scoreB || 0) };
    e.eventId = e.eventId || eventId;
    e.setNumber = Number(e.set || M.currentSet || 1);
    e.authorSide = state.author === 'A' ? 'AWAY' : 'HOME';
    e.playerId = p ? 'player_' + p.number : null;
    e.playerNumber = p ? Number(p.number) : null;
    e.playerRole = p ? ROLE_LABEL[role(p)] || String(role(p) || '').toUpperCase() : 'OPPONENT';
    e.actionCode = a ? a.code : state.action == null ? null : String(e.action || '').toUpperCase();
    e.status = r ? r.code : String(e.result || '').toUpperCase();
    e.inputSource = inputSource || 'touch';
    e.scoreBefore = { home: beforeScore.a, away: beforeScore.b };
    e.scoreAfter = after;
    e.inputMode = state.mode;
    e.schemaVersion = 'runtime-input-v1';
    writeObject(EVENTS_KEY, list);
    return e;
  }
  function haptic() {
    if (prefs.runtimeHaptics && navigator.vibrate)
      try {
        navigator.vibrate(18);
      } catch (error) {
        // Haptic feedback is optional (unsupported or blocked by the browser).
      }
  }
  function commit(result, inputSource) {
    if (state.pending || Date.now() < state.lockedUntil) return;
    if (!state.author) {
      state.error = t('runtime.errorNoAuthor');
      render();
      return;
    }
    var matrixMode = state.mode === 'SPEED',
      matrixOrFlow = matrixMode || state.mode === 'FLOW',
      opponentQuickResult =
        matrixOrFlow && state.author === 'A' && (result === 'point' || result === 'error');
    if (!state.action && !opponentQuickResult) {
      state.error = t('runtime.errorNoAction');
      render();
      return;
    }
    if (matrixOrFlow && !flowStatusAllowed(result)) return;
    if (!resultMeta(result)) {
      state.error = t('runtime.errorBadResult');
      render();
      return;
    }
    state.pending = true;
    state.error = '';
    var beforeCount = events().length,
      beforeScore = scoreNow(),
      eventId = uniqueEventId();
    VC.runtimeContext = { eventId: eventId, inputMode: state.mode, inputSource: inputSource || 'touch' };
    try {
      VC.commit(state.author, state.action, result);
    } catch (error) {
      state.pending = false;
      state.error = t('runtime.errorSave', { reason: (error && error.message) || t('runtime.unknownError') });
      render();
      return;
    } finally {
      VC.runtimeContext = null;
    }
    if (events().length !== beforeCount + 1) {
      state.pending = false;
      state.error = t('runtime.errorNotRecorded');
      render();
      return;
    }
    var committed = patchCanonicalEvent(beforeScore, eventId, inputSource || 'touch'),
      a = actionMeta(state.action),
      r = resultMeta(result);
    state.feedback = '✓ ' + authorText() + ' · ' + (a ? a.label : state.action) + ' ' + (r ? r.symbol : '');
    haptic();
    var afterScore = scoreNow();
    if (matrixMode && (afterScore.a !== beforeScore.a || afterScore.b !== beforeScore.b)) pulseMatrixScore();
    if (matrixMode) state.matrixFlash = result;
    state.lockedUntil = Date.now() + (state.mode === 'FLOW' ? 300 : 500);
    state.pending = false;
    clear(true);
    render();
    if (matrixMode)
      setTimeout(function () {
        state.matrixFlash = '';
        if (state.mode === 'SPEED') render();
      }, 150);
    setTimeout(render, 520);
    document.dispatchEvent(new CustomEvent('volleylive:runtime-event', { detail: { event: committed } }));
  }
  function undo() {
    if (state.pending) return;
    if ((state.mode === 'FLOW' || state.mode === 'SPEED') && (state.author || state.action)) {
      state.author = null;
      state.action = null;
      state.stage = 'player';
      state.error = '';
      render();
      return;
    }
    if (state.mode !== 'FLOW' && Date.now() < state.lockedUntil) return;
    if (typeof VC.deleteLastAction !== 'function') {
      state.error = t('runtime.errorUndoUnavailable');
      render();
      return;
    }
    var ok = VC.deleteLastAction();
    if (ok) {
      clear(true);
      state.feedback = t('runtime.undone');
      state.lockedUntil = Date.now() + 460;
      render();
      setTimeout(render, 480);
    } else {
      state.error = t('runtime.errorNothingToUndo');
      render();
    }
  }
  function openOptions() {
    var overlay = document.getElementById('runtimePrefs');
    refreshPrefs();
    overlay.hidden = false;
    var first = overlay.querySelector('button');
    if (first) first.focus();
  }
  function closeOptions() {
    var overlay = document.getElementById('runtimePrefs');
    overlay.hidden = true;
    var button = panel.querySelector('[data-runtime-options]');
    if (button) button.focus();
  }

  // ---- substitutions (FIVB Rule 15) ----
  function rotationState() {
    return window.VolleyRotation.replay(M, currentSetEvents());
  }
  // Keeps the stored type of a player number (numbers in the roster, strings in data attributes).
  function rosterValue(value) {
    var p = player(value);
    return p ? p.number : value;
  }
  function playerLabel(number) {
    var p = player(number) || { number: number, name: '', position: '' },
      r = role(p);
    return (
      '<span class="number">#' +
      esc(number) +
      '</span><span class="role">' +
      esc(ROLE_LABEL[r] || String(r || '').toUpperCase()) +
      '</span><span class="name">' +
      esc(p.name || '') +
      '</span>'
    );
  }
  function subsBlocked() {
    var su = window.VolleySets ? window.VolleySets.summary(M, events()) : null;
    if (su && (su.matchWinner || (su.current && su.current.winner))) return t('subs.blockedSetOver');
    if (Subs.rallyInProgress(currentSetEvents())) return t('subs.blockedRally');
    return '';
  }
  // Liberos (FIVB Rule 19): the acting libero may be replaced by the other libero between two rallies (19.3.2), or
  // declared unable to play (19.4: injury, illness, expulsion). Shown whenever a libero is acting.
  function liberoSwapBlock(setNo) {
    var sw = Subs.liberoSwap(M, setNo, currentSetEvents());
    if (sw.current == null) return '';
    return (
      '<div class="runtime-libero-swap"><p class="runtime-subs-step">' +
      esc(t('subs.liberoTitle', { libero: sw.current })) +
      '</p>' +
      (sw.candidates.length && sw.refusal ? '<p class="runtime-subs-warning">' + esc(t(sw.refusal)) + '</p>' : '') +
      (sw.candidates.length
        ? '<div class="runtime-sub-grid">' +
          sw.candidates
            .map(function (n) {
              return (
                '<button type="button" class="runtime-sub-player" data-libero-swap="' +
                esc(n) +
                '"' +
                (sw.refusal ? ' disabled' : '') +
                '>' +
                playerLabel(n) +
                '<small>' +
                esc(t('subs.liberoSwapFor', { out: sw.current })) +
                '</small></button>'
              );
            })
            .join('') +
          '</div>'
        : '') +
      '<button type="button" class="runtime-subs-back runtime-libero-unable-open" data-libero-unable-open>' +
      esc(t('subs.unableOpen', { libero: sw.current })) +
      '</button></div>'
    );
  }
  // Step shown after « Libéro indisponible »: the other libero takes over, or a player is re-designated (19.4).
  function liberoUnableStep(setNo) {
    var u = Subs.liberoUnable(M, setNo, currentSetEvents()),
      list = u.liberos.length ? u.liberos : u.players,
      attr = u.liberos.length ? 'data-libero-unable' : 'data-libero-redesignate',
      hint = u.liberos.length ? 'subs.unableTakeOver' : 'subs.redesignateHint';
    return (
      '<p class="runtime-subs-step">' +
      esc(t('subs.unableTitle', { libero: u.current })) +
      '</p><p class="runtime-subs-warning">' +
      esc(t('subs.unableWarning', { libero: u.current })) +
      '</p>' +
      (u.refusal
        ? '<p class="runtime-subs-warning">' + esc(t(u.refusal)) + '</p>'
        : '<div class="runtime-sub-grid">' +
          list
            .map(function (n) {
              return (
                '<button type="button" class="runtime-sub-player" ' +
                attr +
                '="' +
                esc(n) +
                '">' +
                playerLabel(n) +
                '<small>' +
                esc(t(hint)) +
                '</small></button>'
              );
            })
            .join('') +
          '</div>') +
      '<button type="button" class="runtime-subs-back" data-sub-back>' +
      esc(t('subs.unableBack')) +
      '</button>'
    );
  }
  function subsOutStep(st, setNo) {
    var zones = ['p4', 'p3', 'p2', 'p5', 'p6', 'p1'];
    return (
      liberoSwapBlock(setNo) +
      '<p class="runtime-subs-step">' +
      esc(t('subs.playerOut')) +
      '</p><div class="runtime-sub-grid">' +
      zones
        .map(function (z) {
          var n = st.rot[z];
          if (n == null) return '';
          var o = Subs.options(M, Number(M.currentSet || 1), st.rot, n),
            possible = o.regular.length > 0 || o.exceptional.length > 0,
            withLibero = st.liberoFor != null && String(st.liberoFor) === String(n);
          return (
            '<button type="button" class="runtime-sub-player" data-sub-out="' +
            esc(n) +
            '"' +
            (possible ? '' : ' disabled') +
            '>' +
            playerLabel(n) +
            '<small>' +
            esc(z.toUpperCase()) +
            (withLibero ? ' · ' + esc(t('subs.replacedByLibero')) : '') +
            (possible ? '' : ' · ' + esc(t('subs.noAllowedSubstitute'))) +
            '</small></button>'
          );
        })
        .join('') +
      '</div>'
    );
  }
  function subsInStep(st, setNo) {
    var out = subState.out,
      o = Subs.options(M, setNo, st.rot, out),
      exceptional = !o.regular.length && o.exceptional.length > 0,
      list = exceptional ? o.exceptional : o.regular;
    return (
      '<p class="runtime-subs-step">' +
      esc(t('subs.playerIn', { out: out })) +
      '</p>' +
      (exceptional
        ? '<p class="runtime-subs-warning">' + esc(t('subs.exceptionalWarning', { out: out })) + '</p>'
        : '') +
      (list.length
        ? '<div class="runtime-sub-grid">' +
          list
            .map(function (n) {
              return (
                '<button type="button" class="runtime-sub-player" data-sub-in="' +
                esc(n) +
                '"' +
                (exceptional ? ' data-sub-exceptional' : '') +
                '>' +
                playerLabel(n) +
                '</button>'
              );
            })
            .join('') +
          '</div>'
        : '<p class="runtime-subs-warning">' + esc(t('subs.noneAllowed', { out: out })) + '</p>') +
      (o.refused.length
        ? '<details class="runtime-subs-refused"><summary>' +
          esc(t('subs.refusedTitle', { count: o.refused.length })) +
          '</summary><ul>' +
          o.refused
            .map(function (r) {
              return '<li><b>#' + esc(r.number) + '</b> ' + esc(t(r.reason)) + '</li>';
            })
            .join('') +
          '</ul></details>'
        : '') +
      '<button type="button" class="runtime-subs-back" data-sub-back>' +
      esc(t('subs.changeOut')) +
      '</button>'
    );
  }
  function subsHtml() {
    var setNo = Number(M.currentSet || 1),
      h = Subs.history(M, setNo),
      blocked = subsBlocked(),
      st = rotationState(),
      body = blocked
        ? '<p class="runtime-subs-warning">' + esc(blocked) + '</p>'
        : subState.unable
          ? liberoUnableStep(setNo)
          : subState.out == null
            ? subsOutStep(st, setNo)
            : subsInStep(st, setNo);
    return (
      '<div class="runtime-prefs-card runtime-subs-card" role="dialog" aria-modal="true" aria-labelledby="runtimeSubsTitle"><h2 id="runtimeSubsTitle">' +
      esc(t('subs.title')) +
      '</h2><p>' +
      esc(t('subs.counter', { set: setNo, count: h.regular, limit: Subs.REGULAR_LIMIT })) +
      (h.exceptional
        ? ' · ' + esc(t(h.exceptional > 1 ? 'subs.exceptionalMany' : 'subs.exceptionalOne', { count: h.exceptional }))
        : '') +
      ' · ' +
      esc(t('subs.rule')) +
      '</p>' +
      (subState.error ? '<p class="runtime-subs-error" role="alert">' + esc(subState.error) + '</p>' : '') +
      body +
      '<button type="button" class="runtime-prefs-close" data-sub-close>' +
      esc(t('subs.close')) +
      '</button></div>'
    );
  }
  function renderSubs() {
    var sheet = document.getElementById('runtimeSubs');
    if (!sheet || sheet.hidden) return;
    sheet.innerHTML = subsHtml();
  }
  function openSubs() {
    if (!Subs || state.pending) return;
    subState.out = null;
    subState.unable = false;
    subState.error = '';
    var sheet = document.getElementById('runtimeSubs');
    sheet.hidden = false;
    renderSubs();
    var first = sheet.querySelector('button:not([disabled])');
    if (first) first.focus();
  }
  function closeSubs() {
    var sheet = document.getElementById('runtimeSubs');
    if (sheet) sheet.hidden = true;
    var button = panel.querySelector('[data-runtime-sub-open]');
    if (button) button.focus();
  }
  // Checks a libero change again and records it (a match.subs entry with libero: true and its event). mode: 'swap'
  // (the other libero, 19.3.2), 'unable' (the acting libero cannot play, the other libero takes over, 19.4) or
  // 'redesignate' (the acting libero cannot play, a player becomes libero for the rest of the match, 19.4).
  function changeLibero(inValue, mode) {
    var setNo = Number(M.currentSet || 1),
      incoming = rosterValue(inValue),
      list = currentSetEvents(),
      rule = mode === 'swap' ? Subs.liberoSwap(M, setNo, list) : Subs.liberoUnable(M, setNo, list),
      allowed = mode === 'swap' ? rule.candidates : mode === 'unable' ? rule.liberos : rule.players,
      key =
        rule.refusal ||
        (allowed.some(function (n) {
          return String(n) === String(incoming);
        })
          ? ''
          : 'subs.notAllowed'),
      reason = subsBlocked() || (key ? t(key) : '');
    if (reason) {
      subState.error = reason;
      renderSubs();
      return false;
    }
    var built = Subs.build(M, setNo, list, scoreNow(), rule.current, incoming, {
      eventId: uniqueEventId(),
      libero: true,
      unable: mode !== 'swap',
      redesignated: mode === 'redesignate',
    });
    M.subs = M.subs || [];
    M.subs.push(built.sub);
    writeObject(window.VolleyDomain.STORAGE.captureMatch, M);
    if (typeof VC.logSubstitution === 'function') VC.logSubstitution(built.event);
    else {
      var all = events();
      all.push(built.event);
      writeObject(EVENTS_KEY, all);
    }
    state.feedback = t(
      mode === 'swap' ? 'subs.liberoSwapDone' : mode === 'unable' ? 'subs.unableDone' : 'subs.redesignateDone',
      { in: incoming, out: rule.current }
    );
    subState.unable = false;
    closeSubs();
    clear(true);
    render();
    return true;
  }
  // Checks the substitution again (rules can change between rendering and tapping) and records it.
  function substitute(outValue, inValue, exceptional) {
    var setNo = Number(M.currentSet || 1),
      out = rosterValue(outValue),
      incoming = rosterValue(inValue),
      st = rotationState(),
      o = Subs.options(M, setNo, st.rot, out),
      allowed = exceptional ? o.exceptional : o.regular,
      reason =
        subsBlocked() ||
        (allowed.some(function (n) {
          return String(n) === String(incoming);
        })
          ? ''
          : t((exceptional ? '' : Subs.regularRefusal(M, setNo, st.rot, out, incoming)) || 'subs.notAllowed'));
    if (reason) {
      subState.error = reason;
      renderSubs();
      return false;
    }
    var built = Subs.build(M, setNo, currentSetEvents(), scoreNow(), out, incoming, {
      eventId: uniqueEventId(),
      exceptional: !!exceptional,
    });
    M.subs = M.subs || [];
    M.subs.push(built.sub);
    writeObject(window.VolleyDomain.STORAGE.captureMatch, M);
    if (typeof VC.logSubstitution === 'function') VC.logSubstitution(built.event);
    else {
      var list = events();
      list.push(built.event);
      writeObject(EVENTS_KEY, list);
    }
    state.feedback = t(exceptional ? 'subs.doneExceptional' : 'subs.done', { in: incoming, out: out });
    closeSubs();
    clear(true);
    render();
    return true;
  }

  /* Called by js/index-capture-tools.js after each change (VolleyCapture.refreshCourt): shows the serving team on the score
     board. The court itself is part of the runtime shell (render()). Errors are swallowed so that a commit can never
     fail after its event has been saved. */
  VC.refreshCourt = function (list) {
    if (!window.VolleyRotation || !M.startingRotation) return;
    try {
      var set = (list || events()).filter(function (e) {
          return Number(e.set || 1) === Number(M.currentSet || 1);
        }),
        replay = window.VolleyRotation.replay(M, set);
      VC.updateScoreService(replay.serving);
    } catch (error) {
      console.warn('VolleyLive: serving team not updated', error);
    }
  };
  ensureStructure();
  render();
  VC.refreshCourt();
  panel.addEventListener('click', function (event) {
    var target = event.target.closest('button');
    if (!target) return;
    if (target.hasAttribute('data-runtime-options')) {
      openOptions();
      return;
    }
    if (target.dataset.runtimeMode) {
      setMode(target.dataset.runtimeMode, true);
      return;
    }
    if (target.dataset.runtimeAuthor) {
      chooseAuthor(target.dataset.runtimeAuthor);
      return;
    }
    if (target.dataset.runtimeAction) {
      chooseAction(target.dataset.runtimeAction);
      return;
    }
    if (target.dataset.runtimeResult) {
      commit(target.dataset.runtimeResult);
      return;
    }
    if (target.hasAttribute('data-runtime-back')) {
      goBack();
      return;
    }
    if (target.hasAttribute('data-runtime-change')) {
      changePlayer();
      return;
    }
    if (target.hasAttribute('data-runtime-sub-open')) {
      openSubs();
      return;
    }
    if (target.hasAttribute('data-runtime-undo')) undo();
  });
  document.getElementById('runtimeSubs').addEventListener('click', function (event) {
    var target = event.target.closest('button');
    if (!target || target.disabled) return;
    if (target.hasAttribute('data-sub-close')) {
      closeSubs();
      return;
    }
    if (target.hasAttribute('data-sub-back')) {
      subState.out = null;
      subState.unable = false;
      subState.error = '';
      renderSubs();
      return;
    }
    if (target.dataset.subOut != null) {
      subState.out = rosterValue(target.dataset.subOut);
      subState.error = '';
      renderSubs();
      return;
    }
    if (target.hasAttribute('data-libero-unable-open')) {
      subState.unable = true;
      subState.error = '';
      renderSubs();
      return;
    }
    if (target.dataset.liberoSwap != null) {
      changeLibero(target.dataset.liberoSwap, 'swap');
      return;
    }
    if (target.dataset.liberoUnable != null) {
      changeLibero(target.dataset.liberoUnable, 'unable');
      return;
    }
    if (target.dataset.liberoRedesignate != null) {
      changeLibero(target.dataset.liberoRedesignate, 'redesignate');
      return;
    }
    if (target.dataset.subIn != null)
      substitute(subState.out, target.dataset.subIn, target.hasAttribute('data-sub-exceptional'));
  });
  document.getElementById('runtimePrefs').addEventListener('click', function (event) {
    var target = event.target.closest('button');
    if (!target) return;
    if (target.dataset.matrixLayout) {
      setMatrixLayout(target.dataset.matrixLayout);
      return;
    }
    if (target.dataset.runtimePrefMode) {
      setMode(target.dataset.runtimePrefMode, true);
      return;
    }
    if (target.hasAttribute('data-runtime-close-options')) closeOptions();
  });
  document.getElementById('runtimePrefs').addEventListener('change', function (event) {
    if (event.target.hasAttribute('data-runtime-highlight')) {
      savePrefs({ runtimeHighlights: event.target.checked });
      render();
      refreshPrefs();
    } else if (event.target.hasAttribute('data-runtime-haptic')) {
      savePrefs({ runtimeHaptics: event.target.checked });
      refreshPrefs();
    }
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      var overlay = document.getElementById('runtimePrefs'),
        sheet = document.getElementById('runtimeSubs');
      if (sheet && !sheet.hidden) {
        event.preventDefault();
        closeSubs();
      } else if (!overlay.hidden) {
        event.preventDefault();
        closeOptions();
      } else if (state.author) {
        event.preventDefault();
        changePlayer();
      }
    }
  });
  document.addEventListener('volleylive:runtime-settings-changed', function () {
    prefs = readPrefs();
    setMode(prefs.runtimeMode, false);
  });
  var score = document.getElementById('liveScore');
  if (score)
    new MutationObserver(function () {
      render();
    }).observe(score, { childList: true, subtree: true });
  var lastPortrait = isPortraitOrientation();
  window.addEventListener('resize', function () {
    var portrait = isPortraitOrientation();
    if (portrait === lastPortrait) return;
    lastPortrait = portrait;
    if (state.mode === 'SPEED') {
      render();
      refreshPrefs();
    }
  });
  window.VLRuntimeInput = {
    setMode: setMode,
    getState: function () {
      return {
        mode: state.mode,
        stage: state.stage,
        author: state.author,
        action: state.action,
        pending: state.pending,
      };
    },
    actions: ACTIONS.slice(),
    results: RESULTS.slice(),
    commit: commit,
    undo: undo,
    selectPlayer: chooseAuthor,
    selectAction: chooseAction,
    goBack: goBack,
    changePlayer: changePlayer,
    openSubstitution: openSubs,
    // Records a substitution after checking FIVB Rule 15; returns false (with the reason in the sheet) when refused.
    substitute: substitute,
  };
})();
