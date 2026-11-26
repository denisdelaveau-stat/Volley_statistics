/* Volley Live Coach UI — OVERVIEW view */
(function () {
  'use strict';
  var P = window.VolleyCoachParts;
  if (!P) return;
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
      rot = cur.rot;
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
        ? 'Efficacité attaque'
        : recv != null && recv >= Math.max(sov || -999, bpv || -999)
          ? 'Réception positive'
          : 'Dynamique collective';
    var h =
      sharedHeading(
        'Vue coach',
        'Détecter la dynamique du match',
        '<select class="coach-select" data-coach-period-select aria-label="Période"><option>' +
          periodLabel() +
          '</option></select>'
      ) +
      provenanceBanner() +
      periodButtons();
    h +=
      '<section class="coach-score"><div class="coach-team">' +
      esc(m.team.name || 'Nous') +
      '<strong>' +
      sc.a +
      '</strong></div><div class="coach-dash">–</div><div class="coach-team away">' +
      esc(m.opponent.name || 'Adversaire') +
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
      (cur.serving === 'A' ? 'NOTRE SERVICE' : 'SERVICE ADVERSE') +
      (demoOnly() ? auditBadge('DÉMO') : '') +
      '</div></section>';
    h +=
      '<section class="coach-grid coach-kpis">' +
      kpi(
        'Side-out',
        pctText(mt.so.n, mt.so.d),
        mt.so.d ? mt.so.n + '/' + mt.so.d + ' réceptions' : 'Échantillon limité',
        status('so', sov, mt.so.d),
        'phase'
      ) +
      kpi(
        'Break point',
        pctText(mt.bp.n, mt.bp.d),
        mt.bp.d ? mt.bp.n + '/' + mt.bp.d + ' services' : 'Échantillon limité',
        status('bp', bpv, mt.bp.d),
        'phase'
      ) +
      kpi(
        'Efficacité attaque',
        mt.att.d ? (aev > 0 ? '+' : '') + aev + '%' : '—',
        mt.att.d ? mt.att.kills + 'K / ' + mt.att.errors + 'E / ' + mt.att.d + ' ATT' : 'Échantillon limité',
        status('att', aev, mt.att.d),
        'actions'
      ) +
      kpi(
        'Réception +',
        pctText(mt.rec.n, mt.rec.d),
        mt.rec.d ? mt.rec.n + '/' + mt.rec.d + ' réceptions' : 'Échantillon limité',
        status('rec', recv, mt.rec.d),
        'actions'
      ) +
      kpi(
        'Service',
        mt.serve.d ? mt.serve.aces + ' ace' + (mt.serve.aces > 1 ? 's' : '') : '—',
        mt.serve.d
          ? mt.serve.errors + ' erreur' + (mt.serve.errors > 1 ? 's' : '') + ' · ' + mt.serve.d + ' services'
          : 'Échantillon limité',
        'neutral',
        'actions'
      ) +
      kpi(
        'Bloc',
        mt.block.d ? mt.block.points + ' point' + (mt.block.points > 1 ? 's' : '') : '—',
        mt.block.d ? mt.block.touches + ' touches · ' + mt.block.d + ' actions' : 'Échantillon limité',
        'neutral',
        'actions'
      ) +
      '</section>';
    h += courtHTML(rot, 'Passeuse en ' + cur.rotation.toUpperCase());
    h +=
      '<section class="coach-grid coach-two"><article class="coach-card coach-insight' +
      auditClass('rotation') +
      '"' +
      auditAttr('rotation') +
      '><span class="icon">△</span><div><h3>À surveiller</h3><strong>' +
      watch.label +
      ' · ' +
      watch.won +
      '/' +
      watch.total +
      ' rallyes gagnés</strong><span class="coach-muted">Signal descriptif · ' +
      periodLabel().toLowerCase() +
      '</span>' +
      (demoOnly() ? auditBadge('ROTATION DE DÉMONSTRATION') : '') +
      '</div><span class="coach-arrow">›</span></article><article class="coach-card coach-insight good" data-json-backed="true"><span class="icon">▥</span><div><h3>Point fort</h3><strong>' +
      bestSkill +
      '</strong><span class="coach-muted">Données observées sur ' +
      e.length +
      ' actions</span></div><span class="coach-arrow">›</span></article></section>';
    h +=
      '<section class="coach-card coach-momentum"><div><h3>Dynamique · 10 derniers points</h3><div class="rally-dots">' +
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
      '</div></div><div class="coach-run-score"><span>Nous<strong>' +
      homeW +
      '</strong></span><b>·</b><span>Adversaire<strong>' +
      (recent.length - homeW) +
      '</strong></span></div></section>';
    h +=
      '<div class="coach-actions"><button type="button" class="coach-cta" data-coach-go="rotations">↻ &nbsp; Analyser les rotations <span>›</span></button><button type="button" class="coach-cta secondary" data-coach-go="players">♟ &nbsp; Voir les joueurs <span>›</span></button></div>' +
      footer('Référence 01');
    content.innerHTML = h;
  }

  P.renderOverview = renderOverview;
})();
