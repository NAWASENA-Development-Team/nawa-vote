// NAWA-VOTE Service Worker — voter offline shell
// Strategy:
//   /_next/static/** → Cache-First (immutable hashed chunks)
//   /vote, /success  → Network-First, cache fallback
//   everything else  → Network only (admin, API, supabase)
//
// The SW intercepts at browser level, before any server middleware runs.
// When offline, cached voter pages are served so the voting session stays alive.

const CACHE_VERSION = 'nawa-v1';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const PAGE_CACHE    = `${CACHE_VERSION}-pages`;

// Voter routes that get a network-first + cache-fallback treatment
const VOTER_PATHS = ['/vote', '/success'];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  // Skip waiting so the new SW activates immediately on update
  self.skipWaiting();
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== PAGE_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // ── Static assets: Cache-First ─────────────────────────────────────────────
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ── Voter page navigations: Network-First, cache fallback ──────────────────
  const isVoterNav =
    request.mode === 'navigate' &&
    VOTER_PATHS.some((p) => url.pathname.startsWith(p));

  if (isVoterNav) {
    event.respondWith(networkFirstPage(request));
    return;
  }

  // ── Everything else: network only (don't intercept) ───────────────────────
});

// ─── Strategies ───────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE);

  try {
    const response = await fetch(request);

    if (response.ok || response.redirected) {
      // Cache the fresh response for offline fallback
      // We cache under a normalized key (strip query for /vote, keep for /success)
      const url = new URL(request.url);
      const cacheKey = url.pathname.startsWith('/vote')
        ? new Request(url.origin + '/vote')
        : request;

      cache.put(cacheKey, response.clone());
    }

    return response;
  } catch {
    // Network failed — serve cached shell
    const url = new URL(request.url);

    // Try exact match first, then normalized path
    const cached =
      (await cache.match(request)) ||
      (await cache.match(new Request(url.origin + url.pathname)));

    if (cached) return cached;

    // Last resort: return a minimal offline notice page
    return offlineFallback();
  }
}

function offlineFallback() {
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Memuat...</title>
  <style>
    body {
      margin: 0; font-family: sans-serif; display: flex;
      align-items: center; justify-content: center;
      min-height: 100vh; background: #fefce8; color: #713f12;
    }
    .box { text-align: center; padding: 2rem; max-width: 360px; }
    h1 { font-size: 1.5rem; margin-bottom: .5rem; }
    p  { font-size: .9rem; opacity: .75; }
    button {
      margin-top: 1.5rem; padding: .75rem 2rem;
      background: #f59e0b; border: none; border-radius: 12px;
      font-weight: 700; cursor: pointer; font-size: .85rem;
      letter-spacing: .05em; text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="box">
    <h1>Memuat halaman…</h1>
    <p>Halaman belum tersimpan di cache. Buka halaman ini sekali saat online agar tersimpan untuk mode offline.</p>
    <button onclick="location.reload()">Coba Lagi</button>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
