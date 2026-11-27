// The capture screen / Coach View (js/index-rotation.js) and the Spectator matrix (statistics/adapter.js) must agree on
// who is on court, libero included, for every event of the reference capture.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadBrowserScripts, fixture } = require('./load-browser-scripts');

const { VolleyStatsAdapter: A, VolleyRotation: R } = loadBrowserScripts(
  'statistics/adapter.js',
  'js/shared-domain.js',
  'js/index-rotation.js'
);

function eventsBySet(events) {
  const sets = {};
  events.forEach((e) => (sets[e.set || 1] = sets[e.set || 1] || []).push(e));
  return sets;
}

// The reference starting rotation shifted to the six zones, and the same with the two middle blockers made adjacent
// (both can then be in the back row at once, the hardest case for the libero rule).
function startingRotationVariants(raw) {
  const zones = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
  const original = zones.map((z) => raw.match.startingRotation[z]);
  const { mb1, mb2 } = raw.match.startingLineup;
  const adjacent = original.slice();
  const i1 = adjacent.indexOf(mb1),
    i2 = adjacent.indexOf(mb2),
    next = (i1 + 1) % 6;
  [adjacent[i2], adjacent[next]] = [adjacent[next], adjacent[i2]];
  const variants = [];
  for (const order of [original, adjacent]) {
    for (let shift = 0; shift < 6; shift++) {
      const rotation = {};
      zones.forEach((zone, i) => (rotation[zone] = order[(i + shift) % 6]));
      variants.push(rotation);
    }
  }
  return variants;
}

function compareEngineAndAdapter(raw, label) {
  const report = A.toReportData(raw);
  const numberByKey = {};
  report.analyticsPlayers.forEach((key, i) => (numberByKey[key] = raw.match.team.roster[i].number));

  const sets = eventsBySet(raw.events);
  const position = {};
  const traces = {};
  Object.keys(sets).forEach((s) => {
    let rallyStart = 0;
    sets[s].forEach((e, i) => {
      position[e.id] = { set: +s, rallyStart };
      if (e.winningTeam) rallyStart = i + 1;
    });
    traces[s] = R.trace(Object.assign({}, raw.match, { currentSet: +s }), sets[s], +s);
  });

  assert.ok(report.cols.length > 50, 'the fixture has enough events to be meaningful');
  for (const col of report.cols) {
    const { set, rallyStart } = position[col.sourceEventId];
    const step = traces[set].steps[rallyStart];
    const state = Object.assign({}, traces[set], step);
    const engine = Object.values(R.onCourt(raw.match, step.rot, state))
      .map(String)
      .sort();
    const adapter = Object.keys(col.court)
      .filter((key) => col.court[key])
      .map((key) => String(numberByKey[key]))
      .sort();
    assert.deepEqual(adapter, engine, `${label}, set ${set}, event ${col.sourceEventId}`);
  }
  return report.cols.length;
}

test('rotation engine and adapter give the same players on court at every event', () => {
  const raw = fixture('tests/data/As_cannes_vs_Frejus_2026-11-15.capture.v1.json');
  compareEngineAndAdapter(raw, 'reference capture');
});

test('they still agree for every starting rotation, middle blockers opposite or adjacent', () => {
  const raw = fixture('tests/data/As_cannes_vs_Frejus_2026-11-15.capture.v1.json');
  let compared = 0;
  for (const rotation of startingRotationVariants(raw)) {
    const variant = JSON.parse(JSON.stringify(raw));
    variant.match.startingRotation = rotation;
    compared += compareEngineAndAdapter(variant, 'start ' + JSON.stringify(rotation));
  }
  assert.ok(compared > 1000, 'events compared: ' + compared);
});

test('a middle blocker who replaces the opposite is not replaced by the libero', () => {
  // In the reference capture, MB 6 comes in for the opposite (11) in set 2: the libero still replaces MB 4.
  const raw = fixture('tests/data/As_cannes_vs_Frejus_2026-11-15.capture.v1.json');
  const set2 = raw.events.filter((e) => (e.set || 1) === 2);
  const t = R.trace(Object.assign({}, raw.match, { currentSet: 2 }), set2, 2);
  assert.deepEqual([...t.mbs], [4, 2]);
  const court = R.onCourt(raw.match, t.rot, t);
  assert.ok(Object.values(court).includes(6), 'MB 6, playing opposite, stays on court');
});

test('they agree when set 2 has its own line-up (FIVB 7.3.2), for every setter zone', () => {
  // Set 2 line-up: outside hitters and middle blockers swapped, the setter starting in each zone in turn.
  const raw = fixture('tests/data/As_cannes_vs_Frejus_2026-11-15.capture.v1.json');
  const { VolleyDomain: D } = loadBrowserScripts('js/shared-domain.js');
  const l = raw.match.startingLineup;
  const roles = Object.assign({}, l, { oh1: l.oh2, oh2: l.oh1, mb1: l.mb2, mb2: l.mb1 });
  let compared = 0;
  for (let z = 1; z <= 6; z++) {
    const variant = JSON.parse(JSON.stringify(raw));
    const rotation = JSON.parse(JSON.stringify(D.lineup.rotationFromRoles(roles, 'p' + z)));
    variant.match.setLineups = { 2: { startingLineup: roles, startingRotation: rotation } };
    compared += compareEngineAndAdapter(variant, 'set 2 setter in P' + z);
  }
  assert.ok(compared > 500, 'events compared: ' + compared);
});
