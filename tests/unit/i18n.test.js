// Translations (js/shared-i18n.js, js/i18n/*.js): complete dictionaries, every key used exists, no orphan key,
// language choice and fallbacks.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadBrowserScriptsWith, ROOT } = require('./load-browser-scripts');

const DICTIONARIES = ['js/i18n/fr.js', 'js/i18n/en.js'];
// Keys built at run time from a prefix (t('language.' + code)): every key with these prefixes counts as used.
const DYNAMIC_PREFIXES = ['language.'];

function memoryStorage(values) {
  const data = { ...values };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
  };
}
function load(storedLanguage) {
  const storage = memoryStorage(
    storedLanguage === undefined ? {} : { 'volleyLive.language.v1': JSON.stringify(storedLanguage) }
  );
  const document = { documentElement: {}, readyState: 'complete', querySelectorAll: () => [] };
  return loadBrowserScriptsWith(
    { document, localStorage: storage },
    'js/shared-domain.js',
    ...DICTIONARIES,
    'js/shared-i18n.js'
  );
}
function placeholders(text) {
  return (text.match(/\{\w+\}/g) || []).sort().join(',');
}
// Source files that may use translation keys.
function sourceFiles() {
  const out = [];
  (function walk(dir) {
    for (const name of fs.readdirSync(path.join(ROOT, dir))) {
      const rel = path.join(dir, name);
      if (/^(node_modules|tests|docs|TO_DO|icons|\.git|statistics[\\/]data)/.test(rel)) continue;
      const stat = fs.statSync(path.join(ROOT, rel));
      if (stat.isDirectory()) walk(rel);
      // The dictionaries and the i18n module itself (its comments show the syntax) are not scanned.
      else if (
        /\.(js|html)$/.test(name) &&
        !/^js[\\/]i18n[\\/]/.test(rel) &&
        !['shared-i18n.js', 'eslint.config.js'].includes(name)
      )
        out.push(rel);
    }
  })('');
  return out;
}
function usedKeys() {
  const keys = new Set();
  for (const file of sourceFiles()) {
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const m of src.matchAll(/\bt\(\s*'([\w.]+)'/g)) keys.add(m[1]);
    for (const m of src.matchAll(/data-i18n="([\w.]+)"/g)) keys.add(m[1]);
    for (const m of src.matchAll(/data-i18n-attr="([^"]+)"/g))
      m[1].split(';').forEach((pair) => keys.add(pair.split(':')[1].trim()));
  }
  return keys;
}

test('both dictionaries have the same keys, no empty text and the same placeholders', () => {
  const { VolleyI18nMessages: M } = load();
  const fr = M.fr,
    en = M.en;
  assert.deepEqual(Object.keys(en).sort(), Object.keys(fr).sort(), 'same keys in fr and en');
  for (const key of Object.keys(fr)) {
    assert.ok(String(fr[key]).trim() && String(en[key]).trim(), 'empty text for ' + key);
    assert.equal(placeholders(en[key]), placeholders(fr[key]), 'placeholders of ' + key);
  }
});

test('every key used in the code exists, and every key is used', () => {
  const { VolleyI18nMessages: M } = load();
  const defined = new Set(Object.keys(M.fr));
  const used = usedKeys();
  // A key ending with a dot is a prefix completed at run time (see DYNAMIC_PREFIXES).
  const missing = [...used].filter((k) => !defined.has(k) && !k.endsWith('.'));
  assert.deepEqual(missing, [], 'keys used in the code but missing from the dictionaries');
  const orphans = [...defined].filter((k) => !used.has(k) && !DYNAMIC_PREFIXES.some((p) => k.startsWith(p)));
  assert.deepEqual(orphans, [], 'keys defined but never used');
});

test('French by default, English when chosen, unknown choices ignored', () => {
  assert.equal(load().VolleyI18n.lang(), 'fr');
  assert.equal(load('en').VolleyI18n.lang(), 'en');
  assert.equal(load('de').VolleyI18n.lang(), 'fr');
  assert.equal(load('en').VolleyI18n.t('settings.title'), 'Settings');
  assert.equal(load().VolleyI18n.t('settings.title'), 'Réglages');
});

test('placeholders are replaced, missing keys fall back to the key and are reported once', () => {
  const ctx = load('en');
  ctx.VolleyI18nMessages.en['test.hello'] = 'Hello {name}, {count} sets';
  assert.equal(ctx.VolleyI18n.t('test.hello', { name: 'Ana', count: 2 }), 'Hello Ana, 2 sets');
  assert.equal(ctx.VolleyI18n.t('test.hello', { name: 'Ana' }), 'Hello Ana, {count} sets');
  const warnings = [];
  const original = console.warn;
  console.warn = (...args) => warnings.push(args.join(' '));
  try {
    assert.equal(ctx.VolleyI18n.t('nope.key'), 'nope.key');
    ctx.VolleyI18n.t('nope.key');
  } finally {
    console.warn = original;
  }
  assert.equal(warnings.length, 1);
});

test('a key missing in English falls back to French', () => {
  const ctx = load('en');
  ctx.VolleyI18nMessages.fr['test.only'] = 'Seulement en français';
  assert.equal(ctx.VolleyI18n.t('test.only'), 'Seulement en français');
});

test('setLanguage stores supported languages only', () => {
  const ctx = load();
  assert.equal(ctx.VolleyI18n.setLanguage('en'), true);
  assert.equal(ctx.localStorage.getItem('volleyLive.language.v1'), '"en"');
  assert.equal(ctx.VolleyI18n.setLanguage('xx'), false);
});
