const CACHE_NAME = "frever-wishlist-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./login.html",
  "./register.html",
  "./dashboard.html",
  "./registries.html",
  "./wishlist.html",
  "./admin.html",
  "./purchases.html",
  "./profile.html",
  "./css/main.css",
  "./js/supabase.js",
  "./js/auth.js",
  "./js/ui.js",
  "./js/app.js"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
