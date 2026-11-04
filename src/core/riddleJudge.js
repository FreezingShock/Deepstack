/* Riddle Shelf judge: you are handed a definition and write the word.
   Pure and local. An exact match (or one letter off, or another form of the word) is Apocrypha-level; a synonym is close;
   a broader or related word is a little less. Relations come from public/data/relations.json (see src/scorer/relations.js);
   curated words also bring their hand-written concept terms. */
import {stem} from '../scorer/lexical.js';
import {hintLadder, HINT_COST} from './hints.js';

export const RIDDLE_SCORES = {exact: 100, form: 96, typo: 93, synonym: 58, concept: 52, broader: 40, near: 30, related: 24, defWord: 18, family: 6, none: 0};

/** Lowercase, no accents, hyphens as spaces, leading "to / a / an / the" dropped. */
export function normalize(text) {
  let t = String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  t = t.replace(/[-_]+/g, ' ').replace(/[^a-z' ]+/g, ' ').replace(/'/g, '').replace(/\s+/g, ' ').trim();
  return t.replace(/^(to|a|an|the)\s+(?=\S)/, '');
}

/** Edit distance, bailing out above `max`. */
export function editDistance(a, b, max = 2) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({length: b.length + 1}, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let lo = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < lo) lo = cur[j];
    }
    if (lo > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

const listOf = (rel, k) => (rel?.[k] || []).map(normalize);
/** Single words and short phrases the curated concept lists accept as meaning the same thing. */
export function conceptTerms(word) {
  const out = new Set();
  for (const c of word.concepts || []) for (const t of String(c[2] || '').split(',')) { const n = normalize(t); if (n && !n.startsWith('~')) out.add(n); }
  return out;
}

/** True when two words are the same word in another form ("accrued" for accrue). */
const sameWord = (a, b) => a.length >= 4 && b.length >= 4 && !a.includes(' ') && !b.includes(' ') && stem(a) === stem(b);

/**
 * @param {string} text what the player wrote
 * @param {{w:string,def:string,concepts?:Array}} word the target
 * @param {{s?:string[],h?:string[],r?:string[],n?:string[],a?:string[]}|null} rel relations of the target (relOf)
 * @returns {{score:number,kind:string,empty:boolean,opposite:boolean}}
 */
export function riddleJudge(text, word, rel = null) {
  const a = normalize(text), target = word.w.toLowerCase();
  const res = (kind, extra = {}) => ({score: RIDDLE_SCORES[kind], kind, empty: false, opposite: false, ...extra});
  if (!a) return {score: 0, kind: 'empty', empty: true, opposite: false};
  if (a === target) return res('exact');
  if (sameWord(a, target)) return res('form');
  const hit = k => { const l = listOf(rel, k); return l.includes(a) || l.some(x => sameWord(x, a)); };
  const listed = hit('s') || hit('a') || conceptTerms(word).has(a); // a real word of its own beats a near-miss spelling
  if (!listed && a.length >= 5 && !a.includes(' ') && editDistance(a, target, a.length >= 9 ? 2 : 1) <= (a.length >= 9 ? 2 : 1)) return res('typo');
  if (hit('a')) return res('none', {kind: 'opposite', opposite: true});
  if (hit('s')) return res('synonym');
  if (conceptTerms(word).has(a)) return res('concept');
  if (hit('h')) return res('broader');
  if (hit('n')) return res('near');
  if (hit('r') && a.slice(0, 4) !== target.slice(0, 4)) return res('related');
  if (a.slice(0, 4) === target.slice(0, 4) && a.length >= 4) return res('family');
  const defStems = new Set(word.def.toLowerCase().split(/[^a-z]+/).filter(t => t.length >= 4).map(stem));
  if (!a.includes(' ') && a.length >= 4 && defStems.has(stem(a))) return res('defWord');
  return res('none');
}

const LINES = {
  exact: ['Exactly the word.', 'The very word. It was waiting for you.', 'Found it.'],
  form: ['The right word, in another form.'],
  typo: ['The word, give or take a letter.'],
  synonym: ['Not the word itself, but it means the same.', 'A true cousin: same meaning, other word.'],
  concept: ['Not the word, but the meaning is right.'],
  broader: ['In the right family, though too broad.'],
  near: ['A distant relation of the word.'],
  related: ['Related, but not what the slip describes.'],
  defWord: ['That is only part of the description, not the word.'],
  family: ['A word that looks alike but means something else.'],
  opposite: ['That points the other way. The word means close to the opposite.'],
  none: ['Wrong shelf. The word stays closed.'],
  empty: ['Nothing written.'],
};
/** One-line verdict for a result card. */
export function riddleVerdict(j, word) {
  const l = LINES[j.kind] || LINES.none;
  return l[word.id % l.length];
}

/** Hints for a riddle: the sentence and neighbour clues from the Daily ladder, minus "the definition begins" (the slip already
 *  is the definition). Words without a neighbour clue borrow one synonym from the relations, so most riddles get some help.
 *  Never spells the word. */
export function riddleLadder(word, rel = null) {
  const out = hintLadder(word).filter(h => h.kind !== 'opening');
  if (!out.some(h => h.kind === 'synonym')) {
    const t = (rel?.s || []).map(x => x.trim()).find(x => /^[a-z]{3,14}$/.test(x) && x.slice(0, 4) !== word.w.slice(0, 4) && !x.includes(word.w) && !word.w.includes(x));
    if (t) out.push({kind: 'synonym', cost: HINT_COST.synonym, text: t});
  }
  return out;
}
