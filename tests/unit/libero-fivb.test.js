// The libero / middle-blocker permutation must follow the FIVB Official Volleyball Rules 2025-2028, Rule 19:
//   19.1.3    only one Libero on court at a time;
//   19.3.1.1  the Libero may replace any back-row player (here: the middle blocker, the usual tactical choice);
//   19.3.1.2  the Libero plays only as a back-row player;
//   19.3.1.3  the Libero cannot serve;
//   19.3.2.1  at least one completed rally between two Libero replacements;
//   19.3.2.2  the active Libero can only be replaced by the regular player it replaced.
// Every rally of many simulated sets is checked, for each starting rotation and both initial phases.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadBrowserScripts } = require('./load-browser-scripts');

const { VolleyRotation: R } = loadBrowserScripts('js/shared-domain.js', 'js/index-rotation.js');
const BACK_ROW = ['p5', 'p6', 'p1'];
const LIBERO = 99;

// Deterministic pseudo-random events (no flaky tests): about one in three is a neutral contact inside a rally.
function outcomes(seed, count) {
  let x = seed;
  const out = [];
  for (let i = 0; i < count; i++) {
    x = (x * 1103515245 + 12345) % 2147483648;
    const draw = x % 100;
    out.push({ winningTeam: draw < 33 ? null : draw < 67 ? 'team1' : 'team2' });
  }
  return out;
}

// Starting rotations: middle blockers opposite each other (standard 5-1 system) and, as a stress case, adjacent.
function startingRotations() {
  const zones = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
  const layouts = [
    ['S', 'OH1', 'MB1', 'OPP', 'OH2', 'MB2'], // opposite middles
    ['S', 'MB1', 'MB2', 'OPP', 'OH1', 'OH2'], // adjacent middles
  ];
  const numbers = { S: 1, OH1: 3, OH2: 5, MB1: 4, MB2: 6, OPP: 7 };
  const result = [];
  for (const layout of layouts) {
    for (let shift = 0; shift < 6; shift++) {
      const rotation = {};
      zones.forEach((zone, i) => (rotation[zone] = numbers[layout[(i + shift) % 6]]));
      result.push(rotation);
    }
  }
  return result;
}

function courtAt(match, step, mbs) {
  const c = R.court(match, step.rot, { serving: step.serving, mbs, lib: LIBERO, liberoFor: step.liberoFor });
  const liberoZone = ['p4', 'p3', 'p2', 'p5', 'p6', 'p1'].find((z) => c[z].libero);
  return { court: c, liberoZone, replaced: liberoZone ? c[liberoZone].forNum : null };
}

test('libero / middle-blocker permutation follows FIVB Rule 19 on every rally', () => {
  let rallies = 0;
  for (const startingRotation of startingRotations()) {
    for (const antibesState of ['service', 'reception']) {
      for (let seed = 1; seed <= 12; seed++) {
        const match = {
          currentSet: 1,
          startingLineup: { setter: 1, mb1: 4, mb2: 6, libero: LIBERO },
          startingRotation,
          firstRally: { antibesState },
          subs: [],
        };
        const evs = outcomes(seed * 7919, 60);
        const t = R.trace(match, evs);
        const states = t.steps.concat([{ rot: t.rot, serving: t.serving, liberoFor: t.liberoFor }]);
        let previous = null,
          completedSinceChange = 1;
        states.forEach((step, i) => {
          const where = `rotation ${JSON.stringify(startingRotation)}, ${antibesState}, seed ${seed}, rally ${i}`;
          const now = courtAt(match, step, t.mbs);
          const onCourt = Object.values(now.court)
            .filter((v) => v && typeof v === 'object')
            .map((v) => v.num);
          assert.ok(onCourt.filter((n) => n === LIBERO).length <= 1, '19.1.3 one libero: ' + where);
          if (now.liberoZone) {
            assert.ok(BACK_ROW.includes(now.liberoZone), '19.3.1.2 back row only: ' + where);
            assert.ok(!(now.liberoZone === 'p1' && step.serving === 'A'), '19.3.1.3 libero never serves: ' + where);
            assert.ok([4, 6].includes(now.replaced), '19.3.1.1 replaces a middle blocker: ' + where);
          }
          if (previous) {
            const changed = previous.replaced !== now.replaced,
              rallyJustCompleted = !!evs[i - 1].winningTeam;
            if (rallyJustCompleted) completedSinceChange++;
            assert.ok(!(changed && !rallyJustCompleted), '19.3.2.4 no libero change during a rally: ' + where);
            assert.ok(!(changed && completedSinceChange < 1), '19.3.2.1 a completed rally between changes: ' + where);
            if (changed) completedSinceChange = 0;
            // 19.3.2.2: from one replaced player to another would mean the Libero left without its regular player
            // coming back. It also counts as two replacements without a rally in between (19.3.2.1).
            assert.ok(
              !(changed && previous.replaced !== null && now.replaced !== null),
              '19.3.2.1 / 19.3.2.2 the libero must go back to the player it replaced first: ' + where
            );
          }
          previous = now;
          rallies++;
        });
      }
    }
  }
  assert.ok(rallies > 8000, 'enough simulated rallies: ' + rallies);
});

test('a libero replacement is at most one change per completed rally (19.3.2.1)', () => {
  // Opposite middles, team receiving with MB 6 in P1: libero in for 6, side-out moves 6 (libero) to P6, then P5,
  // then P4 where 6 comes back while MB 4 reaches P1 and serves; when the serve is lost the libero comes in for 4.
  const match = {
    currentSet: 1,
    startingLineup: { setter: 1, mb1: 4, mb2: 6, libero: LIBERO },
    startingRotation: { p1: 6, p2: 1, p3: 3, p4: 4, p5: 7, p6: 5 },
    firstRally: { antibesState: 'reception' },
    subs: [],
  };
  const sequence = ['team1', 'team2', 'team1', 'team2', 'team1', 'team2', 'team1', 'team2'].map((w) => ({
    winningTeam: w,
  }));
  const t = R.trace(match, sequence);
  const states = t.steps.concat([{ rot: t.rot, serving: t.serving, liberoFor: t.liberoFor }]);
  const replaced = Array.from(states, (s) => courtAt(match, s, t.mbs).replaced);
  // rally:            1  2  3  4  5     6  7     8  9
  assert.deepEqual(replaced, [6, 6, 6, 6, 6, null, 4, 4, 4]);
});
