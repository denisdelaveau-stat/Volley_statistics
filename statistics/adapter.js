/* VolleyLive shared data adapter.
 * Unified volley-live v2.1 is authoritative for Coach and Advanced Statistics.
 * Capture v1 remains a migration input for an in-progress local match only.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.VolleyStatsAdapter = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var ACTION_CODES = {
    SERVICE: 'Sv',
    RECEPTION: 'R',
    SET: 'St',
    ATTACK: 'A',
    BLOCK: 'B',
    DEFENSE: 'D',
    DEFENCE: 'D',
    FREEBALL: 'F',
    FREE_BALL: 'F',
    RELAUNCH: 'F',
    OPPONENT_ACTION: 'A',
    ADVERSE: 'A',
    GENERIC: 'F',
    TEAM: 'F',
    service: 'Sv',
    reception: 'R',
    set: 'St',
    attack: 'A',
    block: 'B',
    defense: 'D',
    defence: 'D',
    freeball: 'F',
    free_ball: 'F',
    relaunch: 'F',
    adverse: 'A',
  };
  var ROLE_CODES = {
    setter: 'SET',
    set: 'SET',
    SET: 'SET',
    opp: 'OPP',
    opposite: 'OPP',
    OPP: 'OPP',
    oh: 'OH',
    OH: 'OH',
    mb: 'MB',
    MB: 'MB',
    libero: 'LIB',
    lib: 'LIB',
    LIB: 'LIB',
  };
  var ROLE_TO_CAPTURE = { SET: 'setter', OPP: 'opp', OH: 'oh', MB: 'mb', LIB: 'libero' };
  var ZONES = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }
  function text(value, fallback) {
    return value === undefined || value === null || value === '' ? fallback : String(value);
  }
  function number(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  function upper(value) {
    return String(value || '').toUpperCase();
  }
  /* Shared domain rule used by statistics and spectator evolution views. */
  function isFaultEvaluation(value) {
    var v = String(value || '').toLowerCase();
    return v === 'error' || v === 'fault';
  }
  function isFaultEvent(event) {
    return (
      !!event &&
      upper(event.eventType || 'ACTION') === 'ACTION' &&
      upper(event.status || 'ACTIVE') !== 'VOIDED' &&
      isFaultEvaluation(event.evaluation !== undefined ? event.evaluation : event.result)
    );
  }
  function normalResult(value) {
    var v = String(value || '').toLowerCase();
    if (v === 'point' || v === 'kill' || v === 'ace') return 'point';
    if (isFaultEvaluation(v)) return 'error';
    return 'continue';
  }
  function captureResult(value) {
    var v = normalResult(value);
    return v === 'continue' ? 'neutral' : v;
  }
  function roleCode(value) {
    return ROLE_CODES[value] || ROLE_CODES[String(value || '').toLowerCase()] || upper(value) || '—';
  }
  function actionCode(value) {
    return (
      ACTION_CODES[value] ||
      ACTION_CODES[upper(value)] ||
      ACTION_CODES[String(value || '').toLowerCase()] ||
      text(value, '—')
    );
  }
  function captureAction(value) {
    var code = actionCode(value);
    return (
      { Sv: 'service', R: 'reception', St: 'set', A: 'attack', B: 'block', D: 'defense', F: 'freeball' }[code] ||
      'generic'
    );
  }
  function rotateClockwise(lineup) {
    return { p1: lineup.p2, p2: lineup.p3, p3: lineup.p4, p4: lineup.p5, p5: lineup.p6, p6: lineup.p1 };
  }
  function detectFormat(raw) {
    if (raw && raw.format === 'volley-live' && /^2\./.test(String(raw.schemaVersion || ''))) return 'unified-v2';
    if (raw && raw.format === 'volley-live-capture' && Number(raw.version) === 1) return 'capture-v1';
    return 'unknown';
  }

  function validateUnifiedV2(raw) {
    var errors = [],
      warnings = [],
      ids = {},
      sequences = {};
    if (!raw || typeof raw !== 'object') errors.push('Le document JSON doit être un objet.');
    if (raw && raw.format !== 'volley-live') errors.push('format doit valoir "volley-live".');
    if (raw && !/^2\./.test(String(raw.schemaVersion || '')))
      errors.push('schemaVersion doit être compatible avec volley-live v2.x.');
    if (raw && raw.documentType !== 'match') errors.push('documentType doit valoir "match".');
    if (!raw || !raw.match || typeof raw.match !== 'object') errors.push('match est obligatoire.');
    if (!raw || !Array.isArray(raw.teams) || raw.teams.length < 2) errors.push('teams doit contenir les deux équipes.');
    if (!raw || !Array.isArray(raw.players)) errors.push('players doit être un tableau.');
    if (!raw || !Array.isArray(raw.sets)) errors.push('sets doit être un tableau.');
    if (!raw || !Array.isArray(raw.rallies)) errors.push('rallies doit être un tableau.');
    if (!raw || !Array.isArray(raw.events)) errors.push('events doit être un tableau.');
    if (raw && Array.isArray(raw.events))
      raw.events.forEach(function (event, index) {
        if (!event || typeof event !== 'object') {
          errors.push('events[' + index + '] doit être un objet.');
          return;
        }
        if (!event.eventId) errors.push('events[' + index + '].eventId est obligatoire.');
        else if (ids[event.eventId]) errors.push('eventId dupliqué : ' + event.eventId + '.');
        else ids[event.eventId] = true;
        var seq = number(event.sequenceNumber, null);
        if (seq === null) errors.push('events[' + index + '].sequenceNumber est obligatoire.');
        else if (sequences[seq]) errors.push('sequenceNumber dupliqué : ' + seq + '.');
        else sequences[seq] = true;
        if (!event.eventType) errors.push('events[' + index + '].eventType est obligatoire.');
        if (upper(event.eventType) === 'ACTION') {
          if (!event.rallyId) errors.push('events[' + index + '].rallyId est obligatoire pour une action.');
          if (!event.actionType) errors.push('events[' + index + '].actionType est obligatoire.');
          if (!event.evaluation) errors.push('events[' + index + '].evaluation est obligatoire.');
        }
      });
    if (raw && raw.dataQuality && raw.dataQuality.lineupsVerified === false)
      warnings.push('Les compositions de départ de la fixture sont déduites et non confirmées par le coach.');
    return { valid: errors.length === 0, errors: errors, warnings: warnings, format: 'unified-v2' };
  }

  function validateCaptureV1(raw) {
    var errors = [];
    if (!raw || typeof raw !== 'object') errors.push('Le document JSON doit être un objet.');
    if (raw && raw.format !== 'volley-live-capture') errors.push('format doit valoir "volley-live-capture".');
    if (raw && Number(raw.version) !== 1) errors.push('Cette version attend un export Volley Live Capture version 1.');
    if (!raw || !raw.match || typeof raw.match !== 'object') errors.push('match est obligatoire.');
    if (!raw || !Array.isArray(raw.events)) errors.push('events doit être un tableau.');
    if (raw && raw.match && (!raw.match.team || !Array.isArray(raw.match.team.roster)))
      errors.push('match.team.roster est obligatoire.');
    if (raw && Array.isArray(raw.events))
      raw.events.forEach(function (event, index) {
        if (!event || typeof event !== 'object') errors.push('events[' + index + '] doit être un objet.');
        else {
          if (event.set === undefined) errors.push('events[' + index + '].set est obligatoire.');
          if (!event.action) errors.push('events[' + index + '].action est obligatoire.');
          if (!event.result) errors.push('events[' + index + '].result est obligatoire.');
        }
      });
    return { valid: errors.length === 0, errors: errors, warnings: [], format: 'capture-v1' };
  }

  function validate(raw) {
    var format = detectFormat(raw);
    if (format === 'unified-v2') return validateUnifiedV2(raw);
    if (format === 'capture-v1') return validateCaptureV1(raw);
    return {
      valid: false,
      errors: ['Format non reconnu : utilisez un document volley-live v2.1 (ou un export Capture v1 à migrer).'],
      warnings: [],
      format: 'unknown',
    };
  }

  function teamInfoV2(raw) {
    var match = raw.match || {},
      teams = raw.teams || [];
    var ourId =
      match.ourTeamId ||
      (
        teams.find(function (t) {
          return upper(t.side) === 'OUR';
        }) || {}
      ).teamId;
    var opponentId =
      match.opponentTeamId ||
      (
        teams.find(function (t) {
          return upper(t.side) === 'OPPONENT';
        }) || {}
      ).teamId;
    var our = teams.find(function (t) {
      return t.teamId === ourId;
    }) ||
      teams[0] || { teamId: ourId, name: 'Notre équipe' };
    var opponent = teams.find(function (t) {
      return t.teamId === opponentId;
    }) ||
      teams[1] || { teamId: opponentId, name: 'Adversaire' };
    return { ourId: our.teamId || ourId, opponentId: opponent.teamId || opponentId, our: our, opponent: opponent };
  }
  function rosterV2(raw, team) {
    return (raw.players || [])
      .filter(function (p) {
        return p.teamId === team.ourId || (!p.teamId && upper(p.side) === 'OUR');
      })
      .map(function (p) {
        return {
          id: p.playerId || p.id,
          number: number(p.number, p.number),
          name: text(p.name, 'Joueur ' + p.number),
          role: roleCode(p.role || p.position),
        };
      });
  }
  function playerKey(player) {
    return '#' + player.number + ' ' + (player.name || 'Joueur ' + player.number);
  }
  function resultForRally(rally, ourId) {
    if (!rally || !rally.winnerTeamId) return 'OPEN';
    if (rally.winnerTeamId !== ourId) return 'L';
    return upper(rally.phaseAtStart) === 'SERVE' ? 'BP' : 'SO';
  }
  function eventScore(event, rally) {
    return (
      event.scoreAfter ||
      event.scoreBefore ||
      (rally && (rally.scoreAfter || rally.scoreBefore)) || { our: 0, opponent: 0 }
    );
  }
  function zoneNumber(value) {
    var v = String(value || '').toUpperCase();
    return /^P[1-6]$/.test(v) ? v : 'P?';
  }

  function toReportDataV2(raw) {
    var validation = validateUnifiedV2(raw);
    if (!validation.valid) throw new Error(validation.errors.join(' '));
    var team = teamInfoV2(raw),
      roster = rosterV2(raw, team),
      keyById = {},
      roles = {},
      ownPlayers = [];
    roster.forEach(function (player) {
      var key = playerKey(player);
      keyById[player.id] = key;
      roles[key] = player.role;
      ownPlayers.push(key);
    });
    var opponent = 'ADV · ' + text(team.opponent.name, 'Adversaire');
    roles[opponent] = 'OPPONENT';
    var players = ownPlayers.concat([opponent]),
      rallyById = {},
      lineupById = {};
    (raw.rallies || []).forEach(function (r) {
      rallyById[r.rallyId] = r;
    });
    (raw.lineups || []).forEach(function (l) {
      lineupById[l.lineupVersionId] = l;
    });
    var shadeBySet = {},
      previousBySet = {},
      rallyShade = {};
    (raw.rallies || [])
      .slice()
      .sort(function (a, b) {
        return number(a.setNumber, 0) - number(b.setNumber, 0) || number(a.rallyNumber, 0) - number(b.rallyNumber, 0);
      })
      .forEach(function (r) {
        var result = resultForRally(r, team.ourId),
          setNo = number(r.setNumber, 1),
          shade = shadeBySet[setNo] || 0;
        if (previousBySet[setNo] === result) shade = 1 - shade;
        else shade = 0;
        previousBySet[setNo] = result;
        shadeBySet[setNo] = shade;
        rallyShade[r.rallyId] = shade;
      });
    var cols = [];
    (raw.events || [])
      .filter(function (event) {
        return upper(event.eventType) === 'ACTION' && upper(event.status || 'ACTIVE') !== 'VOIDED';
      })
      .sort(function (a, b) {
        return number(a.sequenceNumber, 0) - number(b.sequenceNumber, 0);
      })
      .forEach(function (event) {
        var rally = rallyById[event.rallyId] || {},
          actions = {},
          isOur = event.teamId === team.ourId;
        var key = isOur ? keyById[event.playerId] : opponent;
        if (key)
          actions[key] = {
            t: actionCode(event.actionType),
            state: normalResult(event.evaluation),
            provenance: event.provenance || null,
            quality: event.quality,
          };
        var court = {},
          onCourt = rally.onCourtPlayerIds || (lineupById[rally.lineupVersionId] || {}).onCourtPlayerIds || [];
        players.forEach(function (p) {
          court[p] =
            p === opponent
              ? false
              : onCourt.some(function (id) {
                  return keyById[id] === p;
                });
        });
        var score = eventScore(event, rally),
          setNo = number(rally.setNumber, event.setNumber || 1),
          rallyNo = number(rally.rallyNumber, 1);
        cols.push({
          set: setNo,
          score: number(score.our, 0) + '-' + number(score.opponent, 0),
          rot: zoneNumber(rally.setterRotationAtStart),
          phase: upper(rally.phaseAtStart) === 'SERVE' ? 'S' : 'R',
          rally: 'S' + setNo + '·R' + rallyNo,
          rallyNumber: rallyNo,
          result: resultForRally(rally, team.ourId),
          shade: rallyShade[rally.rallyId] || 0,
          actions: actions,
          court: court,
          timestamp: event.recordedAt || null,
          sourceEventId: event.eventId,
          provenance: event.provenance || null,
        });
      });
    var synthetic = (raw.events || []).filter(function (e) {
      return upper(e.provenance) === 'SYNTHETIC';
    }).length;
    var captured = (raw.events || []).filter(function (e) {
      return upper(e.provenance) === 'CAPTURED';
    }).length;
    var fixture = !!(raw.dataQuality && raw.dataQuality.fixture);
    var warnings = (validation.warnings || []).slice();
    if (synthetic)
      warnings.unshift(
        synthetic +
          ' événements neutres synthétiques sont inclus pour valider les métriques et les interfaces; les scores et fins de rally restent issus des ' +
          captured +
          ' événements capturés.'
      );
    if (raw.dataQuality && Array.isArray(raw.dataQuality.unknownFields) && raw.dataQuality.unknownFields.length)
      warnings.push('Champs encore inconnus : ' + raw.dataQuality.unknownFields.join(', ') + '.');
    return {
      cols: cols,
      players: players,
      analyticsPlayers: ownPlayers,
      roles: roles,
      meta: {
        matchName: text(raw.match.name, 'Match'),
        teamName: text(team.our.name, 'Notre équipe'),
        opponentName: text(team.opponent.name, 'Adversaire'),
        savedAt: raw.match.savedAt || raw.generatedAt || null,
        sourceFormat: 'volley-live v' + raw.schemaVersion,
        events: (raw.events || []).length,
        actions: cols.length,
        rallies: (raw.rallies || []).length,
        sets: (raw.sets || []).length,
        warnings: warnings,
        fixture: fixture,
        provenance: {
          actions: true,
          scores: true,
          rallies: true,
          phase: true,
          rotation: true,
          lineup: true,
          thresholds: false,
          source: fixture ? 'reference-fixture-demo' : 'explicit-unified-v2-records',
        },
      },
    };
  }

  /* Capture v1 migration path retained for a live match that has not yet been exported as v2. */
  function buildRosterV1(raw) {
    return (raw.match.team.roster || []).map(function (p) {
      return {
        number: number(p.number, p.number),
        name: text(p.name, 'Joueur ' + p.number),
        role: roleCode(p.position),
      };
    });
  }
  function startingRotationV1(raw, roster) {
    var source = raw.match.startingRotation || {},
      fallback = raw.match.startingLineup || {},
      values = roster.map(function (p) {
        return p.number;
      }),
      lineup = {};
    ZONES.forEach(function (zone, index) {
      lineup[zone] = source[zone] !== undefined ? number(source[zone], source[zone]) : values[index];
    });
    var setter = fallback.setter;
    if (setter === undefined) {
      var p = roster.find(function (x) {
        return x.role === 'SET';
      });
      setter = p && p.number;
    }
    return { lineup: lineup, setter: number(setter, setter) };
  }
  function applySubstitutions(lineup, substitutions) {
    substitutions.forEach(function (sub) {
      var zone = ZONES.find(function (z) {
        return String(lineup[z]) === String(sub.out);
      });
      if (zone) lineup[zone] = number(sub.in, sub.in);
    });
    return lineup;
  }
  function phaseForSetV1(raw, setNumber) {
    var first = raw.match && raw.match.firstRally && raw.match.firstRally.antibesState;
    var setOne = String(first || 'reception').toLowerCase() === 'service' ? 'S' : 'R';
    return setNumber % 2 === 1 ? setOne : setOne === 'S' ? 'R' : 'S';
  }
  function setterRotationV1(lineup, setter) {
    var z = ZONES.find(function (x) {
      return String(lineup[x]) === String(setter);
    });
    return z ? 'P' + z.slice(1) : 'P?';
  }
  // Middle blockers tracked for the libero, as in js/index-rotation.js: the starting line-up when it names them,
  // otherwise the roster players whose role is MB. A middle blocker playing another slot after a substitution
  // (for example in place of the opposite) is not one of them.
  function middleBlockersV1(raw, roster) {
    var lineup = (raw.match && raw.match.startingLineup) || {};
    if (lineup.mb1 != null || lineup.mb2 != null) return [lineup.mb1, lineup.mb2];
    return roster
      .filter(function (p) {
        return p.role === 'MB';
      })
      .map(function (p) {
        return p.number;
      });
  }
  // A substitution that takes a middle blocker out makes the incoming player the tracked middle blocker.
  function applyMiddleBlockerSubstitution(middleBlockers, sub) {
    return middleBlockers.map(function (mb) {
      return mb != null && String(mb) === String(sub.out) ? number(sub.in, sub.in) : mb;
    });
  }
  // Libero rule shared with js/index-rotation.js: it replaces the middle blocker in P6 or P5, and also in P1 while
  // our team receives (phase 'R').
  // Libero decision for one rally, same FIVB Rule 19 logic as nextLiberoFor() in js/index-rotation.js: the Libero
  // stays with the player it replaced while that player is in P6/P5 (or P1 while receiving, phase 'R'); when that
  // player must come back, no other replacement happens before the next rally. Returns the replaced player or null.
  function nextLiberoForV1(liberoFor, lineup, middleBlockers, liberoNumber, phase) {
    if (liberoNumber === undefined || liberoNumber === null) return null;
    var allowed = phase === 'S' ? ['p6', 'p5'] : ['p6', 'p5', 'p1'];
    function zoneOf(player) {
      return ZONES.find(function (z) {
        return player != null && String(lineup[z]) === String(player);
      });
    }
    if (liberoFor != null) return allowed.indexOf(zoneOf(liberoFor)) > -1 ? liberoFor : null;
    var zone = allowed.find(function (z) {
      return middleBlockers.some(function (mb) {
        return mb != null && String(mb) === String(lineup[z]);
      });
    });
    return zone ? lineup[zone] : null;
  }
  function onCourtV1(lineup, liberoFor, liberoNumber) {
    var actual = clone(lineup);
    if (liberoFor != null)
      ZONES.forEach(function (z) {
        if (String(actual[z]) === String(liberoFor)) actual[z] = liberoNumber;
      });
    return ZONES.map(function (z) {
      return actual[z];
    }).filter(function (v, i, a) {
      return v !== undefined && a.indexOf(v) === i;
    });
  }
  function groupRalliesV1(events) {
    var bySet = {};
    events.forEach(function (event, globalIndex) {
      var set = number(event.set, 1);
      if (!bySet[set]) bySet[set] = [];
      var list = bySet[set],
        current = list.length && !list[list.length - 1].closed ? list[list.length - 1] : null;
      if (!current) {
        current = {
          set: set,
          number: list.length + 1,
          actions: [],
          closed: false,
          firstSetIndex: bySet[set].reduce(function (n, r) {
            return n + r.actions.length;
          }, 0),
        };
        list.push(current);
      }
      current.actions.push({
        event: event,
        globalIndex: globalIndex,
        setIndex: current.firstSetIndex + current.actions.length,
      });
      if (event.winningTeam === 'team1' || event.winningTeam === 'team2') {
        current.winner = event.winningTeam;
        current.terminal = event;
        current.closed = true;
      }
    });
    return bySet;
  }
  function toReportDataV1(raw) {
    var validation = validateCaptureV1(raw);
    if (!validation.valid) throw new Error(validation.errors.join(' '));
    var roster = buildRosterV1(raw),
      start = startingRotationV1(raw, roster),
      keyByNumber = {},
      roles = {};
    roster.forEach(function (p) {
      var key = playerKey(p);
      keyByNumber[String(p.number)] = key;
      roles[key] = p.role;
    });
    var opponent = 'ADV · ' + text(raw.match.opponent && raw.match.opponent.name, 'Adversaire');
    roles[opponent] = 'OPPONENT';
    var ownPlayers = roster.map(playerKey),
      players = ownPlayers.concat([opponent]),
      groups = groupRalliesV1(raw.events),
      cols = [],
      warnings = [],
      previousResult = null,
      shade = 0,
      terminalOnly = true,
      totalRallies = 0;
    Object.keys(groups)
      .map(Number)
      .sort(function (a, b) {
        return a - b;
      })
      .forEach(function (setNumber) {
        var lineup = clone(start.lineup),
          phase = phaseForSetV1(raw, setNumber),
          setSubs = (raw.match.subs || [])
            .filter(function (s) {
              return number(s.set, 1) === setNumber;
            })
            .sort(function (a, b) {
              return number(a.at, 0) - number(b.at, 0);
            }),
          applied = 0,
          middleBlockers = middleBlockersV1(raw, roster),
          liberoNumber = raw.match.startingLineup && raw.match.startingLineup.libero,
          liberoFor = null;
        previousResult = null;
        groups[setNumber].forEach(function (rally) {
          totalRallies++;
          while (applied < setSubs.length && number(setSubs[applied].at, Infinity) <= rally.firstSetIndex) {
            var sub = setSubs[applied];
            applySubstitutions(lineup, [sub]);
            middleBlockers = applyMiddleBlockerSubstitution(middleBlockers, sub);
            if (liberoFor != null && String(liberoFor) === String(sub.out)) liberoFor = number(sub.in, sub.in);
            applied++;
          }
          liberoFor = nextLiberoForV1(liberoFor, lineup, middleBlockers, liberoNumber, phase);
          var courtNumbers = onCourtV1(lineup, liberoFor, liberoNumber),
            court = {};
          players.forEach(function (p) {
            court[p] =
              p === opponent
                ? false
                : courtNumbers.some(function (n) {
                    return keyByNumber[String(n)] === p;
                  });
          });
          var result = 'OPEN';
          if (rally.closed) result = rally.winner !== 'team1' ? 'L' : phase === 'S' ? 'BP' : 'SO';
          shade = result === previousResult ? 1 - shade : 0;
          previousResult = result;
          if (rally.actions.length !== 1) terminalOnly = false;
          rally.actions.forEach(function (item) {
            var e = item.event,
              actions = {},
              key = e.player === 'A' || e.action === 'adverse' ? opponent : keyByNumber[String(e.player)];
            if (key) actions[key] = { t: actionCode(e.action), state: normalResult(e.result) };
            cols.push({
              set: setNumber,
              score: number(e.scoreA, 0) + '-' + number(e.scoreB, 0),
              rot: setterRotationV1(lineup, start.setter),
              phase: phase,
              rally: 'S' + setNumber + '·R' + rally.number,
              rallyNumber: rally.number,
              result: result,
              shade: shade,
              actions: actions,
              court: clone(court),
              timestamp: e.timestamp || null,
              sourceEventId: e.id,
            });
          });
          if (rally.closed) {
            if (phase === 'R' && rally.winner === 'team1') lineup = rotateClockwise(lineup);
            phase = rally.winner === 'team1' ? 'S' : 'R';
          }
        });
        if (setNumber > 1)
          warnings.push(
            'La phase initiale du set ' +
              setNumber +
              ' est déduite par alternance : migrez ce match vers v2.1 pour un contexte explicite.'
          );
      });
    if (terminalOnly)
      warnings.unshift(
        'Entrée Capture v1 de migration : une seule action terminale par rally. Utilisez volley-live v2.1 pour les métriques complètes.'
      );
    return {
      cols: cols,
      players: players,
      analyticsPlayers: ownPlayers,
      roles: roles,
      meta: {
        matchName: text(raw.match.name, 'Match'),
        teamName: text(raw.match.team && raw.match.team.name, 'Notre équipe'),
        opponentName: text(raw.match.opponent && raw.match.opponent.name, 'Adversaire'),
        savedAt: raw.savedAt || null,
        sourceFormat: 'volley-live-capture v1 (migration)',
        events: raw.events.length,
        actions: cols.length,
        rallies: totalRallies,
        sets: Object.keys(groups).length,
        warnings: warnings,
        fixture: false,
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
      },
    };
  }

  function toReportData(raw) {
    var format = detectFormat(raw);
    if (format === 'unified-v2') return toReportDataV2(raw);
    if (format === 'capture-v1') return toReportDataV1(raw);
    throw new Error(validate(raw).errors.join(' '));
  }

  function toCoachDataV2(raw) {
    var validation = validateUnifiedV2(raw);
    if (!validation.valid) throw new Error(validation.errors.join(' '));
    var team = teamInfoV2(raw),
      roster = rosterV2(raw, team),
      byId = {},
      byNumber = {};
    roster.forEach(function (p) {
      byId[p.id] = p;
      byNumber[String(p.number)] = p;
    });
    var sets = (raw.sets || []).slice().sort(function (a, b) {
      return number(a.setNumber, 0) - number(b.setNumber, 0);
    });
    var currentSet = number(raw.match.currentSetNumber, (sets[sets.length - 1] || {}).setNumber || 1),
      currentSetDef =
        sets.find(function (s) {
          return number(s.setNumber, 0) === currentSet;
        }) ||
        sets[0] ||
        {};
    function idToNumber(id) {
      return byId[id] ? byId[id].number : id;
    }
    var startRot = {};
    ZONES.forEach(function (z) {
      startRot[z] = idToNumber((currentSetDef.startingLineup || {})[z]);
    });
    var match = {
      id: raw.match.matchId,
      name: raw.match.name,
      status: raw.match.lifecycleStatus || raw.match.status,
      createdAt: raw.match.createdAt,
      currentSet: currentSet,
      team: {
        name: team.our.name,
        roster: roster.map(function (p) {
          return {
            number: p.number,
            name: p.name,
            position: ROLE_TO_CAPTURE[p.role] || String(p.role || '').toLowerCase(),
            present: true,
          };
        }),
      },
      opponent: { name: team.opponent.name },
      startingRotation: startRot,
      startingLineup: {
        setter: idToNumber(currentSetDef.setterPlayerId),
        libero: idToNumber(currentSetDef.liberoPlayerId),
      },
      firstRally: { antibesState: currentSetDef.initialServingTeamId === team.ourId ? 'service' : 'reception' },
      format: clone(raw.match.rules || {}),
      subs: [],
    };
    var rallyById = {},
      lineupById = {};
    (raw.rallies || []).forEach(function (r) {
      rallyById[r.rallyId] = r;
    });
    (raw.lineups || []).forEach(function (l) {
      lineupById[l.lineupVersionId] = l;
    });
    var events = (raw.events || [])
      .filter(function (e) {
        return upper(e.eventType) === 'ACTION' && upper(e.status || 'ACTIVE') !== 'VOIDED';
      })
      .sort(function (a, b) {
        return number(a.sequenceNumber, 0) - number(b.sequenceNumber, 0);
      })
      .map(function (e) {
        var r = rallyById[e.rallyId] || {},
          score = eventScore(e, r),
          lineup = (lineupById[r.lineupVersionId] || {}).zones || {},
          normalizedLineup = {};
        ZONES.forEach(function (z) {
          normalizedLineup[z] = idToNumber(lineup[z]);
        });
        return {
          id: e.eventId,
          set: number(r.setNumber, e.setNumber || 1),
          player: e.teamId === team.ourId ? idToNumber(e.playerId) : 'A',
          action: e.teamId === team.ourId ? captureAction(e.actionType) : 'adverse',
          result: captureResult(e.evaluation),
          quality: e.quality || e.grade || null,
          attackOutcome: e.attackOutcome || e.outcomeDetail || null,
          detail: e.detail || null,
          winningTeam: e.winnerTeamId ? (e.winnerTeamId === team.ourId ? 'team1' : 'team2') : null,
          scoreA: number(score.our, 0),
          scoreB: number(score.opponent, 0),
          timestamp: e.recordedAt || null,
          provenance: e.provenance || null,
          _rallyId: r.rallyId,
          _rallyNumber: number(r.rallyNumber, 1),
          _phase: upper(r.phaseAtStart) === 'SERVE' ? 'serve' : 'receive',
          _rotation: String(r.setterRotationAtStart || 'P?').toLowerCase(),
          _lineup: normalizedLineup,
          _onCourt: (r.onCourtPlayerIds || []).map(idToNumber),
          _scoreBefore: r.scoreBefore || null,
        };
      });
    var eventByRally = {};
    events.forEach(function (e) {
      (eventByRally[e._rallyId] || (eventByRally[e._rallyId] = [])).push(e);
    });
    var rallies = (raw.rallies || [])
      .slice()
      .sort(function (a, b) {
        return number(a.setNumber, 0) - number(b.setNumber, 0) || number(a.rallyNumber, 0) - number(b.rallyNumber, 0);
      })
      .map(function (r) {
        var acts = eventByRally[r.rallyId] || [],
          lineup = (lineupById[r.lineupVersionId] || {}).zones || {},
          normalized = {};
        ZONES.forEach(function (z) {
          normalized[z] = idToNumber(lineup[z]);
        });
        return {
          set: number(r.setNumber, 1),
          number: number(r.rallyNumber, 1),
          rallyId: r.rallyId,
          actions: acts,
          winner: r.winnerTeamId === team.ourId ? 'team1' : 'team2',
          scoreA: number((r.scoreAfter || {}).our, 0),
          scoreB: number((r.scoreAfter || {}).opponent, 0),
          serving: r.servingTeamId === team.ourId ? 'A' : 'B',
          phase: upper(r.phaseAtStart) === 'SERVE' ? 'serve' : 'receive',
          rotation: String(r.setterRotationAtStart || 'P?').toLowerCase(),
          rotationLabel: String(r.setterRotationAtStart || 'P?').toUpperCase(),
          lineup: normalized,
          onCourt: (r.onCourtPlayerIds || []).map(idToNumber),
        };
      });
    var warnings = (validation.warnings || []).slice(),
      fixture = !!(raw.dataQuality && raw.dataQuality.fixture);
    if (raw.dataQuality && raw.dataQuality.syntheticEvents)
      warnings.unshift(
        raw.dataQuality.syntheticEvents +
          ' actions neutres synthétiques sont signalées par provenance et utilisées uniquement pour la validation des métriques.'
      );
    return {
      match: match,
      events: events,
      rallies: rallies,
      demo: fixture,
      explicitContext: true,
      sourceFormat: 'volley-live v' + raw.schemaVersion,
      warnings: warnings,
      raw: raw,
      provenance: {
        actions: true,
        scores: true,
        rallies: true,
        phase: true,
        rotation: true,
        lineup: true,
        thresholds: false,
        source: fixture ? 'reference-fixture-demo' : 'explicit-unified-v2-records',
      },
    };
  }

  function toCoachData(raw) {
    if (detectFormat(raw) === 'unified-v2') return toCoachDataV2(raw);
    if (detectFormat(raw) === 'capture-v1') {
      var v = validateCaptureV1(raw);
      if (!v.valid) throw new Error(v.errors.join(' '));
      return {
        match: clone(raw.match),
        events: clone(raw.events),
        demo: false,
        explicitContext: false,
        sourceFormat: 'volley-live-capture v1 (migration)',
        warnings: [
          'Match local v1 migré en mémoire; phase, rotation et présence terrain sont reconstruites et ne proviennent pas de records explicites du JSON.',
        ],
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
    throw new Error(validate(raw).errors.join(' '));
  }

  function fromLocalStorage(storage) {
    if (!storage) return null;
    try {
      var v2Keys = ['volleyLive.document.v2', 'volleyLive.match.v2', 'volleyCapture.match.v2'];
      for (var i = 0; i < v2Keys.length; i++) {
        var candidate = JSON.parse(storage.getItem(v2Keys[i]) || 'null');
        if (candidate && detectFormat(candidate) === 'unified-v2') return candidate;
      }
      var match = JSON.parse(storage.getItem('volleyCapture.match.v1') || 'null'),
        events = JSON.parse(storage.getItem('volleyCapture.events.v1') || '[]'),
        chartData = JSON.parse(storage.getItem('volleyCapture.chartData.v1') || '[]');
      if (!match || !Array.isArray(events)) return null;
      var last = chartData.length ? chartData[chartData.length - 1] : null;
      return {
        format: 'volley-live-capture',
        version: 1,
        savedAt: new Date().toISOString(),
        match: match,
        score: { team1: last ? number(last.a, 0) : 0, team2: last ? number(last.b, 0) : 0 },
        events: events,
        chartData: chartData,
      };
    } catch (error) {
      return null;
    }
  }

  return {
    ACTION_CODES: ACTION_CODES,
    ROLE_CODES: ROLE_CODES,
    detectFormat: detectFormat,
    validate: validate,
    validateUnifiedV2: validateUnifiedV2,
    validateCaptureV1: validateCaptureV1,
    toReportData: toReportData,
    toCoachData: toCoachData,
    fromLocalStorage: fromLocalStorage,
    rotateClockwise: rotateClockwise,
    isFaultEvaluation: isFaultEvaluation,
    isFaultEvent: isFaultEvent,
  };
});
