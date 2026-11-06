// Builds the playable word pool from public/data/words.json (see scripts/build-words.mjs).
// Curated words keep their hand-written entry (definition, hint, concept lists) from BANK;
// generated words get a quality filter, because raw Wiktionary glosses are not all fair to ask.
import {BANK, WORDS, GHOSTS} from './words.js';
import {hashStr} from './daily.js';
import {stem, match} from '../scorer/lexical.js';
import {isSpecialist, effectiveDifficulty} from './difficulty.js';
import {isBlocked} from './blocklist.js';

const POS_OK = new Set(['noun', 'verb', 'adjective', 'adverb']);
// Glosses that only point at another word, or describe a form rather than a meaning.
const RELATIONAL = /^(of|or|relating|pertaining|alternative|obsolete|archaic|dated|plural|past|present|third|simple|comparative|superlative|diminutive|augmentative|misspelling|abbreviation|initialism|acronym|clipping|contraction|synonym|eye dialect|nonstandard|a (surname|given name|female|male)|the (surname|given name))\b/i;
// Not for a daily word game: sexual, scatological, violent and slur-adjacent entries.
const SENSITIVE = /\b(sex\w*|genital\w*|vagin\w*|penis\w*|clitor\w*|anus|anal|rectum|rectal|masturbat\w*|orgasm\w*|erotic\w*|porn\w*|fellatio|semen|testicle\w*|scrotum|vulva|breast\w*|nipple\w*|urin\w*|faec\w*|feces|excrement|defecat\w*|vomit\w*|suicid\w*|rape\w*|rapist|slave\w*|nigg\w*|fagg\w*|retard\w*|kike|spic|chink|gook|dyke|tranny|whore|slut|bitch|cunt|fuck\w*|shit\w*|piss\w*|cock|dick|pussy|bastard|damn\w*|racial\w*|ethnic slur|pejorative|derogatory|offensive|vulgar|slang)\b/i;

// Generated words below this translation count are the archaic, dialectal and compound oddities (churl, seadog).
export const MIN_TRANSLATIONS = 25;
const fragments = d => d.split(/[;,]\s*/).map(x => x.trim()).filter(Boolean);
/** Glosses that are leftovers or bare synonym lists make poor references ("indefinably large, countlessly great; immense"). */
export function weakGloss(def) {
  if (/\((see|cf|q\.v)\b|\bsee also\b|\betc\.?\)|\.\.\.|\bq\.v\./i.test(def)) return true;
  const fr = fragments(def);
  if (fr.length >= 3 && fr.every(f => f.split(/\s+/).length <= 2)) return true; // a list of near-synonyms
  if (def.split(/\s+/).length < 4 && !/^(to|a|an|the)\s/i.test(def)) return true; // "Drawn, pictorial."
  return false;
}

// Technical first senses of everyday words (dialect: a programming-language variant) are unfair to ask.
const JARGON = /\b(programming language|software|algorithm|syntax|operating system|computing|hardware|database)\b/i;
const clean = s => String(s).replace(/\s+/g, ' ').trim();

/** True when the definition gives the answer away by containing a form of the word itself. */
export function selfReferential(word, def) {
  const ws = stem(word);
  return def.toLowerCase().split(/[^a-z]+/).some(t => t.length >= 4 && match(stem(t), ws) >= .85);
}

/** Why a generated entry is not fit to ask, or null if it is. */
export function rejectReason(e, ignoreBlock = false) {
  if (!ignoreBlock && isBlocked(e.w, e.def)) return 'blocked';
  if (!POS_OK.has(e.pos)) return 'pos';
  if (!/^[a-z]{4,16}$/.test(e.w)) return 'shape';
  const def = clean(e.def || '');
  if (def.length < 14 || def.length > 200) return 'length';
  if (RELATIONAL.test(def)) return 'relational';
  if (SENSITIVE.test(def) || SENSITIVE.test(e.w)) return 'sensitive';
  if (selfReferential(e.w, def)) return 'self';
  if (weakGloss(def)) return 'weak';
  if (JARGON.test(def)) return 'jargon';
  if (isSpecialist(def)) return 'specialist';
  if (e.t != null && e.t < MIN_TRANSLATIONS) return 'obscure';
  return null;
}

/** Fallback when the dump has no example sentence: not usable as a sentence hint (hintLadder skips it). */
export function templateHint(w) {
  return `${w.pos === 'adjective' ? 'An' : 'A'} ${w.pos} of ${w.w.length} letters, beginning with “${w.w[0]}”.`;
}

const bankWord = new Map(BANK.map((b, i) => [b[0], i]));

/** @param {{words:Array}} data parsed words.json */
export function buildPool(data) {
  const out = [], seen = new Set(), ghosts = [];
  for (const e of data.words) {
    if (seen.has(e.w)) continue;
    const bi = bankWord.get(e.w);
    if (bi !== undefined) { // curated: the hand-written entry wins
      const b = BANK[bi];
      out.push({id: bi, w: b[0], pos: b[1], d: b[2], def: b[3], hint: b[4], concepts: b[5], opp: b[6], curated: true});
      seen.add(e.w); continue;
    }
    if (rejectReason(e)) {
      // Blocked words stay in the seeded Daily's random stream (see pickRampWord) so dropping one never reshuffles a day.
      if (rejectReason(e, true) === null) ghosts.push({id: hashStr('w:' + e.w), w: e.w, d: effectiveDifficulty(e.d, e.t)});
      continue;
    }
    const w = {id: hashStr('w:' + e.w), w: e.w, pos: e.pos, d: effectiveDifficulty(e.d, e.t), def: clean(e.def), hint: e.hint || null, concepts: [], opp: '', curated: false};
    if (!w.hint) w.hint = templateHint(w);
    out.push(w); seen.add(e.w);
  }
  for (const b of BANK) if (!seen.has(b[0])) { // curated words missing from the dump still play
    const i = bankWord.get(b[0]);
    out.push({id: i, w: b[0], pos: b[1], d: b[2], def: b[3], hint: b[4], concepts: b[5], opp: b[6], curated: true});
  }
  // Stable order so seeded daily picks are identical on every device.
  const byWord = (a, b) => a.w < b.w ? -1 : a.w > b.w ? 1 : 0;
  out.sort(byWord);
  Object.defineProperty(out, 'ghosts', {value: ghosts.sort(byWord), enumerable: false});
  return out;
}

let loading = null;
/** Replaces the contents of WORDS in place (references stay valid). Falls back to the 38-word bank on failure. */
export function loadWords(url = (import.meta.env?.BASE_URL || '/') + 'data/words.json') {
  return loading ||= (async () => {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const pool = buildPool(await r.json());
      if (pool.length < 500) throw new Error('word list too small');
      WORDS.length = 0; WORDS.push(...pool);
      GHOSTS.length = 0; GHOSTS.push(...(pool.ghosts || []));
      return {ok: true, count: pool.length};
    } catch (err) {
      console.warn('Using built-in word bank:', err);
      return {ok: false, count: WORDS.length};
    }
  })();
}
