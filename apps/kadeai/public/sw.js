self.KADE_CACHE_VERSION = 'kadeai-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('kadeai-') && key !== self.KADE_CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

// Kişisel sayfalar ve API cevapları kasıtlı olarak offline cache'e alınmaz.
self.addEventListener('fetch', () => {})
