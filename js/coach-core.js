/* Volley Live Coach UI — shared core: storage keys, state, data loading, rally model, metrics, shared cards and empty states */
(function () {
  'use strict';
  var KM = 'volleyCapture.match.v1',
    KE = 'volleyCapture.events.v1',
    KR = 'volleyAnalysis.replay.v1',
    KRS = 'volleyAnalysis.replay.source.v1',
    KU = 'volleyAnalysis.unloaded.v1';
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
  var POS = ['p4', 'p3', 'p2', 'p5', 'p6', 'p1'];
  var NEXT = { p2: 'p1', p1: 'p6', p6: 'p5', p5: 'p4', p4: 'p3', p3: 'p2' };
  var ROLE = { setter: 'Passeur', oh: 'Réceptionneuse-attaquante', mb: 'Centrale', opp: 'Pointue', libero: 'Libéro' };
  var ROLE_SHORT = { setter: 'S', oh: 'OH', mb: 'MB', opp: 'OPP', libero: 'L' };
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
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
  function rotate(rot) {
    var n = {};
    Object.keys(NEXT).forEach(function (k) {
      n[NEXT[k]] = rot[k];
    });
    return n;
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
  function applySubstitution(rot, sub) {
    var zone = '';
    POS.some(function (k) {
      if (String(rot[k]) === String(sub.out)) {
        zone = k;
        return true;
      }
      return false;
    });
    if (zone) rot[zone] = sub.in;
    return rot;
  }
  function applySubsThrough(match, rot, setNo, eventCount) {
    (match.subs || [])
      .filter(function (s) {
        return (+s.set || 1) === setNo && (+s.at || 0) <= eventCount;
      })
      .sort(function (a, b) {
        return (+a.at || 0) - (+b.at || 0);
      })
      .forEach(function (s) {
        applySubstitution(rot, s);
      });
    return rot;
  }
  function initialServing(match, setNo) {
    var s = match.firstRally && match.firstRally.antibesState === 'reception' ? 'B' : 'A';
    if (setNo % 2 === 0) s = s === 'A' ? 'B' : 'A';
    return s;
  }

  function emptyData() {
    return {
      empty: true,
      match: {
        id: '',
        name: '',
        status: 'empty',
        currentSet: 1,
        team: { name: 'Équipe', roster: [] },
        opponent: { name: 'Adversaire' },
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
      warnings: ['Phase, rotation et présence terrain sont reconstruites depuis l’historique du match.'],
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
        var serving = initialServing(match, setNo),
          rot = clone(match.startingRotation || {}),
          pending = [],
          rallyLineup = null;
        var subs = (match.subs || [])
            .filter(function (s) {
              return (+s.set || 1) === setNo;
            })
            .sort(function (a, b) {
              return (+a.at || 0) - (+b.at || 0);
            }),
          subIndex = 0;
        sets[setNo].forEach(function (e, eventIndex) {
          while (subIndex < subs.length && (+subs[subIndex].at || 0) === eventIndex) {
            applySubstitution(rot, subs[subIndex]);
            subIndex++;
          }
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
          if (e.winningTeam === 'team1') {
            if (serving === 'B') rot = rotate(rot);
            serving = 'A';
          } else if (e.winningTeam === 'team2') serving = 'B';
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
      return { serving: serving, rot: rot, rotation: setterZone(match, rot) };
    }
    var serving = initialServing(match, setNo),
      rot = clone(match.startingRotation || {}),
      setEvents = (C.data.events || []).filter(function (e) {
        return (+e.set || 1) === setNo;
      }),
      eventIndex = 0,
      subs = (match.subs || [])
        .filter(function (s) {
          return (+s.set || 1) === setNo;
        })
        .sort(function (a, b) {
          return (+a.at || 0) - (+b.at || 0);
        }),
      subIndex = 0;
    setEvents.forEach(function (e) {
      while (subIndex < subs.length && (+subs[subIndex].at || 0) === eventIndex) {
        applySubstitution(rot, subs[subIndex]);
        subIndex++;
      }
      eventIndex++;
      if (e.winningTeam === 'team1') {
        if (serving === 'B') rot = rotate(rot);
        serving = 'A';
      } else if (e.winningTeam === 'team2') serving = 'B';
    });
    while (subIndex < subs.length && (+subs[subIndex].at || 0) <= eventIndex) {
      applySubstitution(rot, subs[subIndex]);
      subIndex++;
    }
    return { serving: serving, rot: rot, rotation: setterZone(match, rot) };
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
      ? 'Match'
      : C.period === 'last10'
        ? '10 derniers'
        : 'Set ' + (C.data.match.currentSet || 1);
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
      '<div class="coach-period" aria-label="Période">' +
      [
        ['set', 'SET ' + (C.data.match.currentSet || 1)],
        ['match', 'MATCH'],
        ['last10', '10 DERNIERS'],
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
      ? 'Aucun match chargé.'
      : C.data.replay
        ? 'Match rejoué · fichier JSON'
        : C.data.explicitContext
          ? 'Match chargé · volley-live v2.1'
          : 'Match live · Capture';
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
      '<aside class="coach-provenance"><strong>Origine des données</strong><span>' +
      (C.data.replay ? 'Replay JSON chargé.' : C.data.explicitContext ? 'Match JSON chargé.' : 'Match live chargé.') +
      '</span>' +
      (warning ? '<small>' + esc(warning) + '</small>' : '') +
      '<span class="analysis-source-actions"><button type="button" data-coach-load-file>Charger JSON</button>' +
      (C.data.replay && live ? '<button type="button" data-coach-live>Match live</button>' : '') +
      '<button type="button" data-coach-unload>Décharger</button></span></aside>'
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
      '><div class="coach-card-head"><h2>Organisation actuelle</h2><span class="coach-chip">' +
      esc(title) +
      '</span></div>' +
      (demoOnly() ? auditBadge('POSITION DE DÉMONSTRATION') : '') +
      '<div class="coach-court" role="img" aria-label="Organisation des joueurs sur le terrain"><div class="coach-net"></div><div class="coach-court-grid">' +
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
          esc(p.name || 'Joueur') +
          '</span><small>Poste ' +
          z.slice(1) +
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
      '<section class="analysis-empty-message" role="status"><strong>Aucun match chargé</strong><span>Chargez un match live issu de Capture ou un fichier JSON pour afficher les statistiques.</span><div class="analysis-empty-actions"><button type="button" data-coach-live ' +
      (live ? '' : 'disabled') +
      '>MATCH LIVE</button><button type="button" data-coach-load-file>CHARGER JSON</button></div></section>'
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
      '<section class="coach-card coach-court-card empty-panel"><div class="coach-card-head"><h2>Organisation actuelle</h2><span class="coach-chip">NA</span></div><div class="coach-court empty-court"><div class="coach-net"></div><div class="coach-court-grid">' +
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
    var h = sharedHeading('Vue coach', 'Aucun match actif') + emptyActions();
    h +=
      '<section class="coach-score empty-panel"><div class="coach-team">Équipe<strong class="empty-indicator">0</strong></div><div class="coach-dash">–</div><div class="coach-team away">Adversaire<strong class="empty-indicator">0</strong></div><div class="coach-match-meta">SET 0 · SETS 0–0</div><div class="coach-phase empty-indicator">NA</div></section>';
    h +=
      '<section class="coach-grid coach-kpis">' +
      emptyKpi('Side-out', 'NA', '0 réception') +
      emptyKpi('Break point', 'NA', '0 service') +
      emptyKpi('Efficacité attaque', 'NA', '0 action') +
      emptyKpi('Réception +', 'NA', '0 réception') +
      emptyKpi('Service', '0', '0 service') +
      emptyKpi('Bloc', '0', '0 action') +
      '</section>' +
      emptyCourt();
    h +=
      '<section class="coach-grid coach-two"><article class="coach-card coach-insight empty-indicator"><span class="icon">△</span><div><h3>À surveiller</h3><strong>NA</strong><span class="coach-muted">0 rallye</span></div></article><article class="coach-card coach-insight empty-indicator"><span class="icon">▥</span><div><h3>Point fort</h3><strong>NA</strong><span class="coach-muted">0 action</span></div></article></section><section class="coach-card coach-momentum empty-panel"><div><h3>Dynamique · 10 derniers points</h3><div class="empty-indicator">NA</div></div><div class="coach-run-score"><span>Équipe<strong class="empty-indicator">0</strong></span><b>·</b><span>Adversaire<strong class="empty-indicator">0</strong></span></div></section>' +
      footer('État vide');
    content.innerHTML = h;
  }
  function renderEmptyRotations() {
    var h = sharedHeading('Analyse des rotations', 'Aucun match actif') + emptyActions();
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
      emptyKpi('Side-out', 'NA', '0 rallye') +
      emptyKpi('Break point', 'NA', '0 rallye') +
      emptyKpi('Attaque', 'NA', '0 action') +
      emptyKpi('Réception +', 'NA', '0 réception') +
      '</section><section class="coach-card rotation-chart empty-panel"><h2>Comparaison des rotations</h2>' +
      [1, 2, 3, 4, 5, 6]
        .map(function (n) {
          return (
            '<div class="rotation-bar"><span>P' +
            n +
            '</span><div class="rotation-track"><div class="rotation-fill empty-fill" style="width:0%"></div></div><strong class="empty-indicator">0</strong></div>'
          );
        })
        .join('') +
      '</section><section class="coach-grid rotation-summary"><article class="coach-card rotation-award empty-indicator"><span class="big">NA</span><div>Meilleure rotation<small>0 rallye</small></div></article><article class="coach-card rotation-award empty-indicator"><span class="big">NA</span><div>À surveiller<small>0 rallye</small></div></article></section>' +
      footer('Équipe · état vide');
    content.innerHTML = h;
  }
  function renderEmptyPlayers() {
    var h = sharedHeading('Performance joueurs', 'Aucun match actif') + emptyActions();
    h +=
      '<div class="players-layout"><section class="coach-card empty-panel"><div class="coach-card-head"><h2>Joueurs</h2><span class="coach-chip empty-indicator">0</span></div><div class="coach-empty">0 joueur chargé.</div></section><section class="coach-card empty-panel"><h2 class="player-summary-title">NA</h2><section class="coach-grid player-summary-kpis">' +
      emptyKpi('Attaque', 'NA', '0 action') +
      emptyKpi('Réception', 'NA', '0 action') +
      emptyKpi('Service', '0', '0 service') +
      '</section><section class="coach-grid player-mini-two"><article class="coach-card"><h3>Participation</h3><div class="coach-grid coach-two"><div class="coach-kpi empty-indicator"><div class="value">0</div><div class="sample">Rallyes</div></div><div class="coach-kpi empty-indicator"><div class="value">0</div><div class="sample">Actions</div></div></div></article><article class="coach-card empty-indicator"><h3>Contribution</h3><strong>NA</strong></article></section><button type="button" class="player-detail-cta empty-detail-cta" data-empty-detail>Voir le détail joueur vide <span>›</span></button></section></div>' +
      footer('Joueurs · état vide');
    content.innerHTML = h;
  }
  function renderEmptyDetail() {
    var h =
      '<button type="button" class="detail-back" data-empty-players>‹ Retour aux joueurs</button>' +
      sharedHeading('Détail joueur', 'Aucun match actif') +
      emptyActions();
    h +=
      '<section class="coach-card detail-hero empty-panel"><div class="detail-number empty-indicator">NA</div><div><div class="detail-name">NA<small>NA</small></div><span class="detail-status empty-indicator">NA</span></div><div class="detail-net">Delta<strong class="empty-indicator">0</strong><small>0 point · 0 erreur</small></div></section><section class="coach-grid player-summary-kpis">' +
      emptyKpi('Attaque', 'NA', '0 action') +
      emptyKpi('Réception', 'NA', '0 action') +
      emptyKpi('Service', '0', '0 service') +
      '</section><section class="coach-grid detail-grid"><article class="coach-card empty-indicator"><h2>Participation</h2><strong>0</strong><small> rallye</small></article><article class="coach-card empty-indicator"><h2>Points directs</h2><strong>0</strong></article><article class="coach-card empty-indicator"><h2>Performance par set</h2><strong>NA</strong></article><article class="coach-card empty-indicator"><h2>Dernières actions</h2><strong>0</strong></article></section>' +
      footer('Détail joueur · état vide');
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
  P.NEXT = NEXT;
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
  P.applySubstitution = applySubstitution;
  P.applySubsThrough = applySubsThrough;
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
