// transformers.js asks for the same model file from more than one place while it builds the judge's session, and each ask
// was a full download: on a cold visit the 23 MB model crossed the phone's link three times, the copies sharing the
// bandwidth, so the judge came up about three times later than it needed to. This wraps the loader's fetch so that every
// GET of a model file is one download. Each caller gets its own copy of the same response stream, so the bytes arrive
// as they always did (progress still reports while the file streams in). Ranged reads, HEAD, POST, failed responses and
// files from other origins go straight to the network, unchanged.
const SHARED = /\/models\/|huggingface\.co\/|\.hf\.co\//;

/** @param {(input: any, init?: any) => Promise<Response>} fetchFn  @returns {(input: any, init?: any) => Promise<Response>} */
export function shareModelDownloads(fetchFn) {
  const files = new Map(); // url -> Promise<Response> (headers in; the body is only read through clones)
  const shared = async (input, init) => {
    const url = String(input?.url ?? input);
    const method = (init?.method || input?.method || 'GET').toUpperCase();
    const headers = new Headers(init?.headers || input?.headers || undefined);
    if (method !== 'GET' || !SHARED.test(url) || headers.has('range')) return fetchFn(input, init);
    if (!files.has(url)) {
      const first = Promise.resolve(fetchFn(input, init)).catch(err => { files.delete(url); throw err; });
      files.set(url, first);
    }
    const r = await files.get(url);
    if (!r.ok) { files.delete(url); return r; }
    return r.clone(); // each caller reads its own tee of the one download
  };
  /** Forget the held responses once the session is built: the copies in the browser's own cache are what a later visit reads. */
  shared.release = () => files.clear();
  return shared;
}
