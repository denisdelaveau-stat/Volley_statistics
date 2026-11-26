// Unit tests for the statistics adapter (statistics/adapter.js): format detection, validation and conversions.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadBrowserScripts, fixture } = require('./load-browser-scripts');

const { VolleyStatsAdapter: A } = loadBrowserScripts('statistics/adapter.js');
const CAPTURE = 'tests/data/As_cannes_vs_Frejus_2026-11-15.capture.v1.json';
const UNIFIED = 'statistics/data/As_cannes_vs_Frejus_2026-11-15.fixture.v2.json';

test('detects the two supported document formats', () => {
  assert.equal(A.detectFormat(fixture(CAPTURE)), 'capture-v1');
  assert.equal(A.detectFormat(fixture(UNIFIED)), 'unified-v2');
  assert.equal(A.detectFormat({ format: 'other' }), 'unknown');
  assert.equal(A.detectFormat(null), 'unknown');
});

test('accepts both reference documents', () => {
  for (const file of [CAPTURE, UNIFIED]) {
    const result = A.validate(fixture(file));
    assert.equal(result.valid, true, file + ': ' + (result.errors || []).join(' '));
  }
});

test('rejects malformed documents with a reason', () => {
  const noMatch = A.validate({ format: 'volley-live', schemaVersion: '2.1', documentType: 'match' });
  assert.equal(noMatch.valid, false);
  assert.ok(noMatch.errors.length > 0);
  assert.equal(A.validate({ format: 'other' }).valid, false);
});

test('rotateClockwise follows the court rotation (P2 to P1)', () => {
  assert.deepEqual(
    { ...A.rotateClockwise({ p1: 1, p2: 2, p3: 3, p4: 4, p5: 5, p6: 6 }) },
    { p1: 2, p2: 3, p3: 4, p4: 5, p5: 6, p6: 1 }
  );
});

test('report data has one column per action of the reference capture', () => {
  const raw = fixture(CAPTURE);
  const report = A.toReportData(raw);
  assert.equal(report.cols.length, raw.events.filter((e) => e.type !== 'SUBSTITUTION').length);
  assert.ok(report.players.length > report.analyticsPlayers.length, 'opponent column included');
});

test('coach data from a v2 document keeps the explicit context', () => {
  const coach = A.toCoachData(fixture(UNIFIED));
  assert.equal(coach.explicitContext, true);
  assert.ok(coach.rallies.length > 0);
  assert.ok(coach.rallies.every((r) => r.lineup && Array.isArray(r.onCourt)));
});
