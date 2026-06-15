const CACHE_NAME = 'studydash-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'manifest.json',
  'icon.svg',
  'icon-512.jpg'
];

// Install stage: Cache assets for reliable shell loading
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Allow optional failures safely (some assets may build dynamically)
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('Pre-caching warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate stage: Cache cleanup
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch interception: Dynamic fallback with safety guards
self.addEventListener('fetch', (event) => {
  // Only intercept same-origin HTTP/HTTPS GET requests
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Skip firestore / auth / google-api requests
  if (url.pathname.includes('/__/auth') || url.pathname.includes('firestore.googleapis.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful local responses dynamically
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Offline: attempt fallback from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // For navigation failures (page reload on offline), serve standard App Shell index.html
          if (event.request.mode === 'navigate') {
            return caches.match('./') || caches.match('index.html');
          }
        });
      })
  );
});
