// Service Worker utilities for cache management and offline support

const CACHE_NAME = 'lumen-crm-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - precache critical assets
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('SW registered:', registration);
        })
        .catch(error => {
          console.log('SW registration failed:', error);
        });
    });
  }
};

// Check if service worker is supported and active
export const isServiceWorkerSupported = () => {
  return 'serviceWorker' in navigator;
};

// Update cache with new content
export const updateCache = async (url: string, response: Response) => {
  if (!isServiceWorkerSupported()) return;
  
  const cache = await caches.open(CACHE_NAME);
  cache.put(url, response.clone());
};

// Clear old caches
export const clearOldCaches = async () => {
  if (!isServiceWorkerSupported()) return;
  
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => name !== CACHE_NAME);
  
  await Promise.all(
    oldCaches.map(cacheName => caches.delete(cacheName))
  );
};
