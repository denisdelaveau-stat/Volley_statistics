/* VolleyLive spectator view — RANKING. */
(function () {
  'use strict';
  var P = window.VolleySpectatorParts,
    st = P.state;
  var $ = P.$,
    esc = P.esc,
    num = P.num,
    upper = P.upper,
    role = P.role,
    detect = P.detect,
    normalizeResult = P.normalizeResult,
    teamV2 = P.teamV2,
    isVoided = P.isVoided;

  var RANKING_CATEGORIES = [
    { key: 'attack', title: 'Attack' },
    { key: 'block', title: 'Block' },
    { key: 'defence', title: 'Defence' },
    { key: 'reception', title: 'Reception' },
    { key: 'service', title: 'Service' },
  ];
  function rankingCategoryForAction(value) {
    var action = upper(value)
      .replace(/[ÉÈÊË]/g, 'E')
      .replace(/[ÀÂÄ]/g, 'A');
    if (['A', 'ATTACK', 'ATTAQUE', 'SPIKE'].indexOf(action) >= 0) return 'attack';
    if (['B', 'BLOCK', 'CONTRE'].indexOf(action) >= 0) return 'block';
    if (['D', 'DEFENCE', 'DEFENSE', 'DIG'].indexOf(action) >= 0) return 'defence';
    if (['R', 'RECEPTION', 'RECEIVE'].indexOf(action) >= 0) return 'reception';
    if (['SV', 'SERVICE', 'SERVE'].indexOf(action) >= 0) return 'service';
    return null;
  }
  function rankingSource(d, setNumber) {
    var players = {},
      entries = [],
      format = detect(d),
      rallySets = {};
    if (format === 'unified-v2') {
      var teams = teamV2(d);
      (d.rallies || []).forEach(function (rally) {
        rallySets[rally.rallyId] = num(rally.setNumber, null);
      });
      (d.players || []).forEach(function (player) {
        if (player.teamId !== teams.homeId) return;
        players[player.playerId] = {
          id: player.playerId,
          number: player.number == null ? '—' : player.number,
          name: player.name || 'Joueur ' + (player.number == null ? 'NA' : player.number),
          role: role(player.role || player.position),
        };
      });
      (d.events || []).forEach(function (event) {
        if (isVoided(event) || upper(event.eventType || 'ACTION') !== 'ACTION') return;
        var eventSet = num(event.setNumber, rallySets[event.rallyId]);
        if (setNumber != null && eventSet !== setNumber) return;
        var player = players[event.playerId],
          category = rankingCategoryForAction(event.actionType || event.action);
        if (!player || !category) return;
        entries.push({
          player: player,
          category: category,
          outcome: normalizeResult(event.evaluation !== undefined ? event.evaluation : event.result),
        });
      });
    } else {
      (((d.match || {}).team || {}).roster || []).forEach(function (player) {
        players[String(player.number)] = {
          id: String(player.number),
          number: player.number == null ? '—' : player.number,
          name: player.name || 'Joueur ' + (player.number == null ? 'NA' : player.number),
          role: role(player.position || player.role),
        };
      });
      (d.events || []).forEach(function (event) {
        if (isVoided(event)) return;
        if (setNumber != null && num(event.set, 1) !== setNumber) return;
        var player = players[String(event.player)],
          category = rankingCategoryForAction(event.action);
        if (!player || !category) return;
        entries.push({
          player: player,
          category: category,
          outcome: normalizeResult(event.result !== undefined ? event.result : event.evaluation),
        });
      });
    }
    return { players: players, entries: entries };
  }
  function rankingRows(source, category, mode) {
    var rows = {};
    source.entries.forEach(function (entry) {
      if (entry.category !== category) return;
      var row =
        rows[entry.player.id] ||
        (rows[entry.player.id] = {
          player: entry.player,
          points: 0,
          errors: 0,
          total: 0,
          first: Object.keys(rows).length,
        });
      row.total++;
      if (entry.outcome === 'point') row.points++;
      if (entry.outcome === 'error') row.errors++;
    });
    return Object.keys(rows)
      .map(function (id) {
        var row = rows[id];
        row.delta = row.points - row.errors;
        return row;
      })
      .sort(function (a, b) {
        if (mode === 'highlight')
          return b.points - a.points || a.errors - b.errors || b.total - a.total || a.first - b.first;
        if (mode === 'lowlight')
          return b.errors - a.errors || b.points - a.points || b.total - a.total || a.first - b.first;
        return (
          b.delta - a.delta || b.points - a.points || a.errors - b.errors || b.total - a.total || a.first - b.first
        );
      });
  }
  function rankingCard(category, source, mode) {
    var rows = rankingRows(source, category.key, mode);
    if (!rows.length)
      return (
        '<article class="ranking-card empty-ranking"><h3>' +
        category.title +
        '</h3><div class="ranking-empty"><span>0</span><strong>NA</strong><small>0 action</small></div></article>'
      );
    var body = rows
      .map(function (row, index) {
        var main = mode === 'highlight' ? row.points : mode === 'lowlight' ? row.errors : row.delta;
        var detail =
          mode === 'highlight'
            ? row.points + ' pts · ' + row.errors + ' err'
            : mode === 'lowlight'
              ? row.errors + ' erreurs · ' + row.points + ' pts'
              : row.points + ' pts − ' + row.errors + ' err';
        return (
          '<div class="ranking-row"><span class="ranking-rank">#' +
          (index + 1) +
          '</span>' +
          '<span class="ranking-player"><b>' +
          esc(row.player.name) +
          '</b><small>#' +
          esc(row.player.number) +
          ' · ' +
          esc(row.player.role) +
          '</small></span>' +
          '<span class="ranking-value"><b>' +
          main +
          '</b><small>' +
          detail +
          '</small></span></div>'
        );
      })
      .join('');
    return (
      '<article class="ranking-card"><h3>' +
      category.title +
      '</h3><div class="ranking-list">' +
      body +
      '</div></article>'
    );
  }
  function renderRanking() {
    var mode = $('rankingView').value,
      categoryValue = $('rankingCategory').value;
    var source = st.raw ? rankingSource(st.raw, st.model && st.model.currentSet) : { players: {}, entries: [] };
    var categories =
      categoryValue === 'all'
        ? RANKING_CATEGORIES
        : RANKING_CATEGORIES.filter(function (category) {
            return category.key === categoryValue;
          });
    var playerCount = {},
      relevantActions = 0;
    source.entries.forEach(function (entry) {
      if (categoryValue !== 'all' && entry.category !== categoryValue) return;
      playerCount[entry.player.id] = true;
      relevantActions++;
    });
    $('rankingModeTitle').textContent = mode === 'highlight' ? 'Highlight' : mode === 'lowlight' ? 'Lowlight' : 'Delta';
    $('rankingSummary').textContent =
      Object.keys(playerCount).length +
      ' joueur' +
      (Object.keys(playerCount).length > 1 ? 's' : '') +
      ' · ' +
      relevantActions +
      ' action' +
      (relevantActions > 1 ? 's' : '');
    $('rankingSection').className = 'ranking-section mode-' + mode + (relevantActions ? '' : ' is-empty');
    $('rankingCards').classList.toggle('single-category', categoryValue !== 'all');
    $('rankingCards').innerHTML = categories
      .map(function (category) {
        return rankingCard(category, source, mode);
      })
      .join('');
  }

  P.RANKING_CATEGORIES = RANKING_CATEGORIES;
  P.rankingCategoryForAction = rankingCategoryForAction;
  P.rankingSource = rankingSource;
  P.rankingRows = rankingRows;
  P.rankingCard = rankingCard;
  P.renderRanking = renderRanking;
})();
