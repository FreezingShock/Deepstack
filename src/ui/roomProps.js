/* Each topic room's own object on the alcove desk (TR17, option A): a clock for the Chronicle, an abacus for the
   Counting House, an armillary for the Observatory, a scroll for the Scriptorium, a framed picture for the Gallery and
   a skull for the Anatomy Theatre. It stands on the desk beside the inkwell (phones: at the desk's right end). It is
   drawn by drawNook in src/ui/alcoveArt.js, is still (nothing moves, so it is the same under reduced motion), and the
   Reading Room has none. The room is read from <html data-room> (paintRoomVars in src/ui/roomHome.js). */
import {PALETTE} from '../theme/colors.js';
import {roomById, HALL} from '../core/rooms.js';

/** the prop each topic room stands on the desk */
export const PROP_KIND = {history: 'clock', math: 'abacus', science: 'armillary', english: 'scroll', art: 'frame', body: 'skull'};
const TAU = Math.PI * 2;

/** the room whose prop belongs on the desk now (null in the Reading Room or outside the browser) */
export function propRoom() {
  if (typeof document === 'undefined' || !document.documentElement) return null;
  const id = document.documentElement.dataset.room;
  return id && PROP_KIND[id] ? id : null;
}

/** Draws the room's prop with its base on (x, base), `s` pixels wide, in a 40-unit box. Returns false when the room has none. */
export function drawRoomProp(c, room, x, base, s) {
  const kind = PROP_KIND[room];
  if (!kind || room === HALL) return false;
  const rgb = `rgb(${roomById(room).rgb.join(',')})`; // the room's fire colour, for the one accent on each prop
  c.save();
  c.translate(x, base - s); c.scale(s / 40, s / 40);
  const brass = PALETTE.bronze35, wood = PALETTE.oak16, dark = PALETTE.oak24, paper = PALETTE.parchment, ink = PALETTE.ink;
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (kind === 'clock') {
    c.fillStyle = brass; c.beginPath(); c.arc(20, 22, 14, 0, TAU); c.fill();
    c.fillStyle = paper; c.beginPath(); c.arc(20, 22, 10.5, 0, TAU); c.fill();
    c.strokeStyle = ink; c.lineWidth = 1.6; c.beginPath(); c.moveTo(20, 22); c.lineTo(20, 14); c.moveTo(20, 22); c.lineTo(26, 25); c.stroke();
    c.fillStyle = brass; c.fillRect(17.5, 2, 5, 5);
  } else if (kind === 'abacus') {
    c.fillStyle = wood; c.fillRect(2, 4, 36, 32); c.strokeStyle = dark; c.lineWidth = 1; c.strokeRect(2, 4, 36, 32);
    c.strokeStyle = brass; c.lineWidth = 1.2;
    [12, 21, 30].forEach((y, i) => {
      c.beginPath(); c.moveTo(5, y); c.lineTo(35, y); c.stroke();
      [8, 14, 20, 27, 31].forEach((bx, j) => { c.fillStyle = (i + j) % 2 ? paper : brass; c.beginPath(); c.arc(bx, y, 2.4, 0, TAU); c.fill(); });
    });
  } else if (kind === 'armillary') {
    c.strokeStyle = brass; c.lineWidth = 2.2; c.beginPath(); c.arc(20, 20, 16, 0, TAU); c.stroke();
    c.lineWidth = 1.6; c.beginPath(); c.ellipse(20, 20, 16, 6, -0.44, 0, TAU); c.stroke();
    c.lineWidth = 1.2; c.beginPath(); c.ellipse(20, 20, 6, 16, 0.52, 0, TAU); c.stroke();
    c.fillStyle = rgb; c.beginPath(); c.arc(20, 20, 3.6, 0, TAU); c.fill();
  } else if (kind === 'scroll') {
    c.fillStyle = paper; c.strokeStyle = dark; c.lineWidth = 1; c.fillRect(6, 12, 28, 16); c.strokeRect(6, 12, 28, 16);
    c.fillStyle = paper; c.beginPath(); c.ellipse(6, 20, 3, 8, 0, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(34, 20, 3, 8, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = rgb; c.fillRect(17, 10, 6, 20);
    c.strokeStyle = ink; c.lineWidth = 1; c.beginPath(); c.moveTo(10, 17); c.lineTo(30, 17); c.moveTo(10, 23); c.lineTo(26, 23); c.stroke();
  } else if (kind === 'frame') {
    c.strokeStyle = ink; c.lineWidth = 1.2; c.beginPath(); c.moveTo(12, 28); c.lineTo(8, 38); c.moveTo(28, 28); c.lineTo(32, 38); c.moveTo(20, 28); c.lineTo(20, 38); c.stroke();
    c.fillStyle = brass; c.fillRect(5, 4, 30, 24); c.fillStyle = dark; c.fillRect(8, 7, 24, 18);
    c.fillStyle = rgb; c.beginPath(); c.arc(16, 15, 3.2, 0, TAU); c.fill();
    c.fillStyle = paper; c.beginPath(); c.arc(23, 13, 2.4, 0, TAU); c.fill();
  } else if (kind === 'skull') {
    c.fillStyle = paper; c.strokeStyle = dark; c.lineWidth = 1.2;
    c.beginPath(); c.ellipse(20, 17, 13, 14, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = ink; c.beginPath(); c.arc(15, 18, 3.6, 0, TAU); c.fill(); c.beginPath(); c.arc(25, 18, 3.6, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(20, 22); c.lineTo(18, 26); c.lineTo(22, 26); c.closePath(); c.fill();
    c.fillStyle = paper; c.fillRect(13, 29, 14, 6); c.strokeRect(13, 29, 14, 6);
  }
  c.restore();
  return true;
}
