/* VolleyLive physical gamepad capture input (Browser Gamepad API). */
(function () {
  'use strict';

  var STORAGE_KEY = 'volleyCapture.gamepadConfig.v1';
  var MAPPING_NAMES = ['✕', '○', '□', '△', 'L1', 'R1', 'L2', 'R2', 'Create', 'Options', 'L3', 'R3', 'D-pad Up', 'D-pad Down', 'D-pad Left', 'D-pad Right', 'PS', 'Touchpad'];
  var ACTIONS = [
    { id: 'service', code: 'SERVE', label: 'SERVE', color: 'var(--rt-action-service-surface)', textColor: 'var(--role-opp-text)' },
    { id: 'reception', code: 'RECEPTION', label: 'RECEPTION', color: 'var(--rt-action-reception-surface)', textColor: 'var(--role-opp-text)' },
    { id: 'set', code: 'SET', label: 'SET', color: 'var(--rt-action-set-surface)', textColor: 'var(--role-mb-text)' },
    { id: 'attack', code: 'ATTACK', label: 'ATTACK', color: 'var(--rt-action-attack-surface)', textColor: 'var(--role-oh-text)' },
    { id: 'block', code: 'BLOCK', label: 'BLOCK', color: 'var(--rt-action-block-surface)', textColor: 'var(--role-oh-text)' },
    { id: 'defense', code: 'DEFENCE', label: 'DEFENCE', color: 'var(--rt-action-defense-surface)', textColor: 'var(--role-mb-text)' },
    { id: 'freeball', code: 'RELANCE', label: 'FREE BALL', color: 'var(--rt-action-freeball-surface)', textColor: 'var(--role-setter-text)' },
  ];
  var INLINE_ACTIONS = ['reception', 'set', 'attack', 'block', 'defense', 'service'];
  var statusLabels = [
    { id: 'positive', code: 'POSITIVE', label: 'POSITIVE', symbol: '✓' },
    { id: 'neutral', code: 'NEUTRAL', label: 'NEUTRAL', symbol: 'O' },
    { id: 'error', code: 'ERROR', label: 'NEGATIVE', symbol: '✕' },
  ];

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
  function defaults() {
    return {
      controllerId: '',
      mapping: 'standard',
      mode: 2,
      statusVariant: 'A',
      resultDurationMs: 2500,
      haptics: true,
      sticks: { deadzone: 0.55, hysteresis: 0.6, invertY: false },
      bindings: [
        { group: 'control', target: 'VALIDATE', input: { type: 'button', index: 0 } },
        { group: 'control', target: 'BACK', input: { type: 'button', index: 1 } },
        { group: 'control', target: 'UNDO', input: { type: 'button', index: 8 } },
        { group: 'status', target: 'POSITIVE', input: { type: 'button', index: 3 } },
        { group: 'status', target: 'NEUTRAL', input: { type: 'button', index: 1 } },
        { group: 'status', target: 'NEGATIVE', input: { type: 'button', index: 0 } },
      ],
    };
  }
  function readConfig() {
    var raw = readObject(STORAGE_KEY, null),
      base = defaults();
    if (!raw) return base;
    base.mode = raw.mode === 1 ? 1 : 2;
    base.statusVariant = raw.statusVariant === 'B' ? 'B' : 'A';
    base.resultDurationMs = Math.max(1000, Math.min(5000, Number(raw.resultDurationMs) || 2500));
    base.haptics = typeof raw.haptics === 'boolean' ? raw.haptics : true;
    base.controllerId = raw.controllerId || '';
    base.mapping = raw.mapping || 'standard';
    base.sticks = Object.assign(base.sticks, raw.sticks || {});
    base.bindings = Array.isArray(raw.bindings) ? raw.bindings : base.bindings;
    return base;
  }
  var config = readConfig();
  var panel = document.getElementById('capturePanel');
  var activeIndex = null;
  var activeGamepad = null;
  var previousButtons = [];
  var lastPressTime = {};
  var rafId = 0;
  var playerIndex = 0;
  var actionIndex = 0;
  var statusIndex = 0;
  var step = 'playerAction';
  var resultTimer = null;
  var disconnected = false;
  var resultData = null;

  function readStoredCapture() {
    var match = readObject(window.VolleyDomain.STORAGE.captureMatch, null);
    return match;
  }
  function courtPlayers() {
    var match = readStoredCapture();
    if (!match) return [];
    var out = [];
    if (window.VolleyRotation && match.startingRotation) {
      var events = readObject(window.VolleyDomain.STORAGE.captureEvents, []);
      var replay = window.VolleyRotation.replay(match, events);
      var court = window.VolleyRotation.court(match, replay.rot, replay);
      ['p4', 'p3', 'p2', 'p5', 'p6', 'p1'].forEach(function (position) {
        var number = court[position] && court[position].num;
        if (number != null && out.indexOf(String(number)) < 0) out.push(String(number));
      });
    }
    if (!out.length) {
      (match.team && match.team.roster || []).forEach(function (player) {
        if (out.length < 6 && player.present !== false) out.push(String(player.number));
      });
    }
    return out.slice(0, 6);
  }
  function playerMeta(number) {
    var match = readStoredCapture();
    var roster = match && match.team && match.team.roster || [];
    for (var i = 0; i < roster.length; i++) {
      if (String(roster[i].number) === String(number)) return roster[i];
    }
    return { number: number, position: '' };
  }
  function roleToken(position) {
    var role = String(position || '').toLowerCase();
    if (role === 'setter' || role === 'set') return 'setter';
    if (role === 'libero' || role === 'lib') return 'libero';
    if (role === 'opposite' || role === 'opp') return 'opp';
    if (role === 'middle' || role === 'mb') return 'mb';
    if (role === 'outside' || role === 'oh') return 'oh';
    return 'libero';
  }
  function roleSurface(position) {
    return 'var(--role-' + roleToken(position) + '-surface)';
  }
  function roleBorderColor(position) {
    return 'var(--role-' + roleToken(position) + ')';
  }
  function roleTextColor(position) {
    return 'var(--role-' + roleToken(position) + '-text)';
  }
  function escapeMarkup(value) {
    return String(value).replace(/[&<>"]/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character];
    });
  }
  function polarPoint(radius, angle) {
    var radians = angle * Math.PI / 180;
    return { x: 180 + Math.cos(radians) * radius, y: 180 + Math.sin(radians) * radius };
  }
  function sectorPath(index, count) {
    if (count === 1) {
      return 'M180 0 A180 180 0 1 1 180 360 A180 180 0 1 1 180 0 Z' +
        ' M180 125 A55 55 0 1 0 180 235 A55 55 0 1 0 180 125 Z';
    }
    var width = 360 / count;
    var center = -90 + index * width;
    var start = polarPoint(180, center - width / 2);
    var end = polarPoint(180, center + width / 2);
    var innerEnd = polarPoint(55, center + width / 2);
    var innerStart = polarPoint(55, center - width / 2);
    return 'M' + start.x.toFixed(2) + ' ' + start.y.toFixed(2) +
      ' A180 180 0 0 1 ' + end.x.toFixed(2) + ' ' + end.y.toFixed(2) +
      ' L' + innerEnd.x.toFixed(2) + ' ' + innerEnd.y.toFixed(2) +
      ' A55 55 0 0 0 ' + innerStart.x.toFixed(2) + ' ' + innerStart.y.toFixed(2) + ' Z';
  }
  function sectorLabelPoint(index, count) {
    return polarPoint(119, -90 + index * (360 / count));
  }

  function binding(group, target) {
    for (var i = 0; i < config.bindings.length; i++) {
      if (config.bindings[i].group === group && config.bindings[i].target === target) return config.bindings[i].input;
    }
    return null;
  }
  function findBindingInput(input) {
    if (!input) return null;
    for (var i = 0; i < config.bindings.length; i++) {
      var candidate = config.bindings[i].input;
      if (candidate && candidate.type === input.type && candidate.index === input.index && candidate.direction === input.direction) return config.bindings[i];
    }
    return null;
  }
  function friendlyName(input) {
    if (!input) return 'Unassigned';
    if (input.type === 'button') {
      if (activeGamepad && activeGamepad.mapping === 'standard') return MAPPING_NAMES[input.index] || ('Button ' + input.index);
      return 'Button ' + input.index;
    }
    if (input.type === 'axis') return 'Axis ' + input.index + (input.direction < 0 ? ' −' : ' +');
    if (input.type === 'combo') return input.buttons.map(function (index) { return MAPPING_NAMES[index] || ('Button ' + index); }).join(' + ');
    return 'Unassigned';
  }

  function haptic(preset) {
    if (!config.haptics || !activeGamepad || !activeGamepad.vibrationActuator) return;
    var patterns = {
      step: { duration: 40, weakMagnitude: 0.3, strongMagnitude: 0.0 },
      record: { duration: 80, weakMagnitude: 0.4, strongMagnitude: 0.2 },
      negative: { duration: 120, weakMagnitude: 0.2, strongMagnitude: 0.5 },
      invalid: { duration: 100, weakMagnitude: 0.5, strongMagnitude: 0.2 },
      connected: { duration: 150, weakMagnitude: 0.3, strongMagnitude: 0.2 },
    };
    var pattern = patterns[preset] || patterns.step;
    try {
      if (typeof activeGamepad.vibrationActuator.playEffect === 'function') {
        activeGamepad.vibrationActuator.playEffect('dual-rumble', Object.assign({ startDelay: 0 }, pattern));
      } else if (typeof activeGamepad.vibrationActuator.pulse === 'function') {
        activeGamepad.vibrationActuator.pulse(pattern.weakMagnitude, pattern.duration);
      }
    } catch (error) {}
  }

  function ensureOverlay() {
    var existing = document.getElementById('gamepadCaptureOverlay');
    if (existing) return existing;
    var overlay = document.createElement('div');
    overlay.id = 'gamepadCaptureOverlay';
    overlay.className = 'gamepad-capture-overlay';
    overlay.hidden = true;
    overlay.setAttribute('aria-live', 'polite');
    document.body.appendChild(overlay);
    return overlay;
  }
  function ensureSettings() {
    var existing = document.getElementById('gamepadSettings');
    if (existing) return existing;
    var overlay = document.createElement('div');
    overlay.id = 'gamepadSettings';
    overlay.className = 'gamepad-settings';
    overlay.hidden = true;
    document.body.appendChild(overlay);
    return overlay;
  }
  function bubbleStyle(count, index, radius) {
    var theta = ((2 * Math.PI * index) / count) - Math.PI / 2;
    return 'left:calc(50% + ' + (Math.cos(theta) * radius).toFixed(1) + 'px);top:calc(50% + ' + (Math.sin(theta) * radius).toFixed(1) + 'px)';
  }
  function needleStyle(count, index) {
    var theta = ((360 * index) / count) - 90;
    return 'transform:rotate(' + theta.toFixed(1) + 'deg)';
  }
  function renderPlayerCircle() {
    var players = courtPlayers();
    if (!players.length) {
      players = ['#0'];
      playerIndex = 0;
    }
    playerIndex = ((playerIndex % players.length) + players.length) % players.length;
    var selectedNumber = players[playerIndex];
    var meta = playerMeta(selectedNumber);
    var position = String(meta.position || 'PLAYER').toUpperCase();
    return '<div class="gamepad-circle gamepad-player-circle"><div class="gamepad-bubbles">' +
      players.map(function (number, index) {
        var p = playerMeta(number);
        var role = String(p.position || '').toLowerCase();
        return '<div class="gamepad-bubble' + (index === playerIndex ? ' selected' : '') + '" style="' + bubbleStyle(players.length, index, 118) + ';--bubble-color:' + roleSurface(p.position) + ';--bubble-border-color:' + roleBorderColor(p.position) + ';--bubble-text-color:' + roleTextColor(p.position) + '"><b>' + (role === 'libero' || role === 'lib' ? 'A' : '#' + number) + '</b></div>';
      }).join('') +
      '</div><div class="gamepad-needle" style="' + needleStyle(players.length, playerIndex) + '"></div><div class="gamepad-center"><b>#' + selectedNumber + '</b><small>' + position + '</small></div></div>';
  }
  function renderActionCircle() {
    actionIndex = ((actionIndex % ACTIONS.length) + ACTIONS.length) % ACTIONS.length;
    var selected = ACTIONS[actionIndex];
    return '<div class="gamepad-circle gamepad-action-circle"><div class="gamepad-bubbles">' +
      ACTIONS.map(function (action, index) {
      return '<div class="gamepad-bubble' + (index === actionIndex ? ' selected' : '') + '" style="' + bubbleStyle(ACTIONS.length, index, 118) + ';--bubble-color:' + action.color + ';--bubble-text-color:' + action.textColor + '"><b>' + action.label.charAt(0) + '</b></div>';
      }).join('') +
      '</div><div class="gamepad-needle" style="' + needleStyle(ACTIONS.length, actionIndex) + '"></div><div class="gamepad-center"><b>' + selected.label + '</b></div></div>';
  }
  function renderInlinePlayerWheel() {
    var players = courtPlayers();
    if (!players.length) players = ['#0'];
    playerIndex = ((playerIndex % players.length) + players.length) % players.length;
    var state = window.VLRuntimeInput ? window.VLRuntimeInput.getState() : {};
    var opponentSelected = state.author === 'A';
    return '<div class="gamepad-touch-wheel gamepad-player-circle"><svg viewBox="0 0 360 360" role="group" aria-label="Sélection du joueur">' +
      '<circle class="gamepad-wheel-disc" cx="180" cy="180" r="178"></circle>' +
      players.map(function (number, index) {
        var point = sectorLabelPoint(index, players.length);
        var selected = state.author != null && String(state.author) === String(number);
        var color = roleSurface(playerMeta(number).position);
        var labelColor = roleTextColor(playerMeta(number).position);
        return '<g class="gamepad-touch-sector' + (selected ? ' selected' : '') + '" data-gamepad-player="' + index +
          '" role="button" tabindex="0" aria-label="Joueur numéro ' + escapeMarkup(number) + '" aria-pressed="' + selected + '">' +
          '<path d="' + sectorPath(index, players.length) + '" fill="' + color + '"></path>' +
          '<text x="' + point.x.toFixed(2) + '" y="' + point.y.toFixed(2) + '" fill="' + labelColor + '">' +
          escapeMarkup(number) + '</text></g>';
      }).join('') +
      '<g class="gamepad-touch-center gamepad-player-center' + (opponentSelected ? ' selected' : '') +
      '" data-gamepad-player="A" role="button" tabindex="0" aria-label="Adversaire" aria-pressed="' + opponentSelected + '">' +
      '<circle cx="180" cy="180" r="52"></circle><text x="180" y="180">A</text></g></svg></div>';
  }
  function renderInlineActionWheel() {
    var state = window.VLRuntimeInput ? window.VLRuntimeInput.getState() : {};
    var selectedId = state.action;
    var freeballSelected = selectedId === 'freeball';
    return '<div class="gamepad-touch-wheel gamepad-action-circle"><svg viewBox="0 0 360 360" role="group" aria-label="Sélection de l action">' +
      '<circle class="gamepad-wheel-disc" cx="180" cy="180" r="178"></circle>' +
      INLINE_ACTIONS.map(function (actionId, index) {
        var action = ACTIONS.filter(function (item) { return item.id === actionId; })[0];
        var point = sectorLabelPoint(index, INLINE_ACTIONS.length);
        var selected = selectedId === actionId;
        var labelColor = action.textColor;
        return '<g class="gamepad-touch-sector' + (selected ? ' selected' : '') + '" data-gamepad-action="' + action.id +
          '" role="button" tabindex="0" aria-label="' + escapeMarkup(action.label) + '" aria-pressed="' + selected + '">' +
          '<path d="' + sectorPath(index, INLINE_ACTIONS.length) + '" fill="' + action.color + '"></path>' +
          '<text x="' + point.x.toFixed(2) + '" y="' + point.y.toFixed(2) + '" fill="' + labelColor + '">' +
          escapeMarkup(action.label) + '</text></g>';
      }).join('') +
      '<g class="gamepad-touch-center gamepad-action-center' + (freeballSelected ? ' selected' : '') +
      '" data-gamepad-action="freeball" role="button" tabindex="0" aria-label="Relance" aria-pressed="' + freeballSelected + '">' +
      '<circle cx="180" cy="180" r="52"></circle><text x="180" y="180">R</text></g></svg></div>';
  }
  function renderStatus() {
    statusIndex = ((statusIndex % statusLabels.length) + statusLabels.length) % statusLabels.length;
    var author = window.VLRuntimeInput ? window.VLRuntimeInput.getState().author : null;
    var action = window.VLRuntimeInput ? window.VLRuntimeInput.getState().action : null;
    var actionLabel = ACTIONS.filter(function (item) { return item.id === action; })[0];
    return '<section class="gamepad-status-screen"><div class="gamepad-chips"><span>#' + (author || '—') + '</span><span>' + (actionLabel ? actionLabel.label : '—') + '</span></div><div class="gamepad-status-grid">' +
      statusLabels.map(function (status, index) {
        return '<button type="button" class="gamepad-status-button ' + status.id + (index === statusIndex ? ' selected' : '') + '" data-gamepad-status="' + status.id + '"><b>' + status.symbol + '</b><span>' + status.label + '</span></button>';
      }).join('') +
      '</div></section>';
  }
  function renderDualPads() {
    var overlay = ensureOverlay();
    overlay.hidden = false;
    overlay.innerHTML =
      '<header class="gamepad-result-head"><button type="button" data-gamepad-back>↶ Annuler</button><div class="gamepad-brand">VolleyLive</div><button type="button" data-gamepad-settings>⚙</button></header>' +
      (step === 'status' ? renderStatus() : '<div class="gamepad-pad-layout">' + renderPlayerCircle() + renderActionCircle() + '</div>') +
      '<footer class="gamepad-controls"><span id="gamepadConnectionBadge"></span><span id="gamepadLastAction">Dernière action : —</span></footer>';
    updateConnectionBadge();
  }
  function renderInlineCapture() {
    var host = document.getElementById('gamepadInlineView');
    if (!host) return;
    var runtime = window.VLRuntimeInput;
    if (runtime) {
      var runtimeState = runtime.getState();
      var inlinePlayers = courtPlayers();
      if (runtimeState.author) {
        var selectedPlayer = inlinePlayers.indexOf(String(runtimeState.author));
        if (selectedPlayer >= 0) playerIndex = selectedPlayer;
      }
      if (runtimeState.action) {
        var selectedAction = ACTIONS.map(function (item) { return item.id; }).indexOf(runtimeState.action);
        if (selectedAction >= 0) actionIndex = selectedAction;
      }
    }
    host.innerHTML =
      '<div class="gamepad-inline-layout">' +
      renderInlinePlayerWheel() +
      '<div class="gamepad-inline-status" aria-label="Statut de l action">' +
      '<button type="button" class="gamepad-inline-status positive" data-gamepad-status="positive" aria-label="Positif">✓</button>' +
      '<button type="button" class="gamepad-inline-status neutral" data-gamepad-status="neutral" aria-label="Neutre">O</button>' +
      '<button type="button" class="gamepad-inline-status negative" data-gamepad-status="error" aria-label="Négatif">✕</button>' +
      '</div>' +
      renderInlineActionWheel() +
      '</div>';
  }
  function showResult() {
    if (!resultData) return;
    var status = statusLabels.filter(function (item) { return item.id === resultData.status; })[0] || statusLabels[0];
    var overlay = ensureOverlay();
    overlay.hidden = false;
    overlay.innerHTML = '<section class="gamepad-result-screen ' + status.id + '"><small>ENTRY RECORDED</small><div class="gamepad-result-player"><b>#' + (resultData.player || '—') + '</b><span>' + (playerMeta(resultData.player).position || 'PLAYER') + '</span></div><div class="gamepad-result-action">' + resultData.actionLabel + '</div><div class="gamepad-result-status"><b>' + status.symbol + '</b><span>' + status.label + '</span></div><div class="gamepad-progress"><i></i></div></section>';
  }
  function closeResult() {
    if (resultTimer) clearTimeout(resultTimer);
    resultTimer = null;
    resultData = null;
    step = 'playerAction';
    renderDualPads();
  }
  function selectStatus(statusId, inputSource) {
    var runtime = window.VLRuntimeInput;
    if (!runtime) return;
    var state = runtime.getState();
    if (!state.author || !state.action) return;
    var status = statusLabels.filter(function (item) { return item.id === statusId; })[0];
    if (!status) return;
    var resultId = statusId === 'positive' ? 'point' : statusId === 'neutral' ? 'neutral' : 'error';
    runtime.commit(resultId, inputSource === 'touch' ? 'touch' : 'gamepad');
    if (inputSource === 'touch') return;
    var action = runtime.actions.filter(function (item) { return item.id === state.action; })[0];
    resultData = { player: state.author, actionLabel: action ? action.label : state.action, status: statusId };
    haptic(statusId === 'error' ? 'negative' : 'record');
    showResult();
    resultTimer = setTimeout(closeResult, config.resultDurationMs);
  }
  function selectPlayerFromIndex(index) {
    var players = courtPlayers();
    if (!players.length) return;
    playerIndex = ((index % players.length) + players.length) % players.length;
    if (window.VLRuntimeInput) window.VLRuntimeInput.selectPlayer(players[playerIndex]);
  }
  function selectPlayer(player) {
    if (window.VLRuntimeInput) window.VLRuntimeInput.selectPlayer(player);
  }
  function selectActionById(actionId) {
    var index = ACTIONS.map(function (item) { return item.id; }).indexOf(actionId);
    if (index < 0) return;
    actionIndex = index;
    if (window.VLRuntimeInput) window.VLRuntimeInput.selectAction(actionId);
  }
  function selectActionFromIndex(index) {
    actionIndex = ((index % ACTIONS.length) + ACTIONS.length) % ACTIONS.length;
    selectActionById(ACTIONS[actionIndex].id);
  }
  function validate() {
    if (step === 'status') {
      selectStatus(statusLabels[statusIndex].id);
      return;
    }
    var runtime = window.VLRuntimeInput;
    if (!runtime) return;
    var state = runtime.getState();
    if (!state.author) {
      selectPlayerFromIndex(playerIndex);
      state = runtime.getState();
    }
    if (!state.action) selectActionFromIndex(actionIndex);
    state = runtime.getState();
    if (state.author && state.action) {
      if (config.statusVariant === 'B') return;
      step = 'status';
      haptic('step');
      renderDualPads();
    }
  }
  function goBack() {
    var runtime = window.VLRuntimeInput;
    if (resultData) {
      if (typeof runtime.undo === 'function') runtime.undo();
      closeResult();
      return;
    }
    if (step === 'status') {
      step = 'playerAction';
      if (runtime) runtime.goBack();
    } else if (runtime) runtime.changePlayer();
    renderDualPads();
  }

  function updateConnectionBadge() {
    var badge = document.getElementById('gamepadConnectionBadge');
    if (badge) badge.textContent = activeGamepad ? '🎮 Connected' : '🎮 No controller';
    var indicator = document.getElementById('gamepadCaptureIndicator');
    if (indicator) indicator.textContent = activeGamepad ? '🎮 Connected' : '🎮 No controller';
  }
  function ensureIndicator() {
    if (!panel) return;
    var head = panel.querySelector('.capture-head');
    if (!head) return;
    var meta = head.querySelector('.runtime-head-meta');
    if (!meta) return;
    if (meta.querySelector('#gamepadCaptureIndicator')) return;
    meta.insertAdjacentHTML('beforeend', '<button type="button" id="gamepadCaptureIndicator" class="gamepad-indicator" data-gamepad-indicator>🎮 No controller</button>');
  }
  function processEdges(gamepad) {
    var now = Date.now();
    var count = gamepad.buttons.length;
    if (!previousButtons[activeIndex]) previousButtons[activeIndex] = [];
    var previous = previousButtons[activeIndex];
    for (var i = 0; i < count; i++) {
      var pressed = !!(gamepad.buttons[i] && (gamepad.buttons[i].pressed || gamepad.buttons[i].value > 0.5));
      if (pressed && !previous[i]) {
        var last = lastPressTime[activeIndex + ':' + i] || 0;
        if (now - last >= 40) {
          lastPressTime[activeIndex + ':' + i] = now;
          var b = { type: 'button', index: i };
          handleInput(b);
        }
      }
      previous[i] = pressed;
    }
  }
  function handleInput(input) {
    if (resultData) {
      if (input.index === 0) closeResult();
      else if (input.index === 1) goBack();
      return;
    }
    if (config.statusVariant === 'B') {
      if (step === 'status') {
        if (input.index === 3) { selectStatus('positive'); return; }
        if (input.index === 1) { selectStatus('neutral'); return; }
        if (input.index === 0) { selectStatus('error'); return; }
      }
      if (input.index === 2) { goBack(); return; }
      if (input.index === 5) { validate(); return; }
    }
    if (input.index === 12) {
      selectActionFromIndex(actionIndex - 1);
      return;
    }
    if (input.index === 13) {
      selectActionFromIndex(actionIndex + 1);
      return;
    }
    if (input.index === 14 || input.index === 4) {
      selectPlayerFromIndex(playerIndex - 1);
      return;
    }
    if (input.index === 15 || input.index === 5) {
      selectPlayerFromIndex(playerIndex + 1);
      return;
    }
    var found = findBindingInput(input);
    if (found) {
      if (found.group === 'control') {
        if (found.target === 'VALIDATE') validate();
        if (found.target === 'BACK') goBack();
        if (found.target === 'UNDO') undo();
      } else if (found.group === 'status') {
        if (config.statusVariant === 'B') selectStatus(found.target);
      }
    }
  }
  function undo() {
    if (window.VLRuntimeInput) window.VLRuntimeInput.undo();
  }
  function processSticks(gamepad) {
    var leftX = gamepad.axes[0] || 0;
    var leftY = (gamepad.axes[1] || 0) * (config.sticks.invertY ? -1 : 1);
    var rightX = gamepad.axes[2] || 0;
    var rightY = (gamepad.axes[3] || 0) * (config.sticks.invertY ? -1 : 1);
    var deadzone = config.sticks.deadzone;
    var previousPlayerIndex = playerIndex;
    var previousActionIndex = actionIndex;
    function sector(x, y, count, current) {
      var magnitude = Math.sqrt(x * x + y * y);
      if (magnitude < deadzone) return current;
      var angle = Math.atan2(y, x) * 180 / Math.PI;
      var clockwise = (angle + 90 + 360) % 360;
      var width = 360 / count;
      var candidate = Math.round(clockwise / width) % count;
      var currentAngle = (360 * current / count);
      var difference = Math.abs(((clockwise - currentAngle + 540) % 360) - 180);
      if (difference > width * config.sticks.hysteresis) return candidate;
      return current;
    }
    var players = courtPlayers();
    if (players.length) playerIndex = sector(leftX, leftY, players.length, playerIndex);
    actionIndex = sector(rightX, rightY, ACTIONS.length, actionIndex);
    if (window.VLRuntimeInput) {
      if (players.length && step === 'playerAction') window.VLRuntimeInput.selectPlayer(players[playerIndex]);
      if (step === 'playerAction') window.VLRuntimeInput.selectAction(ACTIONS[actionIndex].id);
    }
    if (playerIndex !== previousPlayerIndex || actionIndex !== previousActionIndex) renderInlineCapture();
  }
  function poll() {
    var gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    var gp = activeIndex != null ? gamepads[activeIndex] : null;
    if (!gp) {
      rafId = requestAnimationFrame(poll);
      return;
    }
    activeGamepad = gp;
    if (handleLearnPress(gp)) {
      rafId = requestAnimationFrame(poll);
      return;
    }
    processEdges(gp);
    processSticks(gp);
    rafId = requestAnimationFrame(poll);
  }
  function onConnected(gamepad) {
    activeIndex = gamepad.index;
    activeGamepad = gamepad;
    disconnected = false;
    previousButtons[activeIndex] = [];
    config.controllerId = gamepad.id;
    config.mapping = gamepad.mapping || 'standard';
    writeObject(STORAGE_KEY, config);
    haptic('connected');
    updateConnectionBadge();
    if (!resultData) renderDualPads();
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(poll);
  }
  function onDisconnected(event) {
    if (activeIndex !== event.gamepad.index) return;
    activeIndex = null;
    activeGamepad = null;
    disconnected = true;
    cancelAnimationFrame(rafId);
    updateConnectionBadge();
  }

  function openSetup() {
    var overlay = ensureSettings();
    overlay.hidden = false;
    var bindingRows = [
      { group: 'control', target: 'VALIDATE', label: 'VALIDATE' },
      { group: 'control', target: 'BACK', label: 'BACK / CANCEL' },
      { group: 'control', target: 'UNDO', label: 'UNDO' },
      { group: 'status', target: 'POSITIVE', label: 'POSITIVE ✓' },
      { group: 'status', target: 'NEUTRAL', label: 'NEUTRAL O' },
      { group: 'status', target: 'NEGATIVE', label: 'NEGATIVE ✕' },
    ];
    overlay.innerHTML = '<div class="gamepad-settings-card" role="dialog" aria-modal="true"><header><b>Controller: ' + (activeGamepad ? activeGamepad.id : 'Not connected') + '</b><button type="button" data-gamepad-close>✕</button></header><p>Status: ' + (activeGamepad ? '● Connected' : '○ Not connected') + ' · Mapping: ' + (activeGamepad ? activeGamepad.mapping : config.mapping) + '</p><button type="button" class="gamepad-reset" data-gamepad-capture>Ouvrir la saisie manette</button><div class="gamepad-settings-grid">' +
      bindingRows.map(function (row) {
        var input = binding(row.group, row.target);
        return '<div class="gamepad-binding-row"><b>' + row.label + '</b><span>' + friendlyName(input) + '</span><button type="button" data-gamepad-change="' + row.group + ':' + row.target + '">CHANGE</button><button type="button" data-gamepad-clear="' + row.group + ':' + row.target + '" class="clear">CLEAR</button></div>';
      }).join('') +
      '</div><div class="gamepad-settings-options"><label>Mode <select data-gamepad-mode><option value="2"' + (config.mode === 2 ? ' selected' : '') + '>2 - Dual pads</option><option value="1"' + (config.mode === 1 ? ' selected' : '') + '>1 - Three screens</option></select></label><label>Status <select data-gamepad-status-variant><option value="A"' + (config.statusVariant === 'A' ? ' selected' : '') + '>A - Dedicated</option><option value="B"' + (config.statusVariant === 'B' ? ' selected' : '') + '>B - Direct buttons</option></select></label><label>Duration <input type="number" min="1" max="5" value="' + (config.resultDurationMs / 1000) + '" data-gamepad-duration></label><label>Haptics <input type="checkbox" data-gamepad-haptics' + (config.haptics ? ' checked' : '') + '></label></div><button type="button" data-gamepad-reset class="gamepad-reset">Reset to defaults</button></div>';
  }
  function closeSetup() {
    var overlay = ensureSettings();
    overlay.hidden = true;
  }
  function learnBinding(group, target) {
    var overlay = ensureSettings();
    overlay.querySelector('.gamepad-settings-card').insertAdjacentHTML('beforeend', '<div class="gamepad-learn" role="status">Press a button on your controller…<button type="button" data-gamepad-learn-cancel>Cancel</button></div>');
    var timeout = setTimeout(function () {
      var learn = overlay.querySelector('.gamepad-learn');
      if (learn) learn.remove();
      openSetup();
    }, 10000);
    overlay._learnTimeout = timeout;
    overlay._learnBinding = { group: group, target: target };
  }

  function handleSettingClick(event) {
    var target = event.target.closest('button');
    if (!target) return;
    if (target.hasAttribute('data-gamepad-close')) closeSetup();
    if (target.hasAttribute('data-gamepad-capture')) {
      closeSetup();
      renderDualPads();
    }
    if (target.hasAttribute('data-gamepad-learn-cancel')) {
      clearTimeout(ensureSettings()._learnTimeout);
      openSetup();
    }
    if (target.dataset.gamepadChange) {
      var parts = target.dataset.gamepadChange.split(':');
      learnBinding(parts[0], parts[1]);
    }
    if (target.dataset.gamepadClear) {
      var clearParts = target.dataset.gamepadClear.split(':');
      config.bindings = config.bindings.filter(function (item) { return !(item.group === clearParts[0] && item.target === clearParts[1]); });
      writeObject(STORAGE_KEY, config);
      openSetup();
    }
    if (target.hasAttribute('data-gamepad-reset')) {
      config = defaults();
      writeObject(STORAGE_KEY, config);
      openSetup();
    }
  }
  function handleSettingsChange(event) {
    if (event.target.hasAttribute('data-gamepad-mode')) config.mode = Number(event.target.value);
    if (event.target.hasAttribute('data-gamepad-status-variant')) config.statusVariant = event.target.value;
    if (event.target.hasAttribute('data-gamepad-duration')) config.resultDurationMs = Math.max(1000, Math.min(5000, Number(event.target.value) * 1000));
    if (event.target.hasAttribute('data-gamepad-haptics')) config.haptics = event.target.checked;
    writeObject(STORAGE_KEY, config);
  }
  function handleLearnPress(gamepad) {
    var overlay = ensureSettings();
    if (!overlay._learnBinding) return false;
    for (var i = 0; i < gamepad.buttons.length; i++) {
      if (gamepad.buttons[i] && (gamepad.buttons[i].pressed || gamepad.buttons[i].value > 0.5)) {
        var previous = previousButtons[activeIndex] && previousButtons[activeIndex][i];
        if (!previous) {
          var row = overlay._learnBinding;
          var conflict = config.bindings.filter(function (item) { return item.group === row.group && item.input && item.input.type === 'button' && item.input.index === i; });
          var input = { type: 'button', index: i };
          if (conflict.length) {
            config.bindings = config.bindings.filter(function (item) {
              return !(item.group === row.group && item.input && item.input.type === 'button' && item.input.index === i);
            });
          }
          config.bindings = config.bindings.filter(function (item) { return !(item.group === row.group && item.target === row.target); });
          config.bindings.push({ group: row.group, target: row.target, input: input });
          clearTimeout(overlay._learnTimeout);
          overlay._learnBinding = null;
          writeObject(STORAGE_KEY, config);
          openSetup();
          return true;
        }
      }
    }
    return false;
  }

  window.addEventListener('gamepadconnected', function (event) {
    onConnected(event.gamepad);
  });
  window.addEventListener('gamepaddisconnected', function (event) {
    onDisconnected(event);
  });
  window.addEventListener('blur', function () {
    previousButtons = [];
  });
  if (panel) {
    panel.addEventListener('click', function (event) {
      var status = event.target.closest('[data-gamepad-status]');
      var player = event.target.closest('[data-gamepad-player]');
      var action = event.target.closest('[data-gamepad-action]');
      if (status) selectStatus(status.dataset.gamepadStatus, status.closest('.gamepad-inline-status') ? 'touch' : 'gamepad');
      if (player) {
        if (player.dataset.gamepadPlayer === 'A') selectPlayer('A');
        else selectPlayerFromIndex(Number(player.dataset.gamepadPlayer));
      }
      if (action) selectActionById(action.dataset.gamepadAction);
      if (event.target.closest('[data-gamepad-settings]')) openSetup();
      if (event.target.closest('[data-gamepad-back]')) goBack();
    });
    panel.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      var target = event.target.closest('[data-gamepad-player], [data-gamepad-action]');
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      target.click();
    });
  }
  var settingsOverlay = ensureSettings();
  settingsOverlay.addEventListener('click', handleSettingClick);
  settingsOverlay.addEventListener('change', handleSettingsChange);
  ensureOverlay();
  ensureIndicator();
  updateConnectionBadge();
  document.addEventListener('volleylive:open-gamepad', openSetup);
  if (panel) {
    panel.addEventListener('click', function (event) {
      if (event.target.closest('[data-gamepad-indicator]')) openSetup();
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') validate();
    if (event.key === 'Escape') goBack();
    if (event.key === 'a' || event.key === 'A') selectPlayerFromIndex(playerIndex - 1);
    if (event.key === 'd' || event.key === 'D') selectPlayerFromIndex(playerIndex + 1);
    if (event.key === 'ArrowLeft') selectActionFromIndex(actionIndex - 1);
    if (event.key === 'ArrowRight') selectActionFromIndex(actionIndex + 1);
    if (event.ctrlKey && event.key.toLowerCase() === 'z') undo();
  });

  window.VolleyGamepad = {
    GamepadManager: {
      getActive: function () { return activeGamepad; },
      getState: function () { return { connected: !!activeGamepad, activeIndex: activeIndex, disconnected: disconnected }; },
    },
    GamepadBindings: {
      getConfig: function () { return config; },
      save: function (next) { config = Object.assign(config, next); writeObject(STORAGE_KEY, config); },
      friendlyName: friendlyName,
    },
    openSetup: openSetup,
    closeSetup: closeSetup,
    renderDualPads: renderDualPads,
    renderInlineCapture: renderInlineCapture,
    getStep: function () { return step; },
  };
  window.VLGamepad = window.VolleyGamepad;
  if (window.VLRuntimeInput && window.VLRuntimeInput.getState().mode === 'GAMEPAD') renderInlineCapture();

  var initial = navigator.getGamepads ? navigator.getGamepads() : [];
  for (var i = 0; i < initial.length; i++) {
    if (initial[i]) {
      onConnected(initial[i]);
      break;
    }
  }
})();
