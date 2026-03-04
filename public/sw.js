// FernetApp Service Worker
const CACHE_NAME = "fernetapp-v1";

// Páginas y assets críticos a pre-cachear
const PRECACHE_URLS = [
  "/",
  "/dashboard",
  "/players",
  "/offline",
  "/Escudo Fernet 2023 PNG.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/apple-touch-icon.png",
];

// Instalación: pre-cachea los recursos críticos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activación: limpia caches viejos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: Network First para navegación, Cache First para assets estáticos
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo cachear requests del mismo origen
  if (url.origin !== self.location.origin) return;
  // No interceptar requests de admin ni API
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api"))
    return;

  if (request.mode === "navigate") {
    // Navegación: Network First, fallback a cache
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/offline"))
        )
    );
  } else if (
    request.destination === "image" ||
    request.destination === "font" ||
    request.destination === "style" ||
    request.destination === "script"
  ) {
    // Assets estáticos: Cache First
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
  }
});
