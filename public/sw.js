// NAWA-VOTE Service Worker (v7) — Unified Offline Kiosk Booth
// Features:
//   - Active ping route (/api/ping) bypasses SW to ensure instant, real offline detection
//   - Pre-caches unified root kiosk shell ('/') and all JS/CSS static bundles on install
//   - Matches cache with { ignoreSearch: true, ignoreVary: true } to eliminate Vary / F5 bypasses
//   - Intelligent CSS fallback: never serves blank CSS that strips colors; falls back to cached stylesheets
//   - Safe 200 OK fallbacks for missing assets and images (prevents NS_ERROR in Firefox)
//   - Intercepts POST server actions when offline to return structured JSON
//   - Network-First for navigations, instantly falling back to cached kiosk shell
//   - Individual image caching using exact query parameters

const CACHE_VERSION = 'nawa-v7';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const PAGE_CACHE    = `${CACHE_VERSION}-pages`;
const IMAGE_CACHE   = `${CACHE_VERSION}-images`;

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const pageCache = await caches.open(PAGE_CACHE);
      const staticCache = await caches.open(STATIC_CACHE);

      try {
        // Fetch the unified root kiosk shell
        const res = await fetch('/', { cache: 'no-cache' });
        if (res && res.status === 200) {
          const html = await res.clone().text();

          // Pre-cache clean 200 OK shells
          await pageCache.put('/', res.clone());
          await pageCache.put('/vote', res.clone());
          await pageCache.put('/success', res.clone());

          // Extract and pre-cache all JS chunks and CSS stylesheets referenced in HTML
          const assetMatches = html.match(/\/(_next\/static\/[a-zA-Z0-9_\-\.\/\(\)]+)/g) || [];
          const uniqueAssets = Array.from(new Set(assetMatches));

          await Promise.allSettled(
            uniqueAssets.map(async (assetUrl) => {
              try {
                const aRes = await fetch(assetUrl);
                if (aRes && aRes.ok) {
                  await staticCache.put(assetUrl, aRes);
                }
              } catch {
                // non-fatal asset fetch
              }
            })
          );
        }
      } catch {
        // non-fatal pre-cache failure
      }

      try {
        const manifest = await fetch('/manifest.json');
        if (manifest && manifest.ok) await staticCache.put('/manifest.json', manifest);
      } catch {}
    })()
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

  // 0. Active Ping probe: ALWAYS bypass SW so active offline probe hits real network
  if (url.pathname === '/api/ping') {
    return;
  }

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

  // 3. Server Actions / POST: offline intercept
  if (request.method === 'POST') {
    event.respondWith(postOfflineIntercept(request));
    return;
  }

  // 4. Page navigations (including F5 / reload): Network-First with safe shell fallback
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
 * Cache-First with safe string-based matching so F5 / reload cache flags don't bypass cache.
 * Intelligent CSS fallback: if new CSS bundle hash isn't cached yet, falls back to any cached
 * CSS stylesheet so the UI color scheme and styles are NEVER wiped clean.
 */
async function cacheFirstSafe(request, cacheName) {
  const url = new URL(request.url);
  const cache = await caches.open(cacheName);
  const matchOpts = { ignoreSearch: true, ignoreVary: true };

  // 1. Match by URL string or Request object
  let cached =
    (await cache.match(request.url, matchOpts)) ||
    (await cache.match(url.pathname, matchOpts)) ||
    (await cache.match(request, matchOpts));
  if (cached) return cached;

  // 2. Try network if online
  try {
    const response = await fetch(request);
    if (response && (response.ok || response.status === 200)) {
      cache.put(request.url, response.clone());
      cache.put(url.pathname, response.clone());
    }
    return response;
  } catch {
    // 3. Re-check cache across all scopes
    cached =
      (await cache.match(request.url, matchOpts)) ||
      (await cache.match(url.pathname, matchOpts)) ||
      (await caches.match(request.url, matchOpts));
    if (cached) return cached;

    // 4. Intelligent CSS Fallback: if exact CSS chunk hash is missing, return ANY cached CSS file
    // so Tailwind styling and color scheme remain intact instead of receiving 0 bytes!
    const isCss = url.pathname.endsWith('.css');
    if (isCss) {
      const keys = await cache.keys();
      for (const k of keys) {
        if (k.url.includes('.css')) {
          const fallbackCss = await cache.match(k);
          if (fallbackCss) return fallbackCss;
        }
      }
    }

    // 5. Return valid 200 empty response as last resort so browser doesn't throw SyntaxError
    const isJs = url.pathname.endsWith('.js');
    return new Response('', {
      status: 200,
      headers: {
        'Content-Type': isCss
          ? 'text/css'
          : isJs
          ? 'application/javascript'
          : 'text/plain',
      },
    });
  }
}

/**
 * Image Cache: Cache-First with strict URL matching.
 * Preserves query string (?url=...&w=...&q=...) so each candidate's photo is cached individually.
 * NEVER uses ignoreSearch or url.pathname matching for images.
 * If offline and un-cached, returns an SVG placeholder instead of throwing.
 */
async function cacheImage(request) {
  const cache = await caches.open(IMAGE_CACHE);

  // Exact request.url match (NEVER ignoreSearch, NEVER url.pathname)
  let cached = await cache.match(request.url);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === 'opaque')) {
      cache.put(request.url, response.clone());
    }
    return response;
  } catch {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400" fill="#0f172a"><rect width="300" height="400" fill="#1e293b"/><circle cx="150" cy="160" r="50" fill="#334155"/><path d="M75 320c0-41.4 33.6-75 75-75s75 33.6 75 75" fill="#334155"/></svg>`;
    return new Response(svg, {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' },
    });
  }
}

/**
 * Network-First for navigations.
 * Caches clean 200 OK responses.
 * On offline refresh (F5), matches with ignoreVary: true so reload mode does not bypass cache.
 */
async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE);
  const url = new URL(request.url);
  const matchOpts = { ignoreSearch: true, ignoreVary: true };

  try {
    const response = await fetch(request);
    // ONLY cache clean 200 OK responses, NEVER 3xx redirects!
    if (response && response.status === 200 && !response.redirected) {
      cache.put('/', response.clone());
      cache.put(url.pathname, response.clone());
      cache.put(request.url, response.clone());
    }
    return response;
  } catch {
    // Network failed (OFFLINE or F5 refresh while offline):
    let cached =
      (await cache.match(url.pathname, matchOpts)) ||
      (await cache.match(request.url, matchOpts)) ||
      (await cache.match('/', matchOpts)) ||
      (await cache.match('/vote', matchOpts));

    if (cached) return cached;

    // Fallback to ANY 200 OK entry in PAGE_CACHE
    const keys = await cache.keys();
    for (const key of keys) {
      const entry = await cache.match(key, matchOpts);
      if (entry && entry.status === 200) {
        return entry;
      }
    }

    return offlineFallback();
  }
}

/**
 * Handle RSC Flight requests. If offline, return 503 so Next.js router gracefully falls back.
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
