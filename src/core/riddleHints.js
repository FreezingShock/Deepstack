// Riddle Shelf hints. The slip already shows the definition and the player must write the word, so a riddle hint
// may only point sideways at it: a sentence with the word left blank, kin, a broader kind, an opposite, a near
// synonym. Every clue is screened so it can never contain the answer, another form of it, or a near-spelling of it,
// and none says anything about letters or length (nate rejected spelling hints, #18).
import {sentenceClue, HINT_COST} from './hints.js';
import {normalize, editDistance} from './riddleJudge.js';
import {stem} from '../scorer/lexical.js';

export const RIDDLE_HINT_COST = {...HINT_COST, kin: 1, kind: 2, opposite: 2, synonym: 3};
export const MAX_RIDDLE_HINTS = 4;

/** True when `text` would hand over the answer: the word itself, another form, a near-spelling, or a shared stem/prefix. */
export function givesAway(text, answer) {
  const t = normalize(text), a = normalize(answer);
  if (!t || !a) return true;
  if (t === a || t.includes(a) || (t.length >= 4 && a.includes(t))) return true;
  for (const tok of t.split(' ')) {
    if (tok.length < 4 && tok !== a) continue;
    if (tok === a || stem(tok) === stem(a) || (tok.length >= 4 && a.length >= 4 && tok.slice(0, 4) === a.slice(0, 4))) return true;
    if (tok.length >= 5 && editDistance(tok, a, 2) <= 2) return true;
    if (tok.length >= 5 && (a.includes(tok) || tok.includes(a))) return true;
  }
  return false;
}

/** The blanked example sentence, or null when it spells the word in any form anywhere. */
export function riddleSentence(w) {
  const s = sentenceClue(w);
  if (!s) return null;
  const rest = s.replace(/___/g, ' ');
  return rest.split(/[^A-Za-z']+/).some(tok => tok.length >= 4 && givesAway(tok, w.w)) ? null : s;
}

const safeTerms = (list, w, n) => {
  const out = [];
  for (const raw of list || []) {
    const t = String(raw).trim();
    if (!/^[a-z][a-z' -]{2,18}$/i.test(t) || givesAway(t, w.w) || t.split(/[^A-Za-z']+/).some(k => k.length >= 4 && givesAway(k, w.w)) || out.includes(t)) continue;
    out.push(t);
    if (out.length >= n) break;
  }
  return out;
};

/** Ordered riddle hints: [{kind, cost, text}], at most MAX_RIDDLE_HINTS, cheapest meaningful first. */
export function riddleHintLadder(word, rel = null) {
  const out = [];
  const s = riddleSentence(word); if (s) out.push({kind: 'sentence', cost: RIDDLE_HINT_COST.sentence, text: s});
  const syn = safeTerms([...(rel?.s || []), ...(rel?.c || [])], word, 2);
  const kin = safeTerms((rel?.r || []).filter(t => !syn.includes(t)), word, 2); if (kin.length) out.push({kind: 'kin', cost: RIDDLE_HINT_COST.kin, text: kin.join(', ')});
  const kind = safeTerms(rel?.h, word, 1); if (kind.length) out.push({kind: 'kind', cost: RIDDLE_HINT_COST.kind, text: kind[0]});
  const opp = safeTerms(rel?.a, word, 1); if (opp.length) out.push({kind: 'opposite', cost: RIDDLE_HINT_COST.opposite, text: opp[0]});
  if (syn.length) out.push({kind: 'synonym', cost: RIDDLE_HINT_COST.synonym, text: syn[0]});
  return out.slice(0, MAX_RIDDLE_HINTS);
}
