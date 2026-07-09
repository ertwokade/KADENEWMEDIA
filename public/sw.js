// KADE service worker — cache-clearing passthrough (v3)
// Eski agresif cache'leri temizler; fetch'e karışmaz => tarayıcı her zaman taze içerik alır.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.map((k) => caches.delete(k)))
    await self.clients.claim()
  })())
})

// fetch handler yok => tüm istekler doğrudan ağ/tarayıcı cache'ine gider (must-revalidate ile taze).
