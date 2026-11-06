// In-browser sentence-embedding model (transformers.js, ONNX/WASM). Lazy: nothing here loads until startModelLoad().
// Runs in a dedicated module worker (worker.js) so inference never blocks animation; if the worker cannot start,
// dies, or goes silent, the same engine (engine.js) is loaded on the main thread instead. Scores are identical either way.
import {MODEL} from './engine.js';
export {MODEL};

const BASE = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
const status = {state: 'idle', progress: 0, loaded: 0, total: 0, source: null, error: null, where: null};
const listeners = new Set();
const emit = () => listeners.forEach(f => f({...status}));
export const modelStatus = () => ({...status});
export const onModelStatus = f => { listeners.add(f); return () => listeners.delete(f); };

const SILENCE_MS = 45000; // a worker that sends nothing for this long is abandoned
let loading = null;
let backend = null; // {embed(texts) -> Promise<number[][]>}

// Root-relative so it means the same in a worker (whose own URL is under /assets/) and on the page. (A full http:// base made transformers.js skip the tokenizer files.)
const absBase = () => { try { return new URL(BASE, location.href).pathname; } catch { return BASE; } };
const rows = ({data, dims}) => { const [n, d] = dims; return Array.from({length: n}, (_, i) => Array.from(data.subarray(i * d, (i + 1) * d))); };
function setProgress(loaded, total) {
  status.loaded = loaded; status.total = total; status.progress = total ? loaded / total : 0; emit();
}

function mainThread() {
  return (async () => {
    // Reuse the worker bundle (it exports loadEngine and stays inert off a worker thread) instead of a second copy of transformers.js.
    const {default: bundle} = await import('./worker.js?worker&url');
    await import(/* @vite-ignore */ bundle);
    const loadEngine = globalThis.__deepstackLoadEngine;
    const files = {};
    const eng = await loadEngine(absBase(), e => {
      if (e.status !== 'progress' || !e.file || !e.total) return;
      files[e.file] = {loaded: e.loaded, total: e.total};
      const v = Object.values(files);
      setProgress(v.reduce((a, f) => a + f.loaded, 0), v.reduce((a, f) => a + f.total, 0));
    });
    status.source = eng.source; status.where = 'main';
    return {embed: async texts => rows(await eng.embed(texts))};
  })();
}

function viaWorker() {
  return new Promise((resolve, reject) => {
    if (typeof Worker === 'undefined') return reject(new Error('Web Workers unavailable'));
    let w, settled = false, timer, nextId = 1;
    const pending = new Map();
    const kill = why => {
      clearTimeout(timer);
      pending.forEach(p => p.rej(new Error(why))); pending.clear();
      try { w.terminate(); } catch { /* already gone */ }
    };
    const fail = why => { if (!settled) { settled = true; kill(why); reject(new Error(why)); } else if (backend?.worker === w) { kill(why); backend = null; } };
    const poke = () => { clearTimeout(timer); timer = setTimeout(() => fail('judge worker stopped responding'), SILENCE_MS); };
    try { w = new Worker(new URL('./worker.js', import.meta.url), {type: 'module'}); } catch (e) { return reject(e); }
    w.onerror = e => fail(`judge worker error: ${e.message || 'failed to start'}`);
    w.onmessageerror = () => fail('judge worker sent unreadable data');
    w.onmessage = ({data: m}) => {
      poke();
      if (m.type === 'progress') setProgress(m.loaded, m.total);
      else if (m.type === 'ready') {
        settled = true; clearTimeout(timer); status.source = m.source; status.where = 'worker';
        resolve({worker: w, embed: texts => new Promise((res, rej) => { const id = nextId++; pending.set(id, {res, rej}); w.postMessage({type: 'embed', id, texts}); })});
      } else if (m.type === 'error') fail(m.message);
      else if (m.type === 'result' || m.type === 'fail') {
        const p = pending.get(m.id); if (!p) return; pending.delete(m.id);
        if (m.type === 'result') p.res(rows(m)); else p.rej(new Error(m.message));
      }
      if (settled && !pending.size) clearTimeout(timer); // idle after load: nothing to watch
    };
    poke();
    w.postMessage({type: 'load', base: absBase()});
  });
}

/** Idempotent. Resolves true when the model is ready, false if loading failed (caller falls back to the lexical judge). */
export function startModelLoad() {
  return loading ||= (async () => {
    status.state = 'loading'; emit();
    navigator.storage?.persist?.().catch(() => {});
    try {
      try { if (/[?&]judge=main\b/.test(location.search)) throw new Error('forced by ?judge=main'); backend = await viaWorker(); }
      catch (err) { console.warn('Judge worker unavailable, running the judge on the main thread:', err); setProgress(0, 0); backend = await mainThread(); }
      status.state = 'ready'; status.progress = 1; emit();
      return true;
    } catch (err) {
      console.warn('Embedding judge unavailable:', err);
      status.state = 'error'; status.error = String(err?.message || err); emit();
      return false;
    }
  })();
}

/** After a failed load, forget it and try again (Daily keeps asking until the full judge arrives). */
export function retryModelLoad() {
  if (status.state === 'error') { loading = null; backend = null; }
  return startModelLoad();
}

/** Resolves true if the model is ready within `ms` (waits for an in-flight load, never starts one). */
export async function whenReady(ms) {
  if (status.state === 'ready') return true;
  if (status.state !== 'loading') return false;
  return Promise.race([loading, new Promise(r => setTimeout(() => r(false), ms))]);
}

let rescue = null; // main-thread engine, loaded only if the worker dies after it was ready
/** @returns {Promise<number[][]>} unit-length vectors */
export async function embed(texts) {
  if (backend) {
    const b = backend;
    try { return await b.embed(texts); }
    catch (err) { if (!b.worker) throw err; if (backend === b) backend = null; console.warn('Judge worker lost, continuing on the main thread:', err); }
  }
  backend = await (rescue ||= mainThread());
  return backend.embed(texts);
}
