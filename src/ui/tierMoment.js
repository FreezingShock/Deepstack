/* A small reveal moment for every tier on the result card, low ones included.
   Pure data + one DOM hook. Tier stays the hero: each moment is a quiet motion on the tier bar and the page,
   in the tier's own colour. Folio and above already have rays, flashes and bursts; they only get the edge light. */
const MOMENTS = [
  {tier: 0, name: 'Pamphlet',  motion: 'settle', note: 'a thin sheet set down on the desk: a small dip and a quiet grey edge light'},
  {tier: 1, name: 'Paperback', motion: 'unfold', note: 'the pages fan open a touch, a green glint crosses the bar'},
  {tier: 2, name: 'Hardbound', motion: 'press',  note: 'a firm press of the board, a blue glint crosses the bar'},
  {tier: 3, name: 'Folio',     motion: null},
  {tier: 4, name: 'Codex',     motion: null},
  {tier: 5, name: 'Grimoire',  motion: null},
  {tier: 6, name: 'Apocrypha', motion: null},
];
export function tierMoment(tier) { return MOMENTS[Math.max(0, Math.min(6, tier | 0))]; }
/** Adds the classes that start the moment; the CSS does the rest. Reduced motion gets nothing (the static dressing stays). */
export function playTierMoment(book, tier, RM) {
  if (RM || !book) return null;
  const m = tierMoment(tier);
  book.classList.add('tm-edge');
  if (m.motion) book.classList.add('tm-' + m.motion);
  return m;
}
