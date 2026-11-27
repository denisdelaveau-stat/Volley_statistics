// Unit tests for VolleyDomain.readStored (js/shared-domain.js): stored JSON is read with a fallback, and corrupted
// values are reported instead of disappearing silently.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadBrowserScripts } = require('./load-browser-scripts');

const { VolleyDomain } = loadBrowserScripts('js/shared-domain.js');

function memoryStorage(values) {
  return {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null),
  };
}

function captureWarnings(fn) {
  const warnings = [];
  const original = console.warn;
  console.warn = (...args) => warnings.push(args.join(' '));
  try {
    return { value: fn(), warnings };
  } finally {
    console.warn = original;
  }
}

test('returns the stored value', () => {
  const storage = memoryStorage({ k: '{"a":1}' });
  assert.deepEqual({ ...VolleyDomain.readStored('k', null, storage) }, { a: 1 });
});

test('returns the fallback for a missing, empty or null value, without warning', () => {
  const storage = memoryStorage({ empty: '', nothing: 'null' });
  const { value, warnings } = captureWarnings(() => [
    VolleyDomain.readStored('missing', 'fb', storage),
    VolleyDomain.readStored('empty', 'fb', storage),
    VolleyDomain.readStored('nothing', 'fb', storage),
  ]);
  assert.deepEqual(value, ['fb', 'fb', 'fb']);
  assert.equal(warnings.length, 0);
});

test('returns the fallback for corrupted JSON and reports the key', () => {
  const storage = memoryStorage({ 'volleyCapture.events.v1': '[{"broken"' });
  const { value, warnings } = captureWarnings(() => VolleyDomain.readStored('volleyCapture.events.v1', [], storage));
  assert.equal(value.length, 0);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /volleyCapture\.events\.v1/);
});

test('returns the fallback when the storage itself is unavailable', () => {
  const storage = {
    getItem() {
      throw new Error('SecurityError');
    },
  };
  const { value, warnings } = captureWarnings(() => VolleyDomain.readStored('k', 7, storage));
  assert.equal(value, 7);
  assert.equal(warnings.length, 1);
});
