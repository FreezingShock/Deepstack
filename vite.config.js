import {defineConfig} from 'vite';
// worker.format 'es': the judge worker is a module worker that lazily imports transformers.js (code-splitting needs ES output).
export default defineConfig({server: {host: true, port: 5173}, worker: {format: 'es'}});
