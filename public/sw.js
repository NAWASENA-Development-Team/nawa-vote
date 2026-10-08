// NAWA-VOTE Service Worker — voter offline shell
// Strategies:
//   /_next/static/**  → Cache-First + graceful offline fallback (never rejects FetchEvent)
//   /vote, /success   → Network-First, cache fallback (navigate requests)
//   POST /vote        → Offline intercept: return JSON error so client falls back to queue
//   everything else   → Network only (admin, API, supabase)
//
// KEY: every respondWith() path returns a Response, never throws.
// A rejected promise inside respondWith() causes browser-level errors.

const CACHE_VERSION = 'nawa-v2';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const PAGE_CACHE    = `${CACHE_VERSION}-pages`;

// Voter routes that get network-first + cache-fallback for navigate requests
const VOTER_PATHS = ['/vote', '/success'];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== PAGE_CACHE)
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

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // ── Static assets (CSS, JS chunks, fonts, media): Cache-First ─────────────
  // Covers: /_next/static/css/**, /_next/static/chunks/**, /_next/static/media/**
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirstSafe(request, STATIC_CACHE));
    return;
  }

  // ── Server Action POST to /vote: offline intercept ────────────────────────
  // castSplitVote() does a POST /_next/... or POST /vote — when offline this
  // would throw NetworkError and crash. Return a structured JSON error instead
  // so VoteWizard catches it and falls through to the local queue path.
  if (request.method === 'POST' && url.pathname.startsWith('/vote')) {
    event.respondWith(postOfflineIntercept(request));
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

  // Everything else: pass through to network (admin, API calls, etc.)
});

// ─── Strategies ───────────────────────────────────────────────────────────────

/**
 * Cache-First with safe offline fallback.
 * NEVER rejects — returns a 503 opaque response if offline and not cached.
 */
async function cacheFirstSafe(request, cacheName) {
  try {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Try network; if it works, cache it for next time
    const response = await fetch(request);
    if (response && (response.ok || response.status === 0)) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline and not cached — return empty 503 so the browser doesn't crash.
    // Cached page HTML is still served; only un-cached assets return 503.
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
 * Network-First for voter page navigations.
 * On network failure, serves cached page shell.
 */
async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE);

  try {
    const response = await fetch(request);

    if (response && (response.ok || response.redirected)) {
      // Normalise cache key for /vote (strip query params so one entry covers all)
      const url = new URL(request.url);
      const cacheKey = url.pathname.startsWith('/vote')
        ? new Request(url.origin + '/vote')
        : request.clone();
      cache.put(cacheKey, response.clone());
    }

    return response;
  } catch {
    // Network unavailable — try cache
    const url = new URL(request.url);
    const cached =
      (await cache.match(request)) ||
      (await cache.match(new Request(url.origin + url.pathname)));

    if (cached) return cached;

    // Nothing cached yet — show a friendly standalone offline page
    return offlineFallback();
  }
}

/**
 * Intercepts POST /vote requests (Next.js server actions) when offline.
 * Returns a JSON error response that VoteWizard can detect and re-route
 * to the local queue instead of crashing.
 */
async function postOfflineIntercept(request) {
  // If we have connectivity, let the request through normally
  try {
    // Quick connectivity check: HEAD the SW script itself
    await fetch('/sw.js', { method: 'HEAD', cache: 'no-store' });
    // Online — pass original request through
    return fetch(request);
  } catch {
    // Offline — return a structured error so VoteWizard can catch and queue
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
    <h1>Koneksi Terputus</h1>
    <p>Buka halaman ini sekali saat online agar tersimpan untuk mode offline.</p>
    <button onclick="location.reload()">Coba Lagi</button>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
