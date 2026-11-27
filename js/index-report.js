/* Self-contained HTML match report. Takes the official match and its events; no capture state. */
(function () {
  function buildReport(MATCH, EVENTS) {
    var VSt = window.VolleyStats,
      E = VSt.esc,
      t = window.VolleyI18n.t,
      lang = window.VolleyI18n.lang(),
      su = window.VolleySets.summary(MATCH, EVENTS),
      tA = MATCH.team.name || t('common.teamA'),
      tB = MATCH.opponent.name || t('common.teamB');
    var css =
      'body{font-family:-apple-system,Segoe UI,Arial,sans-serif;margin:0;background:#f3f5f7;color:#17202a}main{max-width:1100px;margin:0 auto;padding:16px}h1{margin:0;font-size:24px}h2{font-size:18px;margin:22px 0 8px;border-bottom:2px solid #1e2a4a;padding-bottom:4px}' +
      '.hero{background:#1e2a4a;color:#fff;border-radius:14px;padding:16px}.hero .res{font-size:20px;font-weight:800;margin-top:6px}.hero .sub{opacity:.8;font-size:13px;margin-top:4px}' +
      '.tw{overflow-x:auto}table{width:100%;border-collapse:collapse;background:#fff;font-size:13px}th,td{padding:5px 6px;border-bottom:1px solid #e5e7eb;text-align:center}th{background:#f1f5f9}td{white-space:nowrap}td:first-child,th:first-child{text-align:left}' +
      '.sets td.w{background:#dcfce7;font-weight:800}.sets td.l{background:#fee2e2}' +
      document.getElementById('attCss').textContent +
      '.foot{color:#64748b;font-size:11px;margin:20px 0}';
    var won = su.matchWinner
      ? t('report.wonBy', { team: su.matchWinner === 'team1' ? tA : tB })
      : t('report.inProgress', { set: MATCH.currentSet || 1 });
    var h =
      '<!DOCTYPE html><html lang="' +
      lang +
      '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
      E(MATCH.name || t('report.title')) +
      '</title><style>' +
      css +
      '</style></he' +
      'ad><body><main>';
    h +=
      '<div class="hero"><h1>' +
      E(tA) +
      ' vs ' +
      E(tB) +
      '</h1><div class="res">' +
      E(won) +
      ' \u00B7 Sets ' +
      su.wonA +
      ' : ' +
      su.wonB +
      '</div><div class="sub">' +
      E(MATCH.name || '') +
      ' \u00B7 ' +
      new Date(MATCH.createdAt || Date.now()).toLocaleDateString(lang) +
      ' \u00B7 ' +
      E(t('report.bestOf', { sets: su.setsToWin * 2 - 1 })) +
      ' \u00B7 ' +
      E(t('report.actionsCount', { count: EVENTS.length })) +
      '</div></div>';
    h +=
      '<h2>' +
      E(t('report.sets')) +
      '</h2><div class="tw"><table class="sets"><tr><th>' +
      E(t('reports.colSet')) +
      '</th><th>' +
      E(tA) +
      '</th><th>' +
      E(tB) +
      '</th><th>' +
      E(t('report.winner')) +
      '</th><th>' +
      E(t('report.subs')) +
      '</th></tr>';
    su.sets.forEach(function (x) {
      // Substitutions only: a libero replacement (q.libero, FIVB 19.3.2) is not one.
      var ns = (MATCH.subs || []).filter(function (q) {
        return q.set === x.set && !q.libero;
      }).length;
      h +=
        '<tr><td>' +
        E(t(x.target === 15 ? 'report.setTo15' : 'report.setN', { set: x.set })) +
        '</td><td class="' +
        (x.winner === 'team1' ? 'w' : x.winner ? 'l' : '') +
        '">' +
        x.a +
        '</td><td class="' +
        (x.winner === 'team2' ? 'w' : x.winner ? 'l' : '') +
        '">' +
        x.b +
        '</td><td>' +
        (x.winner ? E(x.winner === 'team1' ? tA : tB) : E(t('report.setInProgress'))) +
        '</td><td>' +
        ns +
        '</td></tr>';
    });
    h += '</table></div>';
    var who = function (x) {
      if (x.player === 'A') return E(t('report.opponent'));
      if (x.player === 'T') return E(tA);
      var r = VSt.info(MATCH, x.player);
      return '#' + x.player + (r && r.name ? ' ' + E(r.name) : '');
    };
    var tot = { p: 0, e: 0, n: 0 };
    h +=
      '<h2>' +
      E(t('report.players')) +
      '</h2><div class="tw"><table><tr><th>' +
      E(t('capture.colPlayer')) +
      '</th><th>' +
      E(t('report.position')) +
      '</th>';
    VSt.ACTS.forEach(function (a) {
      h += '<th>' + E(VSt.ALAB[a]) + '</th>';
    });
    h += '<th>' + E(t('stats.pts')) + '</th><th>' + E(t('stats.err')) + '</th><th>' + E(t('stats.diff')) + '</th></tr>';
    (MATCH.team.roster || []).forEach(function (r) {
      var t = VSt.byAction(EVENTS, r.number),
        p = 0,
        e = 0,
        n = 0;
      VSt.ACTS.forEach(function (a) {
        p += t[a].point;
        e += t[a].error;
        n += t[a].neutral;
      });
      if (!(p + e + n)) return;
      tot.p += p;
      tot.e += e;
      tot.n += n;
      h += '<tr><td>#' + r.number + ' ' + E(r.name || '') + '</td><td>' + (VSt.RN[r.position] || '') + '</td>';
      VSt.ACTS.forEach(function (a) {
        var x = t[a];
        h += '<td>' + (x.point + x.error + x.neutral ? x.point + ' / ' + x.error + ' / ' + x.neutral : '') + '</td>';
      });
      h += '<td>' + p + '</td><td>' + e + '</td><td>' + (p - e > 0 ? '+' : '') + (p - e) + '</td></tr>';
    });
    var tT = VSt.byAction(EVENTS, 'T'),
      tp2 = 0,
      te2 = 0,
      tn2 = 0;
    VSt.ACTS.forEach(function (a) {
      tp2 += tT[a].point;
      te2 += tT[a].error;
      tn2 += tT[a].neutral;
    });
    if (tp2 + te2 + tn2) {
      tot.p += tp2;
      tot.e += te2;
      tot.n += tn2;
      h += '<tr><td>' + E(t('report.teamWithoutFocus')) + '</td><td></td>';
      VSt.ACTS.forEach(function (a) {
        var x = tT[a];
        h += '<td>' + (x.point + x.error + x.neutral ? x.point + ' / ' + x.error + ' / ' + x.neutral : '') + '</td>';
      });
      h += '<td>' + tp2 + '</td><td>' + te2 + '</td><td>' + (tp2 - te2 > 0 ? '+' : '') + (tp2 - te2) + '</td></tr>';
    }
    var adv = EVENTS.filter(function (x) {
      return x.player === 'A' && x.winningTeam === 'team2';
    }).length;
    h +=
      '<tr><td><b>' +
      E(t('report.teamTotal')) +
      '</b></td><td></td>' +
      VSt.ACTS.map(function () {
        return '<td></td>';
      }).join('') +
      '<td><b>' +
      tot.p +
      '</b></td><td><b>' +
      tot.e +
      '</b></td><td><b>' +
      (tot.p - tot.e) +
      '</b></td></tr></table></div>';
    h += '<p style="font-size:13px">' + E(t('report.opponentPoints', { team: tB, count: adv })) + '</p>';
    h += '<h2>' + E(t('report.attackers')) + '</h2><div class="att-grid">' + VSt.cards(MATCH, EVENTS) + '</div>';
    if ((MATCH.subs || []).length) {
      h +=
        '<h2>' +
        E(t('report.substitutions')) +
        '</h2><div class="tw"><table><tr><th>' +
        E(t('reports.colSet')) +
        '</th><th>' +
        E(t('report.afterAction')) +
        '</th><th>' +
        E(t('report.in')) +
        '</th><th>' +
        E(t('report.out')) +
        '</th></tr>';
      MATCH.subs.forEach(function (q) {
        var i = VSt.info(MATCH, q['in']),
          o = VSt.info(MATCH, q.out);
        h +=
          '<tr><td>' +
          q.set +
          '</td><td>' +
          q.at +
          '</td><td>#' +
          q['in'] +
          ' ' +
          E((i && i.name) || '') +
          (q.libero ? ' · ' + E(t('report.liberoSwap')) : '') +
          '</td><td>#' +
          q.out +
          ' ' +
          E((o && o.name) || '') +
          '</td></tr>';
      });
      h += '</table></div>';
    }
    h +=
      '<h2>' +
      E(t('report.actionLog')) +
      '</h2><div class="tw"><table><tr><th>#</th><th>' +
      E(t('reports.colSet')) +
      '</th><th>' +
      E(t('report.time')) +
      '</th><th>' +
      E(t('capture.colPlayer')) +
      '</th><th>' +
      E(t('capture.colAction')) +
      '</th><th>' +
      E(t('capture.colResult')) +
      '</th><th>' +
      E(t('capture.colScore')) +
      '</th></tr>';
    EVENTS.forEach(function (x) {
      h +=
        '<tr><td>' +
        x.id +
        '</td><td>' +
        (x.set || 1) +
        '</td><td>' +
        E(x.time || '') +
        '</td><td>' +
        who(x) +
        '</td><td>' +
        E(x.action) +
        '</td><td>' +
        E(x.result) +
        '</td><td>' +
        x.scoreA +
        ' : ' +
        x.scoreB +
        '</td></tr>';
    });
    h +=
      '</table></div><div class="foot">' +
      E(t('report.footer', { date: new Date().toLocaleString(lang) })) +
      '</div></main></bo' +
      'dy></ht' +
      'ml>';
    return h;
  }
  window.VolleyReport = { build: buildReport };
})();
