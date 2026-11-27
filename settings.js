/* VolleyLive Settings controller: default match format and interface language.
   Spec: docs/VolleyLive_Navigation_Home_Specification.md (Settings) */
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
    language = i18n.lang();
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
      '</div></div>';
    $('settingsBody').innerHTML = h;
    $('settingsMsg').textContent = '';
  }
  $('homeSettings').addEventListener('click', function () {
    CFG = settingsGet();
    language = i18n.lang();
    renderSettings();
    show(settings);
  });
  $('settingsBack').addEventListener('click', function () {
    show(home);
    $('homeSettings').focus();
  });
  $('settingsBody').addEventListener('click', function (e) {
    var format = e.target.closest('[data-setting-format]'),
      lang = e.target.closest('[data-setting-language]');
    if (format) {
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
