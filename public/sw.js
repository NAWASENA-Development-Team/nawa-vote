// NAWA-VOTE Service Worker (v3) — Complete Offline PWA & Kiosk Support
// Caching strategies:
//   - Static assets (/_next/static/**): Cache-First with safe 503 fallback
//   - Images (/_next/image, candidate photos): Cache-First with SVG placeholder fallback
//   - Navigations (/, /vote, /success): Network-First with cross-route shell fallback
//   - Server Actions (POST): Offline intercept returning structured JSON

const CACHE_VERSION = 'nawa-v3';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const PAGE_CACHE    = `${CACHE_VERSION}-pages`;
const IMAGE_CACHE   = `${CACHE_VERSION}-images`;

const PRECACHE_ASSETS = [
  '/',
  '/vote',
  '/manifest.json',
  '/favicon.ico',
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(PAGE_CACHE).then(async (cache) => {
      // Pre-cache core pages gracefully so individual failures don't abort install
      await Promise.allSettled(
        PRECACHE_ASSETS.map(async (url) => {
          try {
            const res = await fetch(url, { cache: 'no-cache' });
            if (res && (res.ok || res.type === 'opaque')) {
              await cache.put(url, res);
            }
          } catch {
            // non-fatal pre-cache failure
          }
        })
      );
    })
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(CACHE_VERSION))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Same-origin static assets: Cache-First
  if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirstSafe(request, STATIC_CACHE));
    return;
  }

  // 2. Images (Next.js image optimizer or direct images)
  const isImage =
    url.pathname.startsWith('/_next/image') ||
    request.destination === 'image' ||
    /\.(png|jpg|jpeg|svg|webp|gif|ico)$/i.test(url.pathname);

  if (isImage) {
    event.respondWith(cacheImage(request));
    return;
  }

  // 3. Server Actions / POST to /vote or /: offline intercept
  if (request.method === 'POST') {
    event.respondWith(postOfflineIntercept(request));
    return;
  }

  // 4. Page navigations: Network-First with cross-route shell fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request));
    return;
  }

  // 5. Next.js RSC Flight requests (e.g. router.push client transitions)
  if (url.searchParams.has('_rsc') || request.headers.get('rsc') === '1') {
    event.respondWith(handleRscRequest(request));
    return;
  }
});

// ─── Strategies ───────────────────────────────────────────────────────────────

/**
 * Cache-First with safe fallback. NEVER rejects FetchEvent promise.
 */
async function cacheFirstSafe(request, cacheName) {
  try {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response && (response.ok || response.status === 0)) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    return new Response('', {
      status: 503,
      statusText: 'Service Unavailable (offline)',
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

/**
 * Image Cache: Cache-First.
 * If offline and un-cached, returns an SVG placeholder instead of throwing NetworkError.
 */
async function cacheImage(request) {
  try {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response && (response.ok || response.type === 'opaque')) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Offline SVG placeholder — matches candidate portrait ratio
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400" fill="#0f172a"><rect width="300" height="400" fill="#1e293b"/><circle cx="150" cy="160" r="50" fill="#334155"/><path d="M75 320c0-41.4 33.6-75 75-75s75 33.6 75 75" fill="#334155"/></svg>`;
    return new Response(svg, {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' },
    });
  }
}

/**
 * Network-First for navigations.
 * Offline: falls back to requested page shell, OR any cached shell (/, /vote).
 */
async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE);
  const url = new URL(request.url);

  try {
    const response = await fetch(request);
    if (response && (response.ok || response.redirected)) {
      // Cache under exact URL and normalized pathname
      cache.put(request.clone(), response.clone());
      cache.put(new Request(url.origin + url.pathname), response.clone());
    }
    return response;
  } catch {
    // 1. Try exact URL match
    let cached = await cache.match(request);
    if (cached) return cached;

    // 2. Try normalized pathname match
    cached = await cache.match(new Request(url.origin + url.pathname));
    if (cached) return cached;

    // 3. Cross-route fallback:
    // If requesting /vote, fall back to cached /vote or cached /
    if (url.pathname.startsWith('/vote')) {
      cached = (await cache.match(new Request(url.origin + '/vote'))) ||
               (await cache.match(new Request(url.origin + '/')));
      if (cached) return cached;
    }

    // If requesting /, fall back to cached / or cached /vote
    if (url.pathname === '/' || url.pathname === '') {
      cached = (await cache.match(new Request(url.origin + '/'))) ||
               (await cache.match(new Request(url.origin + '/vote')));
      if (cached) return cached;
    }

    // 4. Any cached page in PAGE_CACHE
    const keys = await cache.keys();
    if (keys.length > 0) {
      const anyPage = await cache.match(keys[0]);
      if (anyPage) return anyPage;
    }

    // 5. Ultimate fallback if user never loaded the site before
    return offlineFallback();
  }
}

/**
 * Handle RSC Flight requests. If offline, return 503 or empty so Next.js falls back to navigate.
 */
async function handleRscRequest(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response('', {
      status: 503,
      statusText: 'RSC Offline',
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

/**
 * Intercepts POST requests (Server Actions) when offline.
 * Returns structured JSON so client code can catch and queue locally without NetworkError.
 */
async function postOfflineIntercept(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'OFFLINE', offline: true }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

function offlineFallback() {
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mode Offline — Bilik Suara</title>
  <style>
    body {
      margin: 0; font-family: system-ui, -apple-system, sans-serif;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; background: #0f172a; color: #f8fafc;
    }
    .box { text-align: center; padding: 2rem; max-width: 400px; }
    h1 { font-size: 1.5rem; margin-bottom: .75rem; color: #f59e0b; }
    p  { font-size: .875rem; color: #94a3b8; line-height: 1.5; }
    button {
      margin-top: 1.5rem; padding: .75rem 2rem;
      background: #f59e0b; color: #0f172a; border: none; border-radius: 12px;
      font-weight: 700; cursor: pointer; font-size: .85rem;
      letter-spacing: .05em; text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="box">
    <h1>Mode Offline</h1>
    <p>Aplikasi sedang offline. Silakan muat ulang halaman setelah tersambung internet sekali untuk menyimpan cache bilik suara.</p>
    <button onclick="location.reload()">Muat Ulang</button>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
