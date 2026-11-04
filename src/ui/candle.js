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
