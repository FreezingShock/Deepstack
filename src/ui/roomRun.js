/* The room follows you down (TA6). Inside a topic room the run keeps the room's fire: the candle halo, the alcove
   lanterns and the lift cage burn in its colour, the result card gets a rim of it, and the depth plaque names the room.
   Everything reads the room palette the home already paints on <html> (`data-room`, `--rm-rgb`, `--rm-ink`, see
   roomHome.js paintRoomVars), so a room switch recolours the run with no extra wiring. The Reading Room has no
   `data-room`: every helper returns null/unchanged there, so its run stays byte for byte as it was. */
import {roomById, rgbOf} from '../core/rooms.js';

/** Pure: the fire colour [r,g,b] of a room id, or null for the Reading Room / an unknown id. */
export function fireOf(id) {
  if (!id) return null;
  const r = roomById(id);
  return r && r.id === id && r.rgb && id !== 'hall' ? r.rgb : null;
}
/** The fire of the room the player is standing in now (read off <html data-room>), or null. */
export const runFire = () => fireOf(typeof document !== 'undefined' ? document.documentElement.dataset.room : '');

const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
/** Pure: a lamp colour pulled toward the room's fire. null fire returns the lamp itself (same array). */
export const tintLamp = (lamp, fire = runFire()) => fire ? mix(lamp, fire, .72) : lamp;

/** Pure: candle halo gradient stops in the room's fire; null fire returns `base` unchanged. */
export function candleStops(base, fire = runFire()) {
  if (!fire) return base;
  const [r, g, b] = fire, hi = mix(fire, [255, 255, 255], .22), lo = mix(fire, [0, 0, 0], .35);
  return [[0, `rgba(${hi},.62)`], [.14, `rgba(${r},${g},${b},.40)`], [.38, `rgba(${r},${g},${b},.16)`], [.7, `rgba(${lo},.05)`], [1, `rgba(${lo},0)`]];
}
/** Cache key that keeps each room's candle sprite separate. */
export const candleKey = (fire = runFire()) => fire ? 'candle-light-' + fire.join('-') : 'candle-light';

/** Lift cage: a faint wash of the room's fire over the cage's dim interior. No-op in the Reading Room. */
export function cageFire(ctx, x0, top, x1, bot, fire = runFire()) {
  if (!fire) return;
  const g = ctx.createLinearGradient(0, top, 0, bot);
  g.addColorStop(0, `rgba(${fire},.20)`); g.addColorStop(1, `rgba(${fire},.06)`);
  ctx.fillStyle = g; ctx.fillRect(x0, top, x1 - x0, bot - top);
}

/** Wire the plaque name and the in-run flag. Idempotent; call once at boot. */
export function initRoomRun(doc = document) {
  const root = doc.documentElement, hud = doc.getElementById('depthHud');
  const sync = () => {
    const id = root.dataset.room, r = id ? roomById(id) : null;
    if (r && r.id !== 'hall') { root.style.setProperty('--rm-name', JSON.stringify(r.name.toUpperCase())); root.style.setProperty('--rm-short', JSON.stringify(r.short.toUpperCase())); }
    else { root.style.removeProperty('--rm-name'); root.style.removeProperty('--rm-short'); }
    root.classList.toggle('run-on', !!hud && !hud.hidden);
  };
  sync();
  const mo = new MutationObserver(sync);
  mo.observe(root, {attributes: true, attributeFilter: ['data-room']});
  if (hud) mo.observe(hud, {attributes: true, attributeFilter: ['hidden']});
  return mo;
}
