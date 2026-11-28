/* Volley Live Capture v1.28.0 - offline service worker.
   Bump CACHE when any file changes so installed phones pick up the new version. */
var CACHE = 'volley-live-capture-v1.28.0-flow-portrait';
var ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'Font_app_ref.jpg',
  'runtime-input.css',
  'runtime-input.js',
  'js/gamepad-input.js',
  'coach.css',
  'match-hub.css',
  'team-management.css',
  'team-management.js',
  'settings.js',
  'match-hub.js',
  'coach-live-config.js',
  'js/coach-core.js',
  'js/coach-rotations.js',
  'js/coach-overview.js',
  'js/coach-players.js',
  'js/coach-live.js',
  'coach.js',
  'css/index-theme.css',
  'css/index-capture-layout.css',
  'css/index-focus.css',
  'css/index-result-grammar.css',
  'js/shared-dom.js',
  'js/shared-domain.js',
  'js/i18n/fr.js',
  'js/i18n/en.js',
  'js/shared-i18n.js',
  'js/index-match-rules.js',
  'js/index-rotation.js',
  'js/index-substitution-rules.js',
  'js/index-capture-engine.js',
  'js/index-set-lineup.js',
  'js/index-capture-tools.js',
  'js/index-report.js',
  'js/index-navigation-new-match.js',
  'js/index-pwa.js',
  'statistics/adapter.js',
  'spectator.html',
  'spectator.css',
  'spectator-live-config.js',
  'js/spectator-core.js',
  'js/spectator-live-score.js',
  'js/spectator-ranking.js',
  'js/spectator-timeline.js',
  'js/spectator-graph.js',
  'spectator.js',
  'statistics/data/As_cannes_vs_Frejus_2026-11-15.fixture.v2.json',
  'statistics/data/reference-fixture.js',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
];
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches
      .open(CACHE)
      .then(function (c) {
        return c.addAll(ASSETS);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (k) {
              return k !== CACHE;
            })
            .map(function (k) {
              return caches.delete(k);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (r) {
      return (
        r ||
        fetch(e.request)
          .then(function (resp) {
            if (resp && resp.ok && new URL(e.request.url).origin === location.origin) {
              var cp = resp.clone();
              caches.open(CACHE).then(function (c) {
                c.put(e.request, cp);
              });
            }
            return resp;
          })
          .catch(function () {
            return caches.match('index.html');
          })
      );
    })
  );
});
