// Judge worker: loads the embedding model and runs inference off the main thread so the canvas keeps animating.
// Protocol: main -> {type:'load', base} | {type:'embed', id, texts}; worker -> {type:'progress'|'ready'|'error'|'result'|'fail', ...}
import {loadEngine} from './engine.js';

let engine = null;
self.onmessage = async ({data: m}) => {
  if (m.type === 'load') {
    try {
      const files = {};
      engine = await loadEngine(m.base, e => {
        if (e.status !== 'progress' || !e.file || !e.total) return;
        files[e.file] = {loaded: e.loaded, total: e.total};
        const v = Object.values(files);
        self.postMessage({type: 'progress', loaded: v.reduce((a, f) => a + f.loaded, 0), total: v.reduce((a, f) => a + f.total, 0)});
      });
      self.postMessage({type: 'ready', source: engine.source});
    } catch (err) { self.postMessage({type: 'error', message: String(err?.message || err)}); }
  } else if (m.type === 'embed') {
    try {
      const {data, dims} = await engine.embed(m.texts);
      self.postMessage({type: 'result', id: m.id, data, dims}, [data.buffer]);
    } catch (err) { self.postMessage({type: 'fail', id: m.id, message: String(err?.message || err)}); }
  }
};
