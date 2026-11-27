/* VolleyLive capture input: court, FOCUS / SPEED+ / FLOW modes, undo and substitutions (see docs/ARCHITECTURE.md). */
(function () {
  'use strict';
  var VC = window.VolleyCapture,
    M = VC && VC.match,
    panel = document.getElementById('capturePanel');
  if (!M || !VC.commit || !panel) return;
  var SETTINGS_KEY = window.VolleyDomain.STORAGE.runtimeInputPreferences,
    EVENTS_KEY = window.VolleyDomain.STORAGE.captureEvents;
  var MODES = ['FOCUS', 'SPEED', 'FLOW'];
  var ACTIONS = [
    { id: 'service', code: 'SERVE', label: 'SERVICE', family: 'serve' },
    { id: 'reception', code: 'RECEPTION', label: 'RÉCEPTION', family: 'build' },
    { id: 'set', code: 'SET', label: 'PASSE', family: 'build' },
    { id: 'attack', code: 'ATTACK', label: 'ATTAQUE', family: 'offence' },
    { id: 'block', code: 'BLOCK', label: 'BLOCK', family: 'offence' },
    { id: 'defense', code: 'DEFENCE', label: 'DÉFENSE', family: 'defence' },
    { id: 'freeball', code: 'RELANCE', label: 'RELANCE', family: 'defence', full: true },
  ];
  var RESULTS = [
    { id: 'point', code: 'POSITIVE', label: '✓  POSITIF', css: 'positive', symbol: '+' },
    { id: 'neutral', code: 'NEUTRAL', label: '○  NEUTRE', css: 'neutral', symbol: '−' },
    { id: 'error', code: 'ERROR', label: '×  ERREUR', css: 'error', symbol: '×' },
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
  };
  // Substitution sheet (FIVB Rule 15, js/index-substitution-rules.js): out = player chosen to leave, error = refusal.
  var Subs = window.VolleySubstitutions;
  var subState = { out: null, error: '' };
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
  function modeLabel(mode) {
    return mode === 'SPEED' ? 'SPEED+' : mode;
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
    if (state.author === 'A') return 'A · ADVERSAIRE';
    var p = player(state.author);
    return p
      ? '#' + p.number + ' · ' + (ROLE_LABEL[role(p)] || String(role(p) || '').toUpperCase())
      : '#' + state.author;
  }
  function scoreNow() {
    return window.VolleySets ? window.VolleySets.score(events(), M.currentSet || 1) : { a: 0, b: 0 };
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
      '" aria-label="Joueur ' +
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
      '<div class="runtime-opponent-wrap"><button type="button" class="runtime-opponent' +
      (selected ? ' selected' : '') +
      '" data-runtime-author="A" aria-pressed="' +
      (selected ? 'true' : 'false') +
      '" aria-label="Adversaire">A</button><span class="runtime-opponent-label">Adversaire</span></div>'
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
      '</div>' +
      opponentButton() +
      '</div>'
    );
  }
  function courtSelector() {
    return (
      '<div><div class="runtime-court" aria-label="Joueurs sur le terrain, sans filet"><div class="runtime-court-grid">' +
      courtPlayers()
        .map(function (n) {
          return playerButton(n, true);
        })
        .join('') +
      '</div></div>' +
      opponentButton() +
      '</div>'
    );
  }
  function authorChip(withAction) {
    var text = state.author ? authorText() : 'Aucun auteur';
    if (withAction && state.action) {
      var a = actionMeta(state.action);
      text += ' · ' + (a ? a.label : state.action);
    }
    return '<div class="runtime-author-chip"><span>' + esc(text) + '</span></div>';
  }
  function inlineTools(canBack) {
    return (
      '<div class="runtime-inline-tools">' +
      (canBack ? '<button type="button" data-runtime-back>← Retour</button>' : '') +
      '<button type="button" data-runtime-change>Changer de joueur</button></div>'
    );
  }
  function actionGrid(flow) {
    return (
      '<div class="runtime-action-grid">' +
      ACTIONS.map(function (a) {
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
          a.label +
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
          r.label +
          '</button>'
        );
      }).join('') +
      '</div><p class="runtime-immediate">Enregistrement immédiat</p>'
    );
  }
  function focusLayout() {
    if (state.stage === 'player')
      return (
        '<section class="runtime-stage"><h2 class="runtime-question"><span class="runtime-kicker">1 · JOUEUR</span>Qui joue ?</h2>' +
        plainPlayers() +
        '</section>'
      );
    if (state.stage === 'action')
      return (
        '<section class="runtime-stage">' +
        authorChip(false) +
        inlineTools(false) +
        '<h2 class="runtime-question"><span class="runtime-kicker">2 · ACTION</span>Quelle action ?</h2><div class="runtime-panel">' +
        actionGrid(false) +
        '</div></section>'
      );
    return (
      '<section class="runtime-stage">' +
      authorChip(true) +
      inlineTools(true) +
      '<h2 class="runtime-question"><span class="runtime-kicker">3 · RÉSULTAT</span>Quel résultat ?</h2><div class="runtime-panel">' +
      resultGrid(false) +
      '</div></section>'
    );
  }
  function speedCommands() {
    if (!state.author)
      return '<div class="runtime-panel runtime-speed-prompt">Touchez un joueur ou A pour saisir une action</div>';
    if (!state.action)
      return (
        '<div class="runtime-panel">' +
        authorChip(false) +
        inlineTools(false) +
        '<h2 class="runtime-question">Quelle action ?</h2>' +
        actionGrid(false) +
        '</div>'
      );
    return (
      '<div class="runtime-panel">' +
      authorChip(true) +
      inlineTools(true) +
      '<h2 class="runtime-question">Quel résultat ?</h2>' +
      resultGrid(false) +
      '</div>'
    );
  }
  function speedLayout() {
    return (
      '<section class="runtime-stage runtime-speed-layout"><div>' +
      courtSelector() +
      '</div>' +
      speedCommands() +
      '</section>'
    );
  }
  function flowLayout() {
    return (
      '<section class="runtime-stage runtime-flow"><div class="runtime-flow-block"><h3>1 · JOUEUR</h3><div class="runtime-panel">' +
      courtSelector() +
      '</div></div><div class="runtime-flow-block"><h3>2 · ACTION</h3><div class="runtime-panel">' +
      actionGrid(true) +
      '</div></div><div class="runtime-flow-block"><h3>3 · RÉSULTAT</h3><div class="runtime-panel">' +
      resultGrid(true) +
      '</div></div></section>'
    );
  }
  function lastEvent() {
    var list = events(),
      e = list[list.length - 1];
    if (!e) return 'Aucun événement enregistré.';
    if (e.type === 'SUBSTITUTION') return 'Dernière : remplacement #' + e.playerIn + ' / #' + e.playerOut;
    var who =
        e.authorSide === 'AWAY' || e.player === 'A' ? 'A' : '#' + (e.playerNumber != null ? e.playerNumber : e.player),
      a = e.actionCode || (actionMeta(e.action) || {}).code || String(e.action || '').toUpperCase(),
      s =
        e.status === 'POSITIVE' || e.result === 'point'
          ? '+'
          : e.status === 'ERROR' || e.result === 'error'
            ? '×'
            : '−';
    return 'Dernière : ' + who + ' · ' + a + ' ' + s;
  }
  function modes() {
    return (
      '<nav class="runtime-mode-tabs" aria-label="Mode de saisie">' +
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
    var body = state.mode === 'FOCUS' ? focusLayout() : state.mode === 'SPEED' ? speedLayout() : flowLayout();
    return (
      '<div class="runtime-shell" data-runtime-layout="' +
      state.mode +
      '">' +
      modes() +
      body +
      '<p class="runtime-error" role="alert">' +
      esc(state.error) +
      '</p><div class="runtime-footer"><div class="runtime-last"><b>' +
      esc(lastEvent()) +
      '</b></div>' +
      (Subs
        ? '<button type="button" class="runtime-sub-open" data-runtime-sub-open aria-haspopup="dialog">⇄ Remplacement</button>'
        : '') +
      '<button type="button" class="runtime-undo" data-runtime-undo' +
      (events().length ? '' : ' disabled') +
      '>↶ Annuler</button></div><div class="runtime-feedback" id="runtimeFeedback" role="status" aria-live="polite">' +
      esc(state.feedback) +
      '</div></div>'
    );
  }
  function prefsHtml() {
    return (
      '<div class="runtime-prefs-card"><h2>Options de saisie runtime</h2><p>Le mode modifie uniquement l’interface. Les événements métier restent identiques.</p><div class="runtime-pref-modes">' +
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
      '</div><label class="runtime-switch"><span>Mettre en avant les actions par poste</span><input type="checkbox" data-runtime-highlight' +
      (prefs.runtimeHighlights ? ' checked' : '') +
      '></label><label class="runtime-switch"><span>Feedback haptique</span><input type="checkbox" data-runtime-haptic' +
      (prefs.runtimeHaptics ? ' checked' : '') +
      '></label><button type="button" class="runtime-prefs-close" data-runtime-close-options>TERMINÉ</button></div>'
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
          '</span><button type="button" class="runtime-options-button" data-runtime-options aria-label="Options de saisie">☰</button></div>'
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
    root.innerHTML = rootHtml();
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
    if (state.pending || Date.now() < state.lockedUntil) return;
    state.author = String(value);
    state.action = null;
    state.error = '';
    state.stage = 'action';
    render();
  }
  function chooseAction(value) {
    if (!state.author) {
      state.error = 'Sélectionnez d’abord un joueur ou A.';
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
  function patchCanonicalEvent(beforeScore, eventId) {
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
    e.actionCode = a ? a.code : String(e.action || '').toUpperCase();
    e.status = r ? r.code : String(e.result || '').toUpperCase();
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
  function commit(result) {
    if (state.pending || Date.now() < state.lockedUntil) return;
    if (!state.author) {
      state.error = 'Auteur manquant.';
      render();
      return;
    }
    if (!state.action) {
      state.error = 'Action manquante.';
      render();
      return;
    }
    if (!resultMeta(result)) {
      state.error = 'Résultat invalide.';
      render();
      return;
    }
    state.pending = true;
    state.error = '';
    var beforeCount = events().length,
      beforeScore = scoreNow(),
      eventId = uniqueEventId();
    VC.runtimeContext = { eventId: eventId, inputMode: state.mode };
    try {
      VC.commit(state.author, state.action, result);
    } catch (error) {
      state.pending = false;
      state.error = 'Enregistrement impossible : ' + ((error && error.message) || 'erreur inconnue');
      render();
      return;
    } finally {
      VC.runtimeContext = null;
    }
    if (events().length !== beforeCount + 1) {
      state.pending = false;
      state.error = 'L’événement n’a pas été enregistré. La sélection est conservée.';
      render();
      return;
    }
    var committed = patchCanonicalEvent(beforeScore, eventId),
      a = actionMeta(state.action),
      r = resultMeta(result);
    state.feedback = '✓ ' + authorText() + ' · ' + (a ? a.label : state.action) + ' ' + (r ? r.symbol : '');
    haptic();
    state.lockedUntil = Date.now() + 500;
    state.pending = false;
    clear(true);
    render();
    setTimeout(render, 520);
    document.dispatchEvent(new CustomEvent('volleylive:runtime-event', { detail: { event: committed } }));
  }
  function undo() {
    if (state.pending || Date.now() < state.lockedUntil) return;
    if (typeof VC.deleteLastAction !== 'function') {
      state.error = 'Annulation indisponible.';
      render();
      return;
    }
    var ok = VC.deleteLastAction();
    if (ok) {
      clear(true);
      state.feedback = 'Dernier événement annulé';
      state.lockedUntil = Date.now() + 460;
      render();
      setTimeout(render, 480);
    } else {
      state.error = 'Aucun événement à annuler.';
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
    if (su && (su.matchWinner || (su.current && su.current.winner)))
      return 'Set terminé : passez au set suivant pour effectuer un remplacement.';
    if (Subs.rallyInProgress(currentSetEvents()))
      return 'Remplacement impossible pendant un échange (règle 15.11.1.1). Terminez l’échange d’abord.';
    return '';
  }
  function subsOutStep(st, setNo) {
    var zones = ['p4', 'p3', 'p2', 'p5', 'p6', 'p1'];
    return (
      '<p class="runtime-subs-step">Joueur qui sort</p><div class="runtime-sub-grid">' +
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
            (withLibero ? ' · remplacé par le libéro' : '') +
            (possible ? '' : ' · aucun remplaçant autorisé') +
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
      '<p class="runtime-subs-step">Sort : #' +
      esc(out) +
      ' — joueur qui entre</p>' +
      (exceptional
        ? '<p class="runtime-subs-warning">Aucun remplacement régulier possible. Remplacement exceptionnel (blessure ou maladie, règle 15.7) : le joueur #' +
          esc(out) +
          ' ne pourra plus revenir dans le match.</p>'
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
        : '<p class="runtime-subs-warning">Aucun joueur ne peut entrer à la place du #' + esc(out) + '.</p>') +
      (o.refused.length
        ? '<details class="runtime-subs-refused"><summary>Joueurs non autorisés (' +
          o.refused.length +
          ')</summary><ul>' +
          o.refused
            .map(function (r) {
              return '<li><b>#' + esc(r.number) + '</b> ' + esc(r.reason) + '</li>';
            })
            .join('') +
          '</ul></details>'
        : '') +
      '<button type="button" class="runtime-subs-back" data-sub-back>← Changer le joueur qui sort</button>'
    );
  }
  function subsHtml() {
    var setNo = Number(M.currentSet || 1),
      h = Subs.history(M, setNo),
      blocked = subsBlocked(),
      st = rotationState(),
      body = blocked
        ? '<p class="runtime-subs-warning">' + esc(blocked) + '</p>'
        : subState.out == null
          ? subsOutStep(st, setNo)
          : subsInStep(st, setNo);
    return (
      '<div class="runtime-prefs-card runtime-subs-card" role="dialog" aria-modal="true" aria-labelledby="runtimeSubsTitle"><h2 id="runtimeSubsTitle">Remplacement</h2><p>Set ' +
      setNo +
      ' · ' +
      h.regular +
      '/' +
      Subs.REGULAR_LIMIT +
      ' remplacements' +
      (h.exceptional ? ' · ' + h.exceptional + ' exceptionnel' + (h.exceptional > 1 ? 's' : '') : '') +
      ' · règle 15 FIVB</p>' +
      (subState.error ? '<p class="runtime-subs-error" role="alert">' + esc(subState.error) + '</p>' : '') +
      body +
      '<button type="button" class="runtime-prefs-close" data-sub-close>FERMER</button></div>'
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
          : (exceptional ? '' : Subs.regularRefusal(M, setNo, st.rot, out, incoming)) ||
            'Remplacement non autorisé par la règle 15.');
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
    state.feedback = '⇄ #' + incoming + ' remplace #' + out + (exceptional ? ' (exceptionnel)' : '');
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
    if (target.dataset.subIn != null)
      substitute(subState.out, target.dataset.subIn, target.hasAttribute('data-sub-exceptional'));
  });
  document.getElementById('runtimePrefs').addEventListener('click', function (event) {
    var target = event.target.closest('button');
    if (!target) return;
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
    openSubstitution: openSubs,
    // Records a substitution after checking FIVB Rule 15; returns false (with the reason in the sheet) when refused.
    substitute: substitute,
  };
})();
