// This is a basic service worker file for PWA capabilities.
// It mainly handles caching strategies and push notifications.

const CACHE_NAME = 'hsaban-app-cache-v1';
const urlsToCache = [
  '/',
  'dream_app_upgrade.html',
  'manifest.json',
  'images/logo192.png',
  'images/logo512.png'
  // Add other static assets like CSS files or critical JS files if they exist.
];

// Install event: open a cache and add the static assets to it.
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event: clean up old caches.
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: serve assets from cache, or fetch from network if not available.
self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch from network
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
      })
      .catch(error => {
        // The catch is triggered when fetching fails, which means the user is offline.
        // You could return a fallback offline page here.
        console.error('Service Worker: Fetch failed; user is likely offline.', error);
        // Optional: return caches.match('/offline.html');
      })
  );
});

// You can add listeners for 'push' and 'notificationclick' events here
// for Firebase Cloud Messaging.
self.addEventListener('push', event => {
  console.log('[Service Worker] Push Received.');
  const pushData = event.data.json();

  const title = pushData.notification.title;
  const options = {
    body: pushData.notification.body,
    icon: 'images/logo192.png',
    badge: 'images/logo192.png'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
