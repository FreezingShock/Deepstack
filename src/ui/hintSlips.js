// Hint and skip presentation. Hints arrive as small pinned slips beside the answer, each labelled
// by kind with its cost; the buttons say plainly what they will cost before you press them.
// Pure string builders so they are testable without a DOM.
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

export const HINT_TITLE = {sentence: 'In a sentence', synonym: 'A neighbour', opening: 'The definition begins'};

/** One revealed hint as a pinned slip. `ft` is what it cost, `n` its 1-based order. */
export function hintSlipHtml(h, word, ft, n) {
  const body = h.kind === 'sentence'
    ? esc(h.text).replace('___', `<mark>${esc(word)}</mark>`)
    : esc(h.text);
  const tilt = (n % 2 ? -1 : 1) * (0.6 + (n % 3) * 0.4);
  return `<div class="hslip" data-kind="${h.kind}" style="--tilt:${tilt}deg"><i class="hpin"></i>` +
    `<span class="hcap">${HINT_TITLE[h.kind] || 'Hint'} <b>${ft ? '−' + ft + ' ft' : 'free'}</b></span><span class="hbody">${body}</span></div>`;
}

/** Hint button text: names the next clue and its price, or says the well is dry. */
export function hintButtonLabel(next, ft, left) {
  if (!next) return 'No more hints';
  return `Hint: ${HINT_TITLE[next.kind].toLowerCase()} (${ft ? '−' + ft + ' ft' : 'free, once per run'})` + (left > 1 ? ` · ${left} left` : '');
}

/** Skip button text: says what skipping gives up. */
export function skipButtonLabel(combo, hintsUsed) {
  const bits = ['Skip'];
  if (combo >= 1) bits.push('breaks your × chain');
  else if (hintsUsed) bits.push('hints wasted');
  return bits.length > 1 ? `${bits[0]} (${bits.slice(1).join(', ')})` : 'Skip';
}
