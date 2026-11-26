// Unit tests for the rotation engine (js/index-rotation.js): side-out rotation, substitutions and the libero rule.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadBrowserScripts, plain } = require('./load-browser-scripts');

const { VolleyRotation: R } = loadBrowserScripts('js/shared-domain.js', 'js/index-rotation.js');

// Setter 1 in P1; middle blockers 4 (P3) and 6 (P6); libero 2.
function match(overrides) {
  return Object.assign(
    {
      currentSet: 1,
      team: { roster: [] },
      startingLineup: { setter: 1, oh1: 3, oh2: 5, mb1: 4, mb2: 6, opposite: 7, libero: 2 },
      startingRotation: { p1: 1, p2: 3, p3: 4, p4: 7, p5: 5, p6: 6 },
      firstRally: { antibesState: 'service' },
      subs: [],
    },
    overrides || {}
  );
}
const won = { winningTeam: 'team1' };
const lost = { winningTeam: 'team2' };

test('rotate moves every player one zone clockwise (P2 to P1, P1 to P6)', () => {
  const next = plain(R.rotate({ p1: 1, p2: 2, p3: 3, p4: 4, p5: 5, p6: 6 }));
  assert.deepEqual(next, { p1: 2, p6: 1, p5: 6, p4: 5, p3: 4, p2: 3 });
});

test('the team rotates only on a side-out', () => {
  const m = match();
  assert.equal(R.replay(m, [won, won]).rotations, 0, 'points won on own serve: no rotation');
  const sideOut = R.replay(m, [lost, won]);
  assert.equal(sideOut.rotations, 1);
  assert.equal(sideOut.serving, 'A');
  assert.equal(sideOut.rot.p1, 3, 'the player from P2 now serves');
});

test('the first serve alternates from set to set', () => {
  assert.equal(R.initialServing(match(), 1), 'A');
  assert.equal(R.initialServing(match(), 2), 'B');
  const receiving = match({ firstRally: { antibesState: 'reception' } });
  assert.equal(R.initialServing(receiving, 1), 'B');
  assert.equal(R.initialServing(receiving, 2), 'A');
});

test('trace gives the state before each event, after the substitutions made before it', () => {
  const m = match({ subs: [{ set: 1, at: 1, out: 7, in: 8 }] });
  const t = R.trace(m, [lost, won, won]);
  assert.equal(t.steps.length, 3);
  assert.equal(t.steps[0].serving, 'A');
  assert.equal(t.steps[1].serving, 'B');
  assert.equal(t.steps[1].rot.p4, 8, 'substitution applied before event 1');
  assert.equal(t.steps[0].rot.p4, 7, 'earlier steps are snapshots, not shared objects');
  assert.equal(t.rotations, 1);
});

test('substitutions match player numbers stored as text (imported files)', () => {
  const m = match({ subs: [{ set: '1', at: '0', out: '7', in: 8 }] });
  assert.equal(R.replay(m, []).rot.p4, 8);
});

test('a substituted middle blocker is still replaced by the libero', () => {
  const m = match({ subs: [{ set: 1, at: 0, out: 6, in: 9 }] });
  const st = R.replay(m, []);
  assert.deepEqual(plain(st.mbs), [4, 9]);
  assert.equal(R.court(m, st.rot, st).p6.num, 2);
});

test('libero replaces the middle blocker in P6 or P5 in both phases', () => {
  const m = match();
  for (const serving of ['A', 'B']) {
    const c = R.court(m, m.startingRotation, { serving });
    assert.equal(c.p6.num, 2, serving);
    assert.equal(c.p6.libero, true);
    assert.equal(c.p6.forNum, 6);
    assert.equal(c.bench, 6);
  }
});

test('libero replaces the middle blocker in P1 only while the team receives', () => {
  const m = match();
  const rot = { p1: 6, p2: 1, p3: 3, p4: 4, p5: 7, p6: 5 };
  const receiving = R.court(m, rot, { serving: 'B' });
  assert.equal(receiving.p1.num, 2);
  assert.equal(receiving.bench, 6);
  const serving = R.court(m, rot, { serving: 'A' });
  assert.equal(serving.p1.num, 6, 'the middle blocker serves');
  assert.equal(serving.bench, 2);
});

test('no libero swap when no libero is declared or no middle blocker is in the back row', () => {
  const noLibero = match({ startingLineup: { setter: 1, mb1: 4, mb2: 6 } });
  assert.equal(R.court(noLibero, noLibero.startingRotation, { serving: 'B' }).p6.num, 6);
  const m = match();
  const frontRowMiddles = { p1: 1, p2: 6, p3: 4, p4: 7, p5: 5, p6: 3 };
  assert.deepEqual(plain(R.onCourt(m, frontRowMiddles, { serving: 'B' })), frontRowMiddles);
});

test('middle blockers fall back to roster positions when the line-up does not name them', () => {
  const m = match({
    startingLineup: { setter: 1, libero: 2 },
    team: {
      roster: [
        { number: 4, position: 'mb' },
        { number: 6, position: 'MB' },
        { number: 7, position: 'opp' },
      ],
    },
  });
  assert.deepEqual(plain(R.middleBlockers(m)), [4, 6]);
  assert.equal(R.onCourt(m, m.startingRotation, { serving: 'A' }).p6, 2);
});

test('onCourt returns the displayed line-up by zone', () => {
  const m = match();
  assert.deepEqual(plain(R.onCourt(m, m.startingRotation, { serving: 'A' })), {
    p4: 7,
    p3: 4,
    p2: 3,
    p5: 5,
    p6: 2,
    p1: 1,
  });
});
