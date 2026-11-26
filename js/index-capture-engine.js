(function () {
  var m = null;
  try {
    m = JSON.parse(localStorage.getItem('volleyCapture.match.v1') || 'null');
  } catch (e) {}
  window.VOLLEY_MATCH = m;
  var nums = m && m.team && m.team.players && m.team.players.length ? m.team.players.slice() : [1, 2, 3, 4, 5, 6, 7];
  var info = {};
  ((m && m.team && m.team.roster) || []).forEach(function (r) {
    info[r.number] = r;
  });
  var esc = window.VolleyDom.esc;
  var LU = (m && m.startingLineup) || {},
    roleOf = {};
  [
    ['oh1', 'oh'],
    ['oh2', 'oh'],
    ['mb1', 'mb'],
    ['mb2', 'mb'],
    ['setter', 'setter'],
    ['opposite', 'opp'],
    ['libero', 'libero'],
  ].forEach(function (x) {
    if (LU[x[0]]) roleOf[LU[x[0]]] = x[1];
  });
  var RL = { setter: 'SET', oh: 'OH', mb: 'MB', opp: 'OPP', libero: 'LIB' };
  window.updateScoreService = function (side) {
    var board = document.getElementById('liveScore');
    if (!board) return;
    board.setAttribute('data-serving', side || '');
    board.querySelectorAll('.score-side').forEach(function (x) {
      x.classList.remove('serving');
    });
    var target = board.querySelector(side === 'A' ? '.side-a' : side === 'B' ? '.side-b' : '');
    if (target) target.classList.add('serving');
  };
  var g = document.querySelector('#capturePanel .touch-grid.players');
  function cell(n, zone, tag) {
    var i = info[n];
    return (
      (zone ? '<span class="pz">' + zone.toUpperCase() + '</span>' : '') +
      '<span class="pn">' +
      n +
      '</span>' +
      (i && i.name ? '<small>' + esc(i.name) + '</small>' : '') +
      (roleOf[n] ? '<span class="rl">' + RL[roleOf[n]] + '</span>' : '') +
      (tag ? '<small class="tag">' + esc(tag) + '</small>' : '')
    );
  }
  function pbtn(n, zone) {
    return '<button type="button" class="touch" data-player="' + n + '">' + cell(n, zone) + '</button>';
  }
  var advBtn = '<button type="button" class="touch adversary-btn" data-player="A">ADVERSE</button>';
  // v1.3.0 Focus: players with focus=false are not proposed individually; the TEAM button ("T") replaces them.
  function isFocus(n) {
    var i = info[n];
    return !(i && i.focus === false);
  }
  window.VolleyFocus = isFocus;
  var teamBtn =
    '<button type="button" class="touch team-focus-btn" id="teamFocusBtn" data-player="T" hidden>TEAM<small>players without focus</small></button>';
  // Rotation engine: js/index-rotation.js (window.VolleyRotation)
  var POS = window.VolleyRotation.POS,
    replay = window.VolleyRotation.replay,
    courtFrom = window.VolleyRotation.court;
  var rot0 = m && m.startingRotation,
    lib0 = m && m.startingLineup && m.startingLineup.libero;
  var ready = !!(rot0 && rot0.p1 && rot0.p2 && rot0.p3 && rot0.p4 && rot0.p5 && rot0.p6 && lib0);
  if (ready) {
    g.classList.add('court-mode');
    g.innerHTML =
      '<div class="court-status" id="courtStatus"></div><div class="phase-badge" id="phaseBadge" aria-live="polite"></div><div class="court-grid">' +
      POS.map(function (k) {
        return '<button type="button" class="touch" data-player="' + rot0[k] + '" data-zone="' + k + '"></button>';
      }).join('') +
      '</div>' +
      '<div class="bench-row"><button type="button" class="touch" id="benchBtn" data-player="' +
      lib0 +
      '"></button></div>' +
      '<div class="court-adv">' +
      teamBtn +
      advBtn +
      '</div>';
    g.insertAdjacentHTML(
      'afterend',
      '<button type="button" class="sub-toggle capture-sub-toggle" id="subToggle" aria-label="Changer de joueur">\u27F3 Changer de joueur</button><div class="sub-hint" id="subHint" hidden>Tap the player who leaves the court</div><div class="sub-log" id="subLog"></div>'
    );
    // Updates the existing buttons in place so their click handlers stay attached.
    window.updateCourt = function (evs) {
      var set = (evs || []).filter(function (e) {
        return (e.set || 1) === (m.currentSet || 1);
      });
      var st = replay(m, set),
        c = courtFrom(m, st.rot, st),
        anyNoFocus = false;
      window.__court = { st: st, c: c };
      POS.forEach(function (k) {
        var b = g.querySelector('[data-zone="' + k + '"]'),
          x = c[k];
        b.setAttribute('data-player', x.num);
        var fo = isFocus(x.num);
        if (!fo) anyNoFocus = true;
        b.className =
          'touch' +
          (roleOf[x.num] ? ' role-' + roleOf[x.num] : '') +
          (x.libero ? ' is-lib' : '') +
          (k === 'p1' && st.serving === 'A' ? ' is-srv' : '') +
          (fo ? '' : ' nofocus');
        b.innerHTML = fo
          ? cell(x.num, k, x.libero ? 'for #' + x.forNum : '')
          : '<span class="pz">' + k.toUpperCase() + '</span><span class="nf">TEAM</span>';
      });
      var bb = document.getElementById('benchBtn'),
        bfo = isFocus(c.bench);
      if (!bfo) anyNoFocus = true;
      bb.setAttribute('data-player', c.bench);
      bb.className = 'touch' + (roleOf[c.bench] ? ' role-' + roleOf[c.bench] : '') + (bfo ? '' : ' nofocus');
      bb.innerHTML = bfo ? cell(c.bench, '', c.bench === st.lib ? '' : 'out for LIB') : '<span class="nf">TEAM</span>';
      var tfb = document.getElementById('teamFocusBtn');
      if (tfb) tfb.hidden = !anyNoFocus;
      var sl = document.getElementById('subLog');
      sl.textContent = st.subs.length
        ? 'Subs set ' +
          (m.currentSet || 1) +
          ' (' +
          st.subs.length +
          '/6): ' +
          st.subs
            .map(function (x) {
              return '#' + x['in'] + ' for #' + x.out;
            })
            .join(' \u00B7 ')
        : '';
      var cs = document.getElementById('courtStatus'),
        tn = m.team.name || 'Team A';
      var pb = document.getElementById('phaseBadge');
      if (pb) {
        pb.className = 'phase-badge ' + (st.serving === 'A' ? 'srv' : 'rcv');
        pb.textContent = st.serving === 'A' ? 'SERVICE' : 'RECEPTION';
      }
      var setterZone = '';
      POS.some(function (k) {
        if (roleOf[st.rot[k]] === 'setter') {
          setterZone = k.slice(1);
          return true;
        }
        return false;
      });
      var rotationConfig = (st.rotations % 6) + 1,
        rotationCycle = Math.floor(st.rotations / 6) + 1;
      cs.className = 'court-status ' + (st.serving === 'A' ? 'srv' : 'rcv');
      cs.textContent = 'Rot. P' + (setterZone || '?') + ' | R' + rotationConfig + ' | C' + rotationCycle;
      if (window.updateScoreService) window.updateScoreService(st.serving);
    };
    // ---------- substitution mode ----------
    var POSROLE = {
      setter: 'setter',
      set: 'setter',
      oh: 'oh',
      outside: 'oh',
      mb: 'mb',
      middle: 'mb',
      opp: 'opp',
      opposite: 'opp',
      libero: 'libero',
      lib: 'libero',
    };
    (m.subs || []).forEach(function (x) {
      if (!roleOf[x['in']]) roleOf[x['in']] = (info[x['in']] && POSROLE[info[x['in']].position]) || roleOf[x.out];
    });
    var panel = document.getElementById('capturePanel'),
      tg = document.getElementById('subToggle'),
      hint = document.getElementById('subHint');
    var sheet = document.createElement('div');
    sheet.className = 'sub-sheet';
    sheet.hidden = true;
    document.body.appendChild(sheet);
    function setMode(on) {
      panel.classList.toggle('sub-mode', on);
      tg.classList.toggle('on', on);
      tg.textContent = on ? '\u2715 Annuler' : '\u27F3 Changer de joueur';
      tg.setAttribute('aria-label', on ? 'Annuler le changement de joueur' : 'Changer de joueur');
      hint.hidden = !on;
    }
    tg.addEventListener('click', function () {
      setMode(!panel.classList.contains('sub-mode'));
    });
    function positionOf(n) {
      var p = String((info[n] && info[n].position) || '').toLowerCase();
      return POSROLE[p] || p;
    }
    function openPicker(outNum, isLib) {
      var k = window.__court,
        onCourt = [];
      POS.forEach(function (z) {
        onCourt.push(k.c[z].num);
      });
      var outPosition = positionOf(outNum),
        avail = nums.filter(function (n) {
          return (
            n !== outNum &&
            onCourt.indexOf(n) < 0 &&
            info[n] &&
            info[n].present !== false &&
            positionOf(n) === outPosition
          );
        });
      var oi = info[outNum],
        h =
          '<div class="sub-card"><h3>' +
          (isLib ? 'Change libero' : 'Substitution') +
          ' \u00B7 #' +
          outNum +
          (oi && oi.name ? ' ' + esc(oi.name) : '') +
          ' out</h3><div class="sub-sub">Choose an available ' +
          (RL[outPosition] || outPosition.toUpperCase()) +
          ' player</div>';
      h += avail.length
        ? '<div class="sub-grid">' +
          avail
            .map(function (n) {
              var i = info[n];
              return (
                '<button type="button" data-in="' +
                n +
                '">' +
                n +
                '<small>' +
                esc((i && i.name) || '') +
                (i && i.position ? ' \u00B7 ' + (RL[POSROLE[i.position]] || '') : '') +
                '</small></button>'
              );
            })
            .join('') +
          '</div>'
        : '<div class="sub-empty">No player available on the bench (roster only has ' +
          nums.length +
          ' players).</div>';
      if (!avail.length)
        h = h.replace(
          'No player available on the bench (roster only has ' + nums.length + ' players).',
          'Aucun remplaçant disponible à ce poste'
        );
      h += '<button type="button" class="sub-cancel">CANCEL</button></div>';
      sheet.innerHTML = h;
      sheet.hidden = false;
      sheet.querySelector('.sub-cancel').onclick = function () {
        sheet.hidden = true;
      };
      sheet.querySelectorAll('[data-in]').forEach(function (b) {
        b.onclick = function () {
          doSub(outNum, +b.dataset['in']);
        };
      });
    }
    function doSub(outNum, inNum) {
      var cs = m.currentSet || 1,
        n = (m.subs || []).filter(function (x) {
          return x.set === cs;
        }).length;
      if (n >= 6 && !confirm('6 substitutions already used in this set. Record anyway?')) return;
      var evs = [];
      try {
        evs = JSON.parse(localStorage.getItem('volleyCapture.events.v1') || '[]');
      } catch (e) {}
      var at = evs.filter(function (e) {
        return (e.set || 1) === cs;
      }).length;
      var rally =
          evs.filter(function (e) {
            return (e.set || 1) === cs && !!e.winningTeam;
          }).length + 1,
        position = positionOf(outNum),
        now = new Date(),
        sc = window.VolleySets.score(evs, cs);
      var subEvent = {
        id: evs.length + 1,
        type: 'SUBSTITUTION',
        eventType: 'SUBSTITUTION',
        set: cs,
        rally: rally,
        timestamp: now.toISOString(),
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        action: 'substitution',
        result: 'neutral',
        player: inNum,
        playerOut: outNum,
        playerIn: inNum,
        position: position,
        winningTeam: null,
        pointOrigin: null,
        rotation: replay(
          m,
          evs.filter(function (e) {
            return (e.set || 1) === cs;
          })
        ).rotations,
        scoreA: sc.a,
        scoreB: sc.b,
      };
      m.subs = m.subs || [];
      m.subs.push({
        set: cs,
        at: at,
        rally: rally,
        out: outNum,
        in: inNum,
        position: position,
        eventId: subEvent.id,
        ts: subEvent.timestamp,
      });
      if (!roleOf[inNum]) roleOf[inNum] = (info[inNum] && POSROLE[info[inNum].position]) || roleOf[outNum];
      localStorage.setItem('volleyCapture.match.v1', JSON.stringify(m));
      sheet.hidden = true;
      setMode(false);
      if (window.VLCLogSubstitution) window.VLCLogSubstitution(subEvent);
      else {
        evs.push(subEvent);
        localStorage.setItem('volleyCapture.events.v1', JSON.stringify(evs));
        window.updateCourt(evs);
      }
      var stt = document.getElementById('captureStatus');
      if (stt) stt.textContent = 'Substitution: #' + inNum + ' in for #' + outNum;
    }
    // capture phase: intercepts court taps before the normal input flow
    g.addEventListener(
      'click',
      function (e) {
        if (!panel.classList.contains('sub-mode')) return;
        var b = e.target.closest('.court-grid [data-player], .bench-row [data-player]');
        if (!b) return;
        e.stopPropagation();
        e.preventDefault();
        var num = +b.getAttribute('data-player'),
          k = window.__court,
          isLib = num === k.st.lib;
        openPicker(num, isLib);
      },
      true
    );
    window.undoLastSub = function (evs) {
      // removes a substitution only when it is the latest logged event
      var cs = m.currentSet || 1,
        sb = m.subs || [],
        last = evs.length ? evs[evs.length - 1] : null;
      for (var i = sb.length - 1; i >= 0; i--) {
        if (sb[i].set === cs) {
          var same =
            last && last.type === 'SUBSTITUTION' && last.playerOut === sb[i].out && last.playerIn === sb[i]['in'];
          if (same) {
            var r = sb.splice(i, 1)[0];
            evs.pop();
            localStorage.setItem('volleyCapture.match.v1', JSON.stringify(m));
            localStorage.setItem('volleyCapture.events.v1', JSON.stringify(evs));
            window.updateCourt(evs);
            return r;
          }
          break;
        }
      }
      return null;
    };
    window.updateCourt([]);
  } else {
    var fN = nums.filter(isFocus);
    g.innerHTML =
      fN
        .map(function (n) {
          return pbtn(n, '');
        })
        .join('') +
      (fN.length < nums.length ? teamBtn.replace(' hidden', '') : '') +
      advBtn;
  }
  if (m) {
    document.getElementById('captureTitle').textContent =
      m.team.name + ' vs ' + m.opponent.name + ' · Set ' + m.currentSet;
  }
})();
