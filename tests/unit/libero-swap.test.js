// Second libero, FIVB Official Volleyball Rules 2025-2028: up to two liberos (19.1.1), one acting libero (19.1.3);
// replacing the acting libero by the other one is a libero replacement, not a substitution (19.3.2), never during a
// rally, with a completed rally since the previous libero replacement (19.3.2.1).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadBrowserScripts, fixture } = require('./load-browser-scripts');

const {
  VolleyRotation: R,
  VolleySubstitutions: S,
  VolleyStatsAdapter: A,
} = loadBrowserScripts(
  'js/shared-domain.js',
  'js/index-rotation.js',
  'js/index-substitution-rules.js',
  'statistics/adapter.js'
);

const plain = (value) => JSON.parse(JSON.stringify(value));
// Setter 1 in P1; MB 4 in P3 and MB 6 in P6; liberos 2 (acting) and 9; bench 8.
function match(subs, firstRally) {
  return {
    currentSet: 1,
    team: {
      roster: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
        number: n,
        position: n === 2 || n === 9 ? 'libero' : n === 4 || n === 6 ? 'mb' : n === 1 ? 'setter' : 'oh',
        present: true,
      })),
    },
    startingLineup: { setter: 1, oh1: 3, mb1: 4, opposite: 7, oh2: 5, mb2: 6, libero: 2 },
    startingRotation: { p1: 1, p2: 3, p3: 4, p4: 7, p5: 5, p6: 6 },
    firstRally: { antibesState: firstRally || 'service' },
    subs: subs || [],
  };
}
const rally = (winningTeam) => ({ set: 1, winningTeam });
const swap = (at, out, inn) => ({ set: 1, at, out, in: inn, libero: true });

test('both designated liberos are known and excluded from substitutions', () => {
  assert.deepEqual(plain(S.liberos(match())).sort(), [2, 9]);
  assert.deepEqual(plain(S.options(match(), 1, match().startingRotation, 7).regular), [8]);
});

test('a libero replacement is not counted as a substitution (19.3.2)', () => {
  const m = match([swap(1, 2, 9)]);
  assert.equal(S.history(m, 1).regular, 0);
  assert.equal(S.history(m, 1).exceptional, 0);
});

test('after the swap the other libero is the acting one, on court in the same place', () => {
  const events = [rally('team1')];
  const before = R.trace(match(), events, 1);
  const after = R.trace(match([swap(1, 2, 9)]), events, 1);
  assert.equal(before.lib, 2);
  assert.equal(after.lib, 9);
  const court = plain(R.onCourt(match([swap(1, 2, 9)]), after.rot, after));
  assert.equal(court.p6, 9, 'libero 9 plays in P6, in place of MB 6');
  assert.ok(!Object.values(court).includes(2), 'libero 2 has left the court');
});

test('a swap is allowed at the start of the set and between rallies without libero replacement', () => {
  assert.equal(S.liberoSwap(match(), 1, []).refusal, null);
  const sw = S.liberoSwap(match(), 1, [rally('team1')]);
  assert.equal(sw.refusal, null);
  assert.equal(sw.current, 2);
  assert.deepEqual(plain(sw.candidates), [9]);
});

test('never during a rally, never without a second libero', () => {
  assert.equal(
    S.liberoSwap(match(), 1, [{ set: 1, action: 'attack', result: 'neutral' }]).refusal,
    'subs.blockedRally'
  );
  const single = match();
  single.team.roster.find((p) => p.number === 9).position = 'oh';
  assert.equal(S.liberoSwap(single, 1, []).refusal, 'subs.refuseNoSecondLibero');
  const absent = match();
  absent.team.roster.find((p) => p.number === 9).present = false;
  assert.equal(S.liberoSwap(absent, 1, []).refusal, 'subs.refuseNoSecondLibero');
});

test('19.3.2.1: refused right after another libero replacement, allowed again after a completed rally', () => {
  // A swap already made at this break, with or without its SUBSTITUTION event in the list.
  assert.equal(S.liberoSwap(match([swap(1, 2, 9)]), 1, [rally('team1')]).refusal, 'subs.refuseLiberoRally');
  const withEvent = [rally('team1'), { set: 1, type: 'SUBSTITUTION', eventType: 'SUBSTITUTION', libero: true }];
  assert.equal(S.liberoSwap(match([swap(1, 2, 9)]), 1, withEvent).refusal, 'subs.refuseLiberoRally');
  assert.equal(S.liberoSwap(match([swap(0, 2, 9)]), 1, withEvent.slice(1)).refusal, 'subs.refuseLiberoRally');
  // Breaks where the libero comes in or goes out (found with the engine) refuse it; the others allow it.
  const outcomes = ['team2', 'team1', 'team2', 'team1', 'team1', 'team2', 'team1', 'team2', 'team1', 'team2', 'team1'];
  let refused = 0,
    allowed = 0;
  for (let n = 1; n <= outcomes.length; n++) {
    const events = outcomes.slice(0, n).map(rally);
    const t = R.trace(match(), events, 1);
    const changed = String(t.steps[n - 1].liberoFor) !== String(t.liberoFor);
    const refusal = S.liberoSwap(match(), 1, events).refusal;
    assert.equal(refusal, changed ? 'subs.refuseLiberoRally' : null, 'after rally ' + n);
    if (changed) refused++;
    else allowed++;
  }
  assert.ok(refused > 0 && allowed > 0, 'both cases are covered: ' + refused + ' refused, ' + allowed + ' allowed');
});

test('the Spectator matrix (adapter) follows the swap like the engine', () => {
  const raw = fixture('tests/data/As_cannes_vs_Frejus_2026-11-15.capture.v1.json');
  raw.match.team.roster.push({ number: 30, name: 'Second libero', position: 'libero', present: true });
  // Swap at the start of set 1 (no libero replacement can precede it).
  raw.match.subs = (raw.match.subs || []).concat([swap(0, raw.match.startingLineup.libero, 30)]);
  const report = A.toReportData(raw);
  const key30 = report.analyticsPlayers[raw.match.team.roster.length - 1];
  const keyFirst =
    report.analyticsPlayers[raw.match.team.roster.findIndex((p) => p.number === raw.match.startingLineup.libero)];
  const set1 = report.cols.filter((c) => c.setNumber === 1 || c.set === 1);
  assert.ok(set1.length > 10);
  assert.ok(
    set1.some((c) => c.court[key30]),
    'libero 30 plays in set 1'
  );
  assert.ok(!set1.some((c) => c.court[keyFirst]), 'the first libero no longer plays in set 1');
});
