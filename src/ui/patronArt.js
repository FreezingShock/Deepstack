/* Patron busts: one small inked silhouette per patron, drawn in SVG so it scales with the page. Colours come from
   patrons.css (the room's light as --pt-rgb, the paper and ink tokens), so nothing here carries a raw colour. Pure markup. */
import {PATRONS} from '../core/patrons.js';

const HATS = {
  wig: '<path class="pt-hat" d="M14 26c-4-14 0-24 18-24s22 10 18 24c-2-6-4-10-6-12-6 4-18 4-24 0-2 2-4 6-6 12z"/>',
  visor: '<path class="pt-hat" d="M16 22h32c0-7-6-12-16-12s-16 5-16 12z"/><rect class="pt-hat" x="12" y="21" width="40" height="4" rx="2"/>',
  spectacles: '<path class="pt-hair" d="M16 24c0-10 4-16 16-16s16 6 16 16c-2-4-6-6-16-6s-14 2-16 6z"/>',
  cap: '<path class="pt-hat" d="M16 24c0-9 7-14 16-14s16 5 16 14z"/><path class="pt-hat" d="M30 12h22c3 0 4 3 2 5H32z"/>',
  beret: '<ellipse class="pt-hat" cx="32" cy="16" rx="20" ry="7"/><path class="pt-hat" d="M18 20c2-6 8-8 14-8s12 2 14 8z"/>',
  crop: '<path class="pt-hair" d="M16 24c0-9 6-15 16-15s16 6 16 15c-3-3-8-5-16-5s-13 2-16 5z"/>',
};

const GLASSES = '<circle class="pt-lens" cx="25" cy="32" r="4.2"/><circle class="pt-lens" cx="39" cy="32" r="4.2"/><path class="pt-lens" d="M29 32h6"/>';
const PROP = {
  archivist: '<path class="pt-prop" d="M46 56l10-4v10l-10 4z"/>',
  clerk: '<path class="pt-prop" d="M10 56h16v4H10z"/>',
  apothecary: '<rect class="pt-prop" x="48" y="50" width="8" height="12" rx="2"/>',
  bookbinder: '<rect class="pt-prop" x="44" y="54" width="14" height="9" rx="1"/>',
  varnisher: '<rect class="pt-prop" x="50" y="46" width="4" height="18" rx="1"/>',
  trainer: '<circle class="pt-prop" cx="52" cy="58" r="5"/>',
};

/** SVG markup for one patron's bust. `title` is the accessible name. */
export function patronSVG(p) {
  const hat = HATS[p.hat] || '';
  const face = `<ellipse class="pt-face" cx="32" cy="32" rx="12" ry="14"/>`;
  const coat = '<path class="pt-coat" d="M8 72c0-18 6-28 24-28s24 10 24 28z"/><path class="pt-shirt" d="M26 46l6 10 6-10z"/>';
  const glasses = p.hat === 'spectacles' ? GLASSES : '';
  const eyes = `<circle class="pt-eye" cx="27" cy="33" r="1.4"/><circle class="pt-eye" cx="37" cy="33" r="1.4"/>`;
  const mouth = '<path class="pt-mouth" d="M28 40c2 1.6 6 1.6 8 0" />';
  return `<svg class="pt-svg" viewBox="0 0 64 72" role="img" aria-label="${p.name}" focusable="false">${coat}${face}${hat}${eyes}${glasses}${mouth}${PROP[p.id] || ''}</svg>`;
}

/** Every patron's bust, keyed by id (for tests and a quick contact sheet). */
export const PATRON_ART = Object.fromEntries(PATRONS.map(p => [p.id, patronSVG(p)]));
