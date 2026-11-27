/* VolleyLive Team Management controller. Spec: docs/VolleyLive_Team_Management_Specification.md */
(function () {
  var shell = window.VolleyShell;
  if (!shell) return;
  var $ = shell.$,
    esc = shell.esc,
    t = window.VolleyI18n.t,
    libGet = shell.libGet,
    libPut = shell.libPut,
    show = shell.show,
    updateHome = shell.updateHome,
    teamRows = shell.teamRows,
    PLAB = shell.PLAB,
    teams = shell.screens.teams,
    setupCaptureScreen = shell.screens.setupCaptureScreen;
  var TS = { name: '', rows: [], selected: '', sort: 'number', dir: 1 };
  var ROLE_ORDER = { setter: 1, oh: 2, mb: 3, opp: 4, libero: 5 };
  function tmRoleClass(pos) {
    return 'tm-role-' + (pos || '');
  }
  function tmMessage(message, tone) {
    var el = $('teamsMsg');
    if (!el) return;
    el.textContent = message || '';
    if (tone) el.dataset.tone = tone;
    else el.removeAttribute('data-tone');
  }
  function tmInitials(name) {
    var words = String(name || '')
        .trim()
        .split(/\s+/),
      out = '';
    for (var i = 0; i < words.length && out.length < 2; i++) out += words[i].charAt(0).toUpperCase();
    return out || 'T';
  }
  function tmDate(value) {
    if (!value) return t('teams.savedTeam');
    var d = new Date(value);
    return isNaN(d.getTime())
      ? t('teams.savedTeam')
      : t('teams.updatedOn', { date: d.toLocaleDateString(window.VolleyI18n.lang()) });
  }
  function renderTeamOverview() {
    var library = libGet(),
      names = Object.keys(library.team).sort(function (a, b) {
        return a.localeCompare(b);
      }),
      body = $('teamsBody');
    $('teamCount').textContent = t(names.length === 1 ? 'teams.countOne' : 'teams.countMany', { count: names.length });
    if (!names.length) {
      body.innerHTML =
        '<div class="tm-empty"><strong>' +
        esc(t('teams.emptyTitle')) +
        '</strong><span>' +
        esc(t('teams.emptyHint')) +
        '</span></div>';
      return;
    }
    body.innerHTML = names
      .map(function (name) {
        var d = library.team[name] || {},
          count = (d.roster || []).length;
        return (
          '<div class="tm-team-row" role="button" tabindex="0" data-team-open="' +
          esc(name) +
          '" aria-label="' +
          esc(t('teams.editNamed', { name: name })) +
          '"><span class="tm-team-badge" aria-hidden="true">' +
          esc(tmInitials(name)) +
          '</span><span class="tm-team-copy"><strong>' +
          esc(name) +
          '</strong><small>' +
          esc(t(count === 1 ? 'teams.playersOne' : 'teams.playersMany', { count: count })) +
          ' · ' +
          esc(tmDate(d.savedAt)) +
          '</small></span><span class="tm-team-tools"><button type="button" data-team-edit="' +
          esc(name) +
          '" aria-label="' +
          esc(t('teams.editNamed', { name: name })) +
          '">✎</button><button type="button" class="tm-delete" data-team-delete="' +
          esc(name) +
          '" aria-label="' +
          esc(t('teams.deleteNamed', { name: name })) +
          '">×</button></span></div>'
        );
      })
      .join('');
  }
  function sortedTeamRows() {
    var rows = TS.rows.slice(),
      key = TS.sort,
      dir = TS.dir;
    rows.sort(function (a, b) {
      var av =
          key === 'number'
            ? +a.number
            : key === 'pos'
              ? ROLE_ORDER[a.pos] || 99
              : String(a[key] || '').toLocaleLowerCase(),
        bv =
          key === 'number'
            ? +b.number
            : key === 'pos'
              ? ROLE_ORDER[b.pos] || 99
              : String(b[key] || '').toLocaleLowerCase();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return +a.number - +b.number;
    });
    return rows;
  }
  function renderTeamRoster() {
    var list = $('teamRoster'),
      rows = sortedTeamRows();
    $('teamRosterCount').textContent = '· ' + rows.length;
    var sortButtons = document.querySelectorAll('[data-team-sort]');
    for (var i = 0; i < sortButtons.length; i++) {
      var on = sortButtons[i].dataset.teamSort === TS.sort;
      sortButtons[i].classList.toggle('active', on);
      sortButtons[i].classList.toggle('desc', on && TS.dir < 0);
    }
    if (!rows.length) {
      list.innerHTML =
        '<div class="tm-empty"><strong>' +
        esc(t('teams.noPlayers')) +
        '</strong><span>' +
        esc(t('teams.noPlayersHint')) +
        '</span></div>';
      return;
    }
    list.innerHTML = rows
      .map(function (r) {
        return (
          '<div class="tm-player-row"><span class="tm-player-number ' +
          tmRoleClass(r.pos) +
          '">' +
          esc(r.number) +
          '</span><span class="tm-player-name"><strong>' +
          esc(r.name) +
          '</strong><small>' +
          esc(t('teams.jersey', { number: r.number })) +
          '</small></span><span class="tm-role-pill ' +
          tmRoleClass(r.pos) +
          '">' +
          esc(PLAB[r.pos] || String(r.pos || '').toUpperCase()) +
          '</span><button type="button" class="tm-remove-player" data-team-remove="' +
          esc(r.number) +
          '" aria-label="' +
          esc(t('teams.removeNamed', { name: r.name })) +
          '">×</button></div>'
        );
      })
      .join('');
  }
  function showTeamOverview() {
    TS = { name: '', rows: [], selected: '', sort: 'number', dir: 1 };
    $('teamEditor').hidden = true;
    $('teamOverview').hidden = false;
    renderTeamOverview();
    tmMessage('');
    setTimeout(function () {
      $('teamNew').focus();
    }, 0);
  }
  function openTeamEditor(name, rows, selected) {
    TS = {
      name: name || '',
      rows: (rows || []).map(function (r) {
        return { number: +r.number, name: String(r.name || ''), pos: r.pos || '' };
      }),
      selected: selected || '',
      sort: 'number',
      dir: 1,
    };
    $('teamOverview').hidden = true;
    $('teamEditor').hidden = false;
    $('teamName').value = TS.name;
    $('teamEditorTitle').textContent = selected ? t('teams.editorEdit') : t('teams.editorNew');
    $('teamEditorSub').textContent = selected ? t('teams.editorEditHint') : t('teams.editorNewHint');
    $('teamPlayerNumber').value = '';
    $('teamPlayerName').value = '';
    $('teamPlayerPosition').value = '';
    renderTeamRoster();
    tmMessage('');
    setTimeout(function () {
      (name ? $('teamPlayerNumber') : $('teamName')).focus();
    }, 0);
  }
  function openSavedTeam(name) {
    var d = libGet().team[name];
    if (d) openTeamEditor(d.team || name, teamRows(name, d), name);
  }
  function openTeams() {
    show(teams);
    showTeamOverview();
  }
  function addTeamPlayer() {
    var number = +$('teamPlayerNumber').value,
      name = $('teamPlayerName').value.trim(),
      pos = $('teamPlayerPosition').value;
    if (!Number.isInteger(number) || number < 1 || number > 99) {
      tmMessage(t('teams.errorNumber'), 'error');
      $('teamPlayerNumber').focus();
      return;
    }
    if (!name) {
      tmMessage(t('teams.errorName'), 'error');
      $('teamPlayerName').focus();
      return;
    }
    if (!pos) {
      tmMessage(t('teams.errorPosition'), 'error');
      $('teamPlayerPosition').focus();
      return;
    }
    if (
      TS.rows.some(function (r) {
        return +r.number === number;
      })
    ) {
      tmMessage(t('teams.errorUnique'), 'error');
      $('teamPlayerNumber').focus();
      return;
    }
    if (TS.rows.length >= 40) {
      tmMessage(t('teams.errorMax'), 'error');
      return;
    }
    TS.rows.push({ number: number, name: name, pos: pos });
    $('teamPlayerNumber').value = '';
    $('teamPlayerName').value = '';
    $('teamPlayerPosition').value = '';
    renderTeamRoster();
    tmMessage(t('teams.playerAdded', { name: name }), 'success');
    $('teamPlayerNumber').focus();
  }
  function saveTeam() {
    TS.name = $('teamName').value.trim();
    if (!TS.name) {
      tmMessage(t('teams.errorTeamName'), 'error');
      $('teamName').focus();
      return;
    }
    if (!TS.rows.length) {
      tmMessage(t('teams.errorNoPlayer'), 'error');
      return;
    }
    var seen = {};
    for (var i = 0; i < TS.rows.length; i++) {
      var r = TS.rows[i];
      if (seen[r.number]) {
        tmMessage(t('teams.errorUnique'), 'error');
        return;
      }
      seen[r.number] = 1;
      if (!r.name.trim() || !r.pos) {
        tmMessage(t('teams.errorIncomplete'), 'error');
        return;
      }
    }
    var l = libGet(),
      existing = l.team[TS.name];
    if (existing && TS.selected !== TS.name && !confirm(t('teams.confirmReplace', { name: TS.name }))) return;
    var info = {};
    TS.rows.forEach(function (r) {
      info[r.number] = { name: r.name.trim(), pos: r.pos };
    });
    l.team[TS.name] = {
      team: TS.name,
      maxPlayers: 40,
      roster: TS.rows.map(function (r) {
        return +r.number;
      }),
      info: info,
      savedAt: new Date().toISOString(),
    };
    libPut(l);
    TS.selected = TS.name;
    tmMessage(t('teams.saved', { name: TS.name }), 'success');
    setTimeout(showTeamOverview, 450);
  }
  function normalizeCsvHeader(value) {
    return String(value || '')
      .trim()
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }
  function parseCsvLine(line, sep) {
    var out = [],
      cell = '',
      quoted = false;
    for (var i = 0; i < line.length; i++) {
      var c = line.charAt(i);
      if (c === '"') {
        if (quoted && line.charAt(i + 1) === '"') {
          cell += '"';
          i++;
        } else quoted = !quoted;
      } else if (c === sep && !quoted) {
        out.push(cell.trim());
        cell = '';
      } else cell += c;
    }
    out.push(cell.trim());
    return out;
  }
  function normalizeRole(value) {
    var v = normalizeCsvHeader(value),
      map = {
        set: 'setter',
        setter: 'setter',
        passeur: 'setter',
        passeuse: 'setter',
        oh: 'oh',
        outside: 'oh',
        outsidehitter: 'oh',
        receptionneurattaquant: 'oh',
        receptionneuseattaquante: 'oh',
        ra: 'oh',
        mb: 'mb',
        middle: 'mb',
        middleblocker: 'mb',
        central: 'mb',
        centrale: 'mb',
        opp: 'opp',
        opposite: 'opp',
        pointu: 'opp',
        pointue: 'opp',
        lib: 'libero',
        libero: 'libero',
      };
    return map[v] || '';
  }
  function importTeamCsv(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var text = String(reader.result || '')
            .replace(/^\uFEFF/, '')
            .replace(/\r\n?/g, '\n'),
          lines = text.split('\n').filter(function (line) {
            return line.trim();
          });
        if (lines.length < 2) throw new Error(t('teams.csvEmpty'));
        var first = lines[0],
          counts = {
            ',': (first.match(/,/g) || []).length,
            ';': (first.match(/;/g) || []).length,
            '\t': (first.match(/\t/g) || []).length,
          },
          sep = Object.keys(counts).sort(function (a, b) {
            return counts[b] - counts[a];
          })[0],
          headers = parseCsvLine(first, sep).map(normalizeCsvHeader),
          ni = headers.indexOf('numero'),
          namei = headers.indexOf('nom'),
          pi = headers.indexOf('poste');
        if (ni < 0) ni = headers.indexOf('number');
        if (namei < 0) namei = headers.indexOf('name');
        if (pi < 0) pi = headers.indexOf('position');
        if (ni < 0 || namei < 0 || pi < 0) throw new Error(t('teams.csvHeaders'));
        var rows = [],
          seen = {};
        for (var i = 1; i < lines.length; i++) {
          var cells = parseCsvLine(lines[i], sep),
            number = +cells[ni],
            name = String(cells[namei] || '').trim(),
            pos = normalizeRole(cells[pi]);
          if (!Number.isInteger(number) || number < 1 || number > 99)
            throw new Error(t('teams.csvInvalidNumber', { line: i + 1 }));
          if (!name) throw new Error(t('teams.csvMissingName', { line: i + 1 }));
          if (!pos) throw new Error(t('teams.csvBadPosition', { line: i + 1, value: String(cells[pi] || '') }));
          if (seen[number]) throw new Error(t('teams.csvDuplicate', { line: i + 1, number: number }));
          seen[number] = 1;
          rows.push({ number: number, name: name, pos: pos });
        }
        if (rows.length > 40) throw new Error(t('teams.errorMax'));
        var teamName = file.name
          .replace(/\.csv$/i, '')
          .replace(/[_-]+/g, ' ')
          .trim();
        openTeamEditor(teamName, rows);
        tmMessage(t('teams.csvImported', { count: rows.length }), 'success');
      } catch (error) {
        alert(t('teams.csvFailed', { reason: error.message }));
      }
    };
    reader.onerror = function () {
      alert(t('teams.csvFailed', { reason: t('teams.csvUnreadable') }));
    };
    reader.readAsText(file);
  }
  $('setupTeamManagement').addEventListener('click', openTeams);
  $('teamsBack').addEventListener('click', function () {
    show(setupCaptureScreen);
    updateHome();
    $('setupTeamManagement').focus();
  });
  $('teamNew').addEventListener('click', function () {
    openTeamEditor('', []);
  });
  $('teamEditorBack').addEventListener('click', showTeamOverview);
  $('teamCancel').addEventListener('click', showTeamOverview);
  $('teamAdd').addEventListener('click', addTeamPlayer);
  $('teamsSave').addEventListener('click', saveTeam);
  $('teamPlayerName').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTeamPlayer();
    }
  });
  $('teamPlayerPosition').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTeamPlayer();
    }
  });
  $('teamImport').addEventListener('click', function () {
    $('teamCsvFile').value = '';
    $('teamCsvFile').click();
  });
  $('teamCsvFile').addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (file) importTeamCsv(file);
  });
  $('teamsBody').addEventListener('click', function (e) {
    var edit = e.target.closest('[data-team-edit]'),
      del = e.target.closest('[data-team-delete]'),
      row = e.target.closest('[data-team-open]');
    if (del) {
      e.stopPropagation();
      var name = del.dataset.teamDelete;
      if (confirm(t('teams.confirmDelete', { name: name }))) {
        var l = libGet();
        delete l.team[name];
        libPut(l);
        renderTeamOverview();
      }
      return;
    }
    if (edit) {
      e.stopPropagation();
      openSavedTeam(edit.dataset.teamEdit);
      return;
    }
    if (row) openSavedTeam(row.dataset.teamOpen);
  });
  $('teamsBody').addEventListener('keydown', function (e) {
    var row = e.target.closest('[data-team-open]');
    if (row && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openSavedTeam(row.dataset.teamOpen);
    }
  });
  $('teamEditor').addEventListener('click', function (e) {
    var sort = e.target.closest('[data-team-sort]'),
      remove = e.target.closest('[data-team-remove]');
    if (sort) {
      var key = sort.dataset.teamSort;
      if (TS.sort === key) TS.dir *= -1;
      else {
        TS.sort = key;
        TS.dir = 1;
      }
      renderTeamRoster();
      return;
    }
    if (remove) {
      var number = +remove.dataset.teamRemove;
      TS.rows = TS.rows.filter(function (r) {
        return +r.number !== number;
      });
      renderTeamRoster();
      tmMessage(t('teams.playerRemoved'), 'info');
    }
  });
  window.VolleyTeams = { open: openTeams };
})();
