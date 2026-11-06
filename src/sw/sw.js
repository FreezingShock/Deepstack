/* Deepstack service worker (built to /sw.js by vite.config.js, which fills in __ORT_VERSION__).
   Goal: repeat visits start from disk, and the game opens offline once it has been played online.
   - hashed /assets/*            cache-first (a new build gets new file names, so they never go stale)
   - /ort/*                      cache-first, cache name carries the onnxruntime version (the .mjs and .wasm must match)
   - /fonts/*                    cache-first (unhashed names: bump FONTS below when scripts/fetch-fonts.mjs changes a file)
   - /data/*?v=<hash>            cache-first: the hash is the file's content (vite.config.js, src/core/dataUrl.js), so a cached copy is never stale and a slow
                                 network can't stall a room switch or a first answer; other cached versions of the same file are dropped
   - /data/* without ?v          network-first with a 4 s timeout, cache as fallback (tools and old pages)
   - page navigations            network-first with a 3 s timeout, cache as fallback (index.html is tiny; a fresh deploy shows at once)
   The embedding model is NOT cached here: transformers.js keeps it in its own Cache API store. */
const ASSETS = 'ds-assets-v1', ORT = 'ds-ort-__ORT_VERSION__', DATA = 'ds-data-v1', FONTS = 'ds-fonts-v1', PAGES = 'ds-pages-v1';
const KEEP = [ASSETS, ORT, DATA, FONTS, PAGES];

self.addEventListener('install', () => self.skipWaiting());
// The files the page waits for before a run or a room switch (vite.config.js fills in their hashed names). The page fetched them
// before this worker existed, so they are not in the cache yet: fetch them now, so the next visit never waits on the network for them.
const PRECACHE = JSON.parse('__DATA_PRECACHE__');
async function precacheData() {
  try {
    const cache = await caches.open(DATA);
    for (const rel of PRECACHE) { const req = new Request(new URL(rel, self.registration.scope).href); if (!(await cache.match(req))) await hashedData(req, new URL(req.url)); }
  } catch { /* offline or blocked: the page fetches them on demand */ }
}
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('ds-') && !KEEP.includes(k)) await caches.delete(k);
  await self.clients.claim();
  await precacheData();
})()));

const withTimeout = (p, ms) => new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('timeout')), ms); p.then(v => { clearTimeout(t); res(v); }, e => { clearTimeout(t); rej(e); }); });
const keep = async (cache, req, res) => { if (res && res.ok && res.type === 'basic') await cache.put(req, res.clone()).catch(() => {}); return res; };

async function cacheFirst(name, req) {
  const cache = await caches.open(name), hit = await cache.match(req);
  return hit || keep(cache, req, await fetch(req));
}
async function networkFirst(name, req, ms, key = req) {
  const cache = await caches.open(name);
  try { return await keep(cache, key, await withTimeout(fetch(req), ms)); }
  catch (err) { const hit = await cache.match(key); if (hit) return hit; throw err; }
}

/** A hashed data file: the cached copy is exactly the file the page asked for. On a miss, fetch it, keep it, and forget older versions of that file. */
async function hashedData(req, url) {
  const cache = await caches.open(DATA), hit = await cache.match(req);
  if (hit) return hit;
  const res = await keep(cache, req, await fetch(req));
  if (res && res.ok) for (const old of await cache.keys()) { const u = new URL(old.url); if (u.pathname === url.pathname && u.search !== url.search) await cache.delete(old); }
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || req.headers.has('range')) return;
  const base = new URL(self.registration.scope).pathname, path = url.pathname.slice(base.length - 1); // '/assets/x.js'
  if (req.mode === 'navigate') return e.respondWith(networkFirst(PAGES, req, 3000, new Request(new URL(base, location.origin))));
  if (path.startsWith('/assets/')) return e.respondWith(cacheFirst(ASSETS, req));
  if (path.startsWith('/ort/')) return e.respondWith(cacheFirst(ORT, req));
  if (path.startsWith('/fonts/')) return e.respondWith(cacheFirst(FONTS, req));
  if (path.startsWith('/data/')) return e.respondWith(url.searchParams.has('v') ? hashedData(req, url) : networkFirst(DATA, req, 4000));
});
