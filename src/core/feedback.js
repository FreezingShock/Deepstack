// "What it caught": a spoiler-safe summary of how an answer matched the word's ideas.
// Labels come from the word's curated concepts (short paraphrases like "leave behind"). Any label
// that spells the word, or a close stem of it, is replaced so the page never gives the word away
// (matters for books still being answered on and for hinted words).
import {stem, match} from '../scorer/lexical.js';

const clean = (label, word) => {
  const l = String(label || '').trim();
  if (!l) return null;
  const ws = stem(word);
  const leaks = l.toLowerCase().split(/\s+/).some(t => t.includes(word.toLowerCase()) || match(stem(t), ws) >= .9);
  return leaks ? 'an idea close to the word itself' : l;
};

/** Compact record stored on the book (additive field `fb`): caught and missed idea labels, plus flags. */
export function feedbackData(j, w) {
  if (!j || j.empty && !(j.missed && j.missed.length)) return undefined;
  const c = (j.caught || []).map(l => clean(l, w.w)).filter(Boolean);
  const m = (j.missed || []).map(l => clean(l, w.w)).filter(Boolean);
  if (!c.length && !m.length) return undefined;
  const fb = {c, m};
  if (j.opposite) fb.o = 1;
  if (j.usedWord) fb.u = 1;
  return fb;
}

/** Lines for the page; null when there is nothing to teach (skips, old books without data). */
export function feedbackLines(b) {
  const fb = b && b.fb;
  if (!fb || b.answer === '') return null;
  const notes = [];
  if (fb.o) notes.push('Your answer leaned toward the opposite meaning.');
  if (fb.u) notes.push('Using the word itself earns nothing.');
  return {caught: fb.c || [], missed: fb.m || [], notes};
}
