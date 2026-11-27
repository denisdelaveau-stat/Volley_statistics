/* VolleyLive spectator view — LIVE SCORE: scoreboard and momentum. */
(function () {
  'use strict';
  var t = window.VolleyI18n.t;
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
    if (m.status === 'NO_MATCH') return t('spectator.noMatchUpper');
    if (m.status === 'MATCH_FINISHED') return t('spectator.matchFinished');
    if (m.status === 'SET_FINISHED') return t('spectator.setEnd', { set: m.currentSet });
    if (m.status === 'NOT_STARTED') return t('spectator.setUpcoming', { set: m.currentSet || 1 });
    return t('spectator.setInProgress', { set: m.currentSet });
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
    var service = m.servingSide
      ? ', ' + t('spectator.serviceOf', { team: m.servingSide === 'HOME' ? m.homeName : m.awayName })
      : '';
    $('liveScoreboard').setAttribute(
      'aria-label',
      noMatch
        ? t('spectator.noMatchScore')
        : m.homeName +
            ' ' +
            m.score.home +
            ', ' +
            m.awayName +
            ' ' +
            m.score.away +
            ', ' +
            label.toLowerCase() +
            ', ' +
            t('spectator.setsScore', { home: m.sets.home, away: m.sets.away }) +
            service
    );
  }
  function renderMomentum(m) {
    var vm = momentumView(m),
      card = $('momentumCard'),
      k = vm.sequence.length;
    card.className = 'live-card momentum-card state-' + vm.state.toLowerCase().replace('_', '-');
    if (vm.leader) card.classList.add('leader-' + vm.leader.toLowerCase());
    var subtitle = t('spectator.noMatchLoaded');
    if (vm.state === 'NEW_SET') subtitle = t('spectator.newSet');
    else if (vm.state === 'NOT_ENOUGH') subtitle = t('spectator.momentumAfter', { n: momentumCfg.minPoints });
    else if (vm.state === 'SET_FINISHED' || vm.state === 'MATCH_FINISHED')
      subtitle = t('spectator.setEndLast', { set: m.currentSet, k: k });
    else if (vm.state === 'ACTIVE') subtitle = t('spectator.overLast', { k: k });
    $('momentumSubtitle').textContent = subtitle;
    var arrow = '—',
      headline = 'NA';
    if (vm.leader === 'HOME') {
      arrow = '↗';
      headline = t('spectator.advantage', { team: m.homeName });
    } else if (vm.leader === 'AWAY') {
      arrow = '↗';
      headline = t('spectator.advantage', { team: m.awayName });
    } else if (vm.leader === 'BALANCED') {
      arrow = '↔';
      headline = t('spectator.balanced');
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
        ? t('spectator.splitUnavailable')
        : t('spectator.splitLabel', { home: m.homeName, homePct: vm.homePct, away: m.awayName, awayPct: vm.awayPct })
    );
    $('momentumHomeName').textContent = upper(m.homeName);
    $('momentumAwayName').textContent = upper(m.awayName);
    $('homeCount').textContent = vm.homeCount;
    $('awayCount').textContent = vm.awayCount;
    var placeholders = Math.max(0, vm.windowSize - k),
      html = '';
    for (var i = 0; i < placeholders; i++)
      html +=
        '<span class="momentum-tile placeholder" role="listitem" aria-label="' +
        esc(t('spectator.emptySlot')) +
        '"></span>';
    vm.sequence.forEach(function (side, index) {
      var team = side === 'HOME' ? m.homeName : m.awayName;
      html +=
        '<span class="momentum-tile ' +
        side.toLowerCase() +
        '" role="listitem" aria-label="' +
        esc(t('spectator.pointOf', { n: index + 1, team: team })) +
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
          ? t('spectator.lastPointOf', { team: streakTeam })
          : t('spectator.consecutive', { n: vm.streak.length, team: streakTeam });
    }
    $('streakText').textContent = streakText;
    $('streakPill').textContent =
      vm.state === 'SET_FINISHED' || vm.state === 'MATCH_FINISHED'
        ? t('spectator.finalRun')
        : t('spectator.currentRun');
    $('streakPill').classList.toggle('emphasis', !!vm.streak && vm.streak.length >= 5);
    var ariaLeader =
      vm.leader === 'HOME'
        ? t('spectator.advantageLower', { team: m.homeName })
        : vm.leader === 'AWAY'
          ? t('spectator.advantageLower', { team: m.awayName })
          : vm.leader === 'BALANCED'
            ? t('spectator.balancedLower')
            : t('spectator.unavailable');
    card.setAttribute(
      'aria-label',
      t('spectator.momentumAria', { leader: ariaLeader }) +
        (k ? ', ' + t('spectator.pointsOutOf', { n: vm.homeCount, k: k, team: m.homeName }) : '') +
        (vm.streak
          ? ', ' +
            t(vm.streak.length > 1 ? 'spectator.streakMany' : 'spectator.streakOne', {
              n: vm.streak.length,
              team: vm.streak.side === 'HOME' ? m.homeName : m.awayName,
            })
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
