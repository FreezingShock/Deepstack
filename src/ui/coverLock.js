/* What holds a book shut, per tier. The ceremony table (revealRecipes.js) names the style; this file only builds the
   little pieces that coverLock.css animates away in the `cover.lock` ms before the cover swings open. */
export const COVER_STYLES = Object.freeze(['tape', 'twine', 'strap', 'clasp', 'seal', 'chain', 'seam']);

/** Markup for the closure over the cover. Decorative only, so aria-hidden; the pieces are styled by `.cvl-<style>`. */
export function coverLockHTML(style) {
  if (!COVER_STYLES.includes(style)) return '';
  return `<i class="cvl cvl-${style}" aria-hidden="true"><b class="a"></b><b class="b"></b><b class="c"></b></i>`;
}

/** Inline vars for the lock animation: it ends exactly when the cover starts to swing. */
export function coverLockVars(cover, reduce = false) {
  if (reduce) return {'--cv-ms': cover.ms + 'ms', '--cv-delay': '0ms', '--lk-ms': '0ms', '--lk-at': '0ms'};
  return {'--cv-ms': cover.ms + 'ms', '--cv-delay': cover.delay + 'ms', '--lk-ms': cover.lock + 'ms', '--lk-at': Math.max(0, cover.delay - cover.lock) + 'ms'};
}
