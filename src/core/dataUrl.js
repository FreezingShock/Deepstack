// URL of a file in public/data/. Production builds append ?v=<content hash> (vite.config.js defines __DATA_V__), so a
// changed file is a new URL and an unchanged one can be served from the service worker's cache without asking the network
// (src/sw/sw.js). Without the define (tests, other tooling) it is the plain path.
export const dataUrl = name => {
  const base = (import.meta.env?.BASE_URL || '/') + 'data/' + name;
  const v = typeof __DATA_V__ === 'object' && __DATA_V__ ? __DATA_V__[name] : null;
  return v ? `${base}?v=${v}` : base;
};
