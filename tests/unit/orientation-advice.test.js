// Recommended capture orientation (js/orientation-advice.js) and its generated data (js/orientation-matrix.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadBrowserScripts } = require('./load-browser-scripts');

const context = loadBrowserScripts('js/orientation-matrix.js', 'js/orientation-advice.js');
const { detect, advise } = context.VolleyOrientation;
const matrix = context.VolleyOrientationMatrix;

test('the generated matrix covers every capture mode in both orientations for each device', () => {
  assert.ok(matrix.devices.length >= 8);
  for (const device of matrix.devices) {
    for (const mode of ['FOCUS', 'SPEED', 'FLOW', 'GAMEPAD']) {
      for (const orientation of ['portrait', 'landscape']) {
        const cell = device.modes[mode][orientation];
        assert.equal(typeof cell.button, 'number', `${device.name} ${mode} ${orientation}`);
        assert.equal(typeof cell.fits, 'boolean');
      }
    }
  }
});

test('every capture mode fits with buttons of at least 44 px on every device', () => {
  for (const device of matrix.devices) {
    for (const [mode, entry] of Object.entries(device.modes)) {
      for (const orientation of ['portrait', 'landscape']) {
        assert.ok(entry[orientation].fits, `${device.name} ${mode} ${orientation} does not fit`);
        assert.ok(entry[orientation].button >= 44, `${device.name} ${mode} ${orientation} < 44 px`);
      }
    }
  }
});

test('the screen size finds the device in either orientation, or the closest one', () => {
  assert.equal(detect(390, 844, matrix).device.name, 'iPhone 13 / 14');
  assert.equal(detect(844, 390, matrix).exact, true);
  const near = detect(1280, 800, matrix);
  assert.equal(near.exact, false);
  assert.match(near.device.name, /iPad/);
  assert.equal(detect(390, 844, { devices: [] }), null);
});

test('the advice prefers the orientation that fits, then the bigger buttons, with a tie margin', () => {
  const cell = (button, fits = true) => ({ button, fits });
  assert.equal(advise({ portrait: cell(111), landscape: cell(49) }), 'portrait');
  assert.equal(advise({ portrait: cell(52), landscape: cell(60) }), 'landscape');
  assert.equal(advise({ portrait: cell(64), landscape: cell(62) }), 'either');
  assert.equal(advise({ portrait: cell(90, false), landscape: cell(50) }), 'landscape');
});
