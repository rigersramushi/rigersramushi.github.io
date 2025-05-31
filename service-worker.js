/* ---------------------------  CONFIG  --------------------------- */
const CACHE_NAME = "photodrop-v1";

// List every file you want guaranteed offline.
// TIP: Add new static assets here whenever you change the UI.
const APP_SHELL = [
  "./",                       // index.html
  "./index.html",
  "./authConfig.js",
  "./graph.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-192.png",
  "./icons/maskable-512.png"
];

/* -------------------------  INSTALL  ---------------------------- */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();   // Activate worker immediately after install
});

/* -------------------------  ACTIVATE  --------------------------- */
self.addEventListener("activate", event => {
  // Purge any old caches that don’t match CACHE_NAME
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim(); // Control open pages right away
});

/* -------------------------- FETCH  ------------------------------ */
self.addEventListener("fetch", event => {
  const { request } = event;

  // Only intercept GET requests from this origin
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) {
    return; // Let the network handle it (e.g., Graph calls)
  }

  // Cache-first strategy for app shell; network-first for others
  event.respondWith(
    caches.match(request).then(cached => {
      return (
        cached ||
        fetch(request).then(response => {
          // Optionally cache new navigations to keep them fresh offline
          if (
            response.ok &&
            request.headers.get("accept")?.includes("text/html")
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
      );
    })
  );
});
