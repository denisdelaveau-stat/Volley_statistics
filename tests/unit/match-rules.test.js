// Unit tests for the set and match rules (window.VolleySets in js/index-match-rules.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadBrowserScripts, fixture, plain } = require('./load-browser-scripts');

const { VolleySets: S } = loadBrowserScripts('js/shared-dom.js', 'js/shared-domain.js', 'js/index-match-rules.js');

function points(set, a, b) {
  const out = [];
  for (let i = 0; i < a; i++) out.push({ set, winningTeam: 'team1' });
  for (let i = 0; i < b; i++) out.push({ set, winningTeam: 'team2' });
  return out;
}
const bestOf5 = { format: { setsToWin: 3 }, currentSet: 1 };
const bestOf3 = { format: { setsToWin: 2 }, currentSet: 1 };

test('best of five unless the format says two sets to win', () => {
  assert.equal(S.setsToWin(bestOf5), 3);
  assert.equal(S.setsToWin(bestOf3), 2);
  assert.equal(S.setsToWin({}), 3);
  assert.equal(S.decidingSet(bestOf5), 5);
  assert.equal(S.decidingSet(bestOf3), 3);
});

test('sets are played to 25, the deciding set to 15', () => {
  assert.equal(S.target(bestOf5, 1), 25);
  assert.equal(S.target(bestOf5, 4), 25);
  assert.equal(S.target(bestOf5, 5), 15);
  assert.equal(S.target(bestOf3, 3), 15);
});

test('score counts only the rallies of the requested set; events without set belong to set 1', () => {
  const evs = points(1, 3, 2).concat(points(2, 1, 4), [{ winningTeam: 'team1' }, { winningTeam: null }]);
  assert.deepEqual(plain(S.score(evs, 1)), { a: 4, b: 2 });
  assert.deepEqual(plain(S.score(evs, 2)), { a: 1, b: 4 });
  assert.deepEqual(plain(S.score([], 1)), { a: 0, b: 0 });
});

test('a set is won at the target with a two-point lead', () => {
  assert.equal(S.winner(bestOf5, points(1, 25, 23), 1), 'team1');
  assert.equal(S.winner(bestOf5, points(1, 25, 24), 1), null, 'no two-point lead');
  assert.equal(S.winner(bestOf5, points(1, 26, 24), 1), 'team1');
  assert.equal(S.winner(bestOf5, points(1, 24, 26), 1), 'team2');
  assert.equal(S.winner(bestOf5, points(5, 15, 13), 5), 'team1', 'deciding set to 15');
  assert.equal(S.winner(bestOf5, points(5, 14, 12), 5), null);
});

test('summary counts won sets and declares the match winner', () => {
  const evs = points(1, 25, 20).concat(points(2, 25, 22));
  const ongoing = S.summary({ format: { setsToWin: 3 }, currentSet: 3 }, evs);
  assert.equal(ongoing.wonA, 2);
  assert.equal(ongoing.matchWinner, null);
  const won = S.summary({ format: { setsToWin: 2 }, currentSet: 2 }, evs);
  assert.equal(won.matchWinner, 'team1');
  assert.equal(won.current.set, 2);
});

test('reference capture: set 1 25-22 for team A, set 2 21-25 for team B', () => {
  const raw = fixture('tests/data/As_cannes_vs_Frejus_2026-11-15.capture.v1.json');
  const summary = S.summary(raw.match, raw.events);
  assert.deepEqual(plain(summary.sets.map((s) => [s.a, s.b, s.winner])), [
    [25, 22, 'team1'],
    [21, 25, 'team2'],
  ]);
  assert.equal(summary.wonA, 1);
  assert.equal(summary.wonB, 1);
});
