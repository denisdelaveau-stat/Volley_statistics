/* Volley Live Capture v1.26.0 - offline service worker.
   Bump CACHE when any file changes so installed phones pick up the new version. */
var CACHE = 'volley-live-capture-v1.26.0';
var ASSETS = ['./', 'index.html', 'manifest.webmanifest',
  'Font_app_ref.jpg', 'coach.css', 'match-hub.css', 'team-management.css', 'match-hub.js', 'coach-live-config.js', 'coach.js',
  'statistics/adapter.js', 'spectator.html', 'spectator.css', 'spectator-live-config.js', 'spectator.js',
  'statistics/data/As_cannes_vs_Frejus_2026-11-15.fixture.v2.json',
  'statistics/data/reference-fixture.js',
  'icons/apple-touch-icon.png', 'icons/favicon-32.png', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (r) {
    return r || fetch(e.request).then(function (resp) {
      if (resp && resp.ok && new URL(e.request.url).origin === location.origin) {
        var cp = resp.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cp); });
      }
      return resp;
    }).catch(function () { return caches.match('index.html'); });
  }));
});
