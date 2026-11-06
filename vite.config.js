import {defineConfig} from 'vite';
import {readFileSync} from 'node:fs';
// transformers.js references the 27 MB ORT *asyncify* wasm (WebGPU/JSEP only). The judge runs the plain WASM provider from /ort/
// (see src/scorer/engine.js), so Vite's emitted copy is never fetched: leave it out of the deploy.
const dropUnusedOrt = () => ({name: 'drop-unused-ort', apply: 'build', generateBundle(_, bundle) {
  for (const k of Object.keys(bundle)) if (/ort-wasm-simd-threaded\.asyncify-.*\.wasm$/.test(k)) delete bundle[k];
}});
// Builds src/sw/sw.js to /sw.js, naming its ONNX runtime cache after the installed onnxruntime-web version.
const emitServiceWorker = () => ({name: 'emit-sw', apply: 'build', generateBundle() {
  const ort = JSON.parse(readFileSync('node_modules/onnxruntime-web/package.json', 'utf8')).version;
  this.emitFile({type: 'asset', fileName: 'sw.js', source: readFileSync('src/sw/sw.js', 'utf8').replaceAll('__ORT_VERSION__', ort)});
}});
// worker.format 'es': the judge worker is a module worker that lazily imports transformers.js (code-splitting needs ES output).
// chunkSizeWarningLimit: the one chunk over 500 KB is transformers.js, fetched lazily by the judge worker only (never on first paint).
export default defineConfig({server: {host: true, port: 5173}, worker: {format: 'es'}, build: {chunkSizeWarningLimit: 600}, plugins: [dropUnusedOrt(), emitServiceWorker()]});
