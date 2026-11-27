// Libero unable to play and re-designation, FIVB Official Volleyball Rules 2025-2028, 19.4: the other libero takes
// over; without one, a player not on court (not the player the libero replaced) becomes libero for the rest of the
// match; the libero declared unable cannot play again in the match.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadBrowserScripts } = require('./load-browser-scripts');

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
// Setter 1 in P1; MB 4 in P3, MB 6 in P6 (the libero 2 replaces MB 6 while we serve); bench 8 and 10.
// secondLibero: player 9 is a second libero.
function match(subs, secondLibero) {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 10].concat(secondLibero ? [9] : []);
  return {
    currentSet: 1,
    team: {
      roster: numbers.map((n) => ({
        number: n,
        position: n === 2 || n === 9 ? 'libero' : n === 4 || n === 6 ? 'mb' : n === 1 ? 'setter' : 'oh',
        present: true,
      })),
    },
    startingLineup: { setter: 1, oh1: 3, mb1: 4, opposite: 7, oh2: 5, mb2: 6, libero: 2 },
    startingRotation: { p1: 1, p2: 3, p3: 4, p4: 7, p5: 5, p6: 6 },
    firstRally: { antibesState: 'service' },
    subs: subs || [],
  };
}
const rally = (winningTeam) => ({ set: 1, winningTeam });
const unable = (at, out, inn, redesignated) =>
  Object.assign({ set: 1, at, out, in: inn, libero: true, unable: true }, redesignated ? { redesignated: true } : {});

test('19.4: with a second libero, that libero takes over', () => {
  const u = S.liberoUnable(match([], true), 1, [rally('team1')]);
  assert.equal(u.refusal, null);
  assert.equal(u.current, 2);
  assert.deepEqual(plain(u.liberos), [9]);
  assert.deepEqual(plain(u.players), [], 'no re-designation while another libero can play');
});

test('19.4: without a second libero, a player not on court may be re-designated (not the player replaced)', () => {
  const u = S.liberoUnable(match(), 1, [rally('team1')]);
  assert.equal(u.refusal, null);
  assert.deepEqual(plain(u.liberos), []);
  // On court: 1, 3, 4, 7, 5 and the libero 2 for MB 6. MB 6 (replaced by the libero) is not offered.
  assert.deepEqual(
    plain(u.players).sort((a, b) => a - b),
    [8, 10]
  );
});

test('a player barred by an exceptional substitution cannot be re-designated', () => {
  const m = match([{ set: 1, at: 0, out: 7, in: 8, exceptional: true }]);
  const u = S.liberoUnable(m, 1, [rally('team1')]);
  assert.ok(!plain(u.players).includes(7), 'player 7 left for good (15.7)');
});

test('never during a rally; nothing to do without an acting libero', () => {
  assert.equal(
    S.liberoUnable(match(), 1, [{ set: 1, action: 'attack', result: 'neutral' }]).refusal,
    'subs.blockedRally'
  );
  const none = match();
  none.startingLineup.libero = null;
  none.team.roster.find((p) => p.number === 2).position = 'oh';
  assert.equal(S.liberoUnable(none, 1, []).refusal, 'subs.refuseNoLibero');
});

test('after a re-designation the new libero acts for the rest of the match, the old one never comes back', () => {
  const m = match([unable(1, 2, 8, true)]);
  const events = [rally('team1')];
  const t = R.trace(m, events, 1);
  assert.equal(t.lib, 8);
  const court = plain(R.onCourt(m, t.rot, t));
  assert.equal(court.p6, 8, 'the new libero plays where the libero was');
  assert.deepEqual(plain(S.unableLiberos(m)), [2]);
  assert.ok(plain(S.liberos(m)).includes(8), 'player 8 is now a libero');
  assert.deepEqual(plain(S.options(m, 1, t.rot, 7).regular), [10], 'neither libero is a regular substitute');
  // Set 2: the old libero cannot be swapped back in.
  const later = Object.assign({}, m, {
    currentSet: 2,
    setLineups: {
      2: { startingLineup: Object.assign({}, m.startingLineup, { libero: 8 }), startingRotation: m.startingRotation },
    },
  });
  assert.equal(S.liberoSwap(later, 2, []).refusal, 'subs.refuseNoSecondLibero');
});

test('with two liberos, the one declared unable is no longer offered as a swap', () => {
  const m = match([unable(1, 2, 9)], true);
  const sw = S.liberoSwap(m, 1, [rally('team1'), rally('team1')]);
  assert.equal(sw.current, 9);
  assert.deepEqual(plain(sw.candidates), []);
});

test('the Spectator matrix (adapter) follows a re-designation', () => {
  const m = match([unable(1, 2, 8, true)]);
  m.firstRally = { antibesState: 'service' };
  const raw = {
    format: 'volley-live-capture',
    version: 1,
    match: Object.assign(m, {
      id: 't',
      name: 't',
      team: Object.assign(m.team, { name: 'A' }),
      opponent: { name: 'B' },
    }),
    events: [
      { id: 1, set: 1, action: 'attack', result: 'point', player: 3, winningTeam: 'team1', scoreA: 1, scoreB: 0 },
      { id: 2, set: 1, action: 'attack', result: 'point', player: 3, winningTeam: 'team1', scoreA: 2, scoreB: 0 },
    ],
  };
  const report = A.toReportData(raw);
  const keyOf = (n) => report.analyticsPlayers[raw.match.team.roster.findIndex((p) => p.number === n)];
  const [first, second] = report.cols;
  assert.ok(first.court[keyOf(2)] && !first.court[keyOf(8)], 'rally 1: libero 2');
  assert.ok(second.court[keyOf(8)] && !second.court[keyOf(2)], 'rally 2: re-designated libero 8');
});
