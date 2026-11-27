/* VolleyLive spectator Live configuration. Match values never belong in this file. */
(function (root) {
  'use strict';
  root.VolleySpectatorConfig = {
    momentum: { windowSize: 8, minPoints: 4, advantageThreshold: 0.7 },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
