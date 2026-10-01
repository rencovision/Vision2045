/* Service Worker — Sistem Komunitas Renco Vision 2045
   Naikkan VERSION setiap kali index.html diperbarui agar cache lama dibuang. */
const VERSION = "renco-pwa-v1";
const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION)
      .then((c) => Promise.all(CORE.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;                    // POST/PATCH (sinkron Supabase) tidak disentuh
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;     // Supabase, unpkg, wa.me, dll: langsung ke jaringan

  // Halaman utama: jaringan dulu (selalu dapat versi terbaru), cache bila offline
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) { const cp = res.clone(); caches.open(VERSION).then((c) => c.put("./index.html", cp)); }
          return res;
        })
        .catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
    );
    return;
  }

  // Aset statis satu origin (ikon, manifest): cache dulu, perbarui di latar belakang
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (res && res.ok) { const cp = res.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
