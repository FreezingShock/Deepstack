// Self-host the embedding model and ONNX runtime so players never contact Hugging Face or a CDN.
// Output goes to public/models/<revision>/<model id>/ and public/ort/ (both gitignored). Safe to skip: the app falls back to Hugging Face.
import {mkdir, writeFile, copyFile, access} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {MODEL} from '../src/scorer/model.js';

const FILES = ['config.json', 'tokenizer.json', 'tokenizer_config.json', 'special_tokens_map.json', 'onnx/model_quantized.onnx'];
const exists = p => access(p).then(() => true, () => false);

try {
  const root = join('public/models', MODEL.revision, MODEL.id);
  for (const f of FILES) {
    const out = join(root, f);
    if (await exists(out)) continue;
    const r = await fetch(`https://huggingface.co/${MODEL.id}/resolve/${MODEL.revision}/${f}`);
    if (!r.ok) throw new Error(`${f}: HTTP ${r.status}`);
    await mkdir(dirname(out), {recursive: true});
    await writeFile(out, Buffer.from(await r.arrayBuffer()));
    console.log('fetched', f);
  }
  await mkdir('public/ort', {recursive: true});
  // plain WASM build only: the 27 MB asyncify build is for WebGPU, which the judge does not use
  for (const f of ['ort-wasm-simd-threaded.wasm', 'ort-wasm-simd-threaded.mjs']) {
    await copyFile(join('node_modules/onnxruntime-web/dist', f), join('public/ort', f));
  }
  console.log('model and runtime ready for self-hosting');
} catch (err) {
  console.warn('fetch-model skipped (app will load from Hugging Face):', err.message);
}
