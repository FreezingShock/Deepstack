// In-browser sentence-embedding model (transformers.js, ONNX/WASM). Lazy: nothing here loads until startModelLoad().
// Weights come from /models/<revision>/ when self-hosted (npm run fetch:model), else from Hugging Face at a pinned revision.
export const MODEL = {id: 'Xenova/all-MiniLM-L6-v2', revision: '751bff37182d3f1213fa05d7196b954e230abad9', dtype: 'q8'};

const BASE = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
const status = {state: 'idle', progress: 0, loaded: 0, total: 0, source: null, error: null};
const listeners = new Set();
const emit = () => listeners.forEach(f => f({...status}));
export const modelStatus = () => ({...status});
export const onModelStatus = f => { listeners.add(f); return () => listeners.delete(f); };

let extractor = null, loading = null;

async function hasSelfHosted() {
  try {
    const r = await fetch(`${BASE}models/${MODEL.revision}/${MODEL.id}/config.json`, {method: 'HEAD'});
    return r.ok && /json/.test(r.headers.get('content-type') || '');
  } catch { return false; }
}

async function selfHostedOrt(env) { // keep the ONNX runtime off third-party CDNs when we ship it
  try {
    const r = await fetch(`${BASE}ort/ort-wasm-simd-threaded.wasm`, {method: 'HEAD'});
    if (!r.ok || /html/.test(r.headers.get('content-type') || '')) return;
    const p = env.backends.onnx?.wasm?.wasmPaths;
    if (p && typeof p === 'object') {
      const local = u => `${BASE}ort/${u.split('/').pop()}`;
      env.backends.onnx.wasm.wasmPaths = {mjs: local(p.mjs), wasm: local(p.wasm)};
    }
  } catch { /* stay on defaults */ }
}

function onProgress(files) {
  return e => {
    if (e.status !== 'progress' || !e.file || !e.total) return;
    files[e.file] = {loaded: e.loaded, total: e.total};
    const v = Object.values(files);
    status.loaded = v.reduce((a, f) => a + f.loaded, 0);
    status.total = v.reduce((a, f) => a + f.total, 0);
    status.progress = status.total ? status.loaded / status.total : 0;
    emit();
  };
}

async function dropOldVersions() {
  try {
    const c = await caches.open('transformers-cache');
    for (const req of await c.keys()) {
      if (req.url.includes(MODEL.id) && !req.url.includes(MODEL.revision)) await c.delete(req);
    }
  } catch { /* best effort */ }
}

/** Idempotent. Resolves true when the model is ready, false if loading failed (caller falls back to the lexical judge). */
export function startModelLoad() {
  return loading ||= (async () => {
    status.state = 'loading'; emit();
    try {
      navigator.storage?.persist?.().catch(() => {});
      const {pipeline, env} = await import('@huggingface/transformers');
      const local = await hasSelfHosted();
      status.source = local ? 'self-hosted' : 'huggingface';
      if (local) { env.allowLocalModels = true; env.allowRemoteModels = false; env.localModelPath = `${BASE}models/${MODEL.revision}/`; }
      await selfHostedOrt(env);
      extractor = await pipeline('feature-extraction', MODEL.id, {
        dtype: MODEL.dtype, device: 'wasm', revision: MODEL.revision, progress_callback: onProgress({}),
      });
      status.state = 'ready'; status.progress = 1; emit();
      dropOldVersions();
      return true;
    } catch (err) {
      console.warn('Embedding judge unavailable:', err);
      status.state = 'error'; status.error = String(err?.message || err); emit();
      return false;
    }
  })();
}

/** Resolves true if the model is ready within `ms` (waits for an in-flight load, never starts one). */
export async function whenReady(ms) {
  if (status.state === 'ready') return true;
  if (status.state !== 'loading') return false;
  return Promise.race([loading, new Promise(r => setTimeout(() => r(false), ms))]);
}

/** @returns {Promise<number[][]>} unit-length vectors */
export async function embed(texts) {
  const out = await extractor(texts, {pooling: 'mean', normalize: true});
  return out.tolist();
}
