const CACHE = "hipertrofia-v2";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;

  // Navegación (index.html): red primero. Si sirviéramos esto cache-first, el
  // móvil se quedaría para siempre en el build del día que lo instaló, porque
  // nunca volvería a pedir el index.html que apunta al JS con hash nuevo.
  if (e.request.mode === "navigate" || url.pathname.endsWith("/index.html") || url.pathname === "/") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          e.waitUntil(caches.open(CACHE).then((c) => c.put(e.request, copy)));
          return res;
        })
        .catch(() => caches.match(e.request).then((hit) => hit || caches.match("./index.html")))
    );
    return;
  }

  // Resto de archivos propios (JS/CSS con hash de contenido, iconos...):
  // caché primero, son inmutables por build.
  e.respondWith(
    caches.match(e.request).then(
      (hit) =>
        hit ||
        fetch(e.request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
    )
  );
});
