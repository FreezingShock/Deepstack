// The judge's model loader asks for each model file more than once; shareModelDownloads() must turn that into one download per file.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {shareModelDownloads} from '../src/scorer/fileShare.js';

const MODEL_URL = 'http://localhost/models/rev/Xenova/all-MiniLM-L6-v2/onnx/model_quantized.onnx';
const bytes = new Uint8Array(1000).map((_, i) => i % 251);

// A fake network: counts calls, answers after a tick so concurrent callers really overlap.
function network(routes = {}) {
  const calls = [];
  const fn = async (input, init) => {
    const url = String(input?.url ?? input);
    calls.push({url, method: init?.method || 'GET', range: new Headers(init?.headers || undefined).get('range')});
    await new Promise(r => setTimeout(r, 5));
    const route = routes[url];
    if (route?.status && route.status !== 200) return new Response('nope', {status: route.status});
    return new Response(route?.body ?? bytes, {status: 200, headers: {'content-type': 'application/octet-stream'}});
  };
  return {fn, calls};
}

test('three concurrent asks for one model file cost one download, and each caller gets the full bytes', async () => {
  const net = network();
  const get = shareModelDownloads(net.fn);
  const got = await Promise.all([get(MODEL_URL), get(MODEL_URL), get(MODEL_URL)]);
  assert.equal(net.calls.filter(c => c.url === MODEL_URL).length, 1);
  for (const r of got) {
    assert.equal(r.status, 200);
    assert.deepEqual(new Uint8Array(await r.arrayBuffer()), bytes);
  }
});

test('a tokenizer and the model are separate downloads', async () => {
  const net = network();
  const get = shareModelDownloads(net.fn);
  const tok = MODEL_URL.replace('model_quantized.onnx', '../tokenizer.json');
  await Promise.all([get(MODEL_URL), get(tok), get(tok), get(MODEL_URL)]);
  assert.equal(net.calls.length, 2);
});

test('ranged reads, HEAD and POST go to the network every time, untouched', async () => {
  const net = network();
  const get = shareModelDownloads(net.fn);
  await get(MODEL_URL, {headers: {Range: 'bytes=0-0'}});
  await get(MODEL_URL, {headers: {Range: 'bytes=0-0'}});
  await get(MODEL_URL, {method: 'HEAD'});
  await get(MODEL_URL, {method: 'POST'});
  assert.equal(net.calls.length, 4);
  assert.equal(net.calls[0].range, 'bytes=0-0');
});

test('files from other origins and other paths are not shared', async () => {
  const net = network();
  const get = shareModelDownloads(net.fn);
  await Promise.all([get('http://localhost/data/words.json?v=1'), get('http://localhost/data/words.json?v=1')]);
  assert.equal(net.calls.length, 2);
});

test('a failed download is not remembered: the next ask goes to the network again', async () => {
  const net = network({[MODEL_URL]: {status: 404}});
  const get = shareModelDownloads(net.fn);
  const first = await get(MODEL_URL);
  assert.equal(first.status, 404);
  const second = await get(MODEL_URL);
  assert.equal(second.status, 404);
  assert.equal(net.calls.length, 2);
});

test('a network error is passed on, and the next ask tries again', async () => {
  let n = 0;
  const get = shareModelDownloads(async () => { if (n++ === 0) throw new TypeError('offline'); return new Response(bytes); });
  await assert.rejects(get(MODEL_URL), /offline/);
  const r = await get(MODEL_URL);
  assert.deepEqual(new Uint8Array(await r.arrayBuffer()), bytes);
  assert.equal(n, 2);
});

test('release() forgets the download, so a later ask downloads again (the browser cache is what repeat visits read)', async () => {
  const net = network();
  const get = shareModelDownloads(net.fn);
  await (await get(MODEL_URL)).arrayBuffer();
  get.release();
  await (await get(MODEL_URL)).arrayBuffer();
  assert.equal(net.calls.length, 2);
});

test('callers read the body as a stream: the first one sees chunks before the file is complete', async () => {
  // a body that arrives in two parts; the first chunk must be readable while the second has not been sent yet
  let release;
  const gate = new Promise(r => { release = r; });
  const fn = async () => new Response(new ReadableStream({async start(c) { c.enqueue(bytes.slice(0, 500)); await gate; c.enqueue(bytes.slice(500)); c.close(); }}));
  const get = shareModelDownloads(fn);
  const reader = (await get(MODEL_URL)).body.getReader();
  const first = await reader.read();
  assert.equal(first.value.length, 500);
  release();
  let total = first.value.length;
  for (;;) { const {done, value} = await reader.read(); if (done) break; total += value.length; }
  assert.equal(total, 1000);
});
