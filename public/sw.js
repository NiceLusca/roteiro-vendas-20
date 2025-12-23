// Service Worker for PWA capabilities and performance optimization
// Version 2 - Fixed caching strategy to prevent React hydration issues

const CACHE_NAME = 'lumen-crm-v2';
const RUNTIME_CACHE = 'runtime-cache-v2';

// Assets to precache (minimal - only truly static assets)
const PRECACHE_URLS = [
  '/manifest.json',
];

// Paths that should NEVER be cached (dev tools, HMR, dynamic content)
const NO_CACHE_PATTERNS = [
  '/@vite',
  '/@react-refresh',
  '/src/',
  '/node_modules/.vite/',
  '/__vite_ping',
  '/api/',
  'supabase',
  '.hot-update.',
];

// Check if URL should skip caching
const shouldSkipCache = (url) => {
  return NO_CACHE_PATTERNS.some(pattern => url.includes(pattern));
};

// Install event - precache minimal assets
self.addEventListener('install', (event) => {
  console.log('Service Worker v2 installing.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches aggressively
self.addEventListener('activate', (event) => {
  console.log('Service Worker v2 activating.');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map(name => {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => clients.claim())
  );
});

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event - NETWORK FIRST for everything important
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip requests that should never be cached
  if (shouldSkipCache(url.pathname) || shouldSkipCache(url.href)) {
    return;
  }

  // NETWORK FIRST for navigation (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Only cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache only if network fails
          return caches.match(request).then(cached => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // NETWORK FIRST for JavaScript and CSS (critical for React)
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Only use cache as fallback for offline
          return caches.match(request);
        })
    );
    return;
  }

  // STALE-WHILE-REVALIDATE for images and fonts (less critical)
  if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(
      caches.match(request).then(cached => {
        const fetchPromise = fetch(request).then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Default: just fetch, minimal caching
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
