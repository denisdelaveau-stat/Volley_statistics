/* Volley Live Coach UI — LIVE COURT and PLAYER FOCUS views */
(function () {
  'use strict';
  var P = window.VolleyCoachParts;
  if (!P) return;
  var t = window.VolleyI18n.t;
  var C = P.C,
    POS = P.POS,
    ROLE_SHORT = P.ROLE_SHORT,
    esc = P.esc,
    pct = P.pct,
    playerInfo = P.playerInfo,
    teamPlayers = P.teamPlayers,
    currentState = P.currentState,
    metrics = P.metrics,
    scoreNow = P.scoreNow,
    normalizedRole = P.normalizedRole,
    currentCourtNumbers = P.currentCourtNumbers,
    actionLabel = P.actionLabel,
    content = P.content;
  function render() {
    return P.render.apply(this, arguments);
  }
  /* --- LIVE COURT / PLAYER FOCUS --- */
  var LIVE_CFG = window.VolleyCoachConfig || {};
  function cfg() {
    return LIVE_CFG;
  }
  function outcome(e) {
    var key = String((e && e.result) || '').toLowerCase();
    return (cfg().outcome || {})[key] || 'neutral';
  }
  function liveSkillEvents(playerNumber, skill, events) {
    return (events || []).filter(function (e) {
      return String(e.player) === String(playerNumber) && e.action === skill;
    });
  }
  function qualityValue(e) {
    return String((e && e.quality) || (e && e.grade) || '').toLowerCase();
  }
  function positiveQuality(e) {
    return ['positive', 'perfect', 'good', 'excellent', '3', '4'].indexOf(qualityValue(e)) > -1;
  }
  function blockedAttack(e) {
    var v = String((e && e.attackOutcome) || (e && e.detail) || (e && e.quality) || '').toLowerCase();
    return v === 'blocked' || v === 'block' || v === 'stuffed';
  }
  function canGrade(events, skill) {
    return events.some(function (e) {
      if (skill === 'reception')
        return (
          ['positive', 'perfect', 'good', 'excellent', '3', '4', 'poor', 'negative', '0', '1', '2'].indexOf(
            qualityValue(e)
          ) > -1
        );
      if (skill === 'defense') return qualityValue(e) !== '';
      return false;
    });
  }
  function hasIntermediateContacts(events) {
    return (
      C.data.explicitContext ||
      events.some(function (e) {
        return outcome(e) === 'neutral';
      })
    );
  }
  function skillEfficiency(skill, events) {
    if (!events.length) return null;
    var pos = events.filter(function (e) {
        return outcome(e) === 'positive';
      }).length,
      neg = events.filter(function (e) {
        return outcome(e) === 'negative';
      }).length;
    if (skill === 'attack') return Math.round(((pos - neg) * 100) / events.length);
    if (skill === 'block') {
      if (!hasIntermediateContacts(events)) return null;
      return Math.round(((pos - neg) * 100) / events.length);
    }
    if (skill === 'reception' || skill === 'defense')
      return Math.round(
        (events.filter(function (e) {
          return outcome(e) !== 'negative';
        }).length *
          100) /
          events.length
      );
    if (skill === 'set')
      return Math.round(
        (events.filter(function (e) {
          return outcome(e) !== 'negative';
        }).length *
          100) /
          events.length
      );
    return Math.round(((pos - neg) * 100) / events.length);
  }
  function mainSkillFor(p, events) {
    var role = normalizedRole(p.position);
    if (role === 'setter') return 'set';
    if (role === 'libero') return liveSkillEvents(p.number, 'reception', events).length ? 'reception' : 'defense';
    return 'attack';
  }
  function livePlayerStats(p, events, rallies) {
    var pe = (events || []).filter(function (e) {
        return String(e.player) === String(p.number);
      }),
      skills = {};
    ['attack', 'block', 'reception', 'defense', 'service', 'set', 'freeball'].forEach(function (skill) {
      skills[skill] = liveSkillEvents(p.number, skill, pe);
    });
    var pointEvents = pe.filter(function (e) {
        return outcome(e) === 'positive' && ['attack', 'block', 'service'].indexOf(e.action) > -1;
      }),
      errorEvents = pe.filter(function (e) {
        return outcome(e) === 'negative';
      }),
      main = mainSkillFor(p, pe),
      mainEvents = skills[main] || [],
      eff = skillEfficiency(main, mainEvents);
    var windowSize = cfg().rollingWindow || 5,
      rolling = mainEvents.slice(-windowSize),
      rollingEff = skillEfficiency(main, rolling),
      errorStreak = 0;
    for (var i = mainEvents.length - 1; i >= 0 && outcome(mainEvents[i]) === 'negative'; i--) errorStreak++;
    var lastTwoPositive =
        mainEvents.slice(-2).length === 2 &&
        mainEvents.slice(-2).every(function (e) {
          return outcome(e) === 'positive';
        }),
      drop = eff == null || rollingEff == null ? 0 : eff - rollingEff;
    var d = (cfg().status || {}).difficulty || {},
      w = (cfg().status || {}).watch || {},
      minimum = cfg().minimumSample || 3,
      statusName = 'good';
    if (mainEvents.length >= minimum) {
      if (
        errorStreak >= (d.errorStreak || 3) ||
        (mainEvents.length >= (d.efficiencyMinimumAttempts || 6) && eff != null && eff < (d.efficiencyBelow || 15)) ||
        (errorEvents.length >= (d.errors || 4) && eff != null && eff < (d.errorsEfficiencyBelow || 25)) ||
        drop >= (d.rollingDrop || 30)
      )
        statusName = 'difficulty';
      else if (
        errorStreak >= (w.errorStreak || 2) ||
        (mainEvents.length >= (w.efficiencyMinimumAttempts || 5) && eff != null && eff < (w.efficiencyBelow || 30)) ||
        (main === 'reception' &&
          rolling.length &&
          Math.round(
            (rolling.filter(function (e) {
              return outcome(e) === 'negative';
            }).length *
              100) /
              rolling.length
          ) >= (w.receptionPoorRate || 40)) ||
        drop >= (w.rollingDrop || 15)
      )
        statusName = 'watch';
    }
    if (statusName !== 'good' && lastTwoPositive && rollingEff != null && rollingEff >= (w.efficiencyBelow || 30))
      statusName = 'good';
    var previous = mainEvents.slice(-(windowSize * 2), -windowSize),
      previousEff = skillEfficiency(main, previous),
      trend = 'stable',
      delta = rollingEff == null || previousEff == null ? 0 : rollingEff - previousEff,
      trendLimit = (cfg().status || {}).trendDelta || 10;
    if (delta >= trendLimit) trend = 'up';
    else if (delta <= -trendLimit) trend = 'down';
    var alert = '';
    if (errorStreak >= 3) alert = t('coach.live.errorStreak', { n: errorStreak });
    else if (
      main === 'set' &&
      rolling.filter(function (e) {
        return outcome(e) === 'negative';
      }).length >= 2
    )
      alert = t('coach.live.settingErrors', {
        n: rolling.filter(function (e) {
          return outcome(e) === 'negative';
        }).length,
      });
    else if (main === 'reception' && statusName !== 'good') alert = t('coach.live.receptionUnstable');
    else if (main === 'attack' && eff != null && statusName !== 'good') alert = t('coach.live.attackEff', { eff: eff });
    else if (
      skills.service.slice(-2).length === 2 &&
      skills.service.slice(-2).every(function (e) {
        return outcome(e) === 'negative';
      })
    )
      alert = t('coach.live.serveErrors2');
    return {
      player: p,
      events: pe,
      skills: skills,
      points: pointEvents.length,
      errors: errorEvents.length,
      eff: eff,
      rollingEff: rollingEff,
      status: statusName,
      trend: trend,
      alert: alert,
      mainSkill: main,
      rallies: (rallies || []).filter(function (r) {
        return r.actions.some(function (e) {
          return String(e.player) === String(p.number);
        });
      }).length,
    };
  }
  function liveStatusLabel(s) {
    return s === 'difficulty'
      ? t('coach.live.statusDifficulty')
      : s === 'watch'
        ? t('coach.live.statusWatch')
        : t('coach.live.statusGood');
  }
  function trendSymbol(trend) {
    return trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  }
  function roleChip(p) {
    var r = normalizedRole(p.position);
    return (
      '<span class="live-role role-' +
      r +
      '" data-player-role="' +
      r +
      '">' +
      esc(ROLE_SHORT[r] || String(r || '—').toUpperCase()) +
      '</span>'
    );
  }
  function formatEff(v) {
    return v == null ? '<span class="metric-na">NA</span>' : (v > 0 ? '+' : '') + v + '%';
  }
  function playerEffText(s) {
    return s.eff == null
      ? formatEff(null)
      : (['reception', 'defense'].indexOf(s.mainSkill) > -1 ? '≈' : '') + formatEff(s.eff);
  }
  function liveSetDots(match) {
    var count = Math.max(3, Math.min(5, +(match.format || {}).setsToWin || 3)),
      current = Math.max(1, Math.min(count, +match.currentSet || 1));
    return (
      '<span class="live-set-dots">' +
      Array.from({ length: count }, function (_, i) {
        return '<i class="' + (i + 1 === current ? 'current' : i + 1 < current ? 'done' : '') + '"></i>';
      }).join('') +
      '</span>'
    );
  }
  function liveHeader(includeMetrics) {
    var m = C.data.match,
      empty = !!C.data.empty,
      rr = C.data.rallies.filter(function (r) {
        return r.set === (+m.currentSet || 1);
      }),
      mt = metrics(
        rr,
        [].concat.apply(
          [],
          rr.map(function (r) {
            return r.actions;
          })
        )
      ),
      sc = empty ? { a: 0, b: 0 } : scoreNow(),
      cur = empty ? { rotation: 'na', serving: null } : currentState(m, C.data.rallies, +m.currentSet || 1),
      so = empty ? null : pct(mt.so.n, mt.so.d),
      bp = empty ? null : pct(mt.bp.n, mt.bp.d),
      phase = empty ? 'NA' : cur.serving === 'B' ? t('coach.phaseReceive') : t('coach.phaseServe');
    return (
      '<header class="live-insight-header ' +
      (empty ? 'live-header-empty' : '') +
      '"><div class="live-insight-brand"><span class="live-logo">◉</span><b>VolleyLive <em>Insight</em></b></div><button type="button" class="live-mode-pill" data-coach-go="overview">' +
      esc(t('coach.live.coachViewUpper')) +
      (C.view === 'player-focus' ? ' &gt; ' + esc(t('coach.live.playerUpper')) : '') +
      '</button><div class="live-scoreboard"><span>HOME</span><strong class="' +
      (empty ? 'metric-na' : '') +
      '">' +
      sc.a +
      '</strong><div class="live-set"><b class="' +
      (empty ? 'metric-na' : '') +
      '">' +
      esc(t('common.setLower', { set: empty ? '0' : +m.currentSet || 1 })) +
      '</b>' +
      (empty ? '<span class="live-set-dots"><i></i><i></i><i></i></span>' : liveSetDots(m)) +
      '</div><strong class="' +
      (empty ? 'metric-na' : '') +
      '">' +
      sc.b +
      '</strong><span>AWAY</span></div><div class="live-header-badge"><strong class="' +
      (empty ? 'metric-na' : '') +
      '">' +
      (empty ? 'NA' : esc(cur.rotation.toUpperCase())) +
      '</strong><small>Rotation</small></div><div class="live-phase ' +
      (empty ? 'empty' : cur.serving === 'B' ? 'receive' : 'serve') +
      '"><strong>' +
      phase +
      '</strong><small>Phase</small></div>' +
      (includeMetrics
        ? '<div class="live-rates"><span>SO<strong>' +
          formatEff(so) +
          '</strong></span><span>BP<strong>' +
          formatEff(bp) +
          '</strong></span></div>'
        : '') +
      '</header>'
    );
  }
  function liveEmptyCard(position) {
    return (
      '<article class="live-player-card status-neutral" data-position="' +
      position +
      '"><span class="live-position">' +
      position +
      '</span><div class="live-card-main"><strong class="live-number metric-na">NA</strong><b class="metric-na">NA</b><span class="live-role empty-role">NA</span><span class="live-trend">→</span><div class="live-mini"><span>PTS<b class="metric-na">0</b></span><span>ERR<b class="metric-na">0</b></span><span>EFF<b class="metric-na">NA</b></span></div></div></article>'
    );
  }
  function livePlayerCard(position, p, s) {
    return (
      '<button type="button" class="live-player-card status-' +
      s.status +
      '" data-live-player="' +
      esc(p.number) +
      '" data-position="' +
      position +
      '" aria-label="' +
      esc(t('coach.live.openFocus', { name: p.name || '' })) +
      '"><span class="live-position">' +
      position +
      '</span><div class="live-card-main"><strong class="live-number">#' +
      esc(String(p.number).padStart(2, '0')) +
      '</strong><b>' +
      esc(String(p.name || t('coach.player')).toUpperCase()) +
      '</b>' +
      roleChip(p) +
      '<span class="live-trend">' +
      trendSymbol(s.trend) +
      '</span><div class="live-mini"><span>PTS<b>' +
      s.points +
      '</b></span><span>ERR<b>' +
      s.errors +
      '</b></span><span>EFF<b title="' +
      (['reception', 'defense'].indexOf(s.mainSkill) > -1 ? t('coach.live.derived') : '') +
      '">' +
      playerEffText(s) +
      '</b></span></div>' +
      (s.status !== 'good'
        ? '<div class="live-alert-strip"><span>⚠</span>' + esc(s.alert || liveStatusLabel(s.status)) + '</div>'
        : '') +
      '</div></button>'
    );
  }
  function rallyTimeline(rallies) {
    var last = rallies.slice(-(cfg().timelineLength || 12));
    return (
      '<section class="live-timeline"><h2>' +
      esc(t('coach.live.last12')) +
      '</h2><div class="live-rally-track">' +
      (last.length
        ? last
            .map(function (r, i) {
              var win = r.winner === 'team1',
                now = i === last.length - 1;
              return (
                '<span class="live-rally ' +
                (win ? 'win' : 'loss') +
                ' ' +
                (now ? 'now' : '') +
                '">' +
                (now ? '<em>' + esc(t('coach.live.now')) + '</em>' : '') +
                '<b>' +
                (win ? 'W' : 'L') +
                '</b><small>' +
                esc(r.number || i + 1) +
                '</small></span>'
              );
            })
            .join('')
        : '<span class="live-empty-rallies metric-na">' + esc(t('coach.zeroRally')) + '</span>') +
      '</div></section>'
    );
  }
  function renderLiveCourt() {
    if (innerWidth < innerHeight) {
      content.innerHTML =
        '<div class="live-landscape-gate"><span>↻</span><strong>' +
        esc(t('coach.live.rotate')) +
        '</strong><p>' +
        esc(t('coach.live.landscape')) +
        '</p><button type="button" data-coach-go="overview">' +
        esc(t('coach.live.backToCoach')) +
        '</button></div>';
      return;
    }
    var h = '<div class="live-court-view">' + liveHeader(true),
      m = C.data.match;
    h +=
      '<section class="live-court-panel"><div class="live-section-head"><h1>' +
      esc(t('coach.onCourtUpper')) +
      '</h1><div class="live-status-legend"><span class="good">' +
      esc(t('coach.live.legendGood')) +
      '</span><span class="watch">' +
      esc(t('coach.live.legendWatch')) +
      '</span><span class="difficulty">' +
      esc(t('coach.live.legendDifficulty')) +
      '</span></div></div><div class="live-half-court"><div class="live-net"><span>' +
      esc(t('coach.live.net')) +
      '</span></div><div class="live-court-grid">';
    if (C.data.empty) {
      [4, 3, 2, 5, 6, 1].forEach(function (pos) {
        h += liveEmptyCard(pos);
      });
    } else {
      var setNo = +m.currentSet || 1,
        cur = currentState(m, C.data.rallies, setNo),
        setEvents = C.data.events.filter(function (e) {
          return (+e.set || 1) === setNo;
        });
      [4, 3, 2, 5, 6, 1].forEach(function (pos) {
        var p = playerInfo(m, cur.court['p' + pos]),
          s = livePlayerStats(
            p,
            setEvents,
            C.data.rallies.filter(function (r) {
              return r.set === setNo;
            })
          );
        h += livePlayerCard(pos, p, s);
      });
    }
    h +=
      '</div></div></section>' +
      rallyTimeline(
        C.data.empty
          ? []
          : C.data.rallies.filter(function (r) {
              return r.set === (+m.currentSet || 1);
            })
      ) +
      '<p class="live-threshold-note">' +
      esc(t('coach.live.thresholdNote')) +
      '</p></div>';
    content.innerHTML = h;
  }
  function focusPlayers() {
    var court = currentCourtNumbers().map(String),
      all = teamPlayers(C.data.match);
    var list = all.filter(function (p) {
      return court.indexOf(String(p.number)) > -1;
    });
    return list.length ? list : all;
  }
  function focusNavigate(step) {
    var list = focusPlayers(),
      idx = list.findIndex(function (p) {
        return String(p.number) === String(C.player);
      });
    if (idx < 0) idx = 0;
    idx = (idx + step + list.length) % list.length;
    C.player = list[idx].number;
    render();
  }
  function focusSkillModel(s, skill) {
    var events = s.skills[skill] || [],
      positive = events.filter(function (e) {
        return outcome(e) === 'positive';
      }).length,
      negative = events.filter(function (e) {
        return outcome(e) === 'negative';
      }).length,
      neutral = events.filter(function (e) {
        return outcome(e) === 'neutral';
      }).length,
      eff = skillEfficiency(skill, events),
      intermediate = hasIntermediateContacts(C.data.events || []),
      nonError = events.filter(function (e) {
        return outcome(e) !== 'negative';
      }).length,
      stats = [];
    if (skill === 'attack')
      stats = [
        ['ATT', events.length],
        ['KILL', positive],
        ['ERR', negative],
        ['BLK', 'NA'],
      ];
    if (skill === 'block')
      stats = [
        ['PTS', positive],
        ['TOUCH', intermediate ? neutral : 'NA'],
        ['ERR', negative],
      ];
    if (skill === 'reception')
      stats = [
        ['REC', events.length],
        ['POS', '≈' + nonError],
        ['ERR', negative],
      ];
    if (skill === 'defense')
      stats = [
        ['DIG', events.length],
        ['GOOD', '≈' + nonError],
        ['ERR', negative],
      ];
    return {
      skill: skill,
      events: events,
      positive: positive,
      negative: negative,
      neutral: neutral,
      eff: eff,
      stats: stats,
      derived: skill === 'reception' || skill === 'defense',
      derivable: !(eff == null && events.length > 0),
    };
  }
  function lastFiveHTML(events) {
    var list = events.slice(-5);
    while (list.length < 5) list.unshift(null);
    return (
      '<div class="focus-last-five" aria-label="' +
      esc(t('coach.live.lastFiveLabel')) +
      '">' +
      list
        .map(function (e) {
          if (!e) return '<span class="na" title="' + esc(t('coach.live.noAction')) + '">NA</span>';
          var o = outcome(e);
          return (
            '<span class="' +
            o +
            '" title="' +
            esc(actionLabel(e)) +
            '">' +
            (o === 'positive' ? '✓' : o === 'negative' ? '×' : '−') +
            '</span>'
          );
        })
        .join('') +
      '</div>'
    );
  }
  function curvePoints(playerNumber, skill, rallies) {
    var relevant = rallies.filter(function (r) {
        return r.actions.some(function (e) {
          return String(e.player) === String(playerNumber) && e.action === skill;
        });
      }),
      start = Math.max(0, relevant.length - 12),
      selected = relevant.slice(start),
      seen = [],
      points = [];
    relevant.slice(0, start).forEach(function (r) {
      r.actions.forEach(function (e) {
        if (String(e.player) === String(playerNumber) && e.action === skill) seen.push(e);
      });
    });
    selected.forEach(function (r, i) {
      r.actions.forEach(function (e) {
        if (String(e.player) === String(playerNumber) && e.action === skill) seen.push(e);
      });
      var v = skillEfficiency(skill, seen);
      points.push({ x: i + 1, v: v, rally: r.number || start + i + 1 });
    });
    return points;
  }
  function efficiencyCurve(playerNumber, skill, rallies) {
    if (!C.data.explicitContext && !hasIntermediateContacts(C.data.events || []))
      return (
        '<div class="focus-curve focus-curve-na"><span class="metric-na">NA</span><small>' +
        esc(t('coach.live.noIntermediate')) +
        '</small></div>'
      );
    var pts = curvePoints(playerNumber, skill, rallies),
      valid = pts.filter(function (p) {
        return p.v != null;
      });
    if (!valid.length)
      return (
        '<div class="focus-curve focus-curve-na"><span class="metric-na">NA</span><small>' +
        esc(t('coach.live.noContact')) +
        '</small></div>'
      );
    var W = 420,
      H = 118,
      padL = 34,
      padR = 12,
      padT = 10,
      padB = 24,
      maxX = Math.max(1, pts.length - 1),
      baseY = H - padB;
    var coords = valid.map(function (p) {
        return {
          x: padL + ((p.x - 1) / maxX) * (W - padL - padR),
          y: padT + ((100 - Math.max(0, Math.min(100, p.v))) / 100) * (H - padT - padB),
          v: p.v,
          rally: p.rally,
        };
      }),
      path = coords
        .map(function (p, i) {
          return (i ? 'L' : 'M') + p.x.toFixed(1) + ',' + p.y.toFixed(1);
        })
        .join(' '),
      last = coords[coords.length - 1],
      area =
        'M' +
        coords[0].x.toFixed(1) +
        ',' +
        baseY +
        ' ' +
        coords
          .map(function (p) {
            return 'L' + p.x.toFixed(1) + ',' + p.y.toFixed(1);
          })
          .join(' ') +
        ' L' +
        last.x.toFixed(1) +
        ',' +
        baseY +
        ' Z';
    return (
      '<svg class="focus-curve" viewBox="0 0 ' +
      W +
      ' ' +
      H +
      '" role="img" aria-label="' +
      esc(t('coach.live.curveLabel', { skill: skillTitle(skill) })) +
      '"><line x1="' +
      padL +
      '" x2="' +
      (W - padR) +
      '" y1="' +
      padT +
      '" y2="' +
      padT +
      '"/><line x1="' +
      padL +
      '" x2="' +
      (W - padR) +
      '" y1="' +
      (padT + (H - padT - padB) / 2) +
      '" y2="' +
      (padT + (H - padT - padB) / 2) +
      '" class="mid"/><line x1="' +
      padL +
      '" x2="' +
      (W - padR) +
      '" y1="' +
      baseY +
      '" y2="' +
      baseY +
      '"/><text x="2" y="14">100%</text><text x="8" y="' +
      (padT + (H - padT - padB) / 2 + 4) +
      '">50%</text><text x="17" y="' +
      (baseY + 4) +
      '">0%</text><path class="area" d="' +
      area +
      '"/><path class="line" d="' +
      path +
      '"/>' +
      coords
        .map(function (p) {
          return '<circle cx="' + p.x + '" cy="' + p.y + '" r="3"/>';
        })
        .join('') +
      '<circle class="last" cx="' +
      last.x +
      '" cy="' +
      last.y +
      '" r="6"/><text class="rally-axis" x="' +
      last.x +
      '" y="' +
      (H - 5) +
      '" text-anchor="middle">R' +
      esc(last.rally) +
      '</text></svg>'
    );
  }
  function skillTitle(skill) {
    return {
      attack: t('coach.live.skillAttack'),
      block: t('coach.live.skillBlock'),
      reception: t('coach.phaseReceive'),
      defense: t('coach.live.skillDefense'),
    }[skill];
  }
  function focusPanel(s, skill, rallies) {
    var m = focusSkillModel(s, skill),
      trend = s.trend,
      icon = { attack: '⚡', block: '♜', reception: '◉', defense: '◆' }[skill];
    return (
      '<article class="focus-skill-panel focus-' +
      skill +
      '"><header><span>' +
      icon +
      '</span><h2>' +
      skillTitle(skill) +
      '</h2><b>›</b></header><div class="focus-skill-summary"><strong class="' +
      (m.eff == null ? 'metric-na' : '') +
      '" ' +
      (m.derived ? 'title="' + esc(t('coach.live.derivedRatio')) + '"' : '') +
      '>' +
      (m.eff == null ? 'NA' : (m.derived ? '≈' : '') + m.eff + '%') +
      '</strong><span class="focus-eff-trend ' +
      trend +
      '" title="' +
      esc(t('coach.live.trendTitle', { n: cfg().rollingWindow || 5 })) +
      '">' +
      trendSymbol(trend) +
      '</span><div class="focus-stat-grid">' +
      m.stats
        .map(function (x) {
          return (
            '<span>' +
            x[0] +
            '<b class="' +
            (x[1] === 'NA' ? 'metric-na' : '') +
            '" ' +
            (String(x[1]).charAt(0) === '≈' ? 'title="' + esc(t('coach.live.derivedCount')) + '"' : '') +
            '>' +
            x[1] +
            '</b></span>'
          );
        })
        .join('') +
      '</div></div><div class="focus-last-title">' +
      esc(t('coach.live.last5')) +
      ' <small>' +
      esc(t('coach.live.oldestNewest')) +
      '</small></div>' +
      lastFiveHTML(m.events) +
      '<div class="focus-curve-title">' +
      esc(t('coach.live.efficiencyUpper')) +
      ' ' +
      (m.derived ? '<span title="' + esc(t('coach.live.derived')) + '">≈</span>' : '') +
      '</div>' +
      efficiencyCurve(s.player.number, skill, rallies) +
      '</article>'
    );
  }
  function miniCourt(position, status) {
    return (
      '<article class="focus-position-card"><h2>' +
      esc(t('coach.live.courtPosition')) +
      '</h2><div class="focus-mini-court"><div class="focus-mini-net"></div>' +
      [4, 3, 2, 5, 6, 1]
        .map(function (p) {
          return '<span class="' + (p === position ? 'active status-' + status : '') + '">' + p + '</span>';
        })
        .join('') +
      '</div><p>' +
      esc(t('coach.live.frontRow')) +
      '<br>' +
      esc(t('coach.live.backRow')) +
      '</p></article>'
    );
  }
  function renderEmptyPlayerFocus() {
    if (innerWidth < innerHeight) {
      renderLiveCourt();
      return;
    }
    var fake = { number: 'NA', name: 'NA', position: '' },
      s = {
        player: fake,
        points: 0,
        errors: 0,
        eff: null,
        status: 'neutral',
        trend: 'stable',
        alert: '',
        skills: { attack: [], block: [], reception: [], defense: [] },
      };
    content.innerHTML =
      '<div class="player-focus-view">' +
      liveHeader(false) +
      '<div class="focus-navigation"><button data-focus-court>' +
      esc(t('coach.live.backToCourt')) +
      '</button><div><button disabled>‹</button><strong class="metric-na">NA</strong><button disabled>›</button></div></div><div class="focus-body"><aside><article class="focus-player-card status-neutral"><strong class="metric-na">NA</strong><b class="metric-na">NA</b><span class="live-role empty-role">NA</span><div class="focus-status metric-na">NA</div><div class="focus-player-mini"><span>PTS<b class="metric-na">0</b></span><span>ERR<b class="metric-na">0</b></span><span>EFF<b class="metric-na">NA</b></span></div></article>' +
      miniCourt(0, 'neutral') +
      '</aside><section class="focus-skills">' +
      ['attack', 'block', 'reception', 'defense']
        .map(function (skill) {
          return focusPanel(s, skill, []);
        })
        .join('') +
      '</section></div></div>';
  }
  function renderPlayerFocus() {
    if (C.data.empty) {
      renderEmptyPlayerFocus();
      return;
    }
    if (innerWidth < innerHeight) {
      renderLiveCourt();
      return;
    }
    var list = focusPlayers();
    if (
      !C.player ||
      !list.some(function (p) {
        return String(p.number) === String(C.player);
      })
    )
      C.player = (list[0] || {}).number;
    var p = playerInfo(C.data.match, C.player),
      setNo = +C.data.match.currentSet || 1,
      rallies = C.data.rallies.filter(function (r) {
        return r.set === setNo;
      }),
      events = C.data.events.filter(function (e) {
        return (+e.set || 1) === setNo;
      }),
      s = livePlayerStats(p, events, rallies),
      cur = currentState(C.data.match, C.data.rallies, setNo),
      position = 0;
    POS.some(function (z) {
      if (String(cur.court[z]) === String(p.number)) {
        position = +z.slice(1);
        return true;
      }
      return false;
    });
    var h =
      '<div class="player-focus-view">' +
      liveHeader(false) +
      '<div class="focus-navigation"><button type="button" data-focus-court>' +
      esc(t('coach.live.backToCourt')) +
      '</button><div><button type="button" data-focus-prev aria-label="' +
      esc(t('coach.live.prevPlayer')) +
      '">‹</button><strong>#' +
      esc(String(p.number).padStart(2, '0')) +
      ' ' +
      esc(String(p.name || t('coach.player')).toUpperCase()) +
      '</strong><button type="button" data-focus-next aria-label="' +
      esc(t('coach.live.nextPlayer')) +
      '">›</button></div></div><div class="focus-body"><aside><article class="focus-player-card status-' +
      s.status +
      '"><span class="focus-trend">' +
      trendSymbol(s.trend) +
      '</span><strong>#' +
      esc(String(p.number).padStart(2, '0')) +
      '</strong><b>' +
      esc(String(p.name || t('coach.player')).toUpperCase()) +
      '</b><div>' +
      roleChip(p) +
      ' <span>' +
      esc(t('coach.zone', { zone: position || 'NA' })) +
      '</span></div><div class="focus-status">' +
      liveStatusLabel(s.status) +
      '</div>' +
      (s.alert ? '<div class="focus-alert">⚠ <span>' + esc(s.alert) + '</span></div>' : '') +
      '<div class="focus-player-mini"><span>PTS<b>' +
      s.points +
      '</b></span><span>ERR<b>' +
      s.errors +
      '</b></span><span>EFF<b title="' +
      (['reception', 'defense'].indexOf(s.mainSkill) > -1 ? t('coach.live.derived') : '') +
      '">' +
      playerEffText(s) +
      '</b></span></div></article>' +
      miniCourt(position, s.status) +
      '</aside><section class="focus-skills">' +
      ['attack', 'block', 'reception', 'defense']
        .map(function (skill) {
          return focusPanel(s, skill, rallies);
        })
        .join('') +
      '</section></div><div class="focus-legend"><span class="good">' +
      esc(t('coach.live.legendGood')) +
      '</span><span class="neutral">' +
      esc(t('coach.live.legendNeutral')) +
      '</span><span class="error">' +
      esc(t('coach.live.legendError')) +
      '</span></div></div>';
    content.innerHTML = h;
  }

  P.LIVE_CFG = LIVE_CFG;
  P.cfg = cfg;
  P.outcome = outcome;
  P.liveSkillEvents = liveSkillEvents;
  P.qualityValue = qualityValue;
  P.positiveQuality = positiveQuality;
  P.blockedAttack = blockedAttack;
  P.canGrade = canGrade;
  P.hasIntermediateContacts = hasIntermediateContacts;
  P.skillEfficiency = skillEfficiency;
  P.mainSkillFor = mainSkillFor;
  P.livePlayerStats = livePlayerStats;
  P.liveStatusLabel = liveStatusLabel;
  P.trendSymbol = trendSymbol;
  P.roleChip = roleChip;
  P.formatEff = formatEff;
  P.playerEffText = playerEffText;
  P.liveSetDots = liveSetDots;
  P.liveHeader = liveHeader;
  P.liveEmptyCard = liveEmptyCard;
  P.livePlayerCard = livePlayerCard;
  P.rallyTimeline = rallyTimeline;
  P.renderLiveCourt = renderLiveCourt;
  P.focusPlayers = focusPlayers;
  P.focusNavigate = focusNavigate;
  P.focusSkillModel = focusSkillModel;
  P.lastFiveHTML = lastFiveHTML;
  P.curvePoints = curvePoints;
  P.efficiencyCurve = efficiencyCurve;
  P.skillTitle = skillTitle;
  P.focusPanel = focusPanel;
  P.miniCourt = miniCourt;
  P.renderEmptyPlayerFocus = renderEmptyPlayerFocus;
  P.renderPlayerFocus = renderPlayerFocus;
})();
