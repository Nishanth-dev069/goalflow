const CACHE_VERSION = 'goalflow-v1780567103473';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

const NEVER_CACHE = [
  'supabase.co',
  '/api/',
  '/auth/',
  '_rsc',
  '__nextjs',
  'rspack',
];

const STATIC_ASSETS = [
  '/',
  '/offline',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Skip caching for specific paths/domains
  if (NEVER_CACHE.some(pattern => url.href.includes(pattern))) {
    return;
  }
  if (url.pathname.includes('_rsc') || url.pathname.includes('next_router') || url.pathname.includes('__next')) {
    return;
  }
  if (url.pathname.includes('/api/')) {
    return;
  }

  // Cache-first for static assets
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || url.pathname === '/manifest.json') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        });
      })
    );
    return;
  }

  // Network-first for navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return networkResponse;
        })
        .catch(() => {
          return caches.match('/offline');
        })
    );
    return;
  }

  // Network-first for everything else
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'GoalFlow';
    const body = data.body || 'You have a new notification';
    const icon = data.icon || '/icons/icon-192x192.png';
    const url = data.url || '/';
    const type = data.type || 'default';

    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon,
        badge: '/icons/icon-72x72.png',
        data: { url },
        actions: [{ action: 'open', title: 'Open GoalFlow' }],
        requireInteraction: type === 'deadline',
        vibrate: [200, 100, 200]
      })
    );
  } catch (e) {
    console.error('Error parsing push data', e);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const url = event.notification.data.url || '/';

  if (action === 'open' || !action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        // If app is already open, focus it
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
