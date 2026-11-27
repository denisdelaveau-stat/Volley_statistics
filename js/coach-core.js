/* Volley Live Coach UI — shared core: storage keys, state, data loading, rally model, metrics, shared cards and empty states */
(function () {
  'use strict';
  var KM = window.VolleyDomain.STORAGE.captureMatch,
    KE = window.VolleyDomain.STORAGE.captureEvents,
    KR = window.VolleyDomain.STORAGE.analysisReplay,
    KRS = window.VolleyDomain.STORAGE.analysisReplaySource,
    KU = window.VolleyDomain.STORAGE.analysisUnloaded;
  var screen = document.getElementById('coachScreen'),
    content = document.getElementById('coachContent');
  if (!screen || !content) return;
  var C = {
    view: 'overview',
    period: 'set',
    phase: 'all',
    rotation: null,
    playerScope: 'court',
    role: 'all',
    player: null,
    skill: 'summary',
    detailHistory: false,
    focusOrigin: 'live-court',
    data: null,
    sourceToken: null,
  };
  // Rotation rules come from the shared engine (js/index-rotation.js), the same as the capture screen.
  var Rotation = window.VolleyRotation;
  var POS = window.VolleyDomain.court.POS,
    rotate = window.VolleyDomain.court.rotate,
    initialServing = Rotation.initialServing;
  var t = window.VolleyI18n.t;
  var ROLE = {
    setter: t('coach.roleSetter'),
    oh: t('coach.roleOh'),
    mb: t('coach.roleMb'),
    opp: t('coach.roleOpp'),
    libero: t('coach.roleLibero'),
  };
  var ROLE_SHORT = { setter: 'S', oh: 'OH', mb: 'MB', opp: 'OPP', libero: 'L' };
  var esc = window.VolleyDom.esc;
  function read(k, fallback) {
    try {
      var x = JSON.parse(localStorage.getItem(k) || 'null');
      return x == null ? fallback : x;
    } catch (e) {
      return fallback;
    }
  }
  function clone(x) {
    return JSON.parse(JSON.stringify(x));
  }
  function pct(n, d) {
    return d ? Math.round((n * 100) / d) : null;
  }
  function pctText(n, d, sign) {
    var v = pct(n, d);
    return v == null ? 'NA' : (sign && v > 0 ? '+' : '') + v + '%';
  }
  function num(v) {
    return v == null ? '—' : String(v);
  }
  function playerInfo(match, n) {
    var r = (match && match.team && match.team.roster) || [];
    for (var i = 0; i < r.length; i++) if (String(r[i].number) === String(n)) return r[i];
    return { number: n, name: 'Joueur ' + n, position: '' };
  }
  function teamPlayers(match) {
    return ((match && match.team && match.team.roster) || []).filter(function (p) {
      return p.present !== false;
    });
  }
  function setterNumber(match) {
    return (
      (match && match.startingLineup && match.startingLineup.setter) ||
      (
        teamPlayers(match).filter(function (p) {
          return p.position === 'setter';
        })[0] || {}
      ).number
    );
  }
  function setterZone(match, rot) {
    var s = setterNumber(match),
      z = '';
    POS.some(function (k) {
      if (String(rot[k]) === String(s)) {
        z = k;
        return true;
      }
      return false;
    });
    return z || 'p1';
  }
  function rotationTo(match, target) {
    var r = clone(match.startingRotation || {}),
      guard = 0;
    while (setterZone(match, r) !== target && guard++ < 6) r = rotate(r);
    return r;
  }

  function emptyData() {
    return {
      empty: true,
      match: {
        id: '',
        name: '',
        status: 'empty',
        currentSet: 1,
        team: { name: t('coach.team'), roster: [] },
        opponent: { name: t('coach.opponent') },
        startingLineup: {},
        startingRotation: {},
        firstRally: {},
      },
      events: [],
      rallies: [],
      demo: false,
      replay: false,
      explicitContext: false,
      sourceFormat: 'empty',
      warnings: [],
      provenance: {
        actions: false,
        scores: false,
        rallies: false,
        phase: false,
        rotation: false,
        lineup: false,
        thresholds: false,
        source: 'empty',
      },
    };
  }
  function replayRaw() {
    try {
      return JSON.parse(sessionStorage.getItem(KR) || 'null');
    } catch (error) {
      return null;
    }
  }
  function liveRaw() {
    try {
      return window.VolleyStatsAdapter && window.VolleyStatsAdapter.fromLocalStorage(localStorage);
    } catch (error) {
      return null;
    }
  }
  function hasLive() {
    return !!liveRaw();
  }
  function load() {
    if (sessionStorage.getItem(KU) === '1') return emptyData();
    try {
      if (window.VolleyStatsAdapter) {
        var replay = replayRaw(),
          raw = replay || liveRaw();
        if (raw) {
          var data = window.VolleyStatsAdapter.toCoachData(raw);
          data.empty = false;
          data.replay = !!replay;
          return data;
        }
      }
    } catch (error) {
      console.error('Coach data adapter:', error);
    }
    var m = read(KM, null),
      e = read(KE, []);
    if (!m) return emptyData();
    return {
      empty: false,
      match: m,
      events: Array.isArray(e) ? e : [],
      demo: false,
      replay: false,
      explicitContext: false,
      sourceFormat: 'volley-live-capture v1',
      warnings: [t('coach.inferredWarning')],
      provenance: {
        actions: true,
        scores: true,
        rallies: true,
        phase: false,
        rotation: false,
        lineup: false,
        thresholds: false,
        source: 'capture-v1-inferred-context',
      },
    };
  }
  function buildRallies(match, events) {
    var sets = {},
      ordered = [];
    events.forEach(function (e) {
      var s = +e.set || 1;
      (sets[s] || (sets[s] = [])).push(e);
    });
    Object.keys(sets)
      .map(Number)
      .sort(function (a, b) {
        return a - b;
      })
      .forEach(function (setNo) {
        var steps = Rotation.trace(match, sets[setNo], setNo).steps,
          pending = [],
          rallyLineup = null;
        sets[setNo].forEach(function (e, eventIndex) {
          var rot = steps[eventIndex].rot,
            serving = steps[eventIndex].serving;
          if (!pending.length) rallyLineup = clone(rot);
          pending.push(e);
          if (!e.winningTeam) return;
          var z = setterZone(match, rot),
            r = {
              set: setNo,
              actions: pending.slice(),
              winner: e.winningTeam,
              scoreA: +e.scoreA || 0,
              scoreB: +e.scoreB || 0,
              serving: serving,
              phase: serving === 'A' ? 'serve' : 'receive',
              rotation: z,
              rotationLabel: z.toUpperCase(),
              lineup: clone(rallyLineup || rot),
              onCourt: POS.map(function (k) {
                return (rallyLineup || rot)[k];
              }),
            };
          ordered.push(r);
          pending = [];
          rallyLineup = null;
        });
      });
    return ordered;
  }
  function currentState(match, rallies, setNo) {
    if (C.data && C.data.explicitContext) {
      var explicit = rallies.filter(function (r) {
          return r.set === setNo;
        }),
        last = explicit[explicit.length - 1],
        rot = last && last.lineup ? clone(last.lineup) : clone(match.startingRotation || {}),
        serving = last ? (last.winner === 'team1' ? 'A' : 'B') : initialServing(match, setNo);
      if (last && last.phase === 'receive' && last.winner === 'team1') rot = rotate(rot);
      return {
        serving: serving,
        rot: rot,
        rotation: setterZone(match, rot),
        court: Rotation.onCourt(match, rot, { serving: serving }),
      };
    }
    var setEvents = (C.data.events || []).filter(function (e) {
        return (+e.set || 1) === setNo;
      }),
      state = Rotation.trace(match, setEvents, setNo);
    // rot: rotation slots (setter zone, rotation analysis); court: players on court, libero included (display).
    return {
      serving: state.serving,
      rot: state.rot,
      rotation: setterZone(match, state.rot),
      court: Rotation.onCourt(match, state.rot, state),
    };
  }
  function setSummary(match, rallies) {
    if (match.demoSetWins) return { a: match.demoSetWins.a, b: match.demoSetWins.b };
    var wonA = 0,
      wonB = 0,
      current = +match.currentSet || 1,
      max =
        C.data && C.data.explicitContext
          ? Math.max.apply(
              null,
              rallies
                .map(function (r) {
                  return r.set;
                })
                .concat([current])
            )
          : current - 1;
    for (var s = 1; s <= max; s++) {
      var rr = rallies.filter(function (r) {
          return r.set === s;
        }),
        last = rr[rr.length - 1];
      if (last) {
        if (last.scoreA > last.scoreB) wonA++;
        else if (last.scoreB > last.scoreA) wonB++;
      }
    }
    return { a: wonA, b: wonB };
  }
  function selectedRallies() {
    var all = C.data.rallies,
      m = C.data.match,
      cur = +m.currentSet || 1;
    if (C.period === 'match') return all;
    if (C.period === 'last10') return all.slice(-10);
    return all.filter(function (r) {
      return r.set === cur;
    });
  }
  function selectedEvents() {
    var a = [];
    selectedRallies().forEach(function (r) {
      a = a.concat(r.actions);
    });
    return a;
  }
  function ownEvent(e) {
    return e.player !== 'A' && e.player !== 'T';
  }
  function metrics(rallies, events) {
    var so = rallies.filter(function (r) {
        return r.phase === 'receive';
      }),
      bp = rallies.filter(function (r) {
        return r.phase === 'serve';
      }),
      soW = so.filter(function (r) {
        return r.winner === 'team1';
      }).length,
      bpW = bp.filter(function (r) {
        return r.winner === 'team1';
      }).length;
    var att = events.filter(function (e) {
        return ownEvent(e) && e.action === 'attack';
      }),
      kills = att.filter(function (e) {
        return e.result === 'point';
      }).length,
      ae = att.filter(function (e) {
        return e.result === 'error';
      }).length;
    var rec = events.filter(function (e) {
        return ownEvent(e) && e.action === 'reception';
      }),
      recP = rec.filter(function (e) {
        return e.result !== 'error';
      }).length;
    var srv = events.filter(function (e) {
        return ownEvent(e) && e.action === 'service';
      }),
      aces = srv.filter(function (e) {
        return e.result === 'point';
      }).length,
      se = srv.filter(function (e) {
        return e.result === 'error';
      }).length;
    var blk = events.filter(function (e) {
        return ownEvent(e) && e.action === 'block';
      }),
      bpnt = blk.filter(function (e) {
        return e.result === 'point';
      }).length,
      btouch = blk.filter(function (e) {
        return e.result !== 'error';
      }).length;
    return {
      so: { n: soW, d: so.length },
      bp: { n: bpW, d: bp.length },
      att: { kills: kills, errors: ae, d: att.length, n: kills - ae },
      rec: { n: recP, d: rec.length },
      serve: { aces: aces, errors: se, d: srv.length },
      block: { points: bpnt, touches: btouch, d: blk.length },
    };
  }
  function status(kind, v, d) {
    if (!d || d < 3) return 'neutral';
    if (kind === 'so' || kind === 'rec') return v >= 60 ? 'strong' : v >= 45 ? 'watch' : 'critical';
    if (kind === 'bp') return v >= 40 ? 'strong' : v >= 25 ? 'watch' : 'critical';
    if (kind === 'att') return v >= 35 ? 'strong' : v >= 15 ? 'watch' : 'critical';
    return 'neutral';
  }
  function periodLabel() {
    return C.period === 'match'
      ? t('coach.periodMatch')
      : C.period === 'last10'
        ? t('coach.periodLast10')
        : t('common.setLower', { set: C.data.match.currentSet || 1 });
  }
  function scoreNow() {
    var rr = C.data.rallies.filter(function (r) {
        return r.set === (+C.data.match.currentSet || 1);
      }),
      last = rr[rr.length - 1];
    return last ? { a: last.scoreA, b: last.scoreB } : { a: 0, b: 0 };
  }
  function periodButtons() {
    return (
      '<div class="coach-period" aria-label="' +
      esc(t('coach.period')) +
      '">' +
      [
        ['set', t('common.setN', { set: C.data.match.currentSet || 1 })],
        ['match', t('coach.periodMatchUpper')],
        ['last10', t('coach.periodLast10Upper')],
      ]
        .map(function (x) {
          return (
            '<button type="button" data-period="' +
            x[0] +
            '" class="' +
            (C.period === x[0] ? 'active' : '') +
            '">' +
            x[1] +
            '</button>'
          );
        })
        .join('') +
      '</div>'
    );
  }
  function footer(ref) {
    var source = C.data.empty
      ? t('coach.sourceNone')
      : C.data.replay
        ? t('coach.sourceReplay')
        : C.data.explicitContext
          ? t('coach.sourceV21')
          : t('coach.sourceLive');
    return '<footer class="coach-footer"><span>' + source + '</span><span>' + ref + ' · VOLLEY LIVE</span></footer>';
  }
  function provenance(kind) {
    return !!(C.data && C.data.provenance && C.data.provenance[kind] === true);
  }
  function auditBadge() {
    return '';
  }
  function demoOnly() {
    return !!(C.data && C.data.demo);
  }
  function auditClass() {
    return '';
  }
  function auditAttr(kind) {
    return (
      ' data-json-backed="' +
      (provenance(kind) ? 'true' : 'false') +
      '" data-demo-only="' +
      (demoOnly() ? 'true' : 'false') +
      '"'
    );
  }
  function provenanceBanner() {
    var warning = (C.data.warnings || []).join(' '),
      live = hasLive();
    return (
      '<aside class="coach-provenance"><strong>' +
      esc(t('coach.dataOrigin')) +
      '</strong><span>' +
      (C.data.replay
        ? t('coach.replayLoaded')
        : C.data.explicitContext
          ? t('coach.jsonLoaded')
          : t('coach.liveLoaded')) +
      '</span>' +
      (warning ? '<small>' + esc(warning) + '</small>' : '') +
      '<span class="analysis-source-actions"><button type="button" data-coach-load-file>' +
      esc(t('coach.loadJson')) +
      '</button>' +
      (C.data.replay && live
        ? '<button type="button" data-coach-live>' + esc(t('coach.liveMatch')) + '</button>'
        : '') +
      '<button type="button" data-coach-unload>' +
      esc(t('coach.unload')) +
      '</button></span></aside>'
    );
  }
  function kpi(title, value, sample, cls, kind) {
    kind = kind || 'actions';
    return (
      '<article class="coach-card coach-kpi ' +
      cls +
      auditClass() +
      '"' +
      auditAttr(kind) +
      '><span class="status" aria-hidden="true"></span><h3>' +
      title +
      '</h3><div class="value">' +
      value +
      '</div><div class="sample">' +
      sample +
      '</div>' +
      (demoOnly() ? auditBadge('DÉMO') : '') +
      '</article>'
    );
  }
  function normalizedRole(value) {
    var v = String(value || '').toLowerCase();
    return (
      {
        set: 'setter',
        setter: 'setter',
        lib: 'libero',
        libero: 'libero',
        opposite: 'opp',
        opp: 'opp',
        oh: 'oh',
        mb: 'mb',
      }[v] || v
    );
  }
  function roleClass(p) {
    var role = normalizedRole(p && p.position);
    return role ? 'role-' + role : 'role-libero';
  }
  function courtHTML(rot, title) {
    var m = C.data.match,
      kind = 'lineup';
    return (
      '<section class="coach-card coach-court-card' +
      auditClass(kind) +
      '"' +
      auditAttr(kind) +
      '><div class="coach-card-head"><h2>' +
      esc(t('coach.currentSetup')) +
      '</h2><span class="coach-chip">' +
      esc(title) +
      '</span></div>' +
      (demoOnly() ? auditBadge('POSITION DE DÉMONSTRATION') : '') +
      '<div class="coach-court" role="img" aria-label="' +
      esc(t('coach.courtLabel')) +
      '"><div class="coach-net"></div><div class="coach-court-grid">' +
      POS.map(function (z) {
        var p = playerInfo(m, rot[z]);
        return (
          '<div class="coach-player-dot ' +
          roleClass(p) +
          '" data-player-role="' +
          normalizedRole(p.position) +
          '"><span class="number">' +
          esc(p.number) +
          '</span><span class="name">' +
          esc(p.name || t('coach.player')) +
          '</span><small>' +
          esc(t('coach.zone', { zone: z.slice(1) })) +
          '</small></div>'
        );
      }).join('') +
      '</div></div></section>'
    );
  }
  function sharedHeading(title, sub, select) {
    return (
      '<div class="coach-heading-row"><div><h1 class="coach-title" tabindex="-1">' +
      title +
      '<span class="dot">.</span></h1>' +
      (sub ? '<p class="coach-subtitle">' + sub + '</p>' : '') +
      '</div>' +
      (select || '') +
      '</div>'
    );
  }

  function emptyActions() {
    var live = hasLive();
    return (
      '<section class="analysis-empty-message" role="status"><strong>' +
      esc(t('coach.noMatch')) +
      '</strong><span>' +
      esc(t('coach.noMatchHint')) +
      '</span><div class="analysis-empty-actions"><button type="button" data-coach-live ' +
      (live ? '' : 'disabled') +
      '>' +
      esc(t('coach.liveMatchUpper')) +
      '</button><button type="button" data-coach-load-file>' +
      esc(t('coach.loadJsonUpper')) +
      '</button></div></section>'
    );
  }
  function emptyKpi(title, value, label) {
    return (
      '<article class="coach-card coach-kpi empty-indicator"><h3>' +
      title +
      '</h3><div class="value">' +
      value +
      '</div><div class="sample">' +
      label +
      '</div></article>'
    );
  }
  function emptyCourt() {
    return (
      '<section class="coach-card coach-court-card empty-panel"><div class="coach-card-head"><h2>' +
      esc(t('coach.currentSetup')) +
      '</h2><span class="coach-chip">NA</span></div><div class="coach-court empty-court"><div class="coach-net"></div><div class="coach-court-grid">' +
      POS.map(function (z) {
        return (
          '<div class="coach-player-dot empty-player"><span class="number">NA</span><span class="name">NA</span><small>' +
          z.toUpperCase() +
          '</small></div>'
        );
      }).join('') +
      '</div></div></section>'
    );
  }
  function renderEmptyOverview() {
    var h = sharedHeading(t('coach.overviewTitle'), t('coach.noActive')) + emptyActions();
    h +=
      '<section class="coach-score empty-panel"><div class="coach-team">' +
      esc(t('coach.team')) +
      '<strong class="empty-indicator">0</strong></div><div class="coach-dash">–</div><div class="coach-team away">' +
      esc(t('coach.opponent')) +
      '<strong class="empty-indicator">0</strong></div><div class="coach-match-meta">SET 0 · SETS 0–0</div><div class="coach-phase empty-indicator">NA</div></section>';
    h +=
      '<section class="coach-grid coach-kpis">' +
      emptyKpi('Side-out', 'NA', t('coach.zeroReception')) +
      emptyKpi('Break point', 'NA', t('coach.zeroService')) +
      emptyKpi(t('coach.kpiAttackEff'), 'NA', t('coach.zeroAction')) +
      emptyKpi(t('coach.kpiReceptionPlus'), 'NA', t('coach.zeroReception')) +
      emptyKpi(t('coach.kpiServe'), '0', t('coach.zeroService')) +
      emptyKpi(t('coach.kpiBlock'), '0', t('coach.zeroAction')) +
      '</section>' +
      emptyCourt();
    h +=
      '<section class="coach-grid coach-two"><article class="coach-card coach-insight empty-indicator"><span class="icon">△</span><div><h3>' +
      esc(t('coach.watch')) +
      '</h3><strong>NA</strong><span class="coach-muted">' +
      esc(t('coach.zeroRally')) +
      '</span></div></article><article class="coach-card coach-insight empty-indicator"><span class="icon">▥</span><div><h3>' +
      esc(t('coach.strength')) +
      '</h3><strong>NA</strong><span class="coach-muted">' +
      esc(t('coach.zeroAction')) +
      '</span></div></article></section><section class="coach-card coach-momentum empty-panel"><div><h3>' +
      esc(t('coach.momentum10')) +
      '</h3><div class="empty-indicator">NA</div></div><div class="coach-run-score"><span>' +
      esc(t('coach.team')) +
      '<strong class="empty-indicator">0</strong></span><b>·</b><span>' +
      esc(t('coach.opponent')) +
      '<strong class="empty-indicator">0</strong></span></div></section>' +
      footer(t('coach.emptyState'));
    content.innerHTML = h;
  }
  function renderEmptyRotations() {
    var h = sharedHeading(t('coach.rotationsTitle'), t('coach.noActive')) + emptyActions();
    h +=
      '<div class="rotation-tabs">' +
      [1, 2, 3, 4, 5, 6]
        .map(function (n) {
          return '<button type="button" disabled>P' + n + '</button>';
        })
        .join('') +
      '</div>' +
      emptyCourt();
    h +=
      '<section class="coach-grid rotation-kpis">' +
      emptyKpi('Side-out', 'NA', t('coach.zeroRally')) +
      emptyKpi('Break point', 'NA', t('coach.zeroRally')) +
      emptyKpi(t('coach.kpiAttack'), 'NA', t('coach.zeroAction')) +
      emptyKpi(t('coach.kpiReceptionPlus'), 'NA', t('coach.zeroReception')) +
      '</section><section class="coach-card rotation-chart empty-panel"><h2>' +
      esc(t('coach.rotationCompare')) +
      '</h2>' +
      [1, 2, 3, 4, 5, 6]
        .map(function (n) {
          return (
            '<div class="rotation-bar"><span>P' +
            n +
            '</span><div class="rotation-track"><div class="rotation-fill empty-fill" style="width:0%"></div></div><strong class="empty-indicator">0</strong></div>'
          );
        })
        .join('') +
      '</section><section class="coach-grid rotation-summary"><article class="coach-card rotation-award empty-indicator"><span class="big">NA</span><div>' +
      esc(t('coach.bestRotation')) +
      '<small>' +
      esc(t('coach.zeroRally')) +
      '</small></div></article><article class="coach-card rotation-award empty-indicator"><span class="big">NA</span><div>' +
      esc(t('coach.watch')) +
      '<small>' +
      esc(t('coach.zeroRally')) +
      '</small></div></article></section>' +
      footer(t('coach.footerTeamEmpty'));
    content.innerHTML = h;
  }
  function renderEmptyPlayers() {
    var h = sharedHeading(t('coach.playersTitle'), t('coach.noActive')) + emptyActions();
    h +=
      '<div class="players-layout"><section class="coach-card empty-panel"><div class="coach-card-head"><h2>' +
      esc(t('coach.players')) +
      '</h2><span class="coach-chip empty-indicator">0</span></div><div class="coach-empty">' +
      esc(t('coach.zeroPlayers')) +
      '</div></section><section class="coach-card empty-panel"><h2 class="player-summary-title">NA</h2><section class="coach-grid player-summary-kpis">' +
      emptyKpi(t('coach.kpiAttack'), 'NA', t('coach.zeroAction')) +
      emptyKpi(t('coach.kpiReception'), 'NA', t('coach.zeroAction')) +
      emptyKpi(t('coach.kpiServe'), '0', t('coach.zeroService')) +
      '</section><section class="coach-grid player-mini-two"><article class="coach-card"><h3>Participation</h3><div class="coach-grid coach-two"><div class="coach-kpi empty-indicator"><div class="value">0</div><div class="sample">' +
      esc(t('coach.rallies')) +
      '</div></div><div class="coach-kpi empty-indicator"><div class="value">0</div><div class="sample">Actions</div></div></div></article><article class="coach-card empty-indicator"><h3>Contribution</h3><strong>NA</strong></article></section><button type="button" class="player-detail-cta empty-detail-cta" data-empty-detail>' +
      esc(t('coach.emptyDetailCta')) +
      ' <span>›</span></button></section></div>' +
      footer(t('coach.footerPlayersEmpty'));
    content.innerHTML = h;
  }
  function renderEmptyDetail() {
    var h =
      '<button type="button" class="detail-back" data-empty-players>' +
      esc(t('coach.backToPlayers')) +
      '</button>' +
      sharedHeading(t('coach.detailTitle'), t('coach.noActive')) +
      emptyActions();
    h +=
      '<section class="coach-card detail-hero empty-panel"><div class="detail-number empty-indicator">NA</div><div><div class="detail-name">NA<small>NA</small></div><span class="detail-status empty-indicator">NA</span></div><div class="detail-net">Delta<strong class="empty-indicator">0</strong><small>' +
      esc(t('coach.zeroPointError')) +
      '</small></div></section><section class="coach-grid player-summary-kpis">' +
      emptyKpi(t('coach.kpiAttack'), 'NA', t('coach.zeroAction')) +
      emptyKpi(t('coach.kpiReception'), 'NA', t('coach.zeroAction')) +
      emptyKpi(t('coach.kpiServe'), '0', t('coach.zeroService')) +
      '</section><section class="coach-grid detail-grid"><article class="coach-card empty-indicator"><h2>Participation</h2><strong>0</strong><small> ' +
      esc(t('coach.rallyWord')) +
      '</small></article><article class="coach-card empty-indicator"><h2>' +
      esc(t('coach.directPoints')) +
      '</h2><strong>0</strong></article><article class="coach-card empty-indicator"><h2>' +
      esc(t('coach.perSet')) +
      '</h2><strong>NA</strong></article><article class="coach-card empty-indicator"><h2>' +
      esc(t('coach.lastActions')) +
      '</h2><strong>0</strong></article></section>' +
      footer(t('coach.footerDetailEmpty'));
    content.innerHTML = h;
  }
  function renderEmpty() {
    if (C.view === 'overview') renderEmptyOverview();
    else if (C.view === 'rotations') renderEmptyRotations();
    else if (C.view === 'players') renderEmptyPlayers();
    else renderEmptyDetail();
  }
  var P = (window.VolleyCoachParts = {});
  P.KM = KM;
  P.screen = screen;
  P.C = C;
  P.POS = POS;
  P.ROLE = ROLE;
  P.ROLE_SHORT = ROLE_SHORT;
  P.esc = esc;
  P.read = read;
  P.clone = clone;
  P.pct = pct;
  P.pctText = pctText;
  P.num = num;
  P.playerInfo = playerInfo;
  P.teamPlayers = teamPlayers;
  P.rotate = rotate;
  P.setterNumber = setterNumber;
  P.setterZone = setterZone;
  P.rotationTo = rotationTo;
  P.initialServing = initialServing;
  P.emptyData = emptyData;
  P.replayRaw = replayRaw;
  P.liveRaw = liveRaw;
  P.hasLive = hasLive;
  P.load = load;
  P.buildRallies = buildRallies;
  P.currentState = currentState;
  P.setSummary = setSummary;
  P.selectedRallies = selectedRallies;
  P.selectedEvents = selectedEvents;
  P.ownEvent = ownEvent;
  P.metrics = metrics;
  P.status = status;
  P.periodLabel = periodLabel;
  P.scoreNow = scoreNow;
  P.periodButtons = periodButtons;
  P.footer = footer;
  P.provenance = provenance;
  P.auditBadge = auditBadge;
  P.demoOnly = demoOnly;
  P.auditClass = auditClass;
  P.auditAttr = auditAttr;
  P.provenanceBanner = provenanceBanner;
  P.kpi = kpi;
  P.normalizedRole = normalizedRole;
  P.roleClass = roleClass;
  P.courtHTML = courtHTML;
  P.sharedHeading = sharedHeading;
  P.emptyActions = emptyActions;
  P.emptyKpi = emptyKpi;
  P.emptyCourt = emptyCourt;
  P.renderEmptyOverview = renderEmptyOverview;
  P.renderEmptyRotations = renderEmptyRotations;
  P.renderEmptyPlayers = renderEmptyPlayers;
  P.renderEmptyDetail = renderEmptyDetail;
  P.renderEmpty = renderEmpty;
  P.KE = KE;
  P.KR = KR;
  P.KRS = KRS;
  P.KU = KU;
  P.content = content;
})();
