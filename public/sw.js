// Service Worker for PWA capabilities and performance optimization
const CACHE_NAME = 'lumen-crm-v1';
const RUNTIME_CACHE = 'runtime-cache-v1';

// Assets to precache
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map(name => caches.delete(name))
      );
    }).then(() => clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip API requests (let them go through normally)
  if (url.pathname.includes('/api/') || url.pathname.includes('supabase')) {
    return;
  }

  // Network first strategy for HTML
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request).then(cached => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // Cache first for static assets (CSS, JS, images)
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image') {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) {
          // Return cached version immediately
          // Update cache in background
          fetch(request).then(response => {
            if (response.ok) {
              caches.open(RUNTIME_CACHE).then(cache => {
                cache.put(request, response);
              });
            }
          }).catch(() => {});
          return cached;
        }
        
        // Not in cache, fetch from network
        return fetch(request).then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
  }
});
