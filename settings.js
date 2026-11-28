/* VolleyLive Settings controller: default match format, interface language, gamepad setup and recommended
   capture orientation per mode (js/orientation-advice.js, js/orientation-matrix.js).
   Spec: docs/specs/UI-HOME.md (Settings) */
(function () {
  var shell = window.VolleyShell;
  if (!shell) return;
  var $ = shell.$,
    esc = window.VolleyDom.esc,
    i18n = window.VolleyI18n,
    t = i18n.t,
    settingsGet = shell.settingsGet,
    settingsPut = shell.settingsPut,
    show = shell.show,
    home = shell.screens.home,
    settings = shell.screens.settings;
  var CFG = settingsGet(),
    language = i18n.lang(),
    orientationView = 'closed'; // 'closed', 'device' or 'all'
  // Visible names of the capture modes (runtime-input.js keeps the internal identifiers).
  var MODE_LABELS = { FOCUS: 'FOCUS', SPEED: 'BOARD', FLOW: 'POKER', GAMEPAD: 'GAMEPAD' };
  function orientationCell(entry, orientation, advice) {
    var cell = entry[orientation],
      best = advice === orientation;
    return (
      '<td class="' +
      (best ? 'best' : '') +
      (cell.fits ? '' : ' nofit') +
      '">' +
      (cell.fits ? esc(cell.button + ' px') : '✕') +
      (best ? ' ★' : '') +
      '</td>'
    );
  }
  function adviceLabel(advice) {
    return t(
      advice === 'portrait'
        ? 'settings.orientationPortrait'
        : advice === 'landscape'
          ? 'settings.orientationLandscape'
          : 'settings.orientationEither'
    );
  }
  function deviceTable(device) {
    var advise = window.VolleyOrientation.advise;
    return (
      '<table class="su-matrix"><thead><tr><th>' +
      esc(t('settings.orientationMode')) +
      '</th><th>' +
      esc(t('settings.orientationPortrait')) +
      '</th><th>' +
      esc(t('settings.orientationLandscape')) +
      '</th><th>' +
      esc(t('settings.orientationAdvice')) +
      '</th></tr></thead><tbody>' +
      Object.keys(MODE_LABELS)
        .map(function (mode) {
          var entry = device.modes[mode],
            advice = advise(entry);
          return (
            '<tr data-orientation-mode="' +
            mode +
            '" data-orientation-advice="' +
            advice +
            '"><th>' +
            MODE_LABELS[mode] +
            '</th>' +
            orientationCell(entry, 'portrait', advice) +
            orientationCell(entry, 'landscape', advice) +
            '<td><b>' +
            esc(adviceLabel(advice)) +
            '</b></td></tr>'
          );
        })
        .join('') +
      '</tbody></table>'
    );
  }
  function allDevicesTable(matrix, current) {
    var advise = window.VolleyOrientation.advise;
    return (
      '<div class="su-matrix-wrap"><table class="su-matrix su-matrix-all"><thead><tr><th></th>' +
      Object.keys(MODE_LABELS)
        .map(function (mode) {
          return '<th>' + MODE_LABELS[mode] + '</th>';
        })
        .join('') +
      '</tr></thead><tbody>' +
      matrix.devices
        .map(function (device) {
          return (
            '<tr' +
            (device === current ? ' class="current"' : '') +
            '><th>' +
            esc(device.name) +
            '</th>' +
            Object.keys(MODE_LABELS)
              .map(function (mode) {
                var entry = device.modes[mode];
                return (
                  '<td>' +
                  esc(adviceLabel(advise(entry))) +
                  '<small>' +
                  esc(entry.portrait.button + ' / ' + entry.landscape.button + ' px') +
                  '</small></td>'
                );
              })
              .join('') +
            '</tr>'
          );
        })
        .join('') +
      '</tbody></table></div>'
    );
  }
  function orientationCard() {
    var matrix = window.VolleyOrientationMatrix,
      found =
        window.VolleyOrientation && matrix
          ? window.VolleyOrientation.detect(screen.width, screen.height, matrix)
          : null;
    if (!found) return '';
    var name = t(found.exact ? 'settings.orientationDevice' : 'settings.orientationNearest', {
      device: found.device.name,
    });
    var h =
      '<div class="su-card su-orientation"><label class="field-label">' +
      esc(t('settings.orientation')) +
      '</label><div class="su-format"><button type="button" class="su-btn' +
      (orientationView !== 'closed' ? ' sel' : '') +
      '" data-setting-orientation aria-expanded="' +
      (orientationView !== 'closed' ? 'true' : 'false') +
      '">' +
      esc(t(orientationView === 'closed' ? 'settings.orientationOpen' : 'settings.orientationHide')) +
      '<small>' +
      esc(name) +
      '</small></button></div>';
    if (orientationView !== 'closed') {
      h +=
        '<p class="su-hint">' +
        esc(t('settings.orientationHint')) +
        '</p>' +
        deviceTable(found.device) +
        '<button type="button" class="su-link" data-setting-orientation-all aria-expanded="' +
        (orientationView === 'all' ? 'true' : 'false') +
        '">' +
        esc(t(orientationView === 'all' ? 'settings.orientationAllHide' : 'settings.orientationAll')) +
        '</button>' +
        (orientationView === 'all' ? allDevicesTable(matrix, found.device) : '');
    }
    return h + '</div>';
  }
  function choice(attribute, value, selected, label, detail) {
    return (
      '<button type="button" class="su-btn' +
      (selected ? ' sel' : '') +
      '" ' +
      attribute +
      '="' +
      esc(value) +
      '" aria-pressed="' +
      (selected ? 'true' : 'false') +
      '">' +
      esc(label) +
      (detail ? '<small>' + esc(detail) + '</small>' : '') +
      '</button>'
    );
  }
  function renderSettings() {
    var h =
      '<div class="su-card"><label class="field-label">' +
      esc(t('settings.matchFormat')) +
      '</label><div class="su-format">' +
      choice('data-setting-format', 2, CFG.setsToWin === 2, t('settings.format2'), t('settings.format2Detail')) +
      choice('data-setting-format', 3, CFG.setsToWin === 3, t('settings.format3'), t('settings.format3Detail')) +
      '</div></div><div class="su-card"><label class="field-label">' +
      esc(t('settings.language')) +
      '</label><div class="su-format">' +
      i18n.SUPPORTED.map(function (code) {
        return choice('data-setting-language', code, language === code, t('language.' + code));
      }).join('') +
      '</div></div><div class="su-card"><label class="field-label">' +
      esc(t('settings.gamepad')) +
      '</label><div class="su-format"><button type="button" class="su-btn" data-setting-gamepad>' +
      esc(t('settings.gamepadSetup')) +
      '<small>' +
      esc(t('settings.gamepadSetupDetail')) +
      '</small></button></div></div>' +
      orientationCard();
    $('settingsBody').innerHTML = h;
    $('settingsMsg').textContent = '';
  }
  $('homeSettings').addEventListener('click', function () {
    CFG = settingsGet();
    language = i18n.lang();
    orientationView = 'closed';
    renderSettings();
    show(settings);
  });
  $('settingsBack').addEventListener('click', function () {
    show(home);
    $('homeSettings').focus();
  });
  $('settingsBody').addEventListener('click', function (e) {
    var format = e.target.closest('[data-setting-format]'),
      lang = e.target.closest('[data-setting-language]'),
      gamepad = e.target.closest('[data-setting-gamepad]'),
      orientation = e.target.closest('[data-setting-orientation]'),
      orientationAll = e.target.closest('[data-setting-orientation-all]');
    if (orientation) {
      orientationView = orientationView === 'closed' ? 'device' : 'closed';
      renderSettings();
    } else if (orientationAll) {
      orientationView = orientationView === 'all' ? 'device' : 'all';
      renderSettings();
    } else if (gamepad) {
      if (window.VolleyGamepad) window.VolleyGamepad.openSetup();
    } else if (format) {
      CFG.setsToWin = +format.dataset.settingFormat;
      renderSettings();
    } else if (lang) {
      language = lang.dataset.settingLanguage;
      renderSettings();
    }
  });
  $('settingsSave').addEventListener('click', function () {
    settingsPut(CFG);
    if (language !== i18n.lang() && i18n.setLanguage(language)) {
      // Every screen is rendered again in the new language.
      location.reload();
      return;
    }
    $('settingsMsg').textContent = t('settings.saved');
  });
})();
