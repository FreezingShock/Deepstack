/* A small pen line of the last few Lexicon values (S.rating.hist), drawn under the rank in the Unlimited book.
   Uses only the existing Lexicon numbers; nothing new is stored. */
const W = 220, H = 56, PAD = 8, MAX_RUNS = 12;

/** The Lexicon values to draw: the last MAX_RUNS runs, oldest first. */
export function trendPoints(hist) {
  if (!Array.isArray(hist)) return [];
  return hist.map(h => h && h.lex).filter(v => typeof v === 'number' && isFinite(v)).slice(-MAX_RUNS);
}

/** Screen coordinates for the values; a flat history sits on the middle line. */
export function trendXY(vals) {
  const lo = Math.min(...vals), hi = Math.max(...vals), span = Math.max(hi - lo, 6);
  const mid = (hi + lo) / 2;
  return vals.map((v, i) => [
    +(PAD + (W - 2 * PAD) * i / (vals.length - 1)).toFixed(1),
    +(H / 2 - ((v - mid) / span) * (H - 2 * PAD)).toFixed(1)
  ]);
}

/** One-line caption for the pen line. */
export function trendCaption(vals) {
  const a = vals[0], b = vals[vals.length - 1], n = vals.length;
  const where = b > a ? 'climbing' : b < a ? 'dipping' : 'holding steady';
  return `Last ${n} runs · Lexicon ${a} to ${b}, ${where}`;
}

/** Block for the Unlimited page. Empty until there are two runs to join. */
export function trendHTML(hist) {
  const vals = trendPoints(hist);
  if (vals.length < 2) return '';
  const pts = trendXY(vals);
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1], [x, y] = pts[i], cx = ((px + x) / 2).toFixed(1);
    d += ` C${cx} ${py} ${cx} ${y} ${x} ${y}`;
  }
  const [lx, ly] = pts[pts.length - 1];
  const cap = trendCaption(vals);
  return `<figure class="lx-trend" aria-label="${cap}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-hidden="true" focusable="false">` +
    `<line class="lx-base" x1="${PAD}" y1="${H - 4}" x2="${W - PAD}" y2="${H - 4}"/>` +
    `<path class="lx-line" pathLength="1" d="${d}"/><circle class="lx-dot" cx="${lx}" cy="${ly}" r="3.2"/></svg>` +
    `<figcaption>${cap}</figcaption></figure>`;
}
