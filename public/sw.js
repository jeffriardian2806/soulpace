// Service Worker minimalis: cuma buat PWA installable.
// TIDAK intercept fetch (SW lama sebelumnya balikin Response kosong 504
// pas network flake, yang bikin app stuck di logo).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
