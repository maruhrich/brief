// Garde l'app et le dernier brief en cache pour pouvoir les lire hors connexion.
// Toujours la version en ligne d'abord : le cache ne sert que sans réseau.
const VERSION = 'brief-v6';
const SHELL = ['./', 'index.html', 'style.css?v=6', 'app.js?v=6', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;
  const key = url.pathname + url.search;
  event.respondWith(
    // « no-cache » : toujours vérifier auprès du serveur (GitHub garde sinon les fichiers 10 min)
    fetch(url.href, { cache: 'no-cache', credentials: 'same-origin' })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(key, copy));
        }
        return res;
      })
      .catch(() => caches.match(key).then((hit) => hit || caches.match('index.html'))));
});

// ── Notification du matin ─────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { body: event.data ? event.data.text() : '' }; }
  const badge = self.navigator.setAppBadge ? self.navigator.setAppBadge(1).catch(() => {}) : null;
  event.waitUntil(Promise.all([
    self.registration.showNotification(data.title || 'Today’s brief', {
      body: data.body || 'Your defence & geopolitics brief is ready.',
      icon: 'icons/icon-192.png',
      tag: 'brief',
      data: { url: data.url || './' },
    }),
    badge,
  ]));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || './', self.registration.scope).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => c.url.startsWith(self.registration.scope));
      return open ? open.focus() : self.clients.openWindow(target);
    }));
});
