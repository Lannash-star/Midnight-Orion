const CACHE_NAME = 'mockup-canvas-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event - cache assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      // Return cached response if available
      if (response) {
        return response;
      }

      // Otherwise fetch from network
      return fetch(event.request).then(response => {
        // Cache successful GET requests
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        const responseToCache = response.clone();
        if (event.request.method === 'GET') {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      }).catch(() => {
        // Offline fallback
        console.log('Offline - returning cached version or 404');
        return caches.match('/index.html');
      });
    })
  );
});

// Background sync (optional - for offline actions)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-canvas') {
    event.waitUntil(syncCanvas());
  }
});

async function syncCanvas() {
  try {
    console.log('Background sync: Syncing canvas data...');
    // Add your sync logic here
  } catch (error) {
    console.error('Background sync failed:', error);
    throw error;
  }
}

// Push notifications (optional)
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Mockup Canvas notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png'
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Mockup Canvas', options)
  );
});
