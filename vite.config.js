import {defineConfig} from 'vite';
// worker.format 'es': the judge worker is a module worker that lazily imports transformers.js (code-splitting needs ES output).
// transformers.js references the 27 MB ORT *asyncify* wasm (WebGPU/JSEP only). The judge runs the plain WASM provider from /ort/
// (see src/scorer/engine.js), so Vite's emitted copy is never fetched: leave it out of the deploy.
const dropUnusedOrt = () => ({name: 'drop-unused-ort', apply: 'build', generateBundle(_, bundle) {
  for (const k of Object.keys(bundle)) if (/ort-wasm-simd-threaded\.asyncify-.*\.wasm$/.test(k)) delete bundle[k];
}});
export default defineConfig({server: {host: true, port: 5173}, worker: {format: 'es'}, plugins: [dropUnusedOrt()]});
