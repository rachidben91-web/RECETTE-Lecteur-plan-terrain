/**
 * SERVICE WORKER V4 – Mesures Terrain
 * Mode clair terrain (B3) – Offline Ready
 */

const APP_VERSION = "v4.0.0";
const CACHE_NAME = `mesures-terrain-${APP_VERSION}`;

// Fichiers essentiels (offline)
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./css/main.css",

  "./js/ui/ui.js",
  "./js/ui/modal.js",

  "./js/core/state.js",
  "./js/core/config.js",
  "./js/core/utils.js",
  "./js/core/events.js",

  "./js/renderer/canvas.js",

  "./js/services/pdf.service.js",
  "./js/services/export.service.js",

  "./js/features/measure.js",
  "./js/features/scale.js",
  "./js/features/annotation.js",
  "./js/features/text.js",

  "./js/app.js",

  "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
];

// ------------------------------------------------------
// INSTALL : on crée le cache
// ------------------------------------------------------
self.addEventListener("install", (evt) => {
    evt.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(CORE_ASSETS))
    );
    self.skipWaiting();
});

// ------------------------------------------------------
// ACTIVATE : suppression anciens caches
// ------------------------------------------------------
self.addEventListener("activate", (evt) => {
    evt.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(k => k !== CACHE_NAME)
                    .map(k => caches.delete(k))
            );
        })
    );
    self.clients.claim();
});

// ------------------------------------------------------
// FETCH : stratégie hybride
// ------------------------------------------------------

// - Tous les PDF passent en “network first” (toujours réseau, fallback cache)
// - Tous les fichiers app (HTML/CSS/JS/UI) passent en “cache first”
// - Anti-blocage pour les libs externes

self.addEventListener("fetch", (evt) => {
    const url = new URL(evt.request.url);

    // PDF → priorité réseau
    if (url.pathname.endsWith(".pdf")) {
        evt.respondWith(
            fetch(evt.request)
                .then(resp => {
                    // Cache facultatif
                    const copy = resp.clone();
                    caches.open(CACHE_NAME).then(c => c.put(evt.request, copy));
                    return resp;
                })
                .catch(() => caches.match(evt.request))
        );
        return;
    }

    // Fichiers statiques → priorité cache
    evt.respondWith(
        caches.match(evt.request)
            .then(resp => resp || fetch(evt.request))
    );
});
