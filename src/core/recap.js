/* Pure summary of a finished run, for the results screen. Works on the run record `d` (books with
   score/tier/ft/hints/combo) and tolerates missing fields from older saves. */
const isSkip = b => b.answer === '' && b.score === 0;

export function summarizeRun(d) {
  const books = (d && d.books) || [];
  const answered = books.filter(b => !isSkip(b));
  let bestCombo = 0, comboFt = 0, hints = 0;
  for (const b of books) {
    if (b.combo) { bestCombo = Math.max(bestCombo, b.combo.n || 0); comboFt += b.combo.ft || 0; }
    hints += b.hints || 0;
  }
  let top = null;
  for (const b of answered) if (!top || b.score > top.score) top = b;
  const tiers = [0, 0, 0, 0, 0, 0, 0];
  for (const b of answered) if (b.tier >= 0 && b.tier < 7) tiers[b.tier]++;
  return {total: books.length, answered: answered.length, skipped: books.length - answered.length,
    bestCombo, comboFt, hints, top, tiers, setFt: d && d.setBonus || 0};
}

/** Sets that contain a word from this run, with current progress. `status` is setStatus(S). */
export function setsTouched(books, status) {
  const ws = new Set((books || []).map(b => String(b.w || '').toLowerCase()));
  return status.filter(s => s.words.some(w => ws.has(w)));
}
