// Service Worker utilities for cache management and offline support

const CACHE_NAME = 'lumen-crm-v2';

// Check if we're in production mode
const isProduction = (): boolean => {
  return import.meta.env.PROD === true;
};

// Check if service worker is supported
export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator;
};

// Cleanup function - unregister all service workers and clear caches
const cleanupServiceWorkers = async (): Promise<void> => {
  if (!isServiceWorkerSupported()) return;

  try {
    // Unregister all service workers
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map(registration => {
        console.log('Unregistering SW:', registration.scope);
        return registration.unregister();
      })
    );

    // Clear all caches
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => {
        console.log('Deleting cache:', cacheName);
        return caches.delete(cacheName);
      })
    );

    console.log('Service Worker cleanup completed');
  } catch (error) {
    console.error('Error during SW cleanup:', error);
  }
};

// Register service worker - ONLY in production
export const registerServiceWorker = (): void => {
  if (!isServiceWorkerSupported()) return;

  // In development/staging: cleanup any existing service workers
  if (!isProduction()) {
    console.log('Development mode - cleaning up service workers');
    cleanupServiceWorkers();
    return;
  }

  // Production only: register the service worker
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                console.log('New SW version available');
                // Dispatch event for UI to show update banner
                window.dispatchEvent(new CustomEvent('swUpdate', { detail: registration }));
              }
            });
          }
        });
      })
      .catch(error => {
        console.log('SW registration failed:', error);
      });
  });
};

// Force update and reload - can be called when user clicks "update" button
export const forceSwUpdate = async (): Promise<void> => {
  if (!isServiceWorkerSupported()) return;

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
  window.location.reload();
};

// Update cache with new content
export const updateCache = async (url: string, response: Response): Promise<void> => {
  if (!isServiceWorkerSupported() || !isProduction()) return;

  const cache = await caches.open(CACHE_NAME);
  cache.put(url, response.clone());
};

// Clear old caches
export const clearOldCaches = async (): Promise<void> => {
  if (!isServiceWorkerSupported()) return;

  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => name !== CACHE_NAME);

  await Promise.all(
    oldCaches.map(cacheName => caches.delete(cacheName))
  );
};

// Manual cleanup - can be triggered by user
export const manualCleanup = cleanupServiceWorkers;
