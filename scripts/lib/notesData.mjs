// Pure helpers for the margin notes on a result card: a short etymology, one usage example and a few related words.
// Source is Wiktionary via kaikki.org (CC BY-SA 4.0). Each kaikki entry is reduced to a small summary as the dump streams
// past (see summarize), and pickNote turns the summaries for one word into the note the card shows.
import {isBlockedWord, isBlockedDef} from '../../src/core/blocklist.js';

export const NOTE_POS = {noun: 'noun', verb: 'verb', adj: 'adjective', adv: 'adverb', adjective: 'adjective', adverb: 'adverb'};
const FORM = /\b(form of|alternative|obsolete|archaic|dated|rare|misspelling|plural|singular|past tense|participle|inflection)\b/i;
const SKIP_TAGS = new Set(['form-of', 'alt-of', 'obsolete', 'archaic', 'dated', 'rare', 'misspelling', 'nonstandard', 'abbreviation', 'initialism', 'offensive', 'vulgar', 'slur', 'derogatory', 'ethnic-slur', 'slang', 'historical', 'dialectal', 'dialect']);
// Register labels worth showing under "Usage". Only the first matching tag of a sense is used.
const USAGE = {figuratively: 'Often used figuratively', literary: 'Literary', formal: 'Formal', poetic: 'Poetic', humorous: 'Humorous', technical: 'Technical', law: 'Legal', medicine: 'Medical', idiomatic: 'Used in idioms'};

export const clean = s => String(s ?? '').replace(/\s+/g, ' ').trim();

/** A short etymology: whole sentences up to `max` characters, or the first clause with an ellipsis. */
export function shortEtymology(text, max = 170) {
  const t = clean(text).replace(/\s*\[\d+\]/g, '');
  if (!t) return null;
  if (t.length <= max) return /[.!?]$/.test(t) ? t : t + '.';
  const window = t.slice(0, max + 1);
  const end = Math.max(window.lastIndexOf('. '), window.lastIndexOf('; '));
  if (end > 60) return window.slice(0, end + 1).replace(/;$/, '.');
  const sp = window.lastIndexOf(' ');
  return window.slice(0, sp > 40 ? sp : max).replace(/[,;:\s]+$/, '') + '…';
}

const wordRe = w => new RegExp(`\\b${w.replace(/[^a-z]/gi, '')}(?:s|es|ed|d|ing|ly|ness)?\\b`, 'i');
const SAFE_EXAMPLE = /[\[\]{}<>|]/;

/** True when a candidate example or related word is clean enough to show. */
export function isCleanText(t) {
  if (isBlockedDef(t)) return false;
  return !t.toLowerCase().split(/[^a-z]+/).some(tok => tok.length >= 3 && isBlockedWord(tok));
}

/** One short example sentence that uses the word (not blanked: the card shows the word in place). */
export function pickExample(word, texts) {
  if (!/^[a-z][a-z-]*$/i.test(word)) return null;
  const re = wordRe(word);
  for (const raw of texts) {
    const t = clean(raw);
    if (t.length < 35 || t.length > 150 || SAFE_EXAMPLE.test(t) || !re.test(t)) continue;
    if (!/[.!?"”’]$/.test(t) || !isCleanText(t)) continue;
    return t;
  }
  return null;
}

/** A related word is a fragment when it is a piece of the headword ("hemeral" inside "ephemeral"). Derived forms that contain the headword ("ephemerality") are fine. */
export const isFragment = (word, w) => w !== word && word.includes(w);

/**
 * Up to `max` related words: single words or short phrases, lowercase, never the headword itself, never a fragment of it.
 * `known` (optional) says whether a word is a real word the dictionary knows; without it every clean word passes.
 */
export function cleanRelated(word, list, max = 4, known = null) {
  const out = [];
  for (const raw of list) {
    const w = clean(raw).toLowerCase();
    if (w === word || out.includes(w) || w.length < 3 || w.length > 28) continue;
    if (!/^[a-z][a-z' -]*[a-z]$/.test(w) || w.split(' ').length > 2 || !isCleanText(w)) continue;
    if (isFragment(word, w) || (known && !known(w))) continue;
    out.push(w);
    if (out.length === max) break;
  }
  return out;
}

/** True when the entry has at least one sense a player could be asked about (used as the list of real headwords). */
export function hasUsableSense(entry) {
  return !!NOTE_POS[entry.pos] && (entry.senses || []).some(s => usable(s));
}

const usable = s => {
  const tags = [...(s.tags || []), ...(s.raw_tags || [])].map(t => String(t).toLowerCase());
  if (tags.some(t => SKIP_TAGS.has(t))) return null;
  const gloss = clean((s.glosses || []).slice(-1)[0]);
  if (!gloss || FORM.test(gloss)) return null;
  return {tags, gloss};
};

/** Some kaikki etymologies are raw template output (an \"Etymology tree\" dump, a chain of Proto- forms, a stray ?): not shown. */
export function etymologyOk(t) {
  if (!t || /Etymology tree|\?/.test(t)) return false;
  return (t.match(/Proto-/g) || []).length < 3;
}

/**
 * Reduce one kaikki entry to what a note needs. Keeps the entry's pos so the right one is picked later.
 * Returns null when the entry has nothing (no etymology, examples or related words).
 */
export function summarize(entry) {
  const pos = NOTE_POS[entry.pos];
  if (!pos) return null;
  const examples = [], syn = [];
  let usage = null;
  for (const s of entry.senses || []) {
    const u = usable(s);
    if (!u) continue;
    if (!usage) usage = u.tags.map(t => USAGE[t]).find(Boolean) || null;
    for (const ex of s.examples || []) if (ex?.text) examples.push(ex.text);
    for (const x of s.synonyms || []) if (x?.word) syn.push(x.word);
  }
  const related = [...(entry.related || []).map(x => x?.word).filter(Boolean), ...syn];
  const et = clean(entry.etymology_text).replace(/^\*\s*/, '');
  const out = {pos, et: etymologyOk(et) ? et : '', ex: examples.slice(0, 40), rel: related.slice(0, 40), u: usage};
  return out.et || out.ex.length || out.rel.length ? out : null;
}

/** Choose the note for one word from its summaries (same pos first; any pos only when none matches). */
export function pickNote(word, pos, summaries, known = null) {
  const same = summaries.filter(s => s.pos === pos), pool = same.length ? same : summaries;
  const best = pool.find(s => s.et) || pool[0];
  if (!best) return null;
  const note = {};
  // The etymology may come from another part of speech of the same word, so take the first one that has it.
  const et = (same.find(s => s.et) || pool.find(s => s.et))?.et;
  // A cross-reference such as "From ephemeral (adj)." says nothing on its own, so it is not shown.
  const e = et ? shortEtymology(et) : null; if (e && e.length >= 30 && isCleanText(e)) note.e = e;
  const x = pickExample(word, [...same, ...pool].flatMap(s => s.ex).slice(0, 60)); if (x) note.x = x;
  if (best.u) note.u = best.u;
  const r = cleanRelated(word, [...same, ...pool].flatMap(s => s.rel), 4, known); if (r.length) note.r = r;
  return Object.keys(note).length ? note : null;
}

/** Shard file for a word: one file per first letter (anything else goes to "other"). */
export const shardOf = word => (/^[a-z]/.test(word) ? word[0] : 'other');
