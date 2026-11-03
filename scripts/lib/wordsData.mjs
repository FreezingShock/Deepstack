// Pure helpers for turning Wiktionary (kaikki.org JSONL) + a frequency list into Deepstack word data.

const POS = {noun: 'noun', verb: 'verb', adj: 'adjective', adv: 'adverb'};
const BAD_TAGS = new Set(['obsolete', 'archaic', 'dialectal', 'dialect', 'offensive', 'vulgar', 'slang', 'derogatory', 'ethnic-slur', 'rare', 'nonstandard', 'misspelling', 'abbreviation', 'initialism', 'colloquial', 'informal', 'historical', 'proscribed', 'uncommon', 'form-of', 'alt-of']);
const FORM_GLOSS = /^(alternative|alternate|obsolete|archaic|dated|rare|misspelling|plural|singular|past|present|simple|third-person|comparative|superlative|inflection|nonstandard|eye dialect|abbreviation|initialism|acronym|synonym|clipping|contraction)\b|\b(of|form of|spelling of|variant of)\s+\S+\.?$/i;

/** Parse "word count" lines into Map(word -> count). */
export function parseFreq(text) {
  const m = new Map();
  for (const line of text.split('\n')) {
    const i = line.lastIndexOf(' ');
    if (i < 1) continue;
    const n = Number(line.slice(i + 1));
    if (Number.isFinite(n)) m.set(line.slice(0, i), n);
  }
  return m;
}

export const logFreq = (freq, w) => Math.log10((freq.get(w) ?? 0) + 0.5);

/** Least-squares fit d = a + b*logFreq over anchor words {w, d}. Falls back to a sane default. */
export function fitDifficulty(anchors, freq) {
  const pts = anchors.map(x => [logFreq(freq, x.w), x.d]);
  const n = pts.length;
  if (n < 3) return {a: 12, b: -2.6};
  const mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
  let sxx = 0, sxy = 0;
  for (const [x, y] of pts) { sxx += (x - mx) ** 2; sxy += (x - mx) * (y - my); }
  const b = sxx ? sxy / sxx : -2.6;
  return {a: my - b * mx, b};
}

export const difficultyOf = (fit, freq, w) => Math.max(0.5, Math.min(10, +(fit.a + fit.b * logFreq(freq, w)).toFixed(1)));

/** Number of languages the entry has translations for: a cheap "do people know this word" signal. */
export function translationBreadth(entry) {
  let n = 0;
  for (const s of entry.senses || []) {
    const c = (s.categories || []).filter(x => /^Terms with .+ translations$/.test(x.name || x)).length;
    if (c > n) n = c;
  }
  return n;
}

/** Pick the best usable sense of a kaikki entry, or null. */
export function pickSense(entry) {
  const pos = POS[entry.pos];
  if (!pos || !/^[a-z]{5,18}$/.test(entry.word)) return null;
  for (const s of entry.senses || []) {
    const tags = [...(s.tags || []), ...(s.raw_tags || [])].map(t => t.toLowerCase());
    if (tags.some(t => BAD_TAGS.has(t))) continue;
    const gloss = (s.glosses || []).slice(-1)[0];
    if (!gloss || gloss.length < 12 || gloss.length > 160 || FORM_GLOSS.test(gloss.trim())) continue;
    return {pos, def: cleanGloss(gloss), examples: s.examples || []};
  }
  return null;
}

export function cleanGloss(g) {
  g = g.replace(/\s+/g, ' ').trim();
  g = g.charAt(0).toUpperCase() + g.slice(1);
  return /[.!?]$/.test(g) ? g : g + '.';
}

/** First short example containing the word, with the word blanked. */
export function makeHint(word, examples) {
  const re = new RegExp(`\\b${word}(?:s|es|ed|d|ing|ly)?\\b`, 'i');
  for (const ex of examples) {
    const t = (ex.text || '').replace(/\s+/g, ' ').trim();
    if (t.length >= 25 && t.length <= 140 && re.test(t) && !/[\[\]{}<>]/.test(t)) return t.replace(re, '___');
  }
  return null;
}

/** entries: iterable of kaikki objects. Returns Map(word -> record) keeping the first usable sense per word. */
export function collect(entries, freq, {minCount = 3} = {}) {
  const out = new Map();
  for (const e of entries) {
    if (out.has(e.word) || (freq.get(e.word) ?? 0) < minCount) continue;
    const s = pickSense(e);
    if (!s) continue;
    out.set(e.word, {w: e.word, pos: s.pos, def: s.def, hint: makeHint(e.word, s.examples), t: translationBreadth(e)});
  }
  return out;
}
