/* Deepstack service worker (built to /sw.js by vite.config.js, which fills in __ORT_VERSION__).
   Goal: repeat visits start from disk, and the game opens offline once it has been played online.
   - hashed /assets/*            cache-first (a new build gets new file names, so they never go stale)
   - /ort/*                      cache-first, cache name carries the onnxruntime version (the .mjs and .wasm must match)
   - /fonts/*                    cache-first (unhashed names: bump FONTS below when scripts/fetch-fonts.mjs changes a file)
   - /data/*                     network-first with a 4 s timeout, cache as fallback (the word pool must match everyone else's)
   - page navigations            network-first with a 3 s timeout, cache as fallback (index.html is tiny; a fresh deploy shows at once)
   The embedding model is NOT cached here: transformers.js keeps it in its own Cache API store. */
const ASSETS = 'ds-assets-v1', ORT = 'ds-ort-__ORT_VERSION__', DATA = 'ds-data-v1', FONTS = 'ds-fonts-v1', PAGES = 'ds-pages-v1';
const KEEP = [ASSETS, ORT, DATA, FONTS, PAGES];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('ds-') && !KEEP.includes(k)) await caches.delete(k);
  await self.clients.claim();
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

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || req.headers.has('range')) return;
  const base = new URL(self.registration.scope).pathname, path = url.pathname.slice(base.length - 1); // '/assets/x.js'
  if (req.mode === 'navigate') return e.respondWith(networkFirst(PAGES, req, 3000, new Request(new URL(base, location.origin))));
  if (path.startsWith('/assets/')) return e.respondWith(cacheFirst(ASSETS, req));
  if (path.startsWith('/ort/')) return e.respondWith(cacheFirst(ORT, req));
  if (path.startsWith('/fonts/')) return e.respondWith(cacheFirst(FONTS, req));
  if (path.startsWith('/data/')) return e.respondWith(networkFirst(DATA, req, 4000));
});
