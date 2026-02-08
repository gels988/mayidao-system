const CACHE_NAME = 'g2-gold-mobile-v2';
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/core_engine.js',
  './js/ui_controller.js',
  './js/auth_bridge_local.js',
  './js/dynamics_engine.js',
  './js/utils.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
