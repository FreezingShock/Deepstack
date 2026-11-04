// The actual model loader/runner. Runs inside the judge worker (worker.js) or, as a fallback, on the main thread (model.js).
// Weights come from <base>models/<revision>/ when self-hosted (npm run fetch:model), else from Hugging Face at a pinned revision.
export const MODEL = {id: 'Xenova/all-MiniLM-L6-v2', revision: '751bff37182d3f1213fa05d7196b954e230abad9', dtype: 'q8'};

async function hasSelfHosted(base) {
  try {
    const r = await fetch(`${base}models/${MODEL.revision}/${MODEL.id}/config.json`, {method: 'HEAD'});
    return r.ok && /json/.test(r.headers.get('content-type') || '');
  } catch { return false; }
}

async function selfHostedOrt(env, base) { // keep the ONNX runtime off third-party CDNs when we ship it
  try {
    const r = await fetch(`${base}ort/ort-wasm-simd-threaded.wasm`, {method: 'HEAD'});
    if (!r.ok || /html/.test(r.headers.get('content-type') || '')) return;
    const p = env.backends.onnx?.wasm?.wasmPaths;
    if (p && typeof p === 'object') {
      const local = u => `${base}ort/${u.split('/').pop()}`;
      env.backends.onnx.wasm.wasmPaths = {mjs: local(p.mjs), wasm: local(p.wasm)};
    }
  } catch { /* stay on defaults */ }
}

async function dropOldVersions() {
  try {
    const c = await caches.open('transformers-cache');
    for (const req of await c.keys()) {
      if (req.url.includes(MODEL.id) && !req.url.includes(MODEL.revision)) await c.delete(req);
    }
  } catch { /* best effort */ }
}

/** @param {string} base absolute URL ending in '/'  @param {(e:object)=>void} progress transformers.js progress events
 *  @returns {Promise<{source:string, embed:(texts:string[])=>Promise<{data:Float32Array,dims:number[]}>}>} */
export async function loadEngine(base, progress) {
  const {pipeline, env} = await import('@huggingface/transformers');
  const local = await hasSelfHosted(base);
  if (local) { env.allowLocalModels = true; env.allowRemoteModels = false; env.localModelPath = `${base}models/${MODEL.revision}/`; }
  await selfHostedOrt(env, base);
  // Single-threaded and no ORT proxy worker: nested workers need cross-origin isolation, and the judge already has its own thread.
  if (env.backends.onnx?.wasm) { env.backends.onnx.wasm.numThreads = 1; env.backends.onnx.wasm.proxy = false; }
  const extractor = await pipeline('feature-extraction', MODEL.id, {dtype: MODEL.dtype, device: 'wasm', revision: MODEL.revision, progress_callback: progress});
  dropOldVersions();
  return {
    source: local ? 'self-hosted' : 'huggingface',
    async embed(texts) { const t = await extractor(texts, {pooling: 'mean', normalize: true}); return {data: t.data, dims: t.dims}; },
  };
}
