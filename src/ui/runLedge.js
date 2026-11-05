// The run's progress row: each finished word leaves its book as a spine in its (muted) tier colour,
// a skipped word leaves a gap, the word in play is a lit empty slot. Pure markup so it can be tested.
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

// Small fixed height variation per word, so the row reads as books, not bars.
export function spineHeight(word) {
  let h = 0; for (const ch of String(word)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return 22 + (h % 5) * 2; // 22..30px
}

export function spineModel(words, results, i, tiers) {
  return words.map((w, n) => {
    const r = results[n];
    if (!r) return {n, state: n === i ? 'now' : 'next'};
    if (r.skipped) return {n, state: 'skipped', word: r.w};
    return {n, state: 'done', word: r.w, tier: r.tier, color: tiers[r.tier].spine, name: tiers[r.tier].name, linked: !!(r.combo && r.combo.n >= 2)};
  });
}

export function spineLabel(m, total) {
  const at = `word ${m.n + 1} of ${total}`;
  if (m.state === 'done') return `${at}, ${m.word}, ${m.name}`;
  if (m.state === 'skipped') return `${at}, ${m.word}, skipped`;
  return m.state === 'now' ? `${at}, now` : `${at}, to come`;
}

export function runLedgeHTML(words, results, i, tiers) {
  const ms = spineModel(words, results, i, tiers), last = results.length - 1;
  const row = ms.map(m => {
    const cls = `spine ${m.state}${m.linked ? ' linked' : ''}${m.state !== 'next' && m.state !== 'now' && m.n === last ? ' fresh' : ''}`;
    const st = m.state === 'done' ? `--sp:${m.color};--sh:${spineHeight(m.word)}px` : m.state === 'skipped' ? `--sh:${spineHeight(m.word)}px` : '';
    return `<i class="${cls}"${st ? ` style="${st}"` : ''}></i>`;
  }).join('');
  const done = ms.filter(m => m.state === 'done' || m.state === 'skipped').length;
  const sum = ms.map(m => spineLabel(m, ms.length)).join('; ');
  return `<div class="pips runledge" aria-label="${esc(`word ${Math.min(i + 1, ms.length)} of ${ms.length}, ${done} finished. ${sum}`)}">${row}<b class="rail"></b></div>`;
}
