// Per-set starting line-up (FIVB 7.3.2: a line-up sheet before each set): VolleyDomain.lineup (js/shared-domain.js),
// its use by the rotation engine and the substitution rules, and the same rule in statistics/adapter.js.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadBrowserScripts } = require('./load-browser-scripts');

const {
  VolleyDomain: D,
  VolleyRotation: R,
  VolleySubstitutions: S,
} = loadBrowserScripts('js/shared-domain.js', 'js/index-rotation.js', 'js/index-substitution-rules.js');

const plain = (value) => JSON.parse(JSON.stringify(value));
const ROLES = { setter: 1, oh1: 3, mb1: 4, opposite: 7, oh2: 5, mb2: 6, libero: 2 };
const SET2_ROLES = { setter: 1, oh1: 5, mb1: 6, opposite: 7, oh2: 3, mb2: 4, libero: 2 };

function match(setLineups) {
  return {
    currentSet: 1,
    team: {
      roster: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
        number: n,
        position: n === 2 ? 'libero' : n === 4 || n === 6 ? 'mb' : n === 1 ? 'setter' : 'oh',
        present: true,
      })),
    },
    startingLineup: ROLES,
    startingRotation: plain(D.lineup.rotationFromRoles(ROLES, 'p1')),
    setLineups: setLineups,
    subs: [],
  };
}
function setLineup(roles, setterZone) {
  return { startingLineup: roles, startingRotation: plain(D.lineup.rotationFromRoles(roles, setterZone)) };
}

test('rotationFromRoles follows the New Match wizard: setter, OH1, MB1, opposite, OH2, MB2 from the setter zone', () => {
  assert.deepEqual(plain(D.lineup.rotationFromRoles(ROLES, 'p1')), { p1: 1, p2: 3, p3: 4, p4: 7, p5: 5, p6: 6 });
  assert.deepEqual(plain(D.lineup.rotationFromRoles(ROLES, 'p4')), { p4: 1, p5: 3, p6: 4, p1: 7, p2: 5, p3: 6 });
});

test('a set without its own line-up keeps the line-up of the previous set', () => {
  const none = match();
  for (const set of [1, 2, 5])
    assert.deepEqual(plain(D.lineup.forSet(none, set).startingRotation), plain(none.startingRotation));
  const m = match({ 3: setLineup(SET2_ROLES, 'p3') });
  assert.deepEqual(plain(D.lineup.forSet(m, 1).startingRotation), plain(m.startingRotation));
  assert.deepEqual(plain(D.lineup.forSet(m, 2).startingRotation), plain(m.startingRotation));
  assert.deepEqual(plain(D.lineup.forSet(m, 3)), plain(m.setLineups[3]));
  assert.deepEqual(plain(D.lineup.forSet(m, 4)), plain(m.setLineups[3]), 'set 4 keeps the set 3 line-up');
});

test('the engine replays each set from its own line-up; set 1 is unchanged', () => {
  const m = match({ 2: setLineup(SET2_ROLES, 'p4') });
  const ev = (set, winningTeam) => ({ set, winningTeam });
  const set1 = R.trace(m, [ev(1, 'team1')], 1);
  assert.deepEqual(plain(set1.steps[0].rot), plain(m.startingRotation));
  const set2 = R.trace(Object.assign({}, m, { currentSet: 2 }), [ev(2, 'team2')], 2);
  assert.deepEqual(plain(set2.steps[0].rot), plain(m.setLineups[2].startingRotation));
  assert.deepEqual(plain(set2.mbs), [6, 4], 'middle blockers of the set 2 line-up');
});

test('the libero replaces a middle blocker of the set line-up', () => {
  // Set 2: setter in P4, so MB1 (6) is in P6 at the start, MB2 (4) in P3.
  const m = Object.assign(match({ 2: setLineup(SET2_ROLES, 'p4') }), { currentSet: 2 });
  const t = R.trace(m, [], 2);
  const court = plain(R.onCourt(m, t.rot, t));
  assert.equal(court.p6, 2, 'the libero plays in P6');
  assert.ok(!Object.values(court).includes(6), 'in place of MB 6');
});

test('substitutions: the starters are those of the set', () => {
  const m = match({
    2: { startingLineup: SET2_ROLES, startingRotation: { p1: 1, p2: 5, p3: 6, p4: 7, p5: 3, p6: 8 } },
  });
  assert.deepEqual(plain(S.starters(m, 1)).sort(), [1, 3, 4, 5, 6, 7]);
  assert.deepEqual(plain(S.starters(m, 2)).sort(), [1, 3, 5, 6, 7, 8]);
  // 4 started set 1 but not set 2: in set 2, 4 entering for 8 is a substitute entering, then 8 comes back once.
  m.subs = [{ set: 2, at: 0, out: 8, in: 4 }];
  const h = plain(S.history(m, 2));
  assert.deepEqual(h.starterLeft, { 8: 4 });
});

test('every libero of the match is excluded from regular substitutions', () => {
  const m = match({ 2: setLineup(Object.assign({}, SET2_ROLES, { libero: 9 }), 'p1') });
  assert.deepEqual(plain(S.liberos(m)).sort(), [2, 9]);
});
