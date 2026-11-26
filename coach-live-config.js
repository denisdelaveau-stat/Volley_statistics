/* VolleyLive Coach Live Court configuration v1.13.0.
 * This file contains configurable rules only. Match/player values always come from the loaded match JSON.
 */
(function (root) {
  'use strict';
  root.VolleyCoachConfig = {
    rollingWindow: 5,
    timelineLength: 12,
    minimumSample: 3,
    status: {
      difficulty: {
        errorStreak: 3,
        efficiencyBelow: 15,
        efficiencyMinimumAttempts: 6,
        errors: 4,
        errorsEfficiencyBelow: 25,
        rollingDrop: 30,
      },
      watch: {
        errorStreak: 2,
        efficiencyBelow: 30,
        efficiencyMinimumAttempts: 5,
        receptionPoorRate: 40,
        rollingDrop: 15,
      },
      trendDelta: 10,
      recoveryPositiveActions: 2,
    },
    outcome: {
      point: 'positive',
      kill: 'positive',
      ace: 'positive',
      positive: 'positive',
      perfect: 'positive',
      neutral: 'neutral',
      continue: 'neutral',
      playable: 'neutral',
      error: 'negative',
      fault: 'negative',
      blocked: 'negative',
      negative: 'negative',
    },
    roleOrder: ['setter', 'oh', 'mb', 'opp', 'libero'],
    skillOrder: ['attack', 'block', 'reception', 'defense', 'service', 'set', 'freeball'],
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
