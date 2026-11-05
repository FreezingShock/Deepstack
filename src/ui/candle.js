// The 45 s timer as a candle: how tall the flame stands and how fast it flickers for the time left.
// Pure maths in flameState (tested); paintCandle writes it onto the candle element every tick.
const clamp01 = v => Math.max(0, Math.min(1, v));

// scale: 1 = full flame, 0 = out. period: seconds per flicker (smaller = faster).
export function flameState(left, limit) {
  if (!(left > 0)) return {lit: false, scale: 0, period: 0.06};
  const fr = clamp01(left / limit);
  let scale = 0.45 + 0.55 * Math.sqrt(fr);            // full 1, half ~.95 -> shrinks gently with the wax
  if (left < 2000) scale *= 0.3 + 0.7 * (left / 2000); // it gutters low in the last two seconds
  const hurry = left < 10000 ? 1 - left / 10000 : 0;  // 0 until the last 10 s, then 0 -> 1
  return {lit: true, scale: +scale.toFixed(3), period: +(0.16 - 0.1 * hurry).toFixed(3)};
}

export function paintCandle(el, left, limit) {
  if (!el) return;
  const f = flameState(left, limit);
  el.style.setProperty('--fh', f.scale);
  el.style.setProperty('--fp', f.period + 's');
  el.classList.toggle('out', !f.lit);
}

// The candle is the run's only clock. It stands beside the answer slip, its wax is a ruler (a ring every 10 s,
// the last one brighter), and the seconds left are spoken to screen readers instead of printed under the word.
export const WAX_MIN = 14, WAX_SPAN = 110;                 // px: the wax height is WAX_MIN + WAX_SPAN * (time left / limit)
export const waxHeight = (left, limit) => +(WAX_MIN + WAX_SPAN * clamp01(left / limit)).toFixed(1);

// Rings on the ruler: one per 10 s below the limit; the 10 s ring is the "last stretch" mark.
export function gaugeMarks(limit) {
  const marks = [];
  for (let s = 10; s < limit / 1000; s += 10) marks.push({s, y: waxHeight(s * 1000, limit), last: s === 10});
  return marks;
}

// Which spoken milestone (if any) a tick has just crossed, so the page can say "10 seconds left" once.
export const MILESTONES = [30, 20, 10, 5, 3, 2, 1];
export function milestoneCrossed(prevLeft, left) {
  for (const m of MILESTONES) if (prevLeft > m * 1000 && left <= m * 1000 && left > 0) return m;
  return 0;
}
export const secondsText = left => { const s = Math.max(0, Math.ceil(left / 1000)); return s === 1 ? '1 second left' : `${s} seconds left`; };

export function candleHTML(limit) {
  const ticks = gaugeMarks(limit).map(m => `<i class="${m.last ? 'last' : ''}" style="bottom:${m.y + 8}px"></i>`).join('');
  return `<div class="candle" id="candle" aria-hidden="true"><div class="wax" id="wax" style="height:${WAX_MIN + WAX_SPAN}px"><i class="flame"></i><i class="wick"></i></div><div class="plate"></div><div class="gauge">${ticks}</div></div>`;
}

// Called after a run screen is drawn: seat the candle beside the slip and turn the printed numeral into
// screen-reader text (plus a polite line that speaks only at the milestones).
export function seatCandle(stage, limit) {
  if (!stage) return;
  const slip = stage.querySelector('#fld'), old = stage.querySelector('#candle');
  if (!slip || !old) return;
  old.remove();
  slip.insertAdjacentHTML('afterbegin', candleHTML(limit));
  const k = stage.querySelector('#clock');
  if (k) { k.removeAttribute('aria-hidden'); k.classList.add('sr-only'); k.setAttribute('role', 'timer'); k.setAttribute('aria-live', 'off'); k.textContent = secondsText(limit); }
  const say = document.createElement('div');
  say.id = 'clockSay'; say.className = 'sr-only'; say.setAttribute('aria-live', 'polite');
  slip.after(say);
}
