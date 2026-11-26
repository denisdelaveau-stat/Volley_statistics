(function () {
  var KE = 'volleyCapture.events.v1',
    KD = 'volleyCapture.chartData.v1',
    KM = 'volleyCapture.match.v1',
    STAGE = 'volleyCapture.stage';
  var LIBK = 'volleyCapture.library.v1',
    SETK = 'volleyCapture.settings.v1';
  var $ = function (id) {
      return document.getElementById(id);
    },
    home = $('homeScreen'),
    setupCaptureScreen = $('setupCaptureScreen'),
    insightsScreen = $('insightsScreen'),
    matchHubScreen = $('matchHubScreen'),
    matchLibraryScreen = $('matchLibraryScreen'),
    setup = $('setupScreen'),
    teams = $('teamsScreen'),
    settings = $('settingsScreen');
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function defName(team, opp) {
    return (team || 'Team_A') + '_vs_' + (opp || 'Opponent') + '_' + today();
  }
  function fileName(n) {
    return (
      String(n || 'match')
        .trim()
        .replace(/[\\/:*?"<>|]+/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 80) + '.json'
    );
  }
  window.defName = function () {
    return defName(S.teamName, S.opp);
  };
  window.fileName = fileName;
  function libGet() {
    try {
      var l = JSON.parse(localStorage.getItem(LIBK) || '{}');
      return { team: l.team || {}, lineup: l.lineup || {}, rot: l.rot || {} };
    } catch (e) {
      return { team: {}, lineup: {}, rot: {} };
    }
  }
  function libPut(l) {
    localStorage.setItem(LIBK, JSON.stringify(l));
  }
  function settingsGet() {
    try {
      var x = JSON.parse(localStorage.getItem(SETK) || '{}');
      return { setsToWin: x.setsToWin === 2 ? 2 : 3 };
    } catch (e) {
      return { setsToWin: 3 };
    }
  }
  function settingsPut(x) {
    localStorage.setItem(SETK, JSON.stringify(x));
  }
  function hideAll() {
    home.hidden = true;
    setupCaptureScreen.hidden = true;
    insightsScreen.hidden = true;
    matchHubScreen.hidden = true;
    matchLibraryScreen.hidden = true;
    setup.hidden = true;
    teams.hidden = true;
    settings.hidden = true;
  }
  function show(el) {
    hideAll();
    el.hidden = false;
    el.scrollTop = 0;
  }
  function roleClass(pos) {
    return 'role-' + (pos || '');
  }
  var PLAB = { setter: 'SET', oh: 'OH', mb: 'MB', opp: 'OPP', libero: 'LIB' };
  function teamRows(name, d) {
    var out = [];
    ((d && d.roster) || []).forEach(function (n) {
      var i = (d.info && d.info[n]) || {};
      out.push({ number: +n, name: i.name || '', pos: i.pos || i.position || '' });
    });
    return out;
  }
  function teamNames() {
    return Object.keys(libGet().team).sort(function (a, b) {
      return a.localeCompare(b);
    });
  }
  function buildMatchFile() {
    var m = null,
      e = [],
      d = [];
    try {
      m = JSON.parse(localStorage.getItem(KM) || 'null');
    } catch (x) {}
    try {
      e = JSON.parse(localStorage.getItem(KE) || '[]');
    } catch (x) {}
    try {
      d = JSON.parse(localStorage.getItem(KD) || '[]');
    } catch (x) {}
    var p = d.length ? d[d.length - 1] : { a: 0, b: 0 };
    return {
      format: 'volley-live-capture',
      version: 1,
      savedAt: new Date().toISOString(),
      match: m,
      score: { team1: p.a || 0, team2: p.b || 0 },
      events: e,
      chartData: d,
    };
  }
  function saveJson() {
    var f = buildMatchFile(),
      name = fileName((f.match && f.match.name) || defName());
    var txt = JSON.stringify(f, null, 2),
      blob = new Blob([txt], { type: 'application/json' });
    try {
      var file = new File([blob], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] }) && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
        navigator.share({ files: [file], title: name }).catch(function () {});
        return name;
      }
    } catch (x) {}
    var u = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = u;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(u);
    }, 1500);
    return name;
  }
  window.saveMatchJson = saveJson;
  var sj = $('captureSaveJson');
  if (sj)
    sj.addEventListener('click', function () {
      var n = saveJson();
      $('fileStatus').textContent = 'Saved file: ' + n;
    });
  function updateHome() {
    var ev = [],
      dt = [],
      match = null;
    try {
      ev = JSON.parse(localStorage.getItem(KE) || '[]');
    } catch (e) {}
    try {
      dt = JSON.parse(localStorage.getItem(KD) || '[]');
    } catch (e) {}
    try {
      match = JSON.parse(localStorage.getItem(KM) || 'null');
    } catch (e) {}
    var c = $('homeContinue'),
      info = $('homeContinueInfo');
    c.disabled = !match;
    if (!match) {
      info.textContent = 'NO SAVED MATCH';
      return;
    }
    var p = dt.length ? dt[dt.length - 1] : { a: 0, b: 0 };
    info.textContent =
      (match.name ? match.name + ' · ' : '') +
      (match.team.name || 'Team A') +
      ' vs ' +
      (match.opponent.name || 'Team B') +
      ' · SET ' +
      (match.currentSet || 1) +
      ' · ' +
      ev.length +
      ' EVENTS · ' +
      (p.a || 0) +
      ':' +
      (p.b || 0);
  }
  $('homeContinue').addEventListener('click', function () {
    if (!this.disabled) {
      hideAll();
      window.scrollTo(0, 0);
    }
  });
  $('homeSetupCapture').addEventListener('click', function () {
    show(setupCaptureScreen);
    $('setupCaptureBack').focus();
  });
  $('setupCaptureBack').addEventListener('click', function () {
    show(home);
    $('homeSetupCapture').focus();
  });
  $('homeInsights').addEventListener('click', function () {
    show(insightsScreen);
    $('insightsBack').focus();
  });
  $('insightsBack').addEventListener('click', function () {
    show(home);
    $('homeInsights').focus();
  });
  $('setupMatchCapture').addEventListener('click', function () {
    show(matchHubScreen);
    if (window.VolleyMatchHub) window.VolleyMatchHub.refresh();
    $('matchHubBack').focus();
  });
  $('matchHubBack').addEventListener('click', function () {
    show(setupCaptureScreen);
    $('setupMatchCapture').focus();
  });

  // Shared shell helpers consumed by team-management.js and settings.js.
  window.VolleyShell = {
    $: $,
    esc: esc,
    libGet: libGet,
    libPut: libPut,
    settingsGet: settingsGet,
    settingsPut: settingsPut,
    show: show,
    updateHome: updateHome,
    teamRows: teamRows,
    PLAB: PLAB,
    screens: { home: home, setupCaptureScreen: setupCaptureScreen, teams: teams, settings: settings },
  };

  // ---------- NEW MATCH ----------
  var S = {
    step: 0,
    teamKey: '',
    teamName: '',
    opp: '',
    name: '',
    nameAuto: true,
    roster: [],
    sort: 'number',
    setterZone: 'p1',
    assign: {},
    first: null,
    pickerRole: null,
  };
  var ROLE_KEYS = ['setter', 'oh1', 'mb1', 'opp', 'oh2', 'mb2', 'libero'],
    ROLE_POS = { setter: 'setter', oh1: 'oh', oh2: 'oh', mb1: 'mb', mb2: 'mb', opp: 'opp', libero: 'libero' },
    ROLE_LABEL = { setter: 'SETTER', oh1: 'OH 1', mb1: 'MB 1', opp: 'OPP', oh2: 'OH 2', mb2: 'MB 2', libero: 'LIBÉRO' };
  var COURT = ['p4', 'p3', 'p2', 'p5', 'p6', 'p1'];
  function selectedTeam() {
    return libGet().team[S.teamKey];
  }
  function loadSetupTeam(key) {
    var d = libGet().team[key];
    S.teamKey = key;
    S.teamName = d ? d.team || key : '';
    S.roster = d
      ? teamRows(key, d).map(function (r) {
          return { number: r.number, name: r.name, pos: r.pos, present: true, focus: true };
        })
      : [];
    S.assign = {};
    S.pickerRole = null;
    S.nameAuto = true;
    S.name = defName(S.teamName, S.opp);
  }
  function compatible(role) {
    var pos = ROLE_POS[role];
    return S.roster.filter(function (r) {
      return r.present && r.pos === pos;
    });
  }
  function player(n) {
    for (var i = 0; i < S.roster.length; i++) if (S.roster[i].number === n) return S.roster[i];
    return null;
  }
  function clearInvalidAssignments() {
    var used = {};
    ROLE_KEYS.forEach(function (k) {
      var n = S.assign[k],
        ok =
          n &&
          compatible(k).some(function (r) {
            return r.number === n;
          }) &&
          !used[n];
      if (ok) used[n] = 1;
      else S.assign[k] = null;
    });
  }
  function rosterError() {
    var present = S.roster.filter(function (r) {
      return r.present;
    });
    if (present.length < 7) return 'Sélectionne au moins 7 joueurs présents.';
    var need = { setter: 1, oh: 2, mb: 2, opp: 1, libero: 1 },
      missing = [];
    Object.keys(need).forEach(function (pos) {
      var count = present.filter(function (r) {
        return r.pos === pos;
      }).length;
      if (count < need[pos]) missing.push((PLAB[pos] || pos) + ' × ' + need[pos]);
    });
    return missing.length ? 'Postes manquants : ' + missing.join(', ') + '.' : '';
  }
  function lineupError() {
    var missing = ROLE_KEYS.filter(function (k) {
      return !S.assign[k];
    });
    return missing.length
      ? 'Sélectionne : ' +
          missing
            .map(function (k) {
              return ROLE_LABEL[k];
            })
            .join(', ') +
          '.'
      : '';
  }
  function rotation() {
    var z = +S.setterZone.slice(1),
      seq = ['setter', 'oh1', 'mb1', 'opp', 'oh2', 'mb2'],
      r = {},
      by = {};
    seq.forEach(function (k, i) {
      var zone = 'p' + (((z - 1 + i) % 6) + 1);
      r[zone] = S.assign[k] || null;
      by[zone] = k;
    });
    return { numbers: r, roles: by };
  }
  function sortedRoster() {
    var order = { setter: 0, oh: 1, mb: 2, opp: 3, libero: 4 };
    return S.roster.slice().sort(function (a, b) {
      if (S.sort === 'name') return (a.name || '').localeCompare(b.name || '') || a.number - b.number;
      if (S.sort === 'position') return order[a.pos] - order[b.pos] || a.number - b.number;
      return a.number - b.number;
    });
  }
  function rosterCard(r) {
    var i = S.roster.indexOf(r);
    return (
      '<article class="roster-player ' +
      roleClass(r.pos) +
      (r.present ? '' : ' absent') +
      '"><div class="roster-ball">' +
      r.number +
      '</div><div class="roster-player-name">' +
      esc(r.name) +
      '</div><div class="roster-player-role">' +
      (PLAB[r.pos] || '') +
      '</div><div class="roster-checks"><label><input type="checkbox" data-present="' +
      i +
      '"' +
      (r.present ? ' checked' : '') +
      '> Présent</label><label><input type="checkbox" data-focus="' +
      i +
      '"' +
      (r.focus ? ' checked' : '') +
      (r.present ? '' : ' disabled') +
      '> Focus</label></div></article>'
    );
  }
  function rotationSlot(zone, role, n) {
    var q = player(n),
      filled = !!q,
      pos = filled ? q.pos : ROLE_POS[role],
      cls =
        'rotation-slot ' +
        (filled ? roleClass(pos) + ' filled' : role === 'setter' ? 'role-setter setter-empty' : 'empty');
    return (
      '<button type="button" class="' +
      cls +
      '" data-rotation-role="' +
      role +
      '" aria-label="' +
      (filled ? 'Modifier ' + esc(q.name) : 'Sélectionner ' + ROLE_LABEL[role]) +
      '"><span class="rotation-circle">' +
      (filled ? n : '&nbsp;') +
      '</span><span class="rotation-slot-name">' +
      (filled ? esc(q.name) : '&nbsp;') +
      '</span><span class="rotation-slot-role">' +
      ROLE_LABEL[role] +
      '</span></button>'
    );
  }
  function playerPicker(role) {
    var choices = compatible(role),
      h =
        '<div class="rotation-picker"><div class="rotation-picker-head"><span>Sélectionne ' +
        ROLE_LABEL[role] +
        '</span><button type="button" class="rotation-picker-close" data-close-picker aria-label="Fermer">×</button></div><div class="rotation-picker-grid">';
    choices.forEach(function (r) {
      var inUse = Object.keys(S.assign).some(function (k) {
        return k !== role && S.assign[k] === r.number;
      });
      h +=
        '<button type="button" class="' +
        roleClass(r.pos) +
        (S.assign[role] === r.number ? ' selected' : '') +
        '" data-lineup-player="' +
        r.number +
        '"' +
        (inUse ? ' disabled' : '') +
        '>#' +
        r.number +
        '<small>' +
        esc(r.name) +
        '</small></button>';
    });
    return h + '</div></div>';
  }
  function renderSetup() {
    var names = teamNames(),
      body = $('suBody'),
      msg = $('suMsg'),
      next = $('suNext'),
      steps = document.querySelector('.su-steps');
    setup.setAttribute('data-setup-step', String(S.step));
    steps.hidden = S.step === 0;
    $('suS0').className = S.step === 0 ? 'on' : '';
    $('suS1').className = S.step === 1 ? 'on' : '';
    $('suS2').className = S.step === 2 ? 'on' : '';
    msg.textContent = '';
    next.hidden = false;
    if (S.step === 0) {
      $('suTitle').textContent = 'Sélectionne ton équipe';
      $('suSub').textContent = 'Prépare le nouveau match.';
      var opts =
        '<option value="">— sélectionne une équipe —</option>' +
        names
          .map(function (n) {
            return '<option value="' + esc(n) + '"' + (S.teamKey === n ? ' selected' : '') + '>' + esc(n) + '</option>';
          })
          .join('');
      var h =
        '<div class="setup-intro"><div class="su-card"><div class="setup-intro-title">Sélectionne ton équipe</div><select id="suTeamSelect" class="su-select"' +
        (names.length ? '' : ' disabled') +
        '>' +
        opts +
        '</select>' +
        (names.length
          ? ''
          : '<div class="su-hint">Aucune équipe configurée. Crée d’abord une équipe.</div><button type="button" class="add-player" id="suOpenTeams">OPEN TEAM MANAGEMENT</button>') +
        '</div>';
      if (S.teamKey)
        h +=
          '<div class="su-card"><label class="field-label" for="suOpp">Nom de l\'adversaire</label><input type="text" id="suOpp" autocomplete="off" placeholder="Nom de l\'adversaire" value="' +
          esc(S.opp) +
          '"><label class="field-label" for="suName">Match name</label><input type="text" id="suName" value="' +
          esc(S.name) +
          '"><div class="su-hint">Le nom du match est généré automatiquement et reste modifiable.</div></div>';
      body.innerHTML = h + '</div>';
      next.textContent = 'VALIDE';
      next.disabled = !S.teamKey || !S.opp.trim();
      return;
    }
    if (S.step === 1) {
      $('suTitle').textContent = 'SELECT TEAM';
      $('suSub').textContent = 'Confirme les joueurs présents et active le focus.';
      var err = rosterError(),
        h =
          '<div class="su-card"><div class="roster-toolbar"><label class="field-label" for="rosterSort">Trier par</label><select id="rosterSort" class="su-select"><option value="number"' +
          (S.sort === 'number' ? ' selected' : '') +
          '>Numéro de maillot</option><option value="position"' +
          (S.sort === 'position' ? ' selected' : '') +
          '>Poste</option><option value="name"' +
          (S.sort === 'name' ? ' selected' : '') +
          '>Nom</option></select></div><div class="roster-court"><div class="roster-grid">';
      sortedRoster().forEach(function (r) {
        h += rosterCard(r);
      });
      h += '</div></div></div>';
      body.innerHTML = h;
      next.textContent = 'NEXT →';
      next.disabled = !!err;
      if (err) msg.textContent = err;
      return;
    }
    $('suTitle').textContent = 'Initial rotation';
    $('suSub').textContent = 'Sélectionne les joueurs de la rotation puis le premier rôle du match.';
    clearInvalidAssignments();
    var rr = rotation(),
      rotationNumber = +S.setterZone.slice(1),
      h =
        '<section class="rotation-setup"><div class="setup-rotation-tabs" role="tablist" aria-label="Position initiale du passeur">';
    for (var z = 1; z <= 6; z++)
      h +=
        '<button type="button" data-setter-zone="p' +
        z +
        '" class="' +
        (S.setterZone === 'p' + z ? 'active' : '') +
        '" role="tab" aria-selected="' +
        (S.setterZone === 'p' + z ? 'true' : 'false') +
        '">P' +
        z +
        '</button>';
    h +=
      '</div><div class="rotation-board"><div class="rotation-board-head"><strong>Organisation actuelle</strong><span class="rotation-badge">Rotation ' +
      rotationNumber +
      '</span></div><div class="setup-orange-court"><div class="setup-rotation-grid">';
    COURT.forEach(function (zone) {
      h += rotationSlot(zone, rr.roles[zone], rr.numbers[zone]);
    });
    h += '</div></div>';
    if (S.pickerRole && S.pickerRole !== 'libero') h += playerPicker(S.pickerRole);
    var liberoPlayer = player(S.assign.libero),
      liberoName = (liberoPlayer && liberoPlayer.name) || '';
    h +=
      '<div class="libero-setup"><button type="button" class="libero-picker-button libero-seat role-libero' +
      (S.assign.libero ? ' selected' : ' empty') +
      '" data-rotation-role="libero" aria-label="' +
      (S.assign.libero ? 'Modifier le libéro' : 'Sélectionner le libéro') +
      '"><span class="libero-bench"><span class="libero-circle">' +
      (S.assign.libero ? S.assign.libero : 'L') +
      '</span></span><span class="libero-seat-name">' +
      (S.assign.libero ? esc(liberoName) : 'SÉLECTIONNER LE LIBÉRO') +
      '</span><small>LIBÉRO</small></button></div>';
    if (S.pickerRole === 'libero') h += playerPicker('libero');
    h +=
      '</div><div class="su-card first-rally-card"><label class="field-label">Premier rôle du match</label><div class="su-grid su-slots"><button type="button" class="su-btn' +
      (S.first === 'reception' ? ' sel' : '') +
      '" data-first="reception">RÉCEPTION</button><button type="button" class="su-btn' +
      (S.first === 'service' ? ' sel' : '') +
      '" data-first="service">SERVICE</button></div></div></section>';
    body.innerHTML = h;
    next.textContent = 'START MATCH';
    next.hidden = !S.first;
    var le = lineupError();
    next.disabled = !!le;
    if (le) msg.textContent = le;
  }
  function openSetup() {
    S = {
      step: 0,
      teamKey: '',
      teamName: '',
      opp: '',
      name: '',
      nameAuto: true,
      roster: [],
      sort: 'number',
      setterZone: 'p1',
      assign: {},
      first: null,
      pickerRole: null,
    };
    renderSetup();
    show(setup);
  }
  $('homeNew').addEventListener('click', openSetup);
  $('suBody').addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'suTeamSelect') {
      loadSetupTeam(t.value);
      renderSetup();
    } else if (t.id === 'rosterSort') {
      S.sort = t.value;
      renderSetup();
    } else if (t.dataset.present !== undefined) {
      var r = S.roster[+t.dataset.present];
      r.present = t.checked;
      if (!r.present) r.focus = false;
      else r.focus = true;
      clearInvalidAssignments();
      renderSetup();
    } else if (t.dataset.focus !== undefined) {
      S.roster[+t.dataset.focus].focus = t.checked;
    }
  });
  $('suBody').addEventListener('input', function (e) {
    if (e.target.id === 'suOpp') {
      S.opp = e.target.value;
      if (S.nameAuto) {
        S.name = defName(S.teamName, S.opp);
        var nameField = $('suName');
        if (nameField) nameField.value = S.name;
      }
      var n = $('suNext');
      if (n) n.disabled = !S.teamKey || !S.opp.trim();
    } else if (e.target.id === 'suName') {
      S.name = e.target.value;
      S.nameAuto = false;
    }
  });
  $('suBody').addEventListener('click', function (e) {
    var t = e.target.closest('button');
    if (!t) return;
    if (t.id === 'suOpenTeams') {
      window.VolleyTeams.open();
    } else if (t.dataset.setterZone) {
      S.setterZone = t.dataset.setterZone;
      S.pickerRole = null;
      renderSetup();
    } else if (t.dataset.rotationRole) {
      S.pickerRole = t.dataset.rotationRole;
      renderSetup();
    } else if (t.dataset.lineupPlayer) {
      S.assign[S.pickerRole] = +t.dataset.lineupPlayer;
      S.pickerRole = null;
      renderSetup();
    } else if (t.hasAttribute('data-close-picker')) {
      S.pickerRole = null;
      renderSetup();
    } else if (t.dataset.first) {
      S.first = t.dataset.first;
      renderSetup();
    }
  });
  $('suBack').addEventListener('click', function () {
    if (S.step === 2) {
      S.step = 1;
      S.pickerRole = null;
      renderSetup();
    } else if (S.step === 1) {
      S.step = 0;
      renderSetup();
    } else {
      show(matchHubScreen);
      updateHome();
      if (window.VolleyMatchHub) window.VolleyMatchHub.refresh();
    }
  });
  $('suNext').addEventListener('click', function () {
    if (S.step === 0) {
      S.opp = (($('suOpp') && $('suOpp').value) || S.opp).trim();
      S.name = (($('suName') && $('suName').value) || S.name || defName(S.teamName, S.opp)).trim();
      if (!S.teamKey) {
        $('suMsg').textContent = 'Sélectionne une équipe.';
        return;
      }
      if (!S.opp) {
        $('suMsg').textContent = "Entre le nom de l'adversaire.";
        return;
      }
      S.step = 1;
      renderSetup();
      setup.scrollTop = 0;
      return;
    }
    if (S.step === 1) {
      var re = rosterError();
      if (re) {
        $('suMsg').textContent = re;
        return;
      }
      S.step = 2;
      renderSetup();
      setup.scrollTop = 0;
      return;
    }
    var le = lineupError();
    if (le || !S.first) {
      $('suMsg').textContent = le || 'Sélectionne RÉCEPTION ou SERVICE.';
      return;
    }
    var rr = rotation(),
      present = S.roster.filter(function (r) {
        return r.present;
      }),
      m = {
        id: 'match_' + Date.now(),
        name: S.name || defName(S.teamName, S.opp),
        status: 'in_progress',
        detailLevel: 'advanced',
        createdAt: new Date().toISOString(),
        team: {
          name: S.teamName,
          rosterMax: 40,
          players: present.map(function (r) {
            return r.number;
          }),
          roster: S.roster.map(function (r) {
            return { number: r.number, name: r.name, position: r.pos, present: r.present, focus: r.present && r.focus };
          }),
        },
        opponent: { name: S.opp || 'Opponent' },
        startingLineup: {
          oh1: S.assign.oh1,
          oh2: S.assign.oh2,
          mb1: S.assign.mb1,
          mb2: S.assign.mb2,
          setter: S.assign.setter,
          opposite: S.assign.opp,
          libero: S.assign.libero,
        },
        startingRotation: {
          p1: rr.numbers.p1,
          p2: rr.numbers.p2,
          p3: rr.numbers.p3,
          p4: rr.numbers.p4,
          p5: rr.numbers.p5,
          p6: rr.numbers.p6,
        },
        firstRally: { antibesState: S.first },
        format: { setsToWin: settingsGet().setsToWin, setPoints: 25, decidingSetPoints: 15 },
        currentSet: 1,
        subs: [],
      };
    localStorage.setItem(KM, JSON.stringify(m));
    localStorage.setItem(KE, '[]');
    localStorage.setItem(KD, '[]');
    sessionStorage.setItem(STAGE, 'capture');
    location.reload();
  });

  var stage = sessionStorage.getItem(STAGE);
  sessionStorage.removeItem(STAGE);
  updateHome();
  if (stage === 'capture') home.hidden = true;
  else if (stage === 'setup') openSetup();
})();
