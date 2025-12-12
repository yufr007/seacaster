// SeaCaster Service Worker - Enhanced for Three.js
const CACHE_NAME = 'seacaster-v2';
const RUNTIME_CACHE = 'seacaster-runtime-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.css',
  '/sounds/cast.mp3',
  '/sounds/splash.mp3',
  '/sounds/reel-spin.mp3',
  '/sounds/success.mp3',
  // Note: Vite-generated bundles (index-*.js, index-*.css) are cached at runtime
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Cache three.js and React Three Fiber modules at runtime
  if (
    request.url.includes('node_modules/three') ||
    request.url.includes('node_modules/@react-three') ||
    request.url.includes('/assets/') || // Vite bundled assets
    request.url.endsWith('.glb') || // 3D models
    request.url.endsWith('.gltf')
  ) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          return (
            response ||
            fetch(request).then((networkResponse) => {
              if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
          );
        });
      })
    );
    return;
  }

  // Network first, fall back to cache for HTML
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/index.html')));
    return;
  }

  // Cache first for static assets
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request);
    })
  );
});