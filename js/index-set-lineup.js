/* VolleyLive set line-up sheet: window.VolleySetLineup.
   FIVB 7.3.2: the coach hands in a line-up sheet before each set, so the starting players and the rotation order may
   change. When a set ends, "Start set N" opens this sheet, filled with the line-up of the previous set: the setter's
   starting zone and the player of each role (setter, OH1, MB1, opposite, OH2, MB2). The rotation is derived from the
   roles as in the New Match wizard (VolleyDomain.lineup.rotationFromRoles). The acting libero is chosen among the
   designated liberos (up to two, 19.1.1), or none. Rules checked: six different registered players, present, none of
   them a libero (19.1: the libero is not part of the starting six).
   open(match, setNo, onConfirm, events): onConfirm({startingLineup, startingRotation}) is called when the coach
   confirms; events (the match events) give the libero acting at the end of the previous set. */
(function () {
  'use strict';
  var esc = window.VolleyDom.esc,
    t = window.VolleyI18n.t,
    D = window.VolleyDomain,
    ROLES = D.lineup.ROTATION_ROLES,
    POS = D.court.POS,
    ROLE_KEY = {
      setter: 'lineup.roleSetter',
      oh1: 'lineup.roleOh1',
      mb1: 'lineup.roleMb1',
      opposite: 'lineup.roleOpposite',
      oh2: 'lineup.roleOh2',
      mb2: 'lineup.roleMb2',
    };
  var state = null;

  function same(a, b) {
    return a != null && b != null && String(a) === String(b);
  }
  function roster(match) {
    return (match.team && match.team.roster) || [];
  }
  function playerOf(match, number) {
    return (
      roster(match).filter(function (p) {
        return same(p.number, number);
      })[0] || null
    );
  }
  function liberos(match) {
    return window.VolleySubstitutions ? window.VolleySubstitutions.liberos(match) : [];
  }
  // Designated liberos present for the match: the acting libero of a set is one of them. A libero declared unable to
  // play (19.4) cannot play again in the match.
  function presentLiberos(match) {
    var unable = window.VolleySubstitutions ? window.VolleySubstitutions.unableLiberos(match) : [];
    return liberos(match).filter(function (n) {
      var p = playerOf(match, n);
      return (
        (!p || p.present !== false) &&
        !unable.some(function (u) {
          return same(u, n);
        })
      );
    });
  }
  // Libero proposed for the new set: the previous set's libero, or the libero acting at the end of the previous set
  // when that one can no longer play, or none.
  function proposedLibero(match, setNo, previousLibero, events) {
    var allowed = presentLiberos(match),
      ok = function (n) {
        return (
          n != null &&
          allowed.some(function (a) {
            return same(a, n);
          })
        );
      };
    if (ok(previousLibero)) return previousLibero;
    var acting = null;
    if (window.VolleyRotation) {
      var setEvents = (events || []).filter(function (e) {
        return (+e.set || 1) === setNo - 1;
      });
      acting = window.VolleyRotation.trace(match, setEvents, setNo - 1).lib;
    }
    return ok(acting) ? acting : null;
  }
  // Players who may start: present, registered, not a libero.
  function eligible(match) {
    var libs = liberos(match);
    return roster(match).filter(function (p) {
      return (
        p.present !== false &&
        !libs.some(function (l) {
          return same(l, p.number);
        })
      );
    });
  }
  // Roles and setter zone of the previous set's line-up. When the stored line-up does not name the roles (imported
  // capture), they are read from the rotation, starting at the setter.
  function previous(match, setNo) {
    var lineup = D.lineup.forSet(match, setNo - 1),
      named = lineup.startingLineup || {},
      rotation = lineup.startingRotation || {},
      setterZone = D.court.zoneOf(rotation, named.setter) || 'p1',
      z = +setterZone.slice(1),
      roles = {};
    ROLES.forEach(function (role, i) {
      var fromRotation = rotation['p' + (((z - 1 + i) % 6) + 1)];
      roles[role] = named[role] != null ? named[role] : fromRotation != null ? fromRotation : null;
    });
    return { roles: roles, setterZone: setterZone, libero: named.libero != null ? named.libero : null };
  }
  function errorOf(match, roles) {
    var chosen = ROLES.map(function (role) {
        return roles[role];
      }),
      allowed = eligible(match);
    if (
      chosen.some(function (n) {
        return n == null || n === '';
      })
    )
      return t('lineup.errorMissing');
    for (var i = 0; i < chosen.length; i++)
      for (var j = i + 1; j < chosen.length; j++) if (same(chosen[i], chosen[j])) return t('lineup.errorTwice');
    if (
      chosen.some(function (n) {
        return !allowed.some(function (p) {
          return same(p.number, n);
        });
      })
    )
      return t('lineup.errorNotEligible');
    return '';
  }
  function label(match, number) {
    var p = playerOf(match, number);
    return '#' + number + (p && p.name ? ' ' + p.name : '');
  }

  function html() {
    var match = state.match,
      rotation = D.lineup.rotationFromRoles(state.roles, state.setterZone),
      error = errorOf(match, state.roles),
      h =
        '<div class="runtime-prefs-card set-lineup-card" role="dialog" aria-modal="true" aria-labelledby="setLineupTitle">' +
        '<h2 id="setLineupTitle">' +
        esc(t('lineup.title', { set: state.setNo })) +
        '</h2><p>' +
        esc(t('lineup.hint')) +
        '</p><div class="set-lineup-zones" role="group" aria-label="' +
        esc(t('wizard.setterZoneLabel')) +
        '">';
    for (var z = 1; z <= 6; z++) {
      var on = state.setterZone === 'p' + z;
      h +=
        '<button type="button" data-lineup-zone="p' +
        z +
        '" aria-pressed="' +
        (on ? 'true' : 'false') +
        '"' +
        (on ? ' class="on"' : '') +
        '>P' +
        z +
        '</button>';
    }
    h += '</div><div class="set-lineup-court" aria-label="' + esc(t('wizard.currentLineup')) + '">';
    POS.forEach(function (zone) {
      var n = rotation[zone],
        p = playerOf(match, n);
      h +=
        '<div class="set-lineup-slot" data-lineup-slot="' +
        zone +
        '"><small>' +
        zone.toUpperCase() +
        '</small><strong>' +
        (n != null ? esc(n) : '–') +
        '</strong><span>' +
        esc((p && p.name) || '') +
        '</span></div>';
    });
    h += '</div><div class="set-lineup-roles">';
    var options = eligible(match);
    ROLES.forEach(function (role) {
      h +=
        '<label><span>' +
        esc(t(ROLE_KEY[role])) +
        '</span><select data-lineup-role="' +
        role +
        '"><option value="">–</option>';
      options.forEach(function (p) {
        h +=
          '<option value="' +
          esc(p.number) +
          '"' +
          (same(state.roles[role], p.number) ? ' selected' : '') +
          '>' +
          esc(label(match, p.number)) +
          '</option>';
      });
      h += '</select></label>';
    });
    h +=
      '</div><label class="set-lineup-libero"><span>' +
      esc(t('lineup.libero')) +
      '</span><select data-lineup-libero><option value="">' +
      esc(t('lineup.noLibero')) +
      '</option>' +
      presentLiberos(match)
        .map(function (n) {
          return (
            '<option value="' +
            esc(n) +
            '"' +
            (same(state.libero, n) ? ' selected' : '') +
            '>' +
            esc(label(match, n)) +
            '</option>'
          );
        })
        .join('') +
      '</select></label>' +
      (error ? '<p class="set-lineup-error" role="alert">' + esc(error) + '</p>' : '') +
      '<div class="set-lineup-actions"><button type="button" class="set-lineup-cancel" data-lineup-cancel>' +
      esc(t('common.cancel')) +
      '</button><button type="button" class="runtime-prefs-close" data-lineup-confirm' +
      (error ? ' disabled' : '') +
      '>' +
      esc(t('capture.startSet', { set: state.setNo })) +
      '</button></div></div>';
    return h;
  }
  function sheet() {
    var el = document.getElementById('setLineupSheet');
    if (!el) {
      el = document.createElement('div');
      el.id = 'setLineupSheet';
      el.className = 'runtime-prefs set-lineup';
      el.hidden = true;
      document.body.appendChild(el);
      el.addEventListener('click', onClick);
      el.addEventListener('change', onChange);
    }
    return el;
  }
  function render(focusSelector) {
    var el = sheet();
    el.innerHTML = html();
    var target = focusSelector && el.querySelector(focusSelector);
    if (target) target.focus();
  }
  function close() {
    var el = document.getElementById('setLineupSheet');
    if (el) el.hidden = true;
    var trigger = state && state.trigger;
    state = null;
    if (trigger && trigger.focus) trigger.focus();
  }
  function onClick(e) {
    var b = e.target.closest && e.target.closest('button');
    if (!b || !state) return;
    if (b.dataset.lineupZone) {
      state.setterZone = b.dataset.lineupZone;
      render('[data-lineup-zone="' + state.setterZone + '"]');
    } else if (b.hasAttribute('data-lineup-cancel')) {
      close();
    } else if (b.hasAttribute('data-lineup-confirm')) {
      if (errorOf(state.match, state.roles)) return;
      var roles = {},
        done = state.onConfirm;
      ROLES.forEach(function (role) {
        var p = playerOf(state.match, state.roles[role]);
        roles[role] = p ? p.number : state.roles[role];
      });
      roles.libero = state.libero;
      var lineup = { startingLineup: roles, startingRotation: D.lineup.rotationFromRoles(roles, state.setterZone) };
      close();
      done(lineup);
    }
  }
  function onChange(e) {
    var select = e.target;
    if (!state || !select.dataset) return;
    if (select.hasAttribute('data-lineup-libero')) {
      var libero = playerOf(state.match, select.value);
      state.libero = libero ? libero.number : null;
      return;
    }
    if (!select.dataset.lineupRole) return;
    var p = playerOf(state.match, select.value);
    state.roles[select.dataset.lineupRole] = p ? p.number : null;
    render('[data-lineup-role="' + select.dataset.lineupRole + '"]');
  }
  function open(match, setNo, onConfirm, events) {
    var prev = previous(match, setNo);
    state = {
      match: match,
      setNo: setNo,
      roles: prev.roles,
      setterZone: prev.setterZone,
      libero: proposedLibero(match, setNo, prev.libero, events),
      onConfirm: onConfirm,
      trigger: document.activeElement,
    };
    sheet().hidden = false;
    render('[data-lineup-zone="' + state.setterZone + '"]');
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && state) close();
  });

  window.VolleySetLineup = { open: open, previous: previous, errorOf: errorOf };
})();
