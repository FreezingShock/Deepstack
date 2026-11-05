// Registers the service worker (src/sw/sw.js, built to /sw.js) after the page has loaded and gone idle, so it never competes with first paint.
// Production builds only; add ?nosw to a URL to skip it (and unregister any existing one) when debugging.
const off = typeof location !== 'undefined' && /[?&]nosw\b/.test(location.search);
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && !off && import.meta.env?.PROD) {
  const go = () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {scope: import.meta.env.BASE_URL}).catch(() => {});
  const later = () => (window.requestIdleCallback ? requestIdleCallback(go, {timeout: 4000}) : setTimeout(go, 2000));
  document.readyState === 'complete' ? later() : addEventListener('load', later, {once: true});
} else if (off && typeof navigator !== 'undefined' && navigator.serviceWorker) {
  navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => {});
}
