/* VolleyLive translations: window.VolleyI18n. Loaded after js/i18n/fr.js and js/i18n/en.js (the dictionaries).
   - t(key, params): text of `key` in the current language, `{name}` placeholders replaced by params.name. Falls back
     to French, then to the key itself (and reports the missing key once in the console). The result is plain text:
     escape it with VolleyDom.esc() before inserting it with innerHTML.
   - static HTML: data-i18n="key" sets textContent; data-i18n-attr="aria-label:key;title:key" sets attributes.
     apply(root) translates them. A page calls VolleyI18n.apply() once its markup is parsed and before its app
     scripts render anything (otherwise the static text would overwrite what they render); when it does not, the
     whole page is translated when the DOM is ready.
   - language: French by default; the choice made in Settings is stored (VolleyDomain.STORAGE.language). */
(function () {
  'use strict';
  var SUPPORTED = ['fr', 'en'],
    DEFAULT = 'fr',
    KEY = window.VolleyDomain.STORAGE.language,
    messages = window.VolleyI18nMessages || {},
    reported = {};

  function lang() {
    var stored = window.VolleyDomain.readStored(KEY, null);
    return SUPPORTED.indexOf(stored) > -1 ? stored : DEFAULT;
  }
  var current = lang();

  function t(key, params) {
    var dict = messages[current] || {},
      text = dict[key];
    if (text == null) text = (messages[DEFAULT] || {})[key];
    if (text == null) {
      if (!reported[key]) console.warn('VolleyLive: missing translation for ' + key);
      reported[key] = true;
      return key;
    }
    return !params
      ? text
      : text.replace(/\{(\w+)\}/g, function (match, name) {
          return params[name] == null ? match : String(params[name]);
        });
  }

  // Stores the language; the caller reloads the page so that every screen is rendered again.
  function setLanguage(next) {
    if (SUPPORTED.indexOf(next) < 0) return false;
    localStorage.setItem(KEY, JSON.stringify(next));
    return true;
  }

  var applied = false;
  function apply(root) {
    var scope = root || document;
    if (scope === document) applied = true;
    scope.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    scope.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr')
        .split(';')
        .forEach(function (pair) {
          var parts = pair.split(':');
          if (parts.length === 2) el.setAttribute(parts[0].trim(), t(parts[1].trim()));
        });
    });
  }

  document.documentElement.lang = current;
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', function () {
      if (!applied) apply(document);
    });
  else apply(document);

  window.VolleyI18n = {
    SUPPORTED: SUPPORTED,
    DEFAULT: DEFAULT,
    lang: function () {
      return current;
    },
    t: t,
    setLanguage: setLanguage,
    apply: apply,
  };
})();
