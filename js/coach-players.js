/* Volley Live Coach UI — PLAYERS and player DETAIL views */
(function () {
  'use strict';
  var P = window.VolleyCoachParts;
  if (!P) return;
  var t = window.VolleyI18n.t;
  var C = P.C,
    POS = P.POS,
    ROLE = P.ROLE,
    ROLE_SHORT = P.ROLE_SHORT,
    esc = P.esc,
    pct = P.pct,
    num = P.num,
    playerInfo = P.playerInfo,
    teamPlayers = P.teamPlayers,
    currentState = P.currentState,
    selectedRallies = P.selectedRallies,
    selectedEvents = P.selectedEvents,
    status = P.status,
    periodLabel = P.periodLabel,
    periodButtons = P.periodButtons,
    footer = P.footer,
    auditBadge = P.auditBadge,
    demoOnly = P.demoOnly,
    auditClass = P.auditClass,
    auditAttr = P.auditAttr,
    provenanceBanner = P.provenanceBanner,
    kpi = P.kpi,
    sharedHeading = P.sharedHeading,
    content = P.content;
  function currentCourtNumbers() {
    var m = C.data.match,
      st = currentState(m, C.data.rallies, +m.currentSet || 1);
    return POS.map(function (z) {
      return st.court[z];
    }).filter(function (x) {
      return x != null;
    });
  }
  function playerStats(p, events, rallies) {
    var pe = events.filter(function (e) {
        return String(e.player) === String(p.number);
      }),
      att = pe.filter(function (e) {
        return e.action === 'attack';
      }),
      rec = pe.filter(function (e) {
        return e.action === 'reception';
      }),
      srv = pe.filter(function (e) {
        return e.action === 'service';
      }),
      blk = pe.filter(function (e) {
        return e.action === 'block';
      }),
      pts = pe.filter(function (e) {
        return e.result === 'point';
      }).length,
      err = pe.filter(function (e) {
        return e.result === 'error';
      }).length;
    var rallyCount = rallies.filter(function (r) {
      return r.actions.some(function (e) {
        return String(e.player) === String(p.number);
      });
    }).length;
    return {
      player: p,
      events: pe,
      attempts: pe.length,
      points: pts,
      errors: err,
      delta: pts - err,
      att: {
        d: att.length,
        k: att.filter(function (e) {
          return e.result === 'point';
        }).length,
        e: att.filter(function (e) {
          return e.result === 'error';
        }).length,
      },
      rec: {
        d: rec.length,
        p: rec.filter(function (e) {
          return e.result !== 'error';
        }).length,
        e: rec.filter(function (e) {
          return e.result === 'error';
        }).length,
      },
      srv: {
        d: srv.length,
        a: srv.filter(function (e) {
          return e.result === 'point';
        }).length,
        e: srv.filter(function (e) {
          return e.result === 'error';
        }).length,
      },
      blk: {
        d: blk.length,
        p: blk.filter(function (e) {
          return e.result === 'point';
        }).length,
      },
      rallies: rallyCount,
    };
  }
  function filteredPlayers() {
    var m = C.data.match,
      on = currentCourtNumbers().map(String),
      r = teamPlayers(m);
    if (C.playerScope === 'court')
      r = r.filter(function (p) {
        return on.indexOf(String(p.number)) > -1;
      });
    if (C.role !== 'all')
      r = r.filter(function (p) {
        return p.position === C.role;
      });
    return r;
  }
  function allPlayerStats() {
    var rr = selectedRallies(),
      ev = selectedEvents();
    return filteredPlayers()
      .map(function (p) {
        return playerStats(p, ev, rr);
      })
      .sort(function (a, b) {
        return b.delta - a.delta || b.attempts - a.attempts || +a.player.number - +b.player.number;
      });
  }
  function summaryCards(s) {
    var ae = s.att.d ? Math.round(((s.att.k - s.att.e) * 100) / s.att.d) : null,
      rp = pct(s.rec.p, s.rec.d);
    return (
      '<section class="coach-grid player-summary-kpis">' +
      kpi(
        t('coach.kpiAttack'),
        ae == null ? '—' : (ae > 0 ? '+' : '') + ae + '%',
        s.att.d ? s.att.k + 'K / ' + s.att.e + 'E / ' + s.att.d + ' ATT' : t('coach.smallSample'),
        status('att', ae, s.att.d),
        'actions'
      ) +
      kpi(
        t('coach.kpiReception'),
        rp == null ? '—' : rp + '%',
        s.rec.d ? t('coach.nPositive', { n: s.rec.p, d: s.rec.d }) : t('coach.smallSample'),
        status('rec', rp, s.rec.d),
        'actions'
      ) +
      kpi(
        t('coach.kpiServe'),
        s.srv.d ? s.srv.a + ' ace' + (s.srv.a > 1 ? 's' : '') : '—',
        s.srv.d ? t('coach.serveErrorsOne', { n: s.srv.e, d: s.srv.d }) : t('coach.smallSample'),
        'neutral',
        'actions'
      ) +
      '</section>'
    );
  }
  function contributionBars(s) {
    var vals = [
        [t('coach.kpiAttack'), s.att.d],
        [t('coach.kpiReception'), s.rec.d],
        [t('coach.kpiServe'), s.srv.d],
        [t('coach.kpiBlock'), s.blk.d],
      ],
      max = Math.max.apply(
        null,
        vals
          .map(function (x) {
            return x[1];
          })
          .concat([1])
      );
    return vals
      .map(function (x) {
        return (
          '<div class="player-stat-line"><span>' +
          x[0] +
          '</span><div class="track"><div class="fill" style="width:' +
          Math.round((x[1] * 100) / max) +
          '%"></div></div><strong>' +
          x[1] +
          '</strong></div>'
        );
      })
      .join('');
  }
  function renderPlayers() {
    var list = allPlayerStats();
    if (
      !C.player ||
      !list.some(function (x) {
        return String(x.player.number) === String(C.player);
      })
    )
      C.player = list.length ? list[0].player.number : null;
    var s = list.filter(function (x) {
      return String(x.player.number) === String(C.player);
    })[0];
    var h =
      sharedHeading(
        t('coach.playersTitle'),
        t('coach.playersSub'),
        '<select class="coach-select" aria-label="' +
          esc(t('coach.compareMode')) +
          '"><option>Contributions</option></select>'
      ) +
      provenanceBanner() +
      periodButtons();
    h +=
      '<div class="coach-filter-row" aria-label="' +
      esc(t('coach.presence')) +
      '"><button data-player-scope="court" class="' +
      (C.playerScope === 'court' ? 'active' : '') +
      '">' +
      esc(t('coach.onCourtUpper')) +
      '</button><button data-player-scope="all" class="' +
      (C.playerScope === 'all' ? 'active' : '') +
      '">' +
      esc(t('coach.allUpper')) +
      '</button></div><div class="coach-filter-row" aria-label="' +
      esc(t('coach.position')) +
      '">' +
      [
        ['all', t('coach.allUpper')],
        ['oh', 'OH'],
        ['mb', 'MB'],
        ['opp', 'OPP'],
        ['setter', 'S'],
        ['libero', 'L'],
      ]
        .map(function (x) {
          return (
            '<button data-role="' + x[0] + '" class="' + (C.role === x[0] ? 'active' : '') + '">' + x[1] + '</button>'
          );
        })
        .join('') +
      '</div>';
    if (!list.length) {
      content.innerHTML =
        h +
        '<div class="coach-empty">' +
        esc(t('coach.noPlayerMatch')) +
        '</div>' +
        footer(t('coach.reference', { n: '03' }));
      return;
    }
    h +=
      '<div class="players-layout"><section class="coach-card"><div class="coach-card-head"><h2>' +
      esc(t('coach.players')) +
      '</h2><span class="coach-chip">' +
      esc(t(list.length > 1 ? 'coach.shownMany' : 'coach.shownOne', { n: list.length })) +
      '</span></div>' +
      (demoOnly() && C.playerScope === 'court' ? auditBadge('FILTRE DE DÉMONSTRATION') : '') +
      '<table class="players-table"><thead><tr><th class="rank">#</th><th>' +
      esc(t('coach.player')) +
      '</th><th>' +
      esc(t('coach.position')) +
      '</th><th style="text-align:right">Delta</th></tr></thead><tbody>' +
      list
        .map(function (x, i) {
          return (
            '<tr data-player="' +
            x.player.number +
            '" tabindex="0" class="' +
            (String(x.player.number) === String(C.player) ? 'selected' : '') +
            '"><td class="rank">' +
            (i + 1) +
            '</td><td class="player-name">' +
            esc(x.player.name || t('coach.player')) +
            ' <span class="coach-muted">#' +
            x.player.number +
            '</span></td><td>' +
            esc(ROLE_SHORT[x.player.position] || '—') +
            '</td><td class="metric">' +
            (x.delta > 0 ? '+' : '') +
            x.delta +
            '</td></tr>'
          );
        })
        .join('') +
      '</tbody></table><p class="coach-note">' +
      esc(t('coach.rankingNote')) +
      '</p></section>';
    h +=
      '<section class="coach-card"><h2 class="player-summary-title">' +
      esc(s.player.name || t('coach.player')) +
      ' · #' +
      s.player.number +
      ' <span>· ' +
      esc(ROLE[s.player.position] || s.player.position || '') +
      '</span></h2>' +
      summaryCards(s) +
      '<section class="coach-grid player-mini-two"><article class="coach-card"><h3>Participation</h3><div class="coach-grid coach-two"><div class="coach-kpi"><div class="value">' +
      s.rallies +
      '</div><div class="sample">' +
      esc(t('coach.ralliesWithAction')) +
      '</div></div><div class="coach-kpi"><div class="value">' +
      s.attempts +
      '</div><div class="sample">' +
      esc(t('coach.recordedActions')) +
      '</div></div></div></article><article class="coach-card"><h3>Contribution</h3>' +
      contributionBars(s) +
      '</article></section><button type="button" class="player-detail-cta" id="playerDetailCta" aria-label="' +
      esc(t('coach.seeDetailOf', { number: s.player.number, name: s.player.name || t('coach.player') })) +
      '"><span class="silhouette" aria-hidden="true">♟</span><span>' +
      esc(t('coach.seeDetail')) +
      '</span><span class="chev" aria-hidden="true">›</span></button><div class="coach-footer"><span class="demo">' +
      (C.data.demo
        ? t('coach.demoData')
        : C.data.explicitContext
          ? t('coach.refOfficial')
          : t('coach.currentMigration')) +
      '</span><span>' +
      esc(t('coach.reference', { n: '03' })) +
      ' · VOLLEY LIVE</span></div></section></div>';
    content.innerHTML = h;
  }

  function currentPlayerStats() {
    var p = playerInfo(C.data.match, C.player);
    return playerStats(p, selectedEvents(), selectedRallies());
  }
  function skillRows(s) {
    var rows = [
      [t('coach.kpiAttack'), s.att.d, t('coach.killsErrors', { k: s.att.k, e: s.att.e })],
      [t('coach.kpiReception'), s.rec.d, t('coach.positiveNegative', { p: s.rec.p, e: s.rec.e })],
      [t('coach.kpiServe'), s.srv.d, t('coach.acesErrors', { a: s.srv.a, e: s.srv.e })],
      [t('coach.kpiBlock'), s.blk.d, s.blk.p + ' points'],
    ];
    if (C.skill === 'attack') rows = rows.slice(0, 1);
    else if (C.skill === 'receive') rows = rows.slice(1, 2);
    else if (C.skill === 'serve') rows = rows.slice(2, 3);
    else if (C.skill === 'more') rows = rows.slice(3);
    return rows;
  }
  function setEfficiency(p) {
    var sets = {};
    C.data.events
      .filter(function (e) {
        return String(e.player) === String(p.number) && e.action === 'attack';
      })
      .forEach(function (e) {
        var s = +e.set || 1,
          o = sets[s] || (sets[s] = { k: 0, e: 0, d: 0 });
        o.d++;
        if (e.result === 'point') o.k++;
        else if (e.result === 'error') o.e++;
      });
    var keys = Object.keys(sets)
      .map(Number)
      .sort(function (a, b) {
        return a - b;
      });
    if (!keys.length) keys = [+C.data.match.currentSet || 1];
    return keys.map(function (k) {
      var o = sets[k] || { k: 0, e: 0, d: 0 },
        v = o.d ? Math.round(((o.k - o.e) * 100) / o.d) : 0;
      return { set: k, v: v, d: o.d };
    });
  }
  function actionLabel(e) {
    var A = {
      attack: t('coach.kpiAttack'),
      reception: t('coach.kpiReception'),
      service: t('coach.kpiServe'),
      block: t('coach.kpiBlock'),
      defense: t('coach.actDefense'),
      set: t('coach.actSet'),
      generic: t('coach.actGeneric'),
      team: t('coach.team'),
      adverse: t('coach.opponent'),
    };
    var R = { point: t('coach.resPoint'), error: t('coach.resError'), neutral: t('coach.resNeutral') };
    return (A[e.action] || e.action) + ' ' + (R[e.result] || e.result);
  }
  function renderDetail() {
    var s = currentPlayerStats(),
      p = s.player,
      ae = s.att.d ? Math.round(((s.att.k - s.att.e) * 100) / s.att.d) : null,
      bars = setEfficiency(p),
      recent = s.events.slice(-4).reverse(),
      rows = skillRows(s);
    var onCourt = currentCourtNumbers().map(String).indexOf(String(p.number)) > -1;
    var h =
      '<button type="button" class="detail-back" data-detail-back>' +
      esc(t('coach.backToPlayers')) +
      '</button>' +
      sharedHeading(t('coach.detailTitle'), t('coach.fullAnalysis', { period: periodLabel() })) +
      provenanceBanner() +
      '<section class="coach-card detail-hero"><div class="detail-number">' +
      p.number +
      '</div><div><div class="detail-name">' +
      esc(p.name || t('coach.player')) +
      '<small>#' +
      p.number +
      ' · ' +
      esc(ROLE[p.position] || p.position || '') +
      '</small></div><span class="detail-status' +
      auditClass('lineup') +
      '"' +
      auditAttr('lineup') +
      '><i></i> ' +
      (onCourt ? t('coach.onCourt') : t('coach.onBench')) +
      (demoOnly() ? ' · DÉMO' : '') +
      '</span></div><div class="detail-net">' +
      esc(t('coach.observedDelta')) +
      '<strong>' +
      (s.delta > 0 ? '+' : '') +
      s.delta +
      '</strong><small>' +
      esc(t('coach.pointsErrors', { p: s.points, e: s.errors })) +
      '</small></div></section>';
    h +=
      '<div class="skill-tabs" aria-label="' +
      esc(t('coach.skillFamily')) +
      '">' +
      [
        ['summary', t('coach.summary')],
        ['attack', t('coach.kpiAttack')],
        ['receive', t('coach.kpiReception')],
        ['serve', t('coach.kpiServe')],
        ['more', t('coach.skillMore')],
      ]
        .map(function (x) {
          return (
            '<button type="button" data-skill="' +
            x[0] +
            '" class="' +
            (C.skill === x[0] ? 'active' : '') +
            '">' +
            x[1] +
            '</button>'
          );
        })
        .join('') +
      '</div>' +
      summaryCards(s);
    h +=
      '<section class="coach-card"><div class="coach-card-head"><h2>' +
      esc(t('coach.bySkill')) +
      '</h2><span class="coach-chip">' +
      C.skill.toUpperCase() +
      '</span></div><table class="gesture-table"><thead><tr><th>' +
      esc(t('coach.skill')) +
      '</th><th>Volume</th><th>' +
      esc(t('coach.results')) +
      '</th></tr></thead><tbody>' +
      rows
        .map(function (x) {
          return (
            '<tr><td><strong>' +
            x[0] +
            '</strong></td><td>' +
            x[1] +
            ' action' +
            (x[1] > 1 ? 's' : '') +
            '</td><td>' +
            x[2] +
            '</td></tr>'
          );
        })
        .join('') +
      '</tbody></table><p class="coach-note">' +
      esc(t('coach.attackEffColon')) +
      ' ' +
      (s.att.d
        ? '(' + s.att.k + ' − ' + s.att.e + ') / ' + s.att.d + ' = ' + (ae > 0 ? '+' : '') + ae + '%'
        : '— · ' + esc(t('coach.smallSampleLower'))) +
      '</p></section>';
    h +=
      '<section class="coach-grid detail-grid"><article class="coach-card"><h2>Participation</h2><div class="coach-grid coach-two"><div class="coach-kpi"><div class="value">' +
      s.rallies +
      '</div><div class="sample">' +
      esc(t('coach.ralliesPlayed')) +
      '</div></div><div class="coach-kpi"><div class="value">' +
      s.attempts +
      '</div><div class="sample">' +
      esc(t('coach.recordedActions')) +
      '</div></div></div></article><article class="coach-card"><h2>' +
      esc(t('coach.directPoints')) +
      '</h2><div class="coach-grid coach-kpis"><div class="coach-kpi"><div class="value">' +
      s.att.k +
      '</div><div class="sample">' +
      esc(t('coach.attacks')) +
      '</div></div><div class="coach-kpi"><div class="value">' +
      s.srv.a +
      '</div><div class="sample">Aces</div></div><div class="coach-kpi"><div class="value">' +
      s.blk.p +
      '</div><div class="sample">' +
      esc(t('coach.blocks')) +
      '</div></div></div></article><article class="coach-card"><h2>' +
      esc(t('coach.perSet')) +
      '</h2><p class="coach-note">' +
      esc(t('coach.kpiAttackEff')) +
      '</p><div class="set-bars">' +
      bars
        .map(function (x) {
          return (
            '<div class="set-bar" style="height:' +
            Math.max(5, Math.min(100, 50 + x.v / 2)) +
            '%"><span>' +
            (x.d ? (x.v > 0 ? '+' : '') + x.v + '%' : '—') +
            '</span><small>Set ' +
            x.set +
            '</small></div>'
          );
        })
        .join('') +
      '</div></article><article class="coach-card"><h2>' +
      esc(t('coach.lastActions')) +
      '</h2><div class="recent-list">' +
      (recent.length
        ? recent
            .map(function (e) {
              return (
                '<div class="recent-item ' +
                (e.result === 'error' ? 'loss' : '') +
                '"><i></i><span>' +
                esc(t('common.setLower', { set: e.set || 1 })) +
                ' · ' +
                num(e.scoreA) +
                '–' +
                num(e.scoreB) +
                '</span><strong>' +
                esc(actionLabel(e)) +
                '</strong></div>'
              );
            })
            .join('')
        : '<div class="coach-empty">' + esc(t('capture.noAction')) + '</div>') +
      '</div></article></section>';
    h +=
      '<button type="button" class="detail-full-actions" data-all-actions>☷ &nbsp; ' +
      esc(t('coach.allActions')) +
      ' &nbsp; ›</button>' +
      footer(t('coach.detailTitle'));
    content.innerHTML = h;
  }

  P.currentCourtNumbers = currentCourtNumbers;
  P.playerStats = playerStats;
  P.filteredPlayers = filteredPlayers;
  P.allPlayerStats = allPlayerStats;
  P.summaryCards = summaryCards;
  P.contributionBars = contributionBars;
  P.renderPlayers = renderPlayers;
  P.currentPlayerStats = currentPlayerStats;
  P.skillRows = skillRows;
  P.setEfficiency = setEfficiency;
  P.actionLabel = actionLabel;
  P.renderDetail = renderDetail;
})();
