/**
 * Service Worker RuangKumpul untuk dukungan PWA dan akses offline katalog tools.
 * Seluruh 24 web tools diproses pada sisi klien sehingga dapat berjalan tanpa internet.
 */

const CACHE_NAME = "rk-pwa-v2";

const PRECACHE_ASSETS = [
  "/tools",
  "/offline",
  "/icon.svg",
  "/icon-512.png",
  "/manifest.webmanifest",
];

// Pemasangan Service Worker dan caching aset dasar offline
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

// Pembersihan cache versi lama saat aktivasi
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Strategi pengambilan data (Fetch event)
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Hanya proses request GET dari origin yang sama
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Jangan cache endpoint API, autentikasi, dashboard, dan panel admin
  const pathname = url.pathname;
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin")
  ) {
    return;
  }

  // Aset statis build (_next/static, font, dan gambar): Cache First
  if (
    pathname.startsWith("/_next/static/") ||
    pathname.match(/\.(svg|png|jpg|jpeg|webp|ico|woff2?)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      }),
    );
    return;
  }

  // Navigasi halaman (HTML): Network First dengan fallback ke Cache atau halaman Offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Jika sukses dan merupakan rute tools, perbarui cache untuk offline
          if (networkResponse.status === 200 && pathname.startsWith("/tools")) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Saat koneksi mati, cari halaman di cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;

          // Jika halaman belum ada di cache, arahkan ke halaman fallback offline
          const offlinePage = await caches.match("/offline");
          if (offlinePage) return offlinePage;

          return new Response("Koneksi offline dan konten belum tersimpan.", {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }),
    );
  }
});
