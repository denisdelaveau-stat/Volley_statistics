/* Volley Live Coach UI — OVERVIEW view */
(function () {
  'use strict';
  var P = window.VolleyCoachParts;
  if (!P) return;
  var t = window.VolleyI18n.t;
  var C = P.C,
    esc = P.esc,
    pct = P.pct,
    pctText = P.pctText,
    currentState = P.currentState,
    setSummary = P.setSummary,
    selectedRallies = P.selectedRallies,
    selectedEvents = P.selectedEvents,
    metrics = P.metrics,
    status = P.status,
    periodLabel = P.periodLabel,
    scoreNow = P.scoreNow,
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
    rotationMetrics = P.rotationMetrics,
    content = P.content;
  function renderOverview() {
    var m = C.data.match,
      r = selectedRallies(),
      e = selectedEvents(),
      mt = metrics(r, e),
      sc = scoreNow(),
      ss = setSummary(m, C.data.rallies),
      cur = currentState(m, C.data.rallies, +m.currentSet || 1),
      rot = cur.court;
    var sov = pct(mt.so.n, mt.so.d),
      bpv = pct(mt.bp.n, mt.bp.d),
      aev = mt.att.d ? Math.round((mt.att.n * 100) / mt.att.d) : null,
      recv = pct(mt.rec.n, mt.rec.d);
    var recent = C.data.rallies.slice(-10),
      homeW = recent.filter(function (x) {
        return x.winner === 'team1';
      }).length;
    var rotationStats = rotationMetrics(r),
      watch = rotationStats.slice().sort(function (a, b) {
        return a.diff - b.diff;
      })[0] || { label: 'P—', won: 0, total: 0 };
    var bestSkill =
      aev != null && aev >= Math.max(sov || -999, bpv || -999, recv || -999)
        ? t('coach.kpiAttackEff')
        : recv != null && recv >= Math.max(sov || -999, bpv || -999)
          ? t('coach.positiveReception')
          : t('coach.teamMomentum');
    var h =
      sharedHeading(
        t('coach.overviewTitle'),
        t('coach.overviewSub'),
        '<select class="coach-select" data-coach-period-select aria-label="' +
          esc(t('coach.period')) +
          '"><option>' +
          periodLabel() +
          '</option></select>'
      ) +
      provenanceBanner() +
      periodButtons();
    h +=
      '<section class="coach-score"><div class="coach-team">' +
      esc(m.team.name || t('coach.us')) +
      '<strong>' +
      sc.a +
      '</strong></div><div class="coach-dash">–</div><div class="coach-team away">' +
      esc(m.opponent.name || t('coach.opponent')) +
      '<strong>' +
      sc.b +
      '</strong></div><div class="coach-match-meta">SET ' +
      (m.currentSet || 1) +
      ' · SETS ' +
      ss.a +
      '–' +
      ss.b +
      '</div><div class="coach-phase' +
      auditClass('phase') +
      '"' +
      auditAttr('phase') +
      '><span class="mini-ball">◉</span>' +
      (cur.serving === 'A' ? t('coach.ourServe') : t('coach.theirServe')) +
      (demoOnly() ? auditBadge('DÉMO') : '') +
      '</div></section>';
    h +=
      '<section class="coach-grid coach-kpis">' +
      kpi(
        'Side-out',
        pctText(mt.so.n, mt.so.d),
        mt.so.d ? t('coach.nReceptions', { n: mt.so.n, d: mt.so.d }) : t('coach.smallSample'),
        status('so', sov, mt.so.d),
        'phase'
      ) +
      kpi(
        'Break point',
        pctText(mt.bp.n, mt.bp.d),
        mt.bp.d ? t('coach.nServes', { n: mt.bp.n, d: mt.bp.d }) : t('coach.smallSample'),
        status('bp', bpv, mt.bp.d),
        'phase'
      ) +
      kpi(
        t('coach.kpiAttackEff'),
        mt.att.d ? (aev > 0 ? '+' : '') + aev + '%' : '—',
        mt.att.d ? mt.att.kills + 'K / ' + mt.att.errors + 'E / ' + mt.att.d + ' ATT' : t('coach.smallSample'),
        status('att', aev, mt.att.d),
        'actions'
      ) +
      kpi(
        t('coach.kpiReceptionPlus'),
        pctText(mt.rec.n, mt.rec.d),
        mt.rec.d ? t('coach.nReceptions', { n: mt.rec.n, d: mt.rec.d }) : t('coach.smallSample'),
        status('rec', recv, mt.rec.d),
        'actions'
      ) +
      kpi(
        t('coach.kpiServe'),
        mt.serve.d ? mt.serve.aces + ' ace' + (mt.serve.aces > 1 ? 's' : '') : '—',
        mt.serve.d
          ? t(mt.serve.errors > 1 ? 'coach.serveErrorsMany' : 'coach.serveErrorsOne', {
              n: mt.serve.errors,
              d: mt.serve.d,
            })
          : t('coach.smallSample'),
        'neutral',
        'actions'
      ) +
      kpi(
        t('coach.kpiBlock'),
        mt.block.d ? mt.block.points + ' point' + (mt.block.points > 1 ? 's' : '') : '—',
        mt.block.d ? mt.block.touches + ' touches · ' + mt.block.d + ' actions' : t('coach.smallSample'),
        'neutral',
        'actions'
      ) +
      '</section>';
    h += courtHTML(rot, t('coach.setterIn', { rotation: cur.rotation.toUpperCase() }));
    h +=
      '<section class="coach-grid coach-two"><article class="coach-card coach-insight' +
      auditClass('rotation') +
      '"' +
      auditAttr('rotation') +
      '><span class="icon">△</span><div><h3>' +
      esc(t('coach.watch')) +
      '</h3><strong>' +
      watch.label +
      ' · ' +
      watch.won +
      '/' +
      watch.total +
      ' ' +
      esc(t('coach.ralliesWon')) +
      '</strong><span class="coach-muted">' +
      esc(t('coach.descriptiveSignal')) +
      ' · ' +
      periodLabel().toLowerCase() +
      '</span>' +
      (demoOnly() ? auditBadge('ROTATION DE DÉMONSTRATION') : '') +
      '</div><span class="coach-arrow">›</span></article><article class="coach-card coach-insight good" data-json-backed="true"><span class="icon">▥</span><div><h3>' +
      esc(t('coach.strength')) +
      '</h3><strong>' +
      bestSkill +
      '</strong><span class="coach-muted">' +
      esc(t('coach.observedOn', { n: e.length })) +
      '</span></div><span class="coach-arrow">›</span></article></section>';
    h +=
      '<section class="coach-card coach-momentum"><div><h3>' +
      esc(t('coach.momentum10')) +
      '</h3><div class="rally-dots">' +
      recent
        .map(function (x) {
          return (
            '<span class="rally-dot ' +
            (x.winner === 'team1' ? '' : 'loss') +
            '">' +
            (x.winner === 'team1' ? 'N' : 'A') +
            '</span>'
          );
        })
        .join('') +
      '</div></div><div class="coach-run-score"><span>' +
      esc(t('coach.us')) +
      '<strong>' +
      homeW +
      '</strong></span><b>·</b><span>' +
      esc(t('coach.opponent')) +
      '<strong>' +
      (recent.length - homeW) +
      '</strong></span></div></section>';
    h +=
      '<div class="coach-actions"><button type="button" class="coach-cta" data-coach-go="rotations">↻ &nbsp; ' +
      esc(t('coach.analyseRotations')) +
      ' <span>›</span></button><button type="button" class="coach-cta secondary" data-coach-go="players">♟ &nbsp; ' +
      esc(t('coach.seePlayers')) +
      ' <span>›</span></button></div>' +
      footer(t('coach.reference', { n: '01' }));
    content.innerHTML = h;
  }

  P.renderOverview = renderOverview;
})();
