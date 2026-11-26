/* VolleyLive spectator view — LIVE SCORE: scoreboard and momentum. */
(function () {
  'use strict';
  var P = window.VolleySpectatorParts;
  var $ = P.$,
    esc = P.esc,
    num = P.num,
    upper = P.upper,
    isVoided = P.isVoided,
    monogram = P.monogram;
  var announcedLeader = null;
  var momentumCfg = Object.assign(
    { windowSize: 8, minPoints: 4, advantageThreshold: 0.7 },
    (window.VolleySpectatorConfig && window.VolleySpectatorConfig.momentum) || {}
  );

  function computeMomentum(points, setNumber, cfg) {
    cfg = Object.assign({}, momentumCfg, cfg || {});
    var setPoints = (points || [])
      .filter(function (point) {
        return (
          !isVoided(point) &&
          (setNumber == null || num(point.set, setNumber) === setNumber) &&
          ['HOME', 'AWAY'].indexOf(point.winner) >= 0
        );
      })
      .slice()
      .sort(function (a, b) {
        return num(a.rallyOrdinal, a.rally) - num(b.rallyOrdinal, b.rally);
      });
    var sequence = setPoints.slice(-cfg.windowSize).map(function (point) {
      return point.winner;
    });
    var k = sequence.length,
      homeCount = sequence.filter(function (side) {
        return side === 'HOME';
      }).length;
    var awayCount = k - homeCount,
      homePct = null,
      awayPct = null,
      leader = null;
    if (k >= cfg.minPoints) {
      homePct = Math.round((homeCount / k) * 100);
      awayPct = 100 - homePct;
      var h = homeCount / k,
        a = awayCount / k;
      leader = h >= cfg.advantageThreshold ? 'HOME' : a >= cfg.advantageThreshold ? 'AWAY' : 'BALANCED';
    }
    var streak = null;
    if (setPoints.length) {
      var last = setPoints[setPoints.length - 1].winner,
        length = 0;
      for (var i = setPoints.length - 1; i >= 0 && setPoints[i].winner === last; i--) length++;
      streak = { side: last, length: length };
    }
    return {
      setNumber: setNumber,
      windowSize: cfg.windowSize,
      sequence: sequence,
      homeCount: homeCount,
      awayCount: awayCount,
      homePct: homePct,
      awayPct: awayPct,
      leader: leader,
      streak: streak,
    };
  }
  function momentumView(m) {
    var value = computeMomentum(m.rallies, m.currentSet, momentumCfg),
      state;
    if (m.status === 'NO_MATCH') state = 'NO_MATCH';
    else if (m.status === 'MATCH_FINISHED') state = 'MATCH_FINISHED';
    else if (m.status === 'SET_FINISHED') state = 'SET_FINISHED';
    else if (!m.rallies.length) state = 'NEW_SET';
    else if (m.rallies.length < momentumCfg.minPoints) state = 'NOT_ENOUGH';
    else state = 'ACTIVE';
    value.state = state;
    return value;
  }
  function statusLabel(m) {
    if (m.status === 'NO_MATCH') return 'AUCUN MATCH';
    if (m.status === 'MATCH_FINISHED') return 'MATCH TERMINÉ';
    if (m.status === 'SET_FINISHED') return 'FIN DU SET ' + m.currentSet;
    if (m.status === 'NOT_STARTED') return 'SET ' + (m.currentSet || 1) + ' · À VENIR';
    return 'SET ' + m.currentSet + ' · EN COURS';
  }
  function setLogo(img, mono, url, name) {
    mono.textContent = monogram(name);
    img.removeAttribute('src');
    img.hidden = true;
    if (!url) return;
    img.onload = function () {
      img.hidden = false;
      mono.hidden = true;
    };
    img.onerror = function () {
      img.hidden = true;
      mono.hidden = false;
      img.removeAttribute('src');
    };
    mono.hidden = false;
    img.src = url;
  }
  function renderScoreboard(m) {
    var label = statusLabel(m),
      noMatch = m.status === 'NO_MATCH';
    $('headerHome').textContent = m.score.home;
    $('headerAway').textContent = m.score.away;
    $('setsHome').textContent = m.sets.home;
    $('setsAway').textContent = m.sets.away;
    $('headerSet').textContent = label;
    $('homeTeamDisplay').textContent = m.homeName;
    $('awayTeamDisplay').textContent = m.awayName;
    setLogo($('homeTeamLogo'), $('homeMonogram'), m.homeLogo, m.homeName);
    setLogo($('awayTeamLogo'), $('awayMonogram'), m.awayLogo, m.awayName);
    if (m.servingSide === 'HOME') $('serviceHome').removeAttribute('hidden');
    else $('serviceHome').setAttribute('hidden', '');
    if (m.servingSide === 'AWAY') $('serviceAway').removeAttribute('hidden');
    else $('serviceAway').setAttribute('hidden', '');
    $('liveScoreboard').classList.toggle('state-no-match', noMatch);
    var service = m.servingSide ? ', service ' + (m.servingSide === 'HOME' ? m.homeName : m.awayName) : '';
    $('liveScoreboard').setAttribute(
      'aria-label',
      noMatch
        ? 'Aucun match chargé, score 0 à 0'
        : m.homeName +
            ' ' +
            m.score.home +
            ', ' +
            m.awayName +
            ' ' +
            m.score.away +
            ', ' +
            label.toLowerCase() +
            ', sets ' +
            m.sets.home +
            ' à ' +
            m.sets.away +
            service
    );
  }
  function renderMomentum(m) {
    var vm = momentumView(m),
      card = $('momentumCard'),
      k = vm.sequence.length;
    card.className = 'live-card momentum-card state-' + vm.state.toLowerCase().replace('_', '-');
    if (vm.leader) card.classList.add('leader-' + vm.leader.toLowerCase());
    var subtitle = 'Aucun match chargé';
    if (vm.state === 'NEW_SET') subtitle = 'Nouveau set — en attente du premier point';
    else if (vm.state === 'NOT_ENOUGH') subtitle = 'Momentum disponible après ' + momentumCfg.minPoints + ' points';
    else if (vm.state === 'SET_FINISHED' || vm.state === 'MATCH_FINISHED')
      subtitle = 'Fin du set ' + m.currentSet + ' · ' + k + ' derniers points';
    else if (vm.state === 'ACTIVE') subtitle = 'Sur les ' + k + ' derniers points';
    $('momentumSubtitle').textContent = subtitle;
    var arrow = '—',
      headline = 'NA';
    if (vm.leader === 'HOME') {
      arrow = '↗';
      headline = 'Avantage ' + m.homeName;
    } else if (vm.leader === 'AWAY') {
      arrow = '↗';
      headline = 'Avantage ' + m.awayName;
    } else if (vm.leader === 'BALANCED') {
      arrow = '↔';
      headline = 'Équilibré';
    }
    $('momentumArrow').textContent = arrow;
    $('momentumLeader').textContent = headline;
    if (announcedLeader === vm.leader) $('momentumHeadline').setAttribute('aria-live', 'off');
    else {
      $('momentumHeadline').setAttribute('aria-live', 'polite');
      announcedLeader = vm.leader;
    }
    $('homePct').textContent = vm.homePct == null ? 'NA' : vm.homePct + ' %';
    $('awayPct').textContent = vm.awayPct == null ? 'NA' : vm.awayPct + ' %';
    $('homeMomentumBar').style.width = (vm.homePct == null ? 0 : vm.homePct) + '%';
    $('awayMomentumBar').style.width = (vm.awayPct == null ? 100 : vm.awayPct) + '%';
    $('momentumBar').setAttribute(
      'aria-label',
      vm.homePct == null
        ? 'Répartition indisponible'
        : m.homeName + ' ' + vm.homePct + ' pour cent, ' + m.awayName + ' ' + vm.awayPct + ' pour cent'
    );
    $('momentumHomeName').textContent = upper(m.homeName);
    $('momentumAwayName').textContent = upper(m.awayName);
    $('homeCount').textContent = vm.homeCount;
    $('awayCount').textContent = vm.awayCount;
    var placeholders = Math.max(0, vm.windowSize - k),
      html = '';
    for (var i = 0; i < placeholders; i++)
      html += '<span class="momentum-tile placeholder" role="listitem" aria-label="Emplacement vide"></span>';
    vm.sequence.forEach(function (side, index) {
      var team = side === 'HOME' ? m.homeName : m.awayName;
      html +=
        '<span class="momentum-tile ' +
        side.toLowerCase() +
        '" role="listitem" aria-label="Point ' +
        (index + 1) +
        ' : ' +
        esc(team) +
        '">' +
        (side === 'HOME' ? 'H' : 'A') +
        '</span>';
    });
    $('momentumSequence').style.setProperty('--momentum-slots', vm.windowSize);
    $('momentumSequence').innerHTML = html;
    var streakText = '—';
    if (vm.streak) {
      var streakTeam = vm.streak.side === 'HOME' ? m.homeName : m.awayName;
      streakText =
        vm.streak.length === 1
          ? 'Dernier point · ' + streakTeam
          : vm.streak.length + ' points consécutifs · ' + streakTeam;
    }
    $('streakText').textContent = streakText;
    $('streakPill').textContent =
      vm.state === 'SET_FINISHED' || vm.state === 'MATCH_FINISHED' ? 'SÉRIE FINALE' : 'SÉRIE EN COURS';
    $('streakPill').classList.toggle('emphasis', !!vm.streak && vm.streak.length >= 5);
    var ariaLeader =
      vm.leader === 'HOME'
        ? 'avantage ' + m.homeName
        : vm.leader === 'AWAY'
          ? 'avantage ' + m.awayName
          : vm.leader === 'BALANCED'
            ? 'équilibré'
            : 'indisponible';
    card.setAttribute(
      'aria-label',
      'Momentum : ' +
        ariaLeader +
        (k ? ', ' + vm.homeCount + ' points sur ' + k + ' pour ' + m.homeName : '') +
        (vm.streak
          ? ', série de ' +
            vm.streak.length +
            ' point' +
            (vm.streak.length > 1 ? 's' : '') +
            ' pour ' +
            (vm.streak.side === 'HOME' ? m.homeName : m.awayName)
          : '')
    );
  }

  P.computeMomentum = computeMomentum;
  P.momentumView = momentumView;
  P.statusLabel = statusLabel;
  P.setLogo = setLogo;
  P.renderScoreboard = renderScoreboard;
  P.renderMomentum = renderMomentum;
  P.momentumCfg = momentumCfg;
})();
