// Load-path scheduling: heavy downloads (word list, judge model) start after the first paint, one after the other, so the
// home screen never competes with them for bandwidth or the main thread.
const raf = () => new Promise(r => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(() => r()) : setTimeout(r, 0)));
const idle = ms => new Promise(r => (typeof requestIdleCallback === 'function' ? requestIdleCallback(() => r(), {timeout: ms}) : setTimeout(r, Math.min(ms, 50))));

/** Resolves once the browser has had a chance to paint (two frames), then at the next idle moment (at most `ms` later). */
export async function afterFirstPaint(ms = 600) { await raf(); await raf(); await idle(ms); }

/** Runs `fn` after first paint. Returns the promise of its result, so callers can still await it when they need the data. */
export function deferAfterPaint(fn, ms) { return afterFirstPaint(ms).then(fn); }
