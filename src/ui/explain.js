// "You wrote" with the words the judge counted underlined, plus one quiet line on what a stronger answer named.
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

/** Answer text as HTML, counted words underlined. Unknown hits (old books) leave the text plain. */
export function markedAnswer(answer, hits) {
  const set = new Set((hits || []).map(h => h.toLowerCase()));
  return String(answer).split(/([A-Za-z]+(?:['’][a-z]+)?)/).map(p => set.has(p.toLowerCase()) ? `<u>${esc(p)}</u>` : esc(p)).join('');
}

/** Under twelve words: what a stronger answer would have named (the word's own missed ideas), or '' when nothing to say. */
export function strongerLine(b) {
  const fb = b && b.fb;
  if (!fb || b.skipped || !b.answer || !(b.score < 90)) return '';
  const lead = 'A stronger answer names', words = s => s.split(/\s+/).length;
  const picks = [];
  for (const m of fb.m || []) {
    if (picks.length >= 2) break;
    if (words(`${lead} ${[...picks, m].join(' and ')}`) <= 11) picks.push(m);
  }
  return picks.length ? `${lead} ${picks.join(' and ')}.` : '';
}

export function wroteHTML(b) {
  if (!b.answer) return '';
  const sl = strongerLine(b);
  return `<div class="wrote"><p class="wt">You wrote: “${markedAnswer(b.answer, b.fb && b.fb.h)}”</p>${sl ? `<p class="wmore">${esc(sl)}</p>` : ''}</div>`;
}
