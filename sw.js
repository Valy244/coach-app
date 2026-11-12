// Service worker : rend l'appli installable et rapide à ouvrir.
// Les données (Supabase) passent toujours par le réseau.
const VERSION = "coach-v3";
const SHELL = [
  "./", "index.html", "styles.css", "config.js", "manifest.webmanifest",
  "js/app.js", "js/core.js", "js/db.js", "js/client.js", "js/coach.js", "js/pdf.js", "js/templates.js",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (url.hostname.endsWith("supabase.co") || url.hostname.endsWith("supabase.in")) return;
  // Fichiers de l'appli : réseau d'abord (pour recevoir les mises à jour), cache si hors ligne.
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(e.request).then((r) => {
        const copy = r.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
        return r;
      }).catch(() => caches.match(e.request).then((r) => r || caches.match("index.html")))
    );
    return;
  }
  // Bibliothèques et polices externes : cache d'abord.
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((res) => {
    if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
    return res;
  })));
});
