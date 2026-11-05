/* The Lexicon shown as one hand-lettered rank, plus a one-line explainer and the quiet level-change line.
   Pure text builders over the existing Lexicon (0-100) and levelTitle: no new numbers. */
import {LEVEL_TITLES} from '../core/level.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

/** What each rank means, in a line the player can read at a glance. */
export const RANK_NOTES = {
  'Casual Reader': 'Everyday words and a few curveballs.',
  'Bookworm': 'You know your way around a page.',
  'Wordsmith': 'Rarer words are within reach.',
  'Philologist': 'Fine shades of meaning are your ground.',
  'Lexicographer': 'You could write the definitions yourself.',
  'Grand Logophile': 'The strangest words in the stacks.'
};

export const PLACEMENT_LINE = 'Eight quick words find your rank; after that, each run nudges it up or down.';

/** Rank name for a Lexicon value (0-100). */
export function rankFor(lex) {
  let t = LEVEL_TITLES[0][1];
  for (const [m, x] of LEVEL_TITLES) if (lex >= m) t = x;
  return t;
}

/** Index of the rank, 0 = lowest. */
export const rankIndex = lex => LEVEL_TITLES.reduce((k, [m], i) => (lex >= m ? i : k), 0);

/** The rank block for the Unlimited book's first page. */
export function rankHTML(rating, lexicon) {
  if (!rating || !rating.placed) {
    return `<div class="lx-rank unplaced"><span class="lx-lbl">Your rank</span><span class="lx-name">Not yet placed</span><span class="lx-note">${esc(PLACEMENT_LINE)}</span></div>`;
  }
  const lex = lexicon(rating.L), name = rankFor(lex);
  return `<div class="lx-rank"><span class="lx-lbl">Your rank · Lexicon ${lex}</span><span class="lx-name">${esc(name)}</span><span class="lx-note">${esc(RANK_NOTES[name] || '')}</span></div>`;
}

/** A quiet line for the final page: placed, rose, fell or held. Empty for other modes. */
export function levelChangeLine(d) {
  if (!d || d.mode !== 'unlimited' || typeof d.lex !== 'number') return '';
  const now = rankFor(d.lex);
  if (d.placing) return `You are placed as a ${now}.`;
  const before = rankFor(d.lex0);
  if (now === before) return `Still a ${now}.`;
  return rankIndex(d.lex) > rankIndex(d.lex0) ? `You rose from ${before} to ${now}.` : `You slipped from ${before} to ${now}.`;
}
