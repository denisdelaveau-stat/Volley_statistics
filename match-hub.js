/* VolleyLive navigation, Match Capture and shared Match Library */
(function () {
  'use strict';
  var KE = window.VolleyDomain.STORAGE.captureEvents,
    KD = window.VolleyDomain.STORAGE.captureChartData,
    KM = window.VolleyDomain.STORAGE.captureMatch;
  var KH = window.VolleyDomain.STORAGE.matchHistory,
    KS = window.VolleyDomain.STORAGE.librarySelectedId,
    KSO = window.VolleyDomain.STORAGE.matchLibrarySelected,
    KF = window.VolleyDomain.STORAGE.libraryFilter,
    STAGE = window.VolleyDomain.STORAGE.captureStage;
  var KR = window.VolleyDomain.STORAGE.analysisReplay,
    KRS = window.VolleyDomain.STORAGE.analysisReplaySource,
    KU = window.VolleyDomain.STORAGE.analysisUnloaded;
  var MAX_FILE_BYTES = 10 * 1024 * 1024,
    ACTIVE = { live: 1, paused: 1, in_progress: 1 };
  var $ = function (id) {
    return document.getElementById(id);
  };
  var state = {
    active: null,
    history: [],
    all: [],
    selected: null,
    filter: 'all',
    mode: 'library',
    pendingImport: null,
    pendingFileName: '',
    report: null,
    info: null,
    rendering: false,
  };

  function safeParse(value, fallback) {
    try {
      var parsed = JSON.parse(value);
      return parsed == null ? fallback : parsed;
    } catch (e) {
      return fallback;
    }
  }
  function storageGet(key, fallback) {
    return safeParse(localStorage.getItem(key) || '', fallback);
  }
  function storageSet(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  var esc = window.VolleyDom.esc;
  // App version shown on the Home screen (kept up to date by tools/bump_version.py).
  function appVersion() {
    var label = document.getElementById('appVersion');
    return (label && label.textContent.trim()) || '';
  }
  function text(value) {
    return String(value == null ? '' : value).trim();
  }
  function lower(value) {
    return text(value)
      .toLowerCase()
      .replace(/[\s-]+/g, '_');
  }
  function finite(value) {
    if (value === undefined || value === null || value === '') return null;
    var n = Number(value);
    return isFinite(n) ? n : null;
  }
  function dateValue(value) {
    var n = Date.parse(value || '');
    return isFinite(n) ? n : 0;
  }
  function first() {
    for (var i = 0; i < arguments.length; i++) {
      var value = arguments[i];
      if (value !== undefined && value !== null && text(value) !== '') return value;
    }
    return null;
  }
  function emit(name, properties) {
    try {
      window.dispatchEvent(
        new CustomEvent('volleylive:telemetry', { detail: { event: name, properties: properties || {} } })
      );
    } catch (e) {
      // Telemetry is optional: it must never break the user action that emits it.
    }
  }
  function setStatus(id, message, tone) {
    var el = $(id);
    if (!el) return;
    el.textContent = message || '';
    if (tone) el.dataset.tone = tone;
    else el.removeAttribute('data-tone');
  }
  function hasUnsafeKey(value) {
    if (!value || typeof value !== 'object') return false;
    var names = Object.getOwnPropertyNames(value);
    for (var i = 0; i < names.length; i++) {
      var key = names[i];
      if (key === '__proto__' || key === 'prototype' || key === 'constructor') return true;
      if (hasUnsafeKey(value[key])) return true;
    }
    return false;
  }
  function teamFromV2(raw, id, fallbackIndex) {
    var teams = Array.isArray(raw.teams) ? raw.teams : [],
      found = null;
    for (var i = 0; i < teams.length; i++)
      if (String(first(teams[i].teamId, teams[i].id, '')) === String(id || '')) {
        found = teams[i];
        break;
      }
    found = found || teams[fallbackIndex] || {};
    return {
      id: first(found.teamId, found.id, null),
      name: first(found.name, found.displayName, null),
      shortName: first(found.shortName, found.abbreviation, null),
    };
  }
  function captureTeams(match) {
    return {
      home: {
        id: first(match.team && match.team.id, null),
        name: first(match.team && match.team.name, null),
        shortName: first(match.team && match.team.shortName, null),
      },
      away: {
        id: first(match.opponent && match.opponent.id, null),
        name: first(match.opponent && match.opponent.name, null),
        shortName: first(match.opponent && match.opponent.shortName, null),
      },
    };
  }
  function pointScore(raw, match, currentSet) {
    var events = Array.isArray(raw.events) ? raw.events : [],
      rallies = Array.isArray(raw.rallies) ? raw.rallies : [],
      rows = events.concat(rallies),
      best = null,
      bestOrder = -1;
    rows.forEach(function (row, index) {
      var setNo = finite(first(row.set, row.setNumber, row.setIndex));
      if (setNo !== null && currentSet !== null && setNo !== Number(currentSet)) return;
      var score = row.scoreAfter || row.score || null,
        a,
        b;
      if (score) {
        a = finite(first(score.home, score.our, score.team1, score.a));
        b = finite(first(score.away, score.opponent, score.team2, score.b));
      }
      if (a == null || b == null) {
        a = finite(first(row.scoreA, row.homeScore));
        b = finite(first(row.scoreB, row.awayScore));
      }
      var order = finite(first(row.sequenceNumber, row.actionOrder, row.rallyNumber, index));
      if (a != null && b != null && order >= bestOrder) {
        best = { home: a, away: b };
        bestOrder = order;
      }
    });
    if (best) return best;
    var chart = Array.isArray(raw.chartData) ? raw.chartData : [],
      last = chart.length ? chart[chart.length - 1] : null;
    if (last) return { home: finite(first(last.a, last.home, 0)), away: finite(first(last.b, last.away, 0)) };
    var sets = Array.isArray(raw.sets) ? raw.sets : [],
      set = null;
    for (var i = 0; i < sets.length; i++)
      if (Number(first(sets[i].setNumber, sets[i].number, i + 1)) === Number(currentSet)) {
        set = sets[i];
        break;
      }
    set = set || sets[sets.length - 1];
    if (set) {
      var fs = set.currentScore || set.score || set.finalScore || {};
      return {
        home: finite(first(fs.home, fs.our, fs.team1, set.homeScore, set.ourScore)),
        away: finite(first(fs.away, fs.opponent, fs.team2, set.awayScore, set.opponentScore)),
      };
    }
    return { home: null, away: null };
  }
  function setScore(raw, match) {
    var home = finite(first(match.homeSetsWon, match.ourSetsWon, raw.homeSetsWon)),
      away = finite(first(match.awaySetsWon, match.opponentSetsWon, raw.awaySetsWon));
    if (home !== null && away !== null) return { home: home, away: away };
    if (window.VolleySets && window.VolleySets.summary && raw.format === 'volley-live-capture') {
      try {
        var summary = window.VolleySets.summary(match, Array.isArray(raw.events) ? raw.events : []);
        return { home: finite(summary.wonA), away: finite(summary.wonB) };
      } catch (e) {
        // Inconsistent events: the set counts stay unknown (null) for this summary only.
      }
    }
    var sets = Array.isArray(raw.sets) ? raw.sets : [],
      h = 0,
      a = 0,
      seen = false;
    sets.forEach(function (set) {
      var score = set.finalScore || set.score || {},
        x = finite(first(score.home, score.our, score.team1, set.homeScore, set.ourScore)),
        y = finite(first(score.away, score.opponent, score.team2, set.awayScore, set.opponentScore)),
        winner = lower(first(set.winner, set.winnerSide, set.winningSide, ''));
      if (winner === 'home' || winner === 'our' || winner === 'team1') {
        h++;
        seen = true;
      } else if (winner === 'away' || winner === 'opponent' || winner === 'team2') {
        a++;
        seen = true;
      } else if (x !== null && y !== null && x !== y && lower(first(set.status, '')) === 'completed') {
        x > y ? h++ : a++;
        seen = true;
      }
    });
    return { home: seen ? h : null, away: seen ? a : null };
  }
  function currentSetNumber(raw, match) {
    var n = finite(first(match.currentSet, match.currentSetNumber, raw.currentSetNumber));
    if (n !== null) return n;
    var sets = Array.isArray(raw.sets) ? raw.sets : [];
    if (!sets.length) return null;
    var active = sets.filter(function (set) {
        return ACTIVE[lower(set.status)];
      }),
      selected = (active.length ? active : sets)[(active.length ? active : sets).length - 1];
    return finite(first(selected.setNumber, selected.number, sets.indexOf(selected) + 1));
  }
  function archiveCurrent() {
    var match = storageGet(KM, null);
    if (!match) return null;
    return {
      format: 'volley-live-capture',
      version: 1,
      savedAt: first(match.updatedAt, match.savedAt, null),
      match: match,
      events: storageGet(KE, []),
      chartData: storageGet(KD, []),
    };
  }
  function summaryFrom(raw, sourceName, meta) {
    if (!raw || typeof raw !== 'object') return null;
    var match = raw.match && typeof raw.match === 'object' ? raw.match : raw,
      isV2 = Array.isArray(raw.teams),
      teams = isV2
        ? {
            home: teamFromV2(raw, first(match.ourTeamId, match.homeTeamId), 0),
            away: teamFromV2(raw, first(match.opponentTeamId, match.awayTeamId), 1),
          }
        : captureTeams(match),
      id = text(first(match.id, match.matchId, raw.id, raw.matchId, ''));
    if (!id) return null;
    var status = lower(first(match.status, match.lifecycleStatus, raw.status, 'completed')),
      setNo = currentSetNumber(raw, match),
      points = pointScore(raw, match, setNo),
      sets = setScore(raw, match),
      updated = first(match.updatedAt, match.savedAt, raw.updatedAt, raw.savedAt, null),
      matchDate = first(
        match.matchDate,
        match.date,
        match.startedAt,
        match.createdAt,
        raw.matchDate,
        raw.createdAt,
        null
      ),
      sourceType = (meta && meta.sourceType) || 'finished';
    return {
      id: id,
      status: status,
      homeTeam: teams.home,
      awayTeam: teams.away,
      currentSetNumber: setNo,
      currentHomePoints: points.home,
      currentAwayPoints: points.away,
      homeSetsWon: sets.home,
      awaySetsWon: sets.away,
      matchDate: matchDate,
      updatedAt: updated,
      schemaVersion: first(raw.schemaVersion, raw.version, null),
      raw: raw,
      sourceName: sourceName || 'match.json',
      sourceType: sourceType,
      imported: sourceType === 'imported',
      current: sourceType === 'active',
    };
  }
  function isActive(summary) {
    return !!(summary && ACTIVE[lower(summary.status)]);
  }
  function isLive(summary) {
    return !!(summary && summary.current && isActive(summary));
  }
  function isFinished(summary) {
    return !!summary && !isLive(summary);
  }
  function displayName(team, fallback) {
    return text(first(team && team.shortName, team && team.name, fallback)) || fallback;
  }
  function longName(team, fallback) {
    return text(first(team && team.name, team && team.shortName, fallback)) || fallback;
  }
  function matchName(sum) {
    return longName(sum.homeTeam, 'HOME') + ' vs ' + longName(sum.awayTeam, 'AWAY');
  }
  function formatDate(value) {
    if (!value) return 'NA';
    var date = new Date(value);
    if (!isFinite(date.getTime())) return 'NA';
    try {
      return new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
    } catch (e) {
      return date.toLocaleDateString();
    }
  }
  function formatRowDate(value) {
    if (!value) return 'NA';
    var date = new Date(value);
    if (!isFinite(date.getTime())) return 'NA';
    var day = String(date.getDate()).padStart(2, '0'),
      month = String(date.getMonth() + 1).padStart(2, '0'),
      year = String(date.getFullYear()).slice(-2);
    return day + '/' + month + '/' + year;
  }
  function savedLabel(value) {
    if (!value) return 'Save status unavailable';
    var when = new Date(value),
      now = new Date();
    if (!isFinite(when.getTime())) return 'Save status unavailable';
    var diff = Math.max(0, now.getTime() - when.getTime());
    if (diff < 60000) return 'Saved just now';
    if (diff < 3600000) return 'Saved ' + Math.floor(diff / 60000) + ' min ago';
    if (when.toDateString() === now.toDateString())
      return 'Saved at ' + when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return 'Saved ' + formatDate(value) + ' ' + when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  function readHistory() {
    var rows = storageGet(KH, []);
    return Array.isArray(rows)
      ? rows.filter(function (row) {
          return row && row.raw && row.id;
        })
      : [];
  }
  function writeHistory(rows) {
    storageSet(KH, rows.slice(0, 100));
  }
  function upsertHistory(raw, sourceName, copyId, sourceType) {
    var value = raw;
    if (copyId) {
      value = JSON.parse(JSON.stringify(raw));
      if (value.match) value.match.id = copyId;
      else value.id = copyId;
    }
    var sum = summaryFrom(value, sourceName, { sourceType: sourceType || 'imported' });
    if (!sum) throw new Error('Missing stable match ID or required team fields.');
    var rows = readHistory(),
      record = {
        id: sum.id,
        raw: value,
        sourceName: sourceName || 'match.json',
        sourceType: sourceType || 'imported',
        importedAt: new Date().toISOString(),
        updatedAt: first(sum.updatedAt, new Date().toISOString()),
      };
    rows = rows.filter(function (row) {
      return row.id !== record.id;
    });
    rows.unshift(record);
    writeHistory(rows);
    return summaryFrom(value, record.sourceName, record);
  }
  function syncCurrent() {
    var raw = archiveCurrent(),
      sum = summaryFrom(raw, 'Current match', { sourceType: 'active' });
    if (sum && sum.status === 'completed') {
      var rows = readHistory(),
        exists = rows.some(function (row) {
          return row.id === sum.id;
        });
      if (!exists) {
        rows.unshift({
          id: sum.id,
          raw: raw,
          sourceName: 'Completed local match',
          sourceType: 'finished',
          importedAt: null,
          updatedAt: first(sum.updatedAt, new Date().toISOString()),
        });
        writeHistory(rows);
      }
    }
    return sum;
  }
  function load() {
    var current = syncCurrent(),
      rows = readHistory(),
      history = rows
        .map(function (row) {
          return summaryFrom(row.raw, row.sourceName, row);
        })
        .filter(Boolean);
    state.active = isLive(current) ? current : null;
    state.history = history;
    state.all = [];
    if (current) state.all.push(current);
    history.forEach(function (item) {
      if (
        !state.all.some(function (existing) {
          return existing.id === item.id && existing.sourceType === item.sourceType;
        })
      )
        state.all.push(item);
    });
    state.all.sort(function (a, b) {
      if (isLive(a) !== isLive(b)) return isLive(a) ? -1 : 1;
      var ad = dateValue(a.matchDate),
        bd = dateValue(b.matchDate);
      if (ad !== bd) return bd - ad;
      return dateValue(b.updatedAt) - dateValue(a.updatedAt);
    });
    var selected = storageGet(KS, null),
      old = storageGet(KSO, null),
      selectedId = typeof selected === 'string' ? selected : selected && selected.id,
      selectedSource = selected && selected.sourceType;
    if (!selectedId && old) {
      selectedId = old.id;
      selectedSource = old.sourceType;
    }
    state.selected = selectedId
      ? state.all.find(function (item) {
          return item.id === selectedId && (!selectedSource || item.sourceType === selectedSource);
        })
      : null;
    if (!state.selected && state.all.length) {
      state.selected = state.all.find(isLive) || state.all[0];
      persistSelected(state.selected);
    }
    var savedFilter = storageGet(KF, null);
    if (savedFilter === 'all' || savedFilter === 'live' || savedFilter === 'finished') state.filter = savedFilter;
    else if (['all', 'live', 'finished'].indexOf(state.filter) < 0) state.filter = 'all';
  }
  function persistSelected(sum) {
    state.selected = sum || null;
    if (!sum) {
      localStorage.removeItem(KS);
      return;
    }
    storageSet(KS, { id: sum.id, sourceType: sum.sourceType });
  }
  function persistFilter(value) {
    state.filter = value;
    storageSet(KF, value);
  }
  function currentScoreLabel(sum) {
    return sum.currentHomePoints === null || sum.currentAwayPoints === null
      ? '0 – 0'
      : sum.currentHomePoints + ' – ' + sum.currentAwayPoints;
  }
  function resultLabel(sum) {
    if (sum.homeSetsWon !== null && sum.awaySetsWon !== null) return sum.homeSetsWon + ' – ' + sum.awaySetsWon;
    return 'NA';
  }
  function stateLabel(sum) {
    return isLive(sum) ? 'LIVE' : 'FINISHED';
  }
  function filtered() {
    if (state.filter === 'live') return state.all.filter(isLive);
    if (state.filter === 'finished') return state.all.filter(isFinished);
    return state.all.slice();
  }
  function ensureVisibleSelection() {
    var items = filtered();
    if (
      state.selected &&
      !items.some(function (item) {
        return item.id === state.selected.id && item.sourceType === state.selected.sourceType;
      })
    )
      persistSelected(items[0] || null);
    else if (!state.selected && items.length) persistSelected(items[0]);
    return items;
  }
  function renderCapture() {
    load();
    var button = $('homeContinue'),
      info = $('homeContinueInfo'),
      summary = $('matchHubActiveSummary');
    if (button) {
      button.disabled = !state.active;
      button.setAttribute('aria-disabled', state.active ? 'false' : 'true');
    }
    if (!state.active) {
      if (info) info.textContent = 'No match in progress';
      if (summary) summary.hidden = true;
      if (button) button.setAttribute('aria-label', 'No match in progress');
    } else {
      var home = displayName(state.active.homeTeam, 'HOME'),
        away = displayName(state.active.awayTeam, 'AWAY'),
        setNo = state.active.currentSetNumber;
      if (info) info.textContent = 'Resume official data entry';
      if (summary) {
        summary.hidden = false;
        $('matchHubTeams').textContent = home + ' vs ' + away;
        $('matchHubScore').textContent = currentScoreLabel(state.active);
        $('matchHubMeta').textContent =
          (setNo ? 'Set ' + setNo : 'Set unavailable') + ' • ' + savedLabel(state.active.updatedAt);
      }
      if (button) button.setAttribute('aria-label', 'Continue capture ' + home + ' versus ' + away);
    }
    var off = $('matchHubOffline');
    if (off) off.hidden = navigator.onLine;
    emit('match_capture_viewed', { hasActiveMatch: !!state.active });
  }
  function rowContext(sum) {
    return isLive(sum)
      ? sum.currentSetNumber === null
        ? 'NA'
        : 'S' +
          sum.currentSetNumber +
          ' · ' +
          (sum.currentHomePoints === null || sum.currentAwayPoints === null
            ? 'NA'
            : sum.currentHomePoints + '–' + sum.currentAwayPoints)
      : formatRowDate(sum.matchDate);
  }
  function setScoresLabel(sum) {
    var sets = Array.isArray(sum.raw && sum.raw.sets) ? sum.raw.sets : [],
      labels = [];
    sets.forEach(function (set, index) {
      var score = set.finalScore || set.score || set.currentScore || {},
        home = finite(first(score.home, score.our, score.team1, set.homeScore, set.ourScore)),
        away = finite(first(score.away, score.opponent, score.team2, set.awayScore, set.opponentScore));
      if (home !== null && away !== null)
        labels.push('S' + first(set.setNumber, set.number, index + 1) + ' ' + home + '–' + away);
    });
    return labels.length ? labels.join(' · ') : 'NA';
  }
  function renderActionBar() {
    var enabled =
      !!state.selected &&
      filtered().some(function (item) {
        return item.id === state.selected.id && item.sourceType === state.selected.sourceType;
      });
    document.querySelectorAll('[data-library-open]').forEach(function (button) {
      button.disabled = !enabled;
      button.setAttribute('aria-disabled', enabled ? 'false' : 'true');
    });
  }
  function renderLibrary() {
    if (state.rendering) return;
    state.rendering = true;
    try {
      load();
      var all = state.all.length,
        live = state.all.filter(isLive).length,
        finished = state.all.filter(isFinished).length;
      $('libraryAllCount').textContent = all;
      $('libraryLiveCount').textContent = live;
      $('libraryFinishedCount').textContent = finished;
      document.querySelectorAll('[data-library-filter]').forEach(function (button) {
        var on = button.dataset.libraryFilter === state.filter;
        button.classList.toggle('active', on);
        button.setAttribute('aria-current', on ? 'page' : 'false');
      });
      var items = ensureVisibleSelection(),
        list = $('matchLibraryList'),
        legend = $('libraryLegend');
      if (!items.length) {
        var message =
          state.filter === 'live'
            ? 'No live match.'
            : state.filter === 'finished'
              ? 'No finished match.'
              : 'No matches yet.';
        list.innerHTML =
          '<div class="library-empty"><strong>' +
          esc(message) +
          '</strong><span>' +
          (!all ? 'Import a VolleyLive match JSON to get started.' : 'Choose another filter.') +
          '</span>' +
          (!all ? '<button type="button" data-empty-import>Import match JSON</button>' : '') +
          '</div>';
        list.removeAttribute('aria-activedescendant');
      } else {
        list.innerHTML = items
          .map(function (sum, index) {
            var selected =
                state.selected && state.selected.id === sum.id && state.selected.sourceType === sum.sourceType,
              home = longName(sum.homeTeam, 'NA'),
              away = longName(sum.awayTeam, 'NA'),
              score = resultLabel(sum),
              context = rowContext(sum),
              label =
                home +
                ' ' +
                score +
                ' ' +
                away +
                ', ' +
                stateLabel(sum) +
                ', ' +
                (formatRowDate(sum.matchDate) === 'NA' ? 'date unavailable' : formatRowDate(sum.matchDate));
            return (
              '<div id="libraryOption' +
              index +
              '" class="library-row' +
              (selected ? ' selected' : '') +
              '" role="option" aria-selected="' +
              (selected ? 'true' : 'false') +
              '" aria-label="' +
              esc(label) +
              '" data-library-row data-id="' +
              esc(sum.id) +
              '" data-source="' +
              esc(sum.sourceType) +
              '" tabindex="-1"><i class="status-dot ' +
              (isLive(sum) ? 'live' : 'finished') +
              '" aria-hidden="true"></i><span class="library-team' +
              (home === 'NA' ? ' library-na' : '') +
              '" title="' +
              esc(home) +
              '">' +
              esc(home) +
              '</span><strong class="library-score' +
              (score === 'NA' ? ' library-na' : '') +
              '">' +
              esc(score) +
              '</strong><span class="library-team' +
              (away === 'NA' ? ' library-na' : '') +
              '" title="' +
              esc(away) +
              '">' +
              esc(away) +
              '</span><span class="library-context' +
              (context === 'NA' ? ' library-na' : '') +
              '">' +
              esc(context) +
              '</span><button type="button" class="library-info" data-library-info data-id="' +
              esc(sum.id) +
              '" data-source="' +
              esc(sum.sourceType) +
              '" aria-label="Match details for ' +
              esc(home) +
              ' versus ' +
              esc(away) +
              '">ⓘ</button><span class="library-check" aria-hidden="true">✓</span></div>'
            );
          })
          .join('');
        var selectedRow = list.querySelector('.library-row.selected');
        if (selectedRow) list.setAttribute('aria-activedescendant', selectedRow.id);
      }
      legend.hidden = !items.length;
      renderActionBar();
      var offline = $('libraryOffline');
      if (offline) offline.hidden = navigator.onLine;
      $('matchLibrarySubtitle').textContent = 'Choose a match, then open a view.';
      emit('match_library_viewed', { filter: state.filter, count: items.length, mode: state.mode });
    } catch (error) {
      setStatus('matchLibraryStatus', 'Matches could not be loaded: ' + error.message, 'error');
    }
    state.rendering = false;
  }
  function displayScreen(screen) {
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
      var el = $(id);
      if (el) el.hidden = true;
    });
    screen.hidden = false;
    screen.scrollTop = 0;
  }
  function openLibrary(mode) {
    state.mode = mode || 'library';
    load();
    displayScreen($('matchLibraryScreen'));
    renderLibrary();
    $('matchLibraryList').focus();
  }
  function findSum(id, source) {
    return state.all.find(function (item) {
      return item.id === id && (!source || item.sourceType === source);
    });
  }
  function openInfo(sum) {
    if (!sum) return;
    state.info = sum;
    var origin = sum.imported ? 'Imported' : 'Captured on this device',
      access = sum.imported ? 'Read only' : 'Local match',
      fields = [
        ['Teams', longName(sum.homeTeam, 'NA') + ' vs ' + longName(sum.awayTeam, 'NA')],
        ['Date', formatDate(sum.matchDate)],
        ['Final / current score', resultLabel(sum)],
        ['Set scores', setScoresLabel(sum)],
        ['Status', stateLabel(sum) === 'LIVE' ? 'Live' : 'Finished'],
        ['Origin', origin],
        ['Access', access],
        ['Source file', sum.sourceName || 'NA'],
      ];
    $('matchInfoFields').innerHTML = fields
      .map(function (field) {
        return (
          '<dt>' +
          esc(field[0]) +
          '</dt><dd class="' +
          (field[1] === 'NA' ? 'library-na' : '') +
          '">' +
          esc(field[1]) +
          '</dd>'
        );
      })
      .join('');
    openDialog($('matchInfoDialog'));
    emit('match_library_details_opened', { status: stateLabel(sum), origin: origin });
  }
  function prepareReplay(sum) {
    persistSelected(sum);
    sessionStorage.removeItem(KU);
    if (sum.current && isActive(sum)) {
      sessionStorage.removeItem(KR);
      sessionStorage.removeItem(KRS);
    } else {
      sessionStorage.setItem(KR, JSON.stringify(sum.raw));
      sessionStorage.setItem(KRS, sum.sourceName || 'match.json');
    }
  }
  function openCoach(sum) {
    if (!sum) return;
    prepareReplay(sum);
    var coach = $('coachScreen');
    if (coach) coach.dataset.returnScreen = 'matchLibraryScreen';
    if (window.VolleyCoach && window.VolleyCoach.open) window.VolleyCoach.open();
    else setStatus('matchLibraryStatus', 'Coach View is unavailable.', 'error');
  }
  function openSpectator(sum, tab) {
    if (!sum) return;
    persistSelected(sum);
    localStorage.setItem(window.VolleyDomain.STORAGE.spectatorArchive, JSON.stringify(sum.raw));
    localStorage.setItem(window.VolleyDomain.STORAGE.spectatorArchiveName, sum.sourceName || 'match.json');
    sessionStorage.setItem(KR, JSON.stringify(sum.raw));
    sessionStorage.setItem(KRS, sum.sourceName || 'match.json');
    location.href = 'spectator.html#' + (tab || 'live-score');
  }
  function openDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else dialog.setAttribute('open', '');
  }
  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
  }
  function clearCurrent() {
    localStorage.removeItem(KM);
    localStorage.removeItem(KE);
    localStorage.removeItem(KD);
  }
  function beginSetup() {
    sessionStorage.setItem(STAGE, 'setup');
    location.reload();
  }
  function newMatch(event) {
    load();
    if (!state.active) {
      emit('match_capture_new_selected', { hasActiveMatch: false });
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    $('matchHubDecisionText').textContent =
      'A match is already in progress: ' +
      matchName(state.active) +
      '. Continue it, save it before starting another, or cancel.';
    openDialog($('matchHubDecision'));
    emit('match_capture_new_selected', { hasActiveMatch: true });
  }
  function validateImport(raw) {
    if (hasUnsafeKey(raw)) throw new Error('Unsafe object keys are not allowed.');
    var check =
      window.VolleyStatsAdapter && window.VolleyStatsAdapter.validate ? window.VolleyStatsAdapter.validate(raw) : null;
    if (!check || !check.valid)
      throw new Error(
        check && check.errors && check.errors.length ? check.errors.join(' ') : 'Unsupported VolleyLive JSON structure.'
      );
    var sum = summaryFrom(raw, 'Imported match', { sourceType: 'imported' });
    if (!sum) throw new Error('Missing stable match ID or required team fields.');
    if (
      !text(first(sum.homeTeam.name, sum.homeTeam.shortName, '')) ||
      !text(first(sum.awayTeam.name, sum.awayTeam.shortName, ''))
    )
      throw new Error('Required team fields are missing.');
    return sum;
  }
  function chooseFile() {
    var input = $('matchLibraryFile');
    input.value = '';
    input.click();
    emit('match_library_import_selected', {});
  }
  function importFailure(message, category) {
    setStatus('matchLibraryStatus', 'Import failed: ' + message, 'error');
    emit('match_library_import_failed', { errorCategory: category || 'validation' });
  }
  function importRaw(raw, fileName) {
    var sum;
    try {
      sum = validateImport(raw);
    } catch (error) {
      importFailure('invalid match file.', 'validation');
      return;
    }
    load();
    var existing = state.all.find(function (item) {
      return item.id === sum.id;
    });
    if (existing) {
      persistSelected(existing);
      persistFilter('all');
      setStatus('matchLibraryStatus', 'This match is already in the library.', 'success');
      renderLibrary();
      state.pendingImport = raw;
      state.pendingFileName = fileName;
      $('matchHubDuplicateText').textContent =
        'This match is already in the library. The existing row is selected. You can open it, import this file as a copy, or cancel.';
      $('matchHubOpenExisting').dataset.matchId = sum.id;
      openDialog($('matchHubDuplicate'));
      return;
    }
    try {
      var imported = upsertHistory(raw, fileName, null, 'imported');
      persistSelected(imported);
      persistFilter('all');
      setStatus('matchLibraryStatus', 'Match imported successfully in read-only mode.', 'success');
      renderLibrary();
    } catch (error) {
      importFailure(error.message, 'persistence');
    }
  }
  function onFile() {
    var file = this.files && this.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      importFailure('File exceeds the 10 MB limit.', 'size');
      return;
    }
    if (!/\.json$/i.test(file.name)) {
      importFailure('Select a .json file.', 'type');
      return;
    }
    var reader = new FileReader();
    reader.onerror = function () {
      importFailure('The file could not be read.', 'read');
    };
    reader.onload = function () {
      var raw;
      try {
        raw = JSON.parse(reader.result);
      } catch (error) {
        importFailure('Invalid JSON syntax.', 'parse');
        return;
      }
      importRaw(raw, file.name);
    };
    reader.readAsText(file);
  }
  function rawEvents(sum) {
    var raw = (sum && sum.raw) || {};
    return Array.isArray(raw.events) ? raw.events : [];
  }
  function safeName(value) {
    return (
      text(value || 'match')
        .replace(/[^a-z0-9_-]+/gi, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 80) || 'match'
    );
  }
  function download(name, type, content) {
    var blob = new Blob([content], { type: type }),
      url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1500);
  }
  function reportHtml(sum) {
    var events = rawEvents(sum),
      rows = events
        .map(function (e, index) {
          return (
            '<tr><td>' +
            (index + 1) +
            '</td><td>' +
            esc(first(e.set, e.setNumber, 'NA')) +
            '</td><td>' +
            esc(first(e.player, e.playerId, 'NA')) +
            '</td><td>' +
            esc(first(e.action, e.actionType, e.eventType, 'NA')) +
            '</td><td>' +
            esc(first(e.result, e.evaluation, 'NA')) +
            '</td><td>' +
            esc(first(e.scoreA, e.homeScore, '0')) +
            ' – ' +
            esc(first(e.scoreB, e.awayScore, '0')) +
            '</td></tr>'
          );
        })
        .join('');
    return (
      '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>' +
      esc(matchName(sum)) +
      ' report</title><style>body{font:14px Arial;margin:24px;color:#17212b}h1{color:#123b62}.badge{display:inline-block;padding:5px 8px;border:1px solid #6a52bf;border-radius:99px}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{padding:7px;border:1px solid #ccd6df;text-align:left}th{background:#eaf2f8}</style></head><body><span class="badge">READ ONLY · ' +
      esc(stateLabel(sum)) +
      '</span><h1>' +
      esc(matchName(sum)) +
      '</h1><p>' +
      esc(formatDate(sum.matchDate)) +
      ' · ' +
      esc(resultLabel(sum)) +
      ' · ' +
      events.length +
      ' events</p><table><thead><tr><th>#</th><th>Set</th><th>Player</th><th>Action</th><th>Result</th><th>Score</th></tr></thead><tbody>' +
      rows +
      '</tbody></table><p>Generated locally by VolleyLive ' +
      esc(appVersion()) +
      '.</p></body></html>'
    );
  }
  function reportCsv(sum) {
    var rows = ['Sequence,Set,Player,Action,Result,HomeScore,AwayScore'];
    rawEvents(sum).forEach(function (e, index) {
      function csv(v) {
        return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
      }
      rows.push(
        [
          index + 1,
          first(e.set, e.setNumber, ''),
          first(e.player, e.playerId, ''),
          first(e.action, e.actionType, e.eventType, ''),
          first(e.result, e.evaluation, ''),
          first(e.scoreA, e.homeScore, 0),
          first(e.scoreB, e.awayScore, 0),
        ]
          .map(csv)
          .join(',')
      );
    });
    return rows.join('\r\n');
  }
  function openReports(sum) {
    if (!sum) return;
    persistSelected(sum);
    state.report = sum;
    $('matchReportText').textContent =
      matchName(sum) + ' · ' + stateLabel(sum) + ' · READ ONLY · ' + rawEvents(sum).length + ' events';
    openDialog($('matchReportDialog'));
  }
  function doLibraryAction(action, sum) {
    if (!sum) return;
    persistSelected(sum);
    if (action === 'select') {
      renderLibrary();
      return;
    }
    if (action === 'continue' && sum.current && isActive(sum)) {
      $('homeContinue').click();
      return;
    }
    if (action === 'coach') {
      openCoach(sum);
      return;
    }
    if (action === 'spectator') {
      openSpectator(sum, 'live-score');
      return;
    }
    if (action === 'report') {
      openReports(sum);
    }
  }
  function moveLibrarySelection(direction) {
    var items = filtered();
    if (!items.length) return;
    var index = state.selected
      ? items.findIndex(function (item) {
          return item.id === state.selected.id && item.sourceType === state.selected.sourceType;
        })
      : -1;
    if (direction === 'first') index = 0;
    else if (direction === 'last') index = items.length - 1;
    else index = Math.max(0, Math.min(items.length - 1, index + (direction === 'previous' ? -1 : 1)));
    persistSelected(items[index]);
    renderLibrary();
    $('matchLibraryList').focus();
  }
  function render() {
    renderCapture();
    if ($('matchLibraryScreen') && !$('matchLibraryScreen').hidden) renderLibrary();
  }
  function bind() {
    $('homeNew').addEventListener('click', newMatch, true);
    $('homeContinue').addEventListener(
      'click',
      function () {
        if (!this.disabled)
          emit('match_capture_continue_selected', { matchStatus: state.active && state.active.status });
      },
      true
    );
    $('matchHubRetry').addEventListener('click', function () {
      this.hidden = true;
      setStatus('matchHubStatus', '');
      renderCapture();
    });
    document.querySelectorAll('[data-library-mode]').forEach(function (button) {
      button.addEventListener('click', function () {
        openLibrary(button.dataset.libraryMode);
      });
    });
    $('matchLibraryBack').addEventListener('click', function () {
      displayScreen($('insightsScreen'));
      $('insightsMatchLibrary').focus();
    });
    $('matchLibraryImport').addEventListener('click', chooseFile);
    $('matchLibraryFile').addEventListener('change', onFile);
    document.querySelector('.library-filters').addEventListener('click', function (event) {
      var button = event.target.closest('[data-library-filter]');
      if (!button) return;
      persistFilter(button.dataset.libraryFilter);
      renderLibrary();
    });
    $('matchLibraryList').addEventListener('click', function (event) {
      if (event.target.closest('[data-empty-import]')) {
        chooseFile();
        return;
      }
      var info = event.target.closest('[data-library-info]');
      if (info) {
        event.stopPropagation();
        openInfo(findSum(info.dataset.id, info.dataset.source));
        return;
      }
      var row = event.target.closest('[data-library-row]');
      if (!row) return;
      persistSelected(findSum(row.dataset.id, row.dataset.source));
      renderLibrary();
      $('matchLibraryList').focus();
    });
    $('matchLibraryList').addEventListener('dblclick', function (event) {
      var row = event.target.closest('[data-library-row]');
      if (row && !event.target.closest('[data-library-info]')) openCoach(findSum(row.dataset.id, row.dataset.source));
    });
    $('matchLibraryList').addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        moveLibrarySelection(
          event.key === 'ArrowDown'
            ? 'next'
            : event.key === 'ArrowUp'
              ? 'previous'
              : event.key === 'Home'
                ? 'first'
                : 'last'
        );
      } else if (event.key === 'Enter' && state.selected) {
        event.preventDefault();
        openCoach(state.selected);
      }
    });
    document.querySelector('.library-action-bar').addEventListener('click', function (event) {
      var button = event.target.closest('[data-library-open]');
      if (!button || button.disabled || !state.selected) return;
      doLibraryAction(button.dataset.libraryOpen, state.selected);
    });
    document.querySelectorAll('[data-dialog-close]').forEach(function (button) {
      button.addEventListener('click', function () {
        closeDialog(button.closest('dialog'));
      });
    });
    $('matchHubContinueCurrent').addEventListener('click', function () {
      closeDialog($('matchHubDecision'));
      $('homeContinue').click();
    });
    $('matchHubSaveStart').addEventListener('click', function () {
      // The current match is cleared only once it has been saved: when saving fails (storage full, export
      // refused...), it is kept and the user is told why.
      try {
        if (window.VolleyShell && window.VolleyShell.saveMatchJson) window.VolleyShell.saveMatchJson();
        var raw = archiveCurrent();
        if (raw) upsertHistory(raw, 'Saved local match', null, 'finished');
      } catch (e) {
        console.error('VolleyLive: the current match could not be saved', e);
        $('matchHubDecisionText').textContent =
          'Save failed, the current match was kept: ' + ((e && e.message) || 'unknown error') + '.';
        return;
      }
      clearCurrent();
      beginSetup();
    });
    $('matchHubDiscardStart').addEventListener('click', function () {
      clearCurrent();
      beginSetup();
    });
    $('matchHubOpenExisting').addEventListener('click', function () {
      load();
      var id = this.dataset.matchId,
        sum = state.all.find(function (item) {
          return item.id === id;
        });
      closeDialog($('matchHubDuplicate'));
      if (sum) {
        persistSelected(sum);
        persistFilter('all');
        renderLibrary();
      }
    });
    $('matchHubImportCopy').addEventListener('click', function () {
      if (!state.pendingImport) return;
      try {
        var copyId =
            (summaryFrom(state.pendingImport, 'copy', { sourceType: 'imported' }).id || 'match') +
            '-copy-' +
            Date.now(),
          sum = upsertHistory(state.pendingImport, state.pendingFileName, copyId, 'imported');
        closeDialog($('matchHubDuplicate'));
        state.pendingImport = null;
        persistSelected(sum);
        persistFilter('all');
        setStatus('matchLibraryStatus', 'Match imported as a read-only copy.', 'success');
        renderLibrary();
      } catch (error) {
        importFailure(error.message, 'duplicate');
      }
    });
    $('matchReportHtml').addEventListener('click', function () {
      if (state.report)
        download(safeName(matchName(state.report)) + '_report.html', 'text/html', reportHtml(state.report));
    });
    $('matchReportCsv').addEventListener('click', function () {
      if (state.report)
        download(safeName(matchName(state.report)) + '_events.csv', 'text/csv', reportCsv(state.report));
    });
    $('matchReportJson').addEventListener('click', function () {
      if (state.report)
        download(
          safeName(matchName(state.report)) + '.json',
          'application/json',
          JSON.stringify(state.report.raw, null, 2)
        );
    });
    window.addEventListener('online', render);
    window.addEventListener('offline', render);
    window.addEventListener('pageshow', render);
    window.addEventListener('focus', render);
    var capture = $('matchHubScreen'),
      library = $('matchLibraryScreen');
    if (window.MutationObserver) {
      new MutationObserver(function (records) {
        records.forEach(function (record) {
          if (record.attributeName === 'hidden' && !capture.hidden) renderCapture();
        });
      }).observe(capture, { attributes: true });
      new MutationObserver(function (records) {
        records.forEach(function (record) {
          if (record.attributeName === 'hidden' && !library.hidden) renderLibrary();
        });
      }).observe(library, { attributes: true });
    }
  }
  function init() {
    var hub = $('matchHub');
    if (!hub) return;
    hub.setAttribute('aria-busy', 'true');
    bind();
    render();
    hub.setAttribute('aria-busy', 'false');
    window.VolleyMatchHub = {
      refresh: render,
      summaryFrom: summaryFrom,
      validateImport: validateImport,
      openViewer: openSpectator,
      openLibrary: openLibrary,
      archiveCurrent: archiveCurrent,
    };
    window.VolleyMatchLibrary = window.VolleyMatchHub;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
