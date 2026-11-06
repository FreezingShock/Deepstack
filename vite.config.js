import {defineConfig} from 'vite';
import {readFileSync, readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
// Content hash of every file in public/data/, appended as ?v= by src/core/dataUrl.js so the service worker can serve unchanged data from cache at once.
const dataVersions = Object.fromEntries(readdirSync('public/data').filter(f => f.endsWith('.json')).map(f => [f, createHash('sha1').update(readFileSync('public/data/' + f)).digest('hex').slice(0, 10)]));
// transformers.js references the 27 MB ORT *asyncify* wasm (WebGPU/JSEP only). The judge runs the plain WASM provider from /ort/
// (see src/scorer/engine.js), so Vite's emitted copy is never fetched: leave it out of the deploy.
const dropUnusedOrt = () => ({name: 'drop-unused-ort', apply: 'build', generateBundle(_, bundle) {
  for (const k of Object.keys(bundle)) if (/ort-wasm-simd-threaded\.asyncify-.*\.wasm$/.test(k)) delete bundle[k];
}});
// Builds src/sw/sw.js to /sw.js, naming its ONNX runtime cache after the installed onnxruntime-web version.
const emitServiceWorker = () => ({name: 'emit-sw', apply: 'build', generateBundle() {
  const ort = JSON.parse(readFileSync('node_modules/onnxruntime-web/package.json', 'utf8')).version;
  this.emitFile({type: 'asset', fileName: 'sw.js', source: readFileSync('src/sw/sw.js', 'utf8').replaceAll('__ORT_VERSION__', ort).replaceAll('__DATA_PRECACHE__', JSON.stringify(['words.json', 'rooms.json', 'room-words.json'].map(f => `data/${f}?v=${dataVersions[f]}`)))});
}});
// worker.format 'es': the judge worker is a module worker that lazily imports transformers.js (code-splitting needs ES output).
// chunkSizeWarningLimit: the one chunk over 500 KB is transformers.js, fetched lazily by the judge worker only (never on first paint).
export default defineConfig({define: {__DATA_V__: JSON.stringify(dataVersions)}, server: {host: true, port: 5173}, worker: {format: 'es'}, build: {chunkSizeWarningLimit: 600}, plugins: [dropUnusedOrt(), emitServiceWorker()]});
