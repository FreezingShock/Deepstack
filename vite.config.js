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
const SHELL_FONTS = ['anthropic-serif/Text-Regular.woff2', 'anthropic-serif/Text-RegularItalic.woff2', 'anthropic-serif/Text-Medium.woff2', 'anthropic-serif/Text-Semibold.woff2',
  'anthropic-serif/Display-Regular.woff2', 'anthropic-serif/Display-RegularItalic.woff2', 'anthropic-serif/Display-Medium.woff2',
  'google/Cinzel-normal-500.woff2', 'google/FuzzyBubbles-normal-400.woff2', 'google/FuzzyBubbles-normal-700.woff2', 'google/IMFellEnglish-normal-400.woff2', 'google/Newsreader-normal-400.woff2', 'google/SourceSans3-normal-400.woff2', 'google/SpecialElite-normal-400.woff2'];
// Builds src/sw/sw.js to /sw.js, naming its ONNX runtime cache after the installed onnxruntime-web version.
const emitServiceWorker = () => ({name: 'emit-sw', apply: 'build', generateBundle(_, bundle) {
  const ort = JSON.parse(readFileSync('node_modules/onnxruntime-web/package.json', 'utf8')).version;
  // The app shell: the page's own JS and CSS (not the judge's transformers.js, which only loads with the model) and the fonts, so one visit online is enough for the game to open offline.
  const shell = [...Object.keys(bundle).filter(f => /^assets\/[^/]*\.(js|css)$/.test(f) && !/transformers/.test(f)).map(f => '/' + f),
    // the faces the home screen and the idle prewarm (src/ui/prewarm.js) draw; the other weights are cached the first time a screen asks for them.
    // Precaching all 33 faces cost a first visit ~0.7 MB more, downloaded while the judge model was loading.
    ...SHELL_FONTS.map(f => `/fonts/${f}`),
    // the install artwork and manifest: the browser asks for them offline too (favicon, install prompt); launch images stay with the OS
    ...readdirSync('public/icons').filter(f => /\.(png|svg)$/.test(f)).map(f => `/icons/${f}`), '/manifest.webmanifest'];
  this.emitFile({type: 'asset', fileName: 'sw.js', source: readFileSync('src/sw/sw.js', 'utf8').replaceAll('__ORT_VERSION__', ort).replaceAll('__DATA_PRECACHE__', JSON.stringify(['words.json', 'rooms.json', 'room-words.json'].map(f => `data/${f}?v=${dataVersions[f]}`))).replaceAll('__APP_SHELL__', JSON.stringify(shell))});
}});
// worker.format 'es': the judge worker is a module worker that lazily imports transformers.js (code-splitting needs ES output).
// chunkSizeWarningLimit: the one chunk over 500 KB is transformers.js, fetched lazily by the judge worker only (never on first paint).
export default defineConfig({define: {__DATA_V__: JSON.stringify(dataVersions)}, server: {host: true, port: 5173}, worker: {format: 'es'}, build: {chunkSizeWarningLimit: 600}, plugins: [dropUnusedOrt(), emitServiceWorker()]});
