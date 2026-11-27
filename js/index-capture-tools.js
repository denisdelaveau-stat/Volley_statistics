/* VolleyLive capture screen controller: history panel, action input, persistence, history, sets and undo. */
(function () {
  // Player names, team names and event fields come from user input or imported files: escape them in HTML.
  var esc = window.VolleyDom.esc;
  var historyToggle = document.getElementById('historyToggle');
  var historyPanel = document.getElementById('historyPanel');
  var historyArrow = document.getElementById('historyArrow');
  historyToggle.addEventListener('click', function () {
    var open = historyToggle.getAttribute('aria-expanded') === 'true';
    open = !open;
    historyToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    historyPanel.hidden = !open;
    historyArrow.textContent = open ? '▲' : '▼';
  });
  var VC = window.VolleyCapture;
  var i18n = window.VolleyI18n;
  // Chart data (volleyCapture.chartData.v1): one point per scoring rally of the current set. Nothing is drawn on this
  // screen; the data is saved with the match and read by the Match Hub and statistics/adapter.js.
  var STORAGE_DATA = window.VolleyDomain.STORAGE.captureChartData,
    STORAGE_EVENTS = window.VolleyDomain.STORAGE.captureEvents,
    storedData = window.VolleyDomain.readStored(STORAGE_DATA, null),
    DATA = Array.isArray(storedData)
      ? storedData.map(function (p) {
          if (p && p.c === 'A') p.c = 0;
          return p;
        })
      : [];
  // ---- tablet capture, persistence and export ----
  (function captureModule() {
    var EVENTS = [];
    try {
      EVENTS = JSON.parse(localStorage.getItem(STORAGE_EVENTS) || '[]');
      if (!Array.isArray(EVENTS)) EVENTS = [];
    } catch (e) {
      EVENTS = [];
    }
    // Action being committed; set by VolleyCapture.commit (runtime-input.js owns the input UI).
    var choice = { player: null, action: null, result: null };
    function rosterInfo(n) {
      var r = (VC.match && VC.match.team && VC.match.team.roster) || [];
      for (var i = 0; i < r.length; i++) {
        if (r[i].number === Number(n)) return r[i];
      }
      return null;
    }
    var status = document.getElementById('captureStatus'),
      hist = document.getElementById('captureHistory'),
      score = document.getElementById('liveScore');
    var MATCH = VC.match,
      VS = window.VolleySets,
      KM_ = window.VolleyDomain.STORAGE.captureMatch;
    function curSet() {
      return (MATCH && MATCH.currentSet) || 1;
    }
    function lastScore() {
      if (MATCH) return VS.score(EVENTS, curSet());
      var p = DATA.length ? DATA[DATA.length - 1] : null;
      return { a: p ? p.a : 0, b: p ? p.b : 0 };
    }
    function rebuildData() {
      // chart data = scoring rallies of the current set, rebuilt from events
      if (!MATCH) return;
      DATA.length = 0;
      EVENTS.forEach(function (e) {
        if ((e.set || 1) !== curSet() || !e.winningTeam) return;
        DATA.push({
          n: DATA.length + 1,
          a: e.scoreA,
          b: e.scoreB,
          w: e.winningTeam === 'team1' ? 'A' : 'B',
          c: e.player === 'A' ? 0 : e.player,
          action: e.action,
          result: e.result,
          winningTeam: e.winningTeam,
          pointOrigin: e.pointOrigin,
          ts: e.timestamp,
        });
      });
    }
    function saveMatch() {
      localStorage.setItem(KM_, JSON.stringify(MATCH));
    }
    function tn(t) {
      return t === 'team1'
        ? (MATCH && MATCH.team.name) || i18n.t('common.teamA')
        : (MATCH && MATCH.opponent.name) || i18n.t('common.teamB');
    }
    VC.buildReport = function () {
      return window.VolleyReport.build(MATCH, EVENTS);
    };
    VC.commit = function (p, a, r) {
      choice = { player: p, action: a, result: r };
      commit(p);
    };
    function renderSets() {
      var line = document.getElementById('setsLine'),
        box = document.getElementById('setOver'),
        panel = document.getElementById('capturePanel');
      if (!MATCH) {
        line.innerHTML = '';
        box.hidden = true;
        panel.classList.remove('locked');
        return;
      }
      var su = VS.summary(MATCH, EVENTS);
      line.innerHTML = '';
      var c = su.current,
        t = document.getElementById('setOverTitle'),
        tx = document.getElementById('setOverText'),
        nb = document.getElementById('nextSetBtn');
      if (su.matchWinner) {
        box.hidden = false;
        box.className = 'set-over match';
        t.textContent = i18n.t('capture.matchWonBy', { team: tn(su.matchWinner).toUpperCase() });
        tx.textContent =
          i18n.t('capture.setsScore', { a: su.wonA, b: su.wonB }) +
          ' \u00B7 ' +
          su.sets
            .map(function (x) {
              return x.a + '-' + x.b;
            })
            .join(', ');
        nb.textContent = i18n.t('capture.matchFinished');
        nb.dataset.mode = 'finished';
        nb.disabled = true;
        panel.classList.add('locked');
        if (MATCH.status !== 'completed') {
          MATCH.status = 'completed';
          saveMatch();
        }
      } else if (c && c.winner) {
        box.hidden = false;
        box.className = 'set-over set';
        nb.disabled = false;
        t.textContent = i18n.t('capture.setFinished', { set: c.set });
        tx.textContent =
          i18n.t('capture.setWonBy', { team: tn(c.winner), score: Math.max(c.a, c.b) + '-' + Math.min(c.a, c.b) }) +
          ' \u00B7 ' +
          i18n.t('capture.setsScore', { a: su.wonA, b: su.wonB });
        nb.textContent = i18n.t(c.set + 1 === VS.decidingSet(MATCH) ? 'capture.startDecidingSet' : 'capture.startSet', {
          set: c.set + 1,
        });
        nb.dataset.mode = 'next';
        nb.disabled = false;
        panel.classList.add('locked');
      } else {
        box.hidden = true;
        nb.disabled = false;
        panel.classList.remove('locked');
        if (MATCH.status === 'completed') {
          MATCH.status = 'in_progress';
          saveMatch();
        }
      }
    }
    var deleteLockedUntil = 0,
      deleteTimer = null,
      DELETE_LOCK_MS = 450;
    function isDeleteLocked() {
      return Date.now() < deleteLockedUntil;
    }
    function armDeleteGuard() {
      deleteLockedUntil = Date.now() + DELETE_LOCK_MS;
      clearTimeout(deleteTimer);
      deleteTimer = setTimeout(function () {
        render();
      }, DELETE_LOCK_MS);
    }
    // Action codes are stored in the events; only their labels are translated (action.* keys).
    function actionLabel(code) {
      var key = 'action.' + code;
      var label = i18n.t(key);
      return label === key ? code : label;
    }
    function historyRow(e, isLatest) {
      var tr = document.createElement('tr'),
        rk = e.result === 'error' ? 'error' : e.result === 'point' ? 'point' : 'neutral',
        rl = i18n.t(
          rk === 'error' ? 'capture.resultError' : rk === 'point' ? 'capture.resultPoint' : 'capture.resultNeutral'
        );
      if (isLatest) tr.className = 'history-latest';
      tr.innerHTML =
        '<td>' +
        esc(e.id) +
        '</td><td>' +
        esc(e.player) +
        '</td><td>' +
        esc(actionLabel(e.action)) +
        '</td><td><span class="result-badge result-' +
        rk +
        '">' +
        esc(rl) +
        '</span></td><td><div class="history-score-cell"><span>' +
        esc(e.scoreA) +
        ' : ' +
        esc(e.scoreB) +
        '</span>' +
        (isLatest
          ? '<button type="button" class="history-delete" data-delete-last aria-label="' +
            esc(i18n.t('capture.deleteLast')) +
            '" title="' +
            esc(i18n.t('capture.deleteLast')) +
            '"' +
            (isDeleteLocked() ? ' disabled' : '') +
            '>' +
            esc(i18n.t('capture.delete')) +
            '</button>'
          : '') +
        '</div></td>';
      return tr;
    }
    function render() {
      var sc = lastScore(),
        suHead = MATCH ? VS.summary(MATCH, EVENTS) : { wonA: 0, wonB: 0 };
      score.classList.remove('lead', 'trail', 'tie');
      score.classList.add(sc.a > sc.b ? 'lead' : sc.a < sc.b ? 'trail' : 'tie');
      score.innerHTML =
        '<span class="set-badge set-badge-a" aria-label="' +
        esc(i18n.t('capture.setsWonBy', { team: tn('team1') })) +
        '">' +
        esc(suHead.wonA) +
        '</span><span class="score-side side-a"><span class="digit-box" aria-label="' +
        esc(i18n.t('capture.teamScore', { team: tn('team1') })) +
        '">' +
        esc(sc.a) +
        '</span><span class="service-line" aria-hidden="true"></span></span><span class="sep">:</span><span class="score-side side-b"><span class="digit-box" aria-label="' +
        esc(i18n.t('capture.teamScore', { team: tn('team2') })) +
        '">' +
        esc(sc.b) +
        '</span><span class="service-line" aria-hidden="true"></span></span><span class="set-badge set-badge-b" aria-label="' +
        esc(i18n.t('capture.setsWonBy', { team: tn('team2') })) +
        '">' +
        esc(suHead.wonB) +
        '</span>';
      score.title =
        tn('team1') + ' ' + sc.a + ' : ' + sc.b + ' ' + tn('team2') + ' · Sets ' + suHead.wonA + ' : ' + suHead.wonB;
      hist.innerHTML = '';
      renderSets();
      if (!EVENTS.length) {
        var empty = document.createElement('tr');
        empty.className = 'history-empty';
        empty.innerHTML = '<td colspan="5">' + esc(i18n.t('capture.noAction')) + '</td>';
        hist.appendChild(empty);
      } else
        EVENTS.slice()
          .reverse()
          .forEach(function (e, index) {
            hist.appendChild(historyRow(e, index === 0));
          });
      status.innerHTML = EVENTS.length
        ? '<span class="last-event">' +
          esc(i18n.t('capture.last')) +
          '</span> #' +
          esc(EVENTS[EVENTS.length - 1].player) +
          ' ' +
          esc(actionLabel(EVENTS[EVENTS.length - 1].action)) +
          ' / ' +
          esc(EVENTS[EVENTS.length - 1].result)
        : esc(i18n.t('capture.ready'));
      if (VC.refreshCourt) VC.refreshCourt(EVENTS);
    }
    function persist(msg) {
      localStorage.setItem(STORAGE_DATA, JSON.stringify(DATA));
      localStorage.setItem(STORAGE_EVENTS, JSON.stringify(EVENTS));
      if (msg) status.textContent = msg;
    }
    VC.logSubstitution = function (ev) {
      EVENTS.push(ev);
      persist();
      render();
    };
    function currentRotationNumber() {
      if (!MATCH || !MATCH.startingRotation || !window.VolleyRotation) return null;
      var cs = MATCH.currentSet || 1,
        setEvents = EVENTS.filter(function (e) {
          return (e.set || 1) === cs;
        });
      return window.VolleyRotation.replay(MATCH, setEvents).rotations;
    }
    function commit(player) {
      if (MATCH) {
        var su0 = VS.summary(MATCH, EVENTS);
        if (su0.matchWinner || (su0.current && su0.current.winner)) {
          renderSets();
          return;
        }
      }
      var sc = lastScore(),
        a = sc.a,
        b = sc.b;
      var playerValue = player === 'A' || player === 'T' ? player : Number(player);
      var winningTeam = null,
        pointOrigin = null;
      if (choice.result === 'point') {
        if (playerValue === 'A') {
          winningTeam = 'team2';
          pointOrigin = 'earned';
        } else {
          winningTeam = 'team1';
          pointOrigin = 'earned';
        }
      } else if (choice.result === 'error') {
        if (playerValue === 'A') {
          winningTeam = 'team1';
          pointOrigin = 'opponent_error';
        } else {
          winningTeam = 'team2';
          pointOrigin = 'opponent_error';
        }
      }
      if (winningTeam === 'team1') a++;
      else if (winningTeam === 'team2') b++;
      var runtimeContext = VC.runtimeContext || {},
        runtimePlayer = playerValue === 'A' || playerValue === 'T' ? null : rosterInfo(playerValue),
        runtimeRole = runtimePlayer
          ? window.VolleyDomain.ROLE_CODES[runtimePlayer.position] || String(runtimePlayer.position || '').toUpperCase()
          : 'OPPONENT',
        runtimeAction =
          {
            service: 'SERVE',
            reception: 'RECEPTION',
            set: 'SET',
            attack: 'ATTACK',
            block: 'BLOCK',
            defense: 'DEFENCE',
            freeball: 'RELANCE',
          }[choice.action] || String(choice.action || '').toUpperCase(),
        runtimeStatus =
          { point: 'POSITIVE', neutral: 'NEUTRAL', error: 'ERROR' }[choice.result] ||
          String(choice.result || '').toUpperCase();
      var ev = {
        id: EVENTS.length + 1,
        eventId:
          runtimeContext.eventId || 'evt_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9),
        set: (VC.match && VC.match.currentSet) || 1,
        setNumber: (VC.match && VC.match.currentSet) || 1,
        timestamp: new Date().toISOString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        authorSide: playerValue === 'A' ? 'AWAY' : 'HOME',
        playerId: runtimePlayer ? 'player_' + runtimePlayer.number : null,
        playerNumber: runtimePlayer ? Number(runtimePlayer.number) : null,
        playerRole: runtimeRole,
        action: choice.action,
        actionCode: runtimeAction,
        result: choice.result,
        status: runtimeStatus,
        player: playerValue,
        winningTeam: winningTeam,
        pointOrigin: pointOrigin,
        rotation: currentRotationNumber(),
        scoreBefore: { home: sc.a, away: sc.b },
        scoreAfter: { home: a, away: b },
        scoreA: a,
        scoreB: b,
        inputMode: runtimeContext.inputMode || 'LEGACY',
        schemaVersion: 'runtime-input-v1',
      };
      if (
        EVENTS.some(function (existing) {
          return existing.eventId && existing.eventId === ev.eventId;
        })
      ) {
        status.textContent = i18n.t('capture.duplicate');
        return;
      }
      EVENTS.push(ev);
      if (choice.result !== 'neutral')
        DATA.push({
          n: DATA.length + 1,
          a: a,
          b: b,
          w: winningTeam === 'team1' ? 'A' : 'B',
          c: playerValue === 'A' ? 0 : playerValue,
          action: choice.action,
          result: choice.result,
          winningTeam: winningTeam,
          pointOrigin: pointOrigin,
          ts: ev.timestamp,
        });
      persist();
      choice = { player: null, action: null, result: null };
      render();
    }
    function removeSubstitutionForEvent(e) {
      if (!MATCH || !e || (e.type !== 'SUBSTITUTION' && e.eventType !== 'SUBSTITUTION' && e.action !== 'substitution'))
        return false;
      var subs = MATCH.subs || [],
        before = subs.length;
      MATCH.subs = subs.filter(function (s) {
        if (s.eventId != null && e.id != null) return String(s.eventId) !== String(e.id);
        return !(
          Number(s.set || 1) === Number(e.set || 1) &&
          Number(s.out) === Number(e.playerOut) &&
          Number(s['in']) === Number(e.playerIn) &&
          String(s.ts || '') === String(e.timestamp || '')
        );
      });
      return MATCH.subs.length !== before;
    }
    function deleteLastAction() {
      if (isDeleteLocked()) {
        VC.deletesBlocked++;
        return false;
      }
      if (!EVENTS.length) {
        status.textContent = i18n.t('capture.nothingToDelete');
        render();
        return false;
      }
      armDeleteGuard();
      var e = EVENTS.pop(),
        matchChanged = removeSubstitutionForEvent(e);
      if (MATCH && Number(curSet()) > Number(e.set || 1)) {
        MATCH.currentSet = Number(e.set || 1);
        matchChanged = true;
      }
      if (matchChanged) saveMatch();
      if (MATCH) rebuildData();
      else if (e.result !== 'neutral') DATA.pop();
      persist();
      choice = { player: null, action: null, result: null };
      render();
      return true;
    }
    hist.addEventListener('click', function (event) {
      var button = event.target.closest && event.target.closest('[data-delete-last]');
      if (!button || !hist.contains(button)) return;
      event.preventDefault();
      event.stopPropagation();
      deleteLastAction();
    });
    VC.deleteLastAction = deleteLastAction;
    // Next set: the coach confirms or changes the line-up first (FIVB 7.3.2, js/index-set-lineup.js), stored in
    // match.setLineups[set]; then the capture screen restarts on the new set.
    document.getElementById('nextSetBtn').addEventListener('click', function () {
      var su = VS.summary(MATCH, EVENTS);
      if (!su.current || !su.current.winner || su.matchWinner) return;
      var next = curSet() + 1;
      window.VolleySetLineup.open(MATCH, next, function (lineup) {
        MATCH.setLineups = MATCH.setLineups || {};
        MATCH.setLineups[next] = lineup;
        MATCH.currentSet = next;
        saveMatch();
        DATA.length = 0;
        persist();
        sessionStorage.setItem(window.VolleyDomain.STORAGE.captureStage, 'capture');
        location.reload();
      });
    });
    if (MATCH) {
      rebuildData();
      persist();
    }
    render();
  })();
})();
