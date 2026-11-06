// Pure helpers for picking a word's other senses from kaikki.org entries.
import {cleanGloss} from './wordsData.mjs';
import {STOP, FILL, stem} from '../../src/scorer/lexical.js';

const POS = {noun: 'noun', verb: 'verb', adj: 'adjective', adv: 'adverb'};
const BAD = new Set(['obsolete', 'archaic', 'dialectal', 'dialect', 'offensive', 'vulgar', 'slang', 'derogatory', 'ethnic-slur', 'rare', 'nonstandard', 'misspelling', 'abbreviation', 'initialism', 'form-of', 'alt-of', 'dated', 'historical', 'proscribed']);
const FORM = /^(alternative|alternate|obsolete|archaic|dated|rare|misspelling|plural|singular|past|present|simple|third-person|comparative|superlative|inflection|nonstandard|eye dialect|abbreviation|initialism|acronym|synonym|clipping|contraction)\b|\b(of|form of|spelling of|variant of)\s+\S+\.?$/i;
const stems = t => new Set(t.toLowerCase().split(/[^a-z]+/).filter(x => x.length >= 3 && !STOP.has(x) && !FILL.has(x)).map(stem));
export const overlap = (a, b) => { const A = stems(a), B = stems(b); let n = 0; for (const x of A) if (B.has(x)) n++; return n ? n / Math.min(A.size, B.size) : 0; };

/** Usable glosses of one kaikki entry as [pos, gloss]. */
export function usable(entry) {
  const out = [];
  for (const s of entry.senses || []) {
    const tags = [...(s.tags || []), ...(s.raw_tags || [])].map(t => String(t).toLowerCase());
    if (tags.some(t => BAD.has(t))) continue;
    const g = (s.glosses || []).slice(-1)[0];
    if (!g || g.length < 10 || g.length > 120 || FORM.test(g.trim()) || /[\[\]{}<>]/.test(g)) continue;
    if (VAGUE.test(g.trim()) || g.trim().split(/\s+/).length < 3) continue; // "a kind of ..." says nothing a player could be right about
    out.push([POS[entry.pos], cleanGloss(g)]);
  }
  return out;
}
const VAGUE = /^(an? |the )?(type|kind|sort|form|variety|class|member|instance|example|part|piece|thing|person|one who|someone who|something that|used to|of or (relating|pertaining)|relating to|pertaining to)\b/i;
export const glossOf = entry => usable(entry)[0]?.[1] || null;

/** Up to `max` senses that say something different from the main definition (and from each other). */
export function pickAlts(entries, mainDef, max = 3, word = '') {
  const out = [], root = word.slice(0, Math.max(4, word.length - 3));
  const echoes = g => root.length >= 4 && g.toLowerCase().includes(root); // "characterized by frugality" explains nothing
  for (const e of entries) for (const [pos, g] of usable(e)) {
    if (out.length >= max) return out;
    if (echoes(g) || overlap(g, mainDef) >= .6 || out.some(o => overlap(g, o[1]) >= .6)) continue;
    out.push([pos, g]);
  }
  return out;
}
