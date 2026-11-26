// Unit tests for the substitution rules (js/index-substitution-rules.js), FIVB Official Volleyball Rules 2025-2028,
// Rule 15.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadBrowserScripts, plain } = require('./load-browser-scripts');

const { VolleySubstitutions: S } = loadBrowserScripts('js/index-substitution-rules.js');

// Starters 1, 3, 4, 5, 6, 7; libero 2; bench 8, 9, 10, 11, 12, 13 (12 absent); 14 is a second libero.
function match(subs) {
  return {
    team: {
      roster: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((n) => ({
        number: n,
        position: n === 2 || n === 14 ? 'libero' : n === 4 || n === 6 ? 'mb' : 'oh',
        present: n !== 12,
      })),
    },
    startingLineup: { setter: 1, mb1: 4, mb2: 6, libero: 2 },
    startingRotation: { p1: 1, p2: 3, p3: 4, p4: 7, p5: 5, p6: 6 },
    subs: subs || [],
  };
}
const START = { p1: 1, p2: 3, p3: 4, p4: 7, p5: 5, p6: 6 };
const sub = (out, inn, extra) => Object.assign({ set: 1, at: 0, out, in: inn }, extra || {});
const refusal = (m, rot, out, inn) => S.regularRefusal(m, 1, rot, out, inn);

test('a starter can be replaced by a bench player', () => {
  assert.equal(refusal(match(), START, 7, 8), null);
  assert.deepEqual(plain(S.options(match(), 1, START, 7).regular), [8, 9, 10, 11, 13]);
});

test('15.1: at most six regular substitutions per set', () => {
  const six = [sub(1, 8), sub(3, 9), sub(4, 10), sub(7, 11), sub(5, 13), sub(8, 1)];
  const rot = { p1: 1, p2: 9, p3: 10, p4: 11, p5: 13, p6: 6 };
  assert.match(refusal(match(six), rot, 6, 8), /15\.1/);
  assert.equal(S.history(match(six), 1).regular, 6);
});

test('15.1: substitutions of the other sets are not counted', () => {
  const previousSet = [1, 2, 3, 4, 5, 6].map((i) => sub(1, 8, { set: 2, at: i }));
  assert.equal(refusal(match(previousSet), START, 7, 8), null);
});

test('15.5.1: the libero is never part of a regular substitution', () => {
  assert.match(refusal(match(), START, 7, 14), /15\.5\.1/);
  assert.match(refusal(match(), { ...START, p6: 2 }, 2, 8), /15\.5\.1/);
  assert.ok(!S.options(match(), 1, START, 7).regular.includes(2));
});

test('15.9.1: an absent or unregistered player cannot enter', () => {
  assert.match(refusal(match(), START, 7, 12), /15\.9\.1/);
  assert.match(refusal(match(), START, 7, 99), /15\.9\.1/);
});

test('the player leaving must be on court; the player entering must not be', () => {
  assert.match(refusal(match(), START, 8, 9), /sur le terrain/);
  assert.match(refusal(match(), START, 7, 3), /déjà sur le terrain/);
});

test('15.6.1: a starter leaves once and comes back once, only in place of his substitute', () => {
  const m = match([sub(7, 8, { at: 0 })]);
  const rot = { ...START, p4: 8 };
  assert.equal(refusal(m, rot, 8, 7), null, 'starter 7 comes back for 8');
  assert.match(refusal(m, rot, 3, 7), /15\.6\.1/, 'starter 7 cannot come back for another player');
  const back = match([sub(7, 8, { at: 0 }), sub(8, 7, { at: 5 })]);
  assert.match(refusal(back, START, 7, 9), /15\.6\.1/, 'starter 7 already left once');
});

test('15.6.2: a substitute enters once and is only replaced by his starter', () => {
  const m = match([sub(7, 8, { at: 0 })]);
  const rot = { ...START, p4: 8 };
  assert.match(refusal(m, rot, 8, 9), /15\.6\.2/, 'substitute 8 can only be replaced by 7');
  const back = match([sub(7, 8, { at: 0 }), sub(8, 7, { at: 5 })]);
  assert.match(refusal(back, START, 3, 8), /15\.6\.2/, 'substitute 8 already entered once');
});

test('15.7: exceptional substitution only when no regular one is possible, never with a libero', () => {
  const m = match([sub(7, 8, { at: 0 })]);
  const rot = { ...START, p4: 8 };
  // Substitute 8 can only be replaced by 7 (regular): no exceptional option.
  const regular = S.options(m, 1, rot, 8);
  assert.deepEqual(plain(regular.regular), [7]);
  assert.deepEqual(plain(regular.exceptional), []);
  // Six regular substitutions done: an injured player can only be replaced exceptionally.
  const six = [sub(1, 8), sub(3, 9), sub(4, 10), sub(7, 11), sub(5, 13), sub(8, 1)];
  const sixRot = { p1: 1, p2: 9, p3: 10, p4: 11, p5: 13, p6: 6 };
  const injured = S.options(match(six), 1, sixRot, 6);
  assert.deepEqual(plain(injured.regular), []);
  assert.ok(injured.exceptional.includes(3) && injured.exceptional.includes(8));
  assert.ok(!injured.exceptional.includes(2) && !injured.exceptional.includes(14), 'no libero');
});

test('15.7: a player replaced exceptionally cannot come back in the match', () => {
  const m = match([sub(7, 8, { set: 1, at: 0, exceptional: true })]);
  const h = S.history(m, 1);
  assert.equal(h.exceptional, 1);
  assert.equal(h.regular, 0, 'not counted as a regular substitution');
  const nextSet = Object.assign(match([sub(7, 8, { set: 1, at: 0, exceptional: true })]), {});
  assert.match(S.regularRefusal(nextSet, 2, { ...START, p4: 9 }, 9, 7), /15\.7/);
});

test('15.11.1.1: no substitution while a rally is in progress', () => {
  assert.equal(S.rallyInProgress([]), false);
  assert.equal(S.rallyInProgress([{ winningTeam: 'team1' }]), false);
  assert.equal(S.rallyInProgress([{ winningTeam: 'team1' }, { winningTeam: null, result: 'neutral' }]), true);
  assert.equal(S.rallyInProgress([{ winningTeam: 'team2' }, { type: 'SUBSTITUTION' }]), false);
});

test('build records the substitution before the next event of the set', () => {
  const events = [{ winningTeam: 'team1' }, { winningTeam: 'team2' }];
  const r = S.build(match(), 1, events, { a: 1, b: 1 }, 7, 8, {
    eventId: 'e42',
    now: new Date('2026-11-26T10:00:00Z'),
  });
  assert.deepEqual(plain(r.sub), {
    set: 1,
    at: 2,
    rally: 3,
    out: 7,
    in: 8,
    position: 'oh',
    eventId: 'e42',
    ts: '2026-11-26T10:00:00.000Z',
  });
  assert.equal(r.event.type, 'SUBSTITUTION');
  assert.equal(r.event.playerOut, 7);
  assert.equal(r.event.playerIn, 8);
  assert.equal(r.event.winningTeam, null);
  const exceptional = S.build(match(), 1, events, null, 7, 8, { exceptional: true });
  assert.equal(exceptional.sub.exceptional, true);
});
