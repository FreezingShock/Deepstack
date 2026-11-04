// Floors as chapters: a threshold you pass through at the top of every floor (beam or arch, a hanging
// sign, a few props that belong to that floor) plus a wall material behind the books.
// The static art is drawn into the cached row bitmap; the little live bits (drips, candle flames)
// are drawn per frame by drawThresholdLive, a few strokes each, and are skipped when motion is reduced.
import {mulberry} from '../core/daily.js';
import {PALETTE} from '../theme/colors.js';
import {deepWall} from './floorArt.js';

const TAU = Math.PI * 2;
const rgb = (a, al = 1) => `rgba(${a[0] | 0},${a[1] | 0},${a[2] | 0},${al})`;

// One definition per floor. `wall` is the material behind the books, `frame` the shape of the door.
export const THRESHOLDS = {
  stacks: {frame: 'entry', wall: 'paper', sign: null, props: [], live: []},
  archive: {frame: 'filing beam', wall: 'drawers', sign: 'index card', props: ['card slots', 'ledger piles', 'brass lamp rail'], live: []},
  catacombs: {frame: 'stone arch', wall: 'ossuary', sign: 'iron plate', props: ['keystone skull', 'bone niches', 'niche candles'], live: ['niche flames']},
  vault: {frame: 'flooded arch', wall: 'wet stone', sign: 'verdigris plate', props: ['kelp', 'barnacles', 'rust streaks', 'drips'], live: ['drips']},
  hollow: {frame: 'root bough', wall: 'hollow wood', sign: 'worn slat', props: ['hanging roots', 'empty chains', 'cold lantern'], live: []},
  abyss: {frame: 'glass shards', wall: 'black glass', sign: 'glowing name', props: ['obsidian shards', 'lone candle'], live: ['candle flame']}
};

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
export const numeralOf = fl => fl.numeral || ROMAN[fl.id] || String(fl.id + 1);

// Fit text into a width by shrinking the font; never clips a long name.
function fitText(c, txt, font, size, maxW, x, y) {
  let s = size;
  c.font = font(s);
  while (s > 7 && c.measureText(txt).width > maxW) { s -= 1; c.font = font(s); }
  c.fillText(txt, x, y);
}
const cinzel = w => s => `${w} ${s}px Cinzel,"IM Fell English",Georgia,serif`;
const fell = s => `italic 400 ${s}px "IM Fell English",Newsreader,Georgia,serif`;
const typed = s => `400 ${s}px "Special Elite",monospace`;

function chain(c, x, y0, y1, col, link = 6) {
  c.strokeStyle = col; c.lineWidth = 1.4;
  for (let y = y0; y < y1; y += link) { c.beginPath(); c.ellipse(x, y + link / 2, 1.6, link / 2, 0, 0, TAU); c.stroke(); }
}

// Sign board geometry shared by every floor: centered in the middle bay, hung below the beam.
function signBox(W, y, beamH, rh) {
  const w = Math.min(Math.max(W * .3, 230), 340, W - 24), h = Math.min(Math.max(rh * .34, 40), 56);
  return {x: W / 2 - w / 2, y: y + beamH + 12, w, h, cx: W / 2};
}

function shadowUnder(c, W, y, h) {
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, y, W, h);
}

// ---------------- frames (the beam or arch across the top of the floor's first row) ----------------
const FRAMES = {
  archive(c, fl, W, y, rh) { // lacquered oak filing beam with brass card slots
    c.fillStyle = fl.pillar; c.fillRect(0, y, W, 24);
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(0, y + 14, W, 10);
    c.fillStyle = fl.ledgeHi; c.fillRect(0, y + 24, W, 2);
    for (let x = 18; x < W - 30; x += 34) {
      c.fillStyle = rgb(fl.lamp, .5); c.fillRect(x, y + 5, 26, 10);
      c.fillStyle = PALETTE.parchment85; c.globalAlpha = .75; c.fillRect(x + 3, y + 7, 20, 6); c.globalAlpha = 1;
      c.fillStyle = 'rgba(30,20,10,.55)'; c.fillRect(x + 6, y + 9.5, 14, 1); c.fillRect(x + 6, y + 11.5, 9, 1);
    }
    shadowUnder(c, W, y + 26, 10);
  },
  catacombs(c, fl, W, y, rh) { // heavy stone lintel of voussoirs, a skull on the keystone
    c.fillStyle = fl.ledge; c.fillRect(0, y, W, 26);
    const rg = mulberry(41);
    c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 2;
    for (let x = 0; x < W; x += 46 + rg() * 14) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 26); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(0, y, W, 2);
    c.fillStyle = fl.ledgeHi; c.fillRect(0, y + 26, W, 2);
    // a shallow arch of wedge stones hanging in the middle bay, keystone at the centre
    const cx = W / 2, rx = Math.min(W / 3 - 8, 230), ry = Math.min(rh * .42, 58);
    c.lineWidth = 7; c.strokeStyle = fl.ledge; c.beginPath(); c.ellipse(cx, y + 26, rx, ry, 0, 0, Math.PI); c.stroke();
    c.lineWidth = 1.5; c.strokeStyle = 'rgba(0,0,0,.6)';
    for (let i = 1; i < 9; i++) { const a = Math.PI * i / 9, ca = Math.cos(a), sa = Math.sin(a); c.beginPath(); c.moveTo(cx + ca * (rx - 4), y + 26 + sa * (ry - 4)); c.lineTo(cx + ca * (rx + 4), y + 26 + sa * (ry + 4)); c.stroke(); }
    c.fillStyle = fl.ledgeHi; c.fillRect(cx - 12, y + 26 + ry - 6, 24, 14); // keystone
    c.fillStyle = PALETTE.brassCfc6ad; c.beginPath(); c.arc(cx, y + 26 + ry + 1, 5, Math.PI, 0); c.lineTo(cx + 3.5, y + 26 + ry + 6); c.lineTo(cx - 3.5, y + 26 + ry + 6); c.fill();
    c.fillStyle = 'rgba(0,0,0,.8)'; c.fillRect(cx - 3.5, y + 26 + ry - 1, 2.5, 2.5); c.fillRect(cx + 1, y + 26 + ry - 1, 2.5, 2.5);
    shadowUnder(c, W, y + 28, 8);
  },
  vault(c, fl, W, y, rh) { // wet stone, green with algae, rust and barnacles, kelp hanging from it
    const rg = mulberry(77);
    c.fillStyle = fl.pillar; c.fillRect(0, y, W, 26);
    c.fillStyle = 'rgba(30,110,100,.35)'; c.fillRect(0, y, W, 9);
    c.fillStyle = fl.ledgeHi; c.fillRect(0, y + 26, W, 2);
    for (let i = 0; i < W / 9; i++) { // barnacles
      c.fillStyle = `rgba(190,220,210,${.12 + rg() * .18})`; c.beginPath(); c.arc(rg() * W, y + 4 + rg() * 20, 1.2 + rg() * 1.8, 0, TAU); c.fill();
    }
    c.lineWidth = 1.6;
    for (let i = 0; i < 18; i++) { // kelp and weed hanging off the beam
      const x = rg() * W, len = 14 + rg() * 52, sw = (rg() - .5) * 16;
      c.strokeStyle = `rgba(${30 + rg() * 30 | 0},${100 + rg() * 60 | 0},${70 + rg() * 30 | 0},${.5 + rg() * .3})`;
      c.beginPath(); c.moveTo(x, y + 24); c.bezierCurveTo(x + sw, y + 24 + len * .35, x - sw, y + 24 + len * .7, x + sw * .4, y + 24 + len); c.stroke();
    }
    for (let i = 0; i < 6; i++) { // rust and water streaks running down the wall
      const x = rg() * W, len = 20 + rg() * 60;
      const g = c.createLinearGradient(0, y + 26, 0, y + 26 + len); g.addColorStop(0, 'rgba(150,80,40,.28)'); g.addColorStop(1, 'rgba(150,80,40,0)');
      c.fillStyle = g; c.fillRect(x, y + 26, 2 + rg() * 3, len);
    }
    shadowUnder(c, W, y + 28, 8);
  },
  hollow(c, fl, W, y, rh) { // a gnarled bough instead of a beam, roots and empty chains hanging from it
    const rg = mulberry(113);
    c.fillStyle = fl.pillar; c.strokeStyle = fl.pillar; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, y + 6);
    for (let x = 0; x <= W; x += 40) c.lineTo(x, y + 9 + Math.sin(x * .021) * 4 + (rg() - .5) * 4);
    for (let x = W; x >= 0; x -= 40) c.lineTo(x, y + 24 + Math.sin(x * .017 + 2) * 5 + (rg() - .5) * 4);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(190,150,255,.14)'; c.lineWidth = 1;
    for (let x = 0; x < W; x += 30 + rg() * 30) { c.beginPath(); c.moveTo(x, y + 12); c.lineTo(x + 18 + rg() * 20, y + 15 + rg() * 5); c.stroke(); }
    for (let i = 0; i < 14; i++) { // pale roots reaching down
      const x = rg() * W, len = 18 + rg() * 60;
      c.strokeStyle = `rgba(150,130,190,${.2 + rg() * .25})`; c.lineWidth = 1 + rg() * 1.6;
      c.beginPath(); c.moveTo(x, y + 22); c.bezierCurveTo(x + (rg() - .5) * 20, y + 22 + len * .4, x + (rg() - .5) * 30, y + 22 + len * .7, x + (rg() - .5) * 18, y + 22 + len); c.stroke();
    }
    for (const x of [W * .12, W * .88]) { // empty chains, hooks with nothing on them
      chain(c, x, y + 22, y + 22 + rh * .42, 'rgba(120,110,150,.6)'); c.strokeStyle = 'rgba(120,110,150,.7)'; c.lineWidth = 2;
      c.beginPath(); c.arc(x, y + 22 + rh * .42 + 5, 5, -.4, Math.PI * 1.1); c.stroke();
    }
    shadowUnder(c, W, y + 28, 7);
  },
  abyss(c, fl, W, y, rh) { // obsidian: a black beam with glass shards pointing down, red light along the edges
    const rg = mulberry(211);
    c.fillStyle = fl.pillar; c.fillRect(0, y, W, 20);
    c.fillStyle = 'rgba(255,60,80,.6)'; c.fillRect(0, y + 20, W, 1.5);
    for (let x = -10; x < W; x += 20 + rg() * 26) {
      const w = 12 + rg() * 22, h = 14 + rg() * Math.min(rh * .5, 62), lean = (rg() - .5) * 10;
      c.fillStyle = fl.ledge; c.beginPath(); c.moveTo(x, y + 18); c.lineTo(x + w, y + 18); c.lineTo(x + w / 2 + lean, y + 18 + h); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,70,90,.3)'; c.beginPath(); c.moveTo(x + w * .5, y + 18); c.lineTo(x + w, y + 18); c.lineTo(x + w / 2 + lean, y + 18 + h); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,90,110,.7)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + w / 2, y + 18); c.lineTo(x + w / 2 + lean, y + 18 + h); c.stroke();
    }
    shadowUnder(c, W, y + 20, 6);
  }
};

// ---------------- signs ----------------
const SIGNS = {
  archive(c, fl, b, name, sub, num) { // a typed index card tied up with string
    chain(c, b.x + 22, b.y - 12, b.y, 'rgba(210,190,140,.7)', 5); chain(c, b.x + b.w - 22, b.y - 12, b.y, 'rgba(210,190,140,.7)', 5);
    c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 8; c.shadowOffsetY = 4;
    c.fillStyle = PALETTE.parchmentEee2c4; c.fillRect(b.x, b.y, b.w, b.h); c.restore();
    c.fillStyle = 'rgba(160,40,40,.7)'; c.fillRect(b.x, b.y + 12, b.w, 1.2);
    c.strokeStyle = 'rgba(80,100,130,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(b.x, b.y + b.h - 9); c.lineTo(b.x + b.w, b.y + b.h - 9); c.stroke();
    c.fillStyle = 'rgba(30,24,16,.85)'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.font = typed(9); c.fillText(`FLOOR ${num}`, b.cx, b.y + 9.5);
    fitText(c, name.toUpperCase(), typed, 17, b.w - 22, b.cx, b.y + 30);
    c.fillStyle = 'rgba(30,24,16,.6)'; fitText(c, sub, typed, 8, b.w - 20, b.cx, b.y + b.h - 2);
  },
  catacombs(c, fl, b, name, sub, num) { // a rusted iron plate on two chains
    chain(c, b.x + 16, b.y - 12, b.y, 'rgba(130,110,90,.8)', 6); chain(c, b.x + b.w - 16, b.y - 12, b.y, 'rgba(130,110,90,.8)', 6);
    c.save(); c.shadowColor = 'rgba(0,0,0,.7)'; c.shadowBlur = 8; c.shadowOffsetY = 4;
    c.fillStyle = 'rgba(58,48,40,1)'; c.fillRect(b.x, b.y, b.w, b.h); c.restore();
    c.strokeStyle = 'rgba(150,105,70,.55)'; c.lineWidth = 2; c.strokeRect(b.x + 3, b.y + 3, b.w - 6, b.h - 6);
    c.fillStyle = 'rgba(150,80,40,.25)'; c.fillRect(b.x + 8, b.y + b.h - 8, 22, 8); c.fillRect(b.x + b.w - 40, b.y, 14, 10);
    for (const [rx, ry] of [[b.x + 7, b.y + 7], [b.x + b.w - 7, b.y + 7], [b.x + 7, b.y + b.h - 7], [b.x + b.w - 7, b.y + b.h - 7]]) { c.fillStyle = 'rgba(190,150,100,.6)'; c.beginPath(); c.arc(rx, ry, 1.8, 0, TAU); c.fill(); }
    c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = rgb(fl.lamp, .92);
    fitText(c, name.toUpperCase(), cinzel(600), 17, b.w - 28, b.cx, b.y + b.h * .52);
    c.fillStyle = 'rgba(210,190,160,.6)'; fitText(c, sub, fell, 11, b.w - 28, b.cx, b.y + b.h * .8);
  },
  vault(c, fl, b, name, sub, num) { // verdigris brass, green with age, a drip stain below it
    chain(c, b.x + 16, b.y - 12, b.y, 'rgba(70,130,110,.7)', 6); chain(c, b.x + b.w - 16, b.y - 12, b.y, 'rgba(70,130,110,.7)', 6);
    c.save(); c.shadowColor = 'rgba(0,0,0,.7)'; c.shadowBlur = 8; c.shadowOffsetY = 4;
    const g = c.createLinearGradient(0, b.y, 0, b.y + b.h); g.addColorStop(0, 'rgba(50,110,96,1)'); g.addColorStop(1, 'rgba(24,62,60,1)');
    c.fillStyle = g; c.fillRect(b.x, b.y, b.w, b.h); c.restore();
    c.strokeStyle = 'rgba(160,230,200,.35)'; c.lineWidth = 1.5; c.strokeRect(b.x + 3, b.y + 3, b.w - 6, b.h - 6);
    const rg = mulberry(9); for (let i = 0; i < 14; i++) { c.fillStyle = `rgba(190,240,220,${.06 + rg() * .1})`; c.beginPath(); c.arc(b.x + rg() * b.w, b.y + rg() * b.h, 1 + rg() * 3, 0, TAU); c.fill(); }
    const dg = c.createLinearGradient(0, b.y + b.h, 0, b.y + b.h + 26); dg.addColorStop(0, 'rgba(120,220,200,.25)'); dg.addColorStop(1, 'rgba(120,220,200,0)');
    c.fillStyle = dg; c.fillRect(b.x + b.w * .7, b.y + b.h, 3, 26);
    c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = 'rgba(210,255,240,.92)';
    fitText(c, name.toUpperCase(), cinzel(600), 16, b.w - 28, b.cx, b.y + b.h * .52);
    c.fillStyle = 'rgba(170,230,215,.65)'; fitText(c, sub, fell, 11, b.w - 28, b.cx, b.y + b.h * .8);
  },
  hollow(c, fl, b, name, sub, num) { // a split slat tied on with roots; some of the letters have worn away
    for (const x of [b.x + 14, b.x + b.w - 14]) { c.strokeStyle = 'rgba(150,130,190,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, b.y - 12); c.quadraticCurveTo(x + 5, b.y - 5, x - 2, b.y + 3); c.stroke(); }
    c.save(); c.shadowColor = 'rgba(0,0,0,.7)'; c.shadowBlur = 8; c.shadowOffsetY = 4;
    c.fillStyle = 'rgba(70,56,96,1)'; c.beginPath(); c.moveTo(b.x, b.y + 4); c.lineTo(b.x + b.w * .45, b.y); c.lineTo(b.x + b.w, b.y + 3); c.lineTo(b.x + b.w - 4, b.y + b.h); c.lineTo(b.x + b.w * .55, b.y + b.h - 3); c.lineTo(b.x + 3, b.y + b.h); c.closePath(); c.fill(); c.restore();
    c.strokeStyle = 'rgba(0,0,0,.7)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(b.x + b.w * .5, b.y + 2); c.lineTo(b.x + b.w * .47, b.y + b.h - 2); c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    const letters = name.toUpperCase().split(''), rg = mulberry(name.length * 13);
    let s = 17; c.font = cinzel(600)(s); while (s > 8 && c.measureText(name.toUpperCase()).width > b.w - 28) { s--; c.font = cinzel(600)(s); }
    let x = b.cx - c.measureText(name.toUpperCase()).width / 2;
    c.textAlign = 'left';
    for (const ch of letters) { const w = c.measureText(ch).width; c.fillStyle = rg() < .22 && ch !== ' ' && ch !== letters[0] && ch !== letters[letters.length - 1] ? 'rgba(190,150,255,.5)' : 'rgba(225,205,255,1)'; c.fillText(ch, x, b.y + b.h * .52); x += w; }
    c.textAlign = 'center'; c.fillStyle = 'rgba(210,190,245,.8)'; fitText(c, sub, fell, 11, b.w - 28, b.cx, b.y + b.h * .82);
  },
  abyss(c, fl, b, name, sub, num) { // no board at all: the name burns on the dark, hung from nothing
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.save(); c.shadowColor = 'rgba(255,50,70,.9)'; c.shadowBlur = 22; c.fillStyle = 'rgba(255,150,160,1)';
    fitText(c, name.toUpperCase().split('').join(' '), cinzel(600), 17, b.w + 40, b.cx, b.y + b.h * .5); c.restore();
    c.fillStyle = 'rgba(255,170,185,1)'; fitText(c, sub, fell, 12, b.w + 20, b.cx, b.y + b.h * .8);
  }
};

// ---------------- props standing on or beside the threshold ----------------
const PROPS = {
  archive(c, fl, W, y, base) { // ledgers piled at each end of the shelf, one with a red ribbon
    for (const x of [W * .07, W * .93]) {
      for (let i = 0; i < 4; i++) {
        const w = 40 - i * 3, yy = base - (i + 1) * 9; c.fillStyle = i % 2 ? 'rgba(60,40,30,1)' : 'rgba(40,58,48,1)'; c.fillRect(x - w / 2 + (i % 2) * 3, yy, w, 8);
        c.fillStyle = rgb(fl.lamp, .35); c.fillRect(x - w / 2 + 2 + (i % 2) * 3, yy + 3, w - 4, 1);
      }
      c.fillStyle = PALETTE.blood34; c.fillRect(x + 6, base - 36, 2, 20);
    }
  },
  catacombs(c, fl, W, y, base, rh) { // an ossuary niche at each end, a skull and a candle in it
    for (const x of [W * .08, W * .92]) {
      const w = 46, h = Math.min(rh * .55, 70), ty = base - h;
      c.fillStyle = 'rgba(0,0,0,.72)'; c.beginPath(); c.moveTo(x - w / 2, base); c.lineTo(x - w / 2, ty + w / 2); c.arc(x, ty + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w / 2, base); c.closePath(); c.fill();
      c.strokeStyle = fl.ledgeHi; c.lineWidth = 2; c.stroke();
      c.fillStyle = PALETTE.brassCfc6ad; c.globalAlpha = .75;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x - 12 + i * 12, base - 7, 5, Math.PI, 0); c.fillRect(x - 17 + i * 12, base - 7, 10, 5); c.fill(); }
      c.globalAlpha = 1;
      c.fillStyle = PALETTE.ash55; c.fillRect(x - 2, base - 26, 4, 12); // candle stub, flame drawn live
    }
  },
  vault(c, fl, W, y, base) { // a rotten barrel and a coil of rope left by the tide
    const x = W * .9; c.fillStyle = 'rgba(48,40,30,1)'; c.beginPath(); c.ellipse(x, base - 12, 15, 12, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(100,120,100,.7)'; c.lineWidth = 2; for (const d of [-6, 2, 9]) { c.beginPath(); c.moveTo(x - 15, base - 12 + d); c.lineTo(x + 15, base - 12 + d); c.stroke(); }
    c.strokeStyle = 'rgba(150,130,90,.6)'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(W * .09, base - 5, 13, 5, 0, 0, TAU); c.stroke(); c.beginPath(); c.ellipse(W * .09, base - 7, 9, 3, 0, 0, TAU); c.stroke();
  },
  hollow(c, fl, W, y, base) { // a cold lantern, never lit
    for (const x of [W * .1, W * .9]) {
      c.strokeStyle = 'rgba(120,110,150,.8)'; c.lineWidth = 2; c.strokeRect(x - 7, base - 28, 14, 20); c.beginPath(); c.moveTo(x - 7, base - 28); c.lineTo(x, base - 36); c.lineTo(x + 7, base - 28); c.stroke();
      c.fillStyle = 'rgba(150,120,200,.12)'; c.fillRect(x - 6, base - 27, 12, 18);
    }
  },
  abyss(c, fl, W, y, base) { // one candle on the floor of the world, flame is live
    const x = W / 2; c.fillStyle = 'rgba(220,210,200,.85)'; c.fillRect(x - 4, base - 20, 8, 20); c.fillStyle = 'rgba(180,170,160,.8)'; c.fillRect(x - 4, base - 20, 8, 2);
    c.fillStyle = 'rgba(80,70,70,.8)'; c.fillRect(x - 9, base - 2, 18, 2);
  }
};


// The doorway: the middle bay of the threshold row holds no books, only this scene, so a floor change reads at a glance.
export const doorSpan = W => [W / 3 + 9, 2 * W / 3 - 9];
// A thin glowing edge round the doorway, so the deepest doors still show when the world is almost black.
function rim(c, d, col) {
  c.save(); c.strokeStyle = col; c.lineWidth = 2; c.shadowColor = col; c.shadowBlur = 10; c.strokeRect(d.x + 1, d.y + 1, d.w - 2, d.h - 2); c.restore();
}
const TABLEAUS = {
  archive(c, fl, d) { // a wall of tiny brass-pulled drawers, a few lit from inside
    const rg = mulberry(5), cw = 30, ch = 20;
    c.fillStyle = 'rgba(4,10,6,.92)'; c.fillRect(d.x, d.y, d.w, d.h);
    for (let yy = d.y + 4; yy < d.y + d.h - ch; yy += ch + 3) for (let xx = d.x + 4; xx < d.x + d.w - cw; xx += cw + 3) {
      c.fillStyle = 'rgba(30,44,34,1)'; c.fillRect(xx, yy, cw, ch); c.strokeStyle = 'rgba(100,140,110,.5)'; c.lineWidth = 1; c.strokeRect(xx + .5, yy + .5, cw - 1, ch - 1);
      c.fillStyle = rg() < .2 ? rgb(fl.lamp, .85) : rgb(fl.lamp, .35); c.fillRect(xx + cw / 2 - 5, yy + 4, 10, 6); c.fillRect(xx + cw / 2 - 3, yy + ch - 6, 6, 2);
    }
  },
  catacombs(c, fl, d) { // an arched opening piled with skulls
    c.save(); c.beginPath(); c.rect(d.x, d.y, d.w, d.h); c.clip();
    c.fillStyle = 'rgba(0,0,0,.9)'; c.fillRect(d.x, d.y, d.w, d.h);
    const rg = mulberry(33), r = 6.5;
    for (let row = 0, yy = d.y + d.h - 7; yy > d.y + 4; row++, yy -= r * 1.7) for (let xx = d.x + 8 + (row % 2) * r; xx < d.x + d.w - 4; xx += r * 2.1) {
      c.fillStyle = `rgba(${190 + rg() * 30 | 0},${176 + rg() * 24 | 0},${140 + rg() * 20 | 0},${.78 - row * .05})`;
      c.beginPath(); c.arc(xx, yy - 2, r, Math.PI, 0); c.lineTo(xx + r * .6, yy + 3); c.lineTo(xx - r * .6, yy + 3); c.fill();
      c.fillStyle = 'rgba(0,0,0,.85)'; c.fillRect(xx - 3.4, yy - 4, 2.6, 2.8); c.fillRect(xx + .8, yy - 4, 2.6, 2.8);
    }
    const g = c.createLinearGradient(0, d.y, 0, d.y + d.h); g.addColorStop(0, 'rgba(0,0,0,.8)'); g.addColorStop(.6, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(d.x, d.y, d.w, d.h);
    c.restore();
  },
  vault(c, fl, d) { // the doorway is full of water: a dark pool, a waterline, and light sinking through it
    c.save(); c.beginPath(); c.rect(d.x, d.y, d.w, d.h); c.clip();
    c.fillStyle = 'rgba(2,10,14,.9)'; c.fillRect(d.x, d.y, d.w, d.h);
    const top = d.y + d.h * .38, g = c.createLinearGradient(0, top, 0, d.y + d.h); g.addColorStop(0, 'rgba(40,140,150,.5)'); g.addColorStop(1, 'rgba(6,40,52,.95)');
    c.fillStyle = g; c.fillRect(d.x, top, d.w, d.y + d.h - top);
    c.strokeStyle = 'rgba(170,240,240,.55)'; c.lineWidth = 1.5; c.beginPath(); for (let x = d.x; x <= d.x + d.w; x += 6) { const yy = top + Math.sin(x * .05) * 2; x === d.x ? c.moveTo(x, yy) : c.lineTo(x, yy); } c.stroke();
    c.strokeStyle = 'rgba(120,220,220,.12)'; for (let k = 1; k < 4; k++) { c.beginPath(); for (let x = d.x; x <= d.x + d.w; x += 8) { const yy = top + k * 14 + Math.sin(x * .04 + k) * 3; x === d.x ? c.moveTo(x, yy) : c.lineTo(x, yy); } c.stroke(); }
    c.restore();
  },
  hollow(c, fl, d) { // shelves of nameless pale books with gaps, mist at the floor, eyes watching from a gap
    c.fillStyle = 'rgba(8,5,16,.95)'; c.fillRect(d.x, d.y, d.w, d.h);
    const rg = mulberry(19), tiers = 2, th = d.h / tiers;
    for (let k = 0; k < tiers; k++) {
      const by = d.y + th * (k + 1) - 3;
      c.fillStyle = 'rgba(120,96,170,.8)'; c.fillRect(d.x, by, d.w, 3); // bare board
      for (let x = d.x + 6; x < d.x + d.w - 8;) {
        const w = 6 + rg() * 9, h = th * (.45 + rg() * .35);
        if (rg() < .3) { x += w * 2; continue; } // a gap where a book was
        c.fillStyle = `rgba(${150 + rg() * 30 | 0},${130 + rg() * 30 | 0},${190 + rg() * 30 | 0},.55)`; c.fillRect(x, by - h, w, h); // no title, no lettering
        c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x + w - 2, by - h, 2, h);
        x += w + 1;
      }
    }
    const g = c.createLinearGradient(0, d.y + d.h * .5, 0, d.y + d.h); g.addColorStop(0, 'rgba(150,110,220,0)'); g.addColorStop(1, 'rgba(150,110,220,.4)'); c.fillStyle = g; c.fillRect(d.x, d.y + d.h * .5, d.w, d.h * .5);
    c.fillStyle = 'rgba(225,200,255,.95)'; c.shadowColor = 'rgba(190,150,255,.95)'; c.shadowBlur = 10; const ex = d.x + d.w * .7, ey = d.y + d.h * .3; c.beginPath(); c.ellipse(ex, ey, 2.6, 1.7, 0, 0, TAU); c.ellipse(ex + 12, ey, 2.6, 1.7, 0, 0, TAU); c.fill(); c.shadowBlur = 0;
    rim(c, d, 'rgba(190,150,255,.55)');
  },
  abyss(c, fl, d) { // a monolith of black glass cracked with red light
    c.fillStyle = 'rgba(0,0,0,.96)'; c.fillRect(d.x, d.y, d.w, d.h);
    const rg = mulberry(8); c.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      let x = d.x + rg() * d.w, y = d.y; c.strokeStyle = `rgba(255,${50 + rg() * 50 | 0},${70 + rg() * 30 | 0},${.35 + rg() * .3})`; c.lineWidth = 1 + rg(); c.shadowColor = 'rgba(255,40,60,.8)'; c.shadowBlur = 8; c.beginPath(); c.moveTo(x, y);
      while (y < d.y + d.h) { x += (rg() - .5) * 26; y += 10 + rg() * 16; c.lineTo(x, y); } c.stroke();
    }
    c.shadowBlur = 0;
    rim(c, d, 'rgba(255,70,90,.6)');
  }
};

// Draw a whole threshold for floor `fl` across [bx0,bx1] (the call is per bay; each bay clips its own part).
export function drawThreshold(c, fl, W, y, rh, base, bx0, bx1) {
  const def = THRESHOLDS[fl.key];
  if (!def || !FRAMES[fl.key]) return;
  c.save();
  FRAMES[fl.key](c, fl, W, y, rh);
  const [dx0, dx1] = doorSpan(W), top = y + (fl.key === 'abyss' ? 20 : 26) + 2;
  if (TABLEAUS[fl.key] && bx1 >= dx0 && bx0 <= dx1) TABLEAUS[fl.key](c, fl, {x: dx0, y: top, w: dx1 - dx0, h: base - top});
  PROPS[fl.key]?.(c, fl, W, y, base, rh);
  c.restore();
}

// The sign hangs in front of the shelves, so it is drawn after the bays (unclipped and level) and never cuts a long name.
// Drawn live from a small cached sprite so it can swing on its chains (ui/thresholdPass.js); `sway` is radians about the hook.
const signSprites = new Map();
export function drawThresholdSign(c, fl, W, y, rh, sway = 0) {
  if (!SIGNS[fl.key]) return;
  const beam = fl.key === 'abyss' ? 32 : 26, b = signBox(W, y, beam, rh), pad = 36;
  if (typeof document === 'undefined') { c.save(); SIGNS[fl.key](c, fl, b, fl.name, fl.sub, numeralOf(fl)); c.restore(); return; } // no DOM (tests): draw straight on
  const dpr = c.getTransform?.().a || 1;
  const key = `${fl.key}|${W}|${rh}|${dpr}`;
  let sp = signSprites.get(key);
  if (!sp) {
    const o = document.createElement('canvas'), w = Math.ceil(b.w + pad * 2), h = Math.ceil(b.h + 12 + pad * 2);
    o.width = Math.ceil(w * dpr); o.height = Math.ceil(h * dpr);
    const s = o.getContext('2d'); s.setTransform(dpr, 0, 0, dpr, 0, 0);
    s.translate(pad - b.x, pad + 12 - b.y);
    SIGNS[fl.key](s, fl, {...b, y: b.y}, fl.name, fl.sub, numeralOf(fl));
    sp = {o, w, h}; if (signSprites.size > 12) signSprites.clear(); signSprites.set(key, sp);
  }
  const hx = b.cx, hy = b.y - 12; // the hook on the beam, where the chains meet
  c.save(); c.translate(hx, hy); if (sway) c.rotate(sway);
  c.drawImage(sp.o, -(pad + b.w / 2), -pad, sp.w, sp.h); c.restore();
}

// Live parts: where the candles burn and water drips. Cheap on purpose; none when motion is reduced.
export function drawThresholdLive(c, fl, W, y, rh, t, still) {
  const key = fl.key, base = y + rh - 12;
  if (key === 'vault' && !still) {
    for (let i = 0; i < 3; i++) { // a drop leaves the beam every few seconds and falls past the sign
      const per = 3.4 + i * 1.3, ph = ((t + i * 1.7) % per) / per, x = W * (.2 + i * .3) + i * 17;
      if (ph > .5) continue; const u = ph / .5, yy = y + 30 + u * u * (rh * .55);
      c.fillStyle = `rgba(160,235,230,${.55 * (1 - u * .4)})`; c.beginPath(); c.ellipse(x, yy, 1.4, 2.4, 0, 0, TAU); c.fill();
    }
  } else if (key === 'catacombs') {
    for (const x of [W * .08, W * .92]) flame(c, x, base - 28, 5, t, still, fl.lamp);
  } else if (key === 'abyss') {
    flame(c, W / 2, base - 22, 8, t, still, fl.lamp);
  }
}

function flame(c, x, y, s, t, still, lamp) {
  const f = still ? 1 : 1 + Math.sin(t * 9 + x) * .12 + Math.sin(t * 23 + x * 3) * .08;
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y - s, 1, x, y - s, s * 6 * f);
  g.addColorStop(0, rgb(lamp, .75)); g.addColorStop(1, rgb(lamp, 0));
  c.fillStyle = g; c.fillRect(x - s * 7, y - s * 7, s * 14, s * 14);
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = rgb([255, 210, 130], .95); c.beginPath(); c.ellipse(x, y - s * .9, s * .38, s * .95 * f, 0, 0, TAU); c.fill();
  c.restore();
}

// ---------------- wall materials behind the books ----------------
const WALLS = {
  paper(c, fl, x0, x1, y, base, rh, r) { // paper stacks tied with string, pinned notes, and the old panel rail
    c.save(); const rg = mulberry(r * 61 + 3);
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2;
    for (let xx = x0 + ((r * 29) % 54); xx < x1; xx += 54) { c.beginPath(); c.moveTo(xx, y); c.lineTo(xx, base); c.stroke(); }
    for (let xx = x0 + rg() * 30; xx < x1; xx += 60 + rg() * 90) { // a stack of loose paper on the back wall, string around it
      const w = 22 + rg() * 20, n = 3 + (rg() * 4 | 0), yb = base - 2;
      for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? 'rgba(200,185,140,.16)' : 'rgba(215,200,155,.2)'; c.fillRect(xx - w / 2 + (rg() - .5) * 3, yb - (i + 1) * 5, w, 4); }
      c.strokeStyle = 'rgba(150,100,60,.45)'; c.lineWidth = 1; c.beginPath(); c.moveTo(xx - 2, yb - n * 5); c.lineTo(xx - 2, yb); c.stroke();
    }
    for (let xx = x0 + 40 + rg() * 80; xx < x1 - 20; xx += 120 + rg() * 160) { // pinned notes
      c.save(); c.translate(xx, y + 10 + rg() * rh * .2); c.rotate((rg() - .5) * .3);
      c.fillStyle = 'rgba(225,210,170,.2)'; c.fillRect(-9, 0, 18, 14); c.fillStyle = 'rgba(180,50,40,.5)'; c.fillRect(-1, -1, 2, 2); c.restore();
    }
    c.fillStyle = 'rgba(0,0,0,.33)'; c.fillRect(x0, y + rh * .16, x1 - x0, 3);
    c.restore();
  },
  drawers(c, fl, x0, x1, y, base, rh, r) { // card-catalogue drawers with brass pulls and index cards
    c.save(); const cw = 46, ch = 30, rg = mulberry(r * 19 + 7);
    for (let yy = y + 8; yy < base - ch; yy += ch + 6) for (let xx = x0 + ((r * 13) % cw); xx < x1; xx += cw + 6) {
      c.fillStyle = 'rgba(8,16,10,.5)'; c.fillRect(xx, yy, cw, ch);
      c.strokeStyle = PALETTE.bronze28Alpha88; c.lineWidth = 1; c.strokeRect(xx + .5, yy + .5, cw, ch);
      c.fillStyle = rgb(fl.lamp, .26); c.fillRect(xx + cw / 2 - 8, yy + 6, 16, 8); // card holder
      c.fillStyle = PALETTE.bronze54Alpha33; c.fillRect(xx + cw / 2 - 5, yy + ch - 10, 10, 3);
      if (rg() < .15) { c.fillStyle = 'rgba(225,210,170,.25)'; c.fillRect(xx + cw - 12, yy + 4, 9, 22); } // drawer left ajar with a card sticking out
    }
    c.restore();
  },
  ossuary(c, fl, x0, x1, y, base, rh, r) { // courses of dressed stone with niches full of skulls and long bones
    c.save(); const rg = mulberry(r * 53 + 1), bh = rh / 3.4;
    c.globalAlpha = .55; c.strokeStyle = PALETTE.blackAlpha99; c.lineWidth = 2;
    for (let k = 0; k * bh < base - y; k++) { const yy = y + k * bh; c.beginPath(); c.moveTo(x0, yy); c.lineTo(x1, yy); c.stroke(); const off = (k % 2) * 34; for (let xx = x0 - off; xx < x1; xx += 68 + (rg() * 14 | 0)) { c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx, yy + bh); c.stroke(); } }
    c.globalAlpha = 1;
    for (let xx = x0 + 20 + rg() * 60; xx < x1 - 40; xx += 120 + rg() * 90) { // a bone niche
      const w = 38, h = 36 + rg() * 12, ty = y + 14 + rg() * 14;
      c.fillStyle = 'rgba(0,0,0,.6)'; c.beginPath(); c.moveTo(xx, ty + h); c.lineTo(xx, ty + 12); c.arc(xx + w / 2, ty + 12, w / 2, Math.PI, 0); c.lineTo(xx + w, ty + h); c.fill();
      c.fillStyle = PALETTE.brassCfc6ad; c.globalAlpha = .5;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(xx + 9 + i * 10, ty + h - 6, 4.2, Math.PI, 0); c.fill(); c.fillRect(xx + 5 + i * 10, ty + h - 6, 8, 4); }
      c.fillRect(xx + 4, ty + h - 14, w - 8, 3); c.globalAlpha = 1;
    }
    c.restore();
  },
  wet(c, fl, x0, x1, y, base, rh, r) { // flooded stone: green-stained blocks, vertical seep lines, a tide mark
    c.save(); const rg = mulberry(r * 37 + 9), bh = rh / 3.1;
    c.strokeStyle = 'rgba(0,10,14,.6)'; c.lineWidth = 2;
    for (let k = 0; k * bh < base - y; k++) { const yy = y + k * bh; c.beginPath(); c.moveTo(x0, yy); c.lineTo(x1, yy); c.stroke(); const off = (k % 2) * 40; for (let xx = x0 - off; xx < x1; xx += 80 + (rg() * 16 | 0)) { c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx, yy + bh); c.stroke(); } }
    for (let i = 0; i < 9; i++) { const xx = x0 + rg() * (x1 - x0), len = 30 + rg() * (rh * .6); const g = c.createLinearGradient(0, y, 0, y + len); g.addColorStop(0, 'rgba(90,200,190,.14)'); g.addColorStop(1, 'rgba(90,200,190,0)'); c.fillStyle = g; c.fillRect(xx, y, 2 + rg() * 3, len); }
    for (let i = 0; i < 6; i++) { c.fillStyle = 'rgba(40,110,80,.16)'; c.beginPath(); c.ellipse(x0 + rg() * (x1 - x0), y + rg() * rh * .8, 10 + rg() * 22, 4 + rg() * 8, 0, 0, TAU); c.fill(); }
    c.fillStyle = 'rgba(150,230,225,.12)'; c.fillRect(x0, y + rh * .22, x1 - x0, 2);
    c.restore();
  },
  hollow(c, fl, x0, x1, y, base, rh, r) { // tall grey planks with knotholes that are too deep, then the usual chains and eyes
    c.save(); const rg = mulberry(r * 71 + 5);
    for (let xx = x0 + ((r * 17) % 38); xx < x1; xx += 38) {
      c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(xx, y); c.lineTo(xx, base); c.stroke();
      c.strokeStyle = 'rgba(190,150,255,.05)'; c.lineWidth = 1; for (let k = 0; k < 3; k++) { const gx = xx + 6 + k * 8; c.beginPath(); c.moveTo(gx, y); c.bezierCurveTo(gx + 3, y + rh * .3, gx - 3, y + rh * .6, gx + 1, base); c.stroke(); }
    }
    for (let i = 0; i < 4; i++) { const kx = x0 + rg() * (x1 - x0), ky = y + 14 + rg() * (rh - 50); c.fillStyle = 'rgba(0,0,0,.7)'; c.beginPath(); c.ellipse(kx, ky, 5 + rg() * 4, 8 + rg() * 6, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(190,150,255,.14)'; c.lineWidth = 1; c.stroke(); }
    c.restore();
    deepWall(c, fl, x0, x1, y, base, rh, r);
  },
  glass(c, fl, x0, x1, y, base, rh, r) { // black glass: angular facets that catch a dull red, then the scratched glyphs
    c.save(); const rg = mulberry(r * 83 + 11);
    for (let i = 0; i < 7; i++) {
      const fx = x0 + rg() * (x1 - x0), fy = y + rg() * rh * .6, w = 40 + rg() * 90, h = 30 + rg() * 70;
      c.fillStyle = `rgba(255,70,90,${.025 + rg() * .04})`; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + w, fy + rg() * 20); c.lineTo(fx + w * .6, fy + h); c.closePath(); c.fill();
      c.strokeStyle = `rgba(255,100,120,${.1 + rg() * .12})`; c.lineWidth = 1; c.stroke();
    }
    c.restore();
    deepWall(c, fl, x0, x1, y, base, rh, r);
  }
};

// Material behind the books for one floor row; called from World's floorWall.
export function drawWallMaterial(c, fl, x0, x1, y, base, rh, r) {
  const key = (THRESHOLDS[fl.key] || {}).wall;
  const map = {paper: 'paper', drawers: 'drawers', ossuary: 'ossuary', 'wet stone': 'wet', 'hollow wood': 'hollow', 'black glass': 'glass'};
  (WALLS[map[key]] || (() => {}))(c, fl, x0, x1, y, base, rh, r);
}
