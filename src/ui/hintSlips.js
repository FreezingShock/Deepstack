// Hint and skip presentation. Hints arrive as small pinned slips beside the answer, each labelled
// by kind with its cost; the buttons say plainly what they will cost before you press them.
// Pure string builders so they are testable without a DOM.
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

export const HINT_TITLE = {sentence: 'In a sentence', synonym: 'A neighbour', opening: 'The definition begins', kin: 'Kin to', kind: 'A kind of', opposite: 'The other way'};

/** One revealed hint as a pinned slip. `ft` is what it cost, `n` its 1-based order. */
export function hintSlipHtml(h, word, ft, n) {
  // a riddle passes no word: the gap stays a gap
  const body = h.kind === 'sentence'
    ? esc(h.text).replace('___', word ? `<mark>${esc(word)}</mark>` : '<mark class="gap" aria-label="blank"></mark>')
    : esc(h.text);
  const tilt = (n % 2 ? -1 : 1) * (0.6 + (n % 3) * 0.4);
  return `<div class="hslip" data-kind="${h.kind}" style="--tilt:${tilt}deg;--hn:${Math.max(0, n - 1) % 4}"><i class="hpin"></i>` +
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

/** Visible hint control: one handwritten word and a pip per clue. Pips already spent are hollow,
 *  the next free one is ringed. The long rules live in aria-label / the Library Rules card. */
export function hintButtonHtml(total, used, free, justSpent) {
  const pips = Array.from({length: total}, (_, i) => {
    const cls = i < used ? 'spent' + (justSpent && i === used - 1 ? ' snuff' : '') : (free && i === used ? 'free' : 'left');
    return `<i class="${cls}"></i>`;
  }).join('');
  return `<span class="hs-word">${used >= total ? 'Hints gone' : 'Hint'}</span><span class="hs-pips" aria-hidden="true">${pips}</span>`;
}

/** Visible skip control: the word, plus a small broken-link mark when skipping costs you something. */
export function skipButtonHtml(combo, hintsUsed) {
  const costly = combo >= 1 || hintsUsed > 0;
  return `<span class="hs-word">Skip</span>${costly ? '<span class="hs-cost" aria-hidden="true"></span>' : ''}`;
}

/** Paint both controls from the run state. Shared by the word and riddle screens. */
export function paintHintControls(root, run, ft, justSpent) {
  const h = root.querySelector('#hint'), k = root.querySelector('#skip');
  const n = run.ladder[run.hintN], total = run.ladder.length;
  if (h) {
    h.classList.add('hs-btn');
    h.disabled = !n;
    h.innerHTML = hintButtonHtml(total, run.hintN, !!run.freeHint, justSpent);
    h.setAttribute('aria-label', hintButtonLabel(n, n ? (run.freeHint ? 0 : n.cost * ft | 0) : 0, total - run.hintN));
  }
  if (k) {
    k.classList.add('hs-btn', 'hs-skip');
    k.classList.toggle('costly', run.combo >= 1 || run.hintN > 0);
    k.innerHTML = skipButtonHtml(run.combo, run.hintN);
    k.setAttribute('aria-label', skipButtonLabel(run.combo, run.hintN));
  }
}
