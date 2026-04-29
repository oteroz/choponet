const CACHE_NAME = 'choponet-v3';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/base.css',
  './css/theme.css',
  './css/layout.css',
  './css/components/auth.css',
  './css/components/post.css',
  './css/components/reply.css',
  './css/components/reactions.css',
  './css/components/hashtag.css',
  './css/components/nav.css',
  './js/main.js',
  './js/router.js',
  './js/firebase-config.js',
  './js/auth/auth-service.js',
  './js/auth/nick-generator.js',
  './js/posts/posts-service.js',
  './js/posts/posts-view.js',
  './js/replies/replies-service.js',
  './js/replies/replies-view.js',
  './js/reactions/reactions-service.js',
  './js/reactions/reactions-view.js',
  './js/ui/view-manager.js',
  './js/ui/toast.js',
  './js/utils/hashtags.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(APP_SHELL).catch(() => {
        // Si algún recurso falla, continuamos — los faltantes se cachean en runtime
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('identitytoolkit.googleapis.com') ||
      url.hostname.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && url.origin === location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
