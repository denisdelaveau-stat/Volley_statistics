/* Volley Live Coach UI — ROTATIONS view */
(function () {
  'use strict';
  var P = window.VolleyCoachParts;
  if (!P) return;
  var t = window.VolleyI18n.t;
  var C = P.C,
    esc = P.esc,
    pct = P.pct,
    rotationTo = P.rotationTo,
    currentState = P.currentState,
    selectedRallies = P.selectedRallies,
    metrics = P.metrics,
    status = P.status,
    periodButtons = P.periodButtons,
    footer = P.footer,
    auditBadge = P.auditBadge,
    demoOnly = P.demoOnly,
    auditClass = P.auditClass,
    auditAttr = P.auditAttr,
    provenanceBanner = P.provenanceBanner,
    kpi = P.kpi,
    courtHTML = P.courtHTML,
    sharedHeading = P.sharedHeading,
    content = P.content;
  function rotationMetrics(rallies) {
    var out = [];
    for (var z = 1; z <= 6; z++) {
      var key = 'p' + z,
        rr = rallies.filter(function (r) {
          return r.rotation === key && (C.phase === 'all' || r.phase === C.phase);
        }),
        won = rr.filter(function (r) {
          return r.winner === 'team1';
        }).length,
        ev = [];
      rr.forEach(function (x) {
        ev = ev.concat(x.actions);
      });
      var mt = metrics(rr, ev);
      out.push({
        key: key,
        label: 'P' + z,
        total: rr.length,
        won: won,
        lost: rr.length - won,
        diff: won - (rr.length - won),
        so: pct(mt.so.n, mt.so.d),
        bp: pct(mt.bp.n, mt.bp.d),
        att: mt.att.d ? Math.round((mt.att.n * 100) / mt.att.d) : null,
        rec: pct(mt.rec.n, mt.rec.d),
        events: ev,
        rallies: rr,
      });
    }
    return out;
  }
  function renderRotations() {
    var m = C.data.match,
      all = selectedRallies(),
      cur = currentState(m, C.data.rallies, +m.currentSet || 1);
    if (!C.rotation) C.rotation = cur.rotation;
    var rows = rotationMetrics(all),
      sel =
        rows.filter(function (x) {
          return x.key === C.rotation;
        })[0] || rows[0],
      // Displayed line-up of the selected rotation, libero included (P1 only when the phase filter is reception).
      rot = window.VolleyRotation.onCourt(m, rotationTo(m, C.rotation), {
        serving: C.phase === 'receive' ? 'B' : 'A',
      }),
      best = rows.slice().sort(function (a, b) {
        return b.diff - a.diff || b.total - a.total;
      })[0],
      watch = rows.slice().sort(function (a, b) {
        return a.diff - b.diff || b.total - a.total;
      })[0];
    var h =
      sharedHeading(t('coach.rotationsTitle'), t('coach.rotationsSub', { set: m.currentSet || 1 })) +
      provenanceBanner() +
      periodButtons();
    h +=
      '<div class="coach-filter-row" aria-label="Phase"><button data-phase="all" class="' +
      (C.phase === 'all' ? 'active' : '') +
      '">' +
      esc(t('coach.phaseAll')) +
      '</button><button data-phase="receive" class="' +
      (C.phase === 'receive' ? 'active' : '') +
      '">' +
      esc(t('coach.phaseReceive')) +
      '</button><button data-phase="serve" class="' +
      (C.phase === 'serve' ? 'active' : '') +
      '">' +
      esc(t('coach.phaseServe')) +
      '</button></div>';
    h +=
      '<div class="rotation-tabs" aria-label="Rotation">' +
      rows
        .map(function (x) {
          return (
            '<button type="button" data-rotation="' +
            x.key +
            '" class="' +
            (x.key === C.rotation ? 'active' : '') +
            '" aria-label="' +
            x.label +
            ', ' +
            esc(t('coach.differential')) +
            ' ' +
            x.diff +
            '">' +
            x.label +
            '</button>'
          );
        })
        .join('') +
      '</div>';
    h += courtHTML(rot, 'Rotation ' + C.rotation.slice(1));
    h +=
      '<section class="coach-grid rotation-kpis">' +
      kpi(
        'Side-out',
        sel.so == null ? '—' : sel.so + '%',
        sel.total ? t('coach.nRallies', { n: sel.won, d: sel.total }) : t('coach.smallSample'),
        status('so', sel.so, sel.total),
        'phase'
      ) +
      kpi(
        'Break point',
        sel.bp == null ? '—' : sel.bp + '%',
        sel.total ? t('coach.nRallies', { n: sel.won, d: sel.total }) : t('coach.smallSample'),
        status('bp', sel.bp, sel.total),
        'phase'
      ) +
      kpi(
        t('coach.kpiAttack'),
        sel.att == null ? '—' : (sel.att > 0 ? '+' : '') + sel.att + '%',
        sel.events.length + ' actions',
        status('att', sel.att, sel.events.length),
        'actions'
      ) +
      kpi(
        t('coach.kpiReceptionPlus'),
        sel.rec == null ? '—' : sel.rec + '%',
        t('coach.receptionsCount', {
          n: sel.events.filter(function (e) {
            return e.action === 'reception';
          }).length,
        }),
        status('rec', sel.rec, sel.events.length),
        'actions'
      ) +
      '</section>';
    h +=
      '<section class="coach-card rotation-chart' +
      auditClass('rotation') +
      '"' +
      auditAttr('rotation') +
      '><h2>' +
      esc(t('coach.rotationCompare')) +
      '</h2>' +
      (demoOnly() ? auditBadge('ROTATIONS DE DÉMONSTRATION') : '') +
      '<p class="coach-subtitle">' +
      esc(t('coach.diffSub')) +
      '</p>' +
      rows
        .map(function (x) {
          var width = x.total ? Math.max(8, Math.min(100, 50 + x.diff * 10)) : 3;
          return (
            '<div class="rotation-bar ' +
            (x.key === C.rotation ? 'active ' : '') +
            (x.diff < 0 ? 'watch' : '') +
            '"><span>' +
            x.label +
            '</span><div class="rotation-track"><div class="rotation-fill" style="width:' +
            width +
            '%"></div></div><strong>' +
            (x.diff > 0 ? '+' : '') +
            x.diff +
            '</strong></div>'
          );
        })
        .join('') +
      '<p class="coach-note">' +
      esc(t('coach.diffNote')) +
      '</p></section>';
    h +=
      '<section class="coach-grid rotation-summary' +
      auditClass('rotation') +
      '"' +
      auditAttr('rotation') +
      '><article class="coach-card rotation-award"><span class="big">♛</span><div>' +
      esc(t('coach.bestRotation')) +
      '<div class="big">' +
      best.label +
      '</div><small>' +
      best.won +
      '/' +
      best.total +
      ' ' +
      esc(t('coach.ralliesWord')) +
      '</small></div></article><article class="coach-card rotation-award watch"><span class="big">△</span><div>' +
      esc(t('coach.watch')) +
      '<div class="big">' +
      watch.label +
      '</div><small>' +
      watch.won +
      '/' +
      watch.total +
      ' ' +
      esc(t('coach.ralliesWord')) +
      '</small></div></article></section>';
    h +=
      '<button type="button" class="detail-full-actions" data-coach-go="players">' +
      esc(t('coach.comparePlayers')) +
      ' &nbsp; ›</button>' +
      footer(t('coach.reference', { n: '02' }));
    content.innerHTML = h;
  }

  P.rotationMetrics = rotationMetrics;
  P.renderRotations = renderRotations;
})();
