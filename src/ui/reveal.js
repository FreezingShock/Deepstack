/* Rarity-escalating backdrop, screen flash and cover timing for the book reveal. The numbers all live in
   revealRecipes.js (revealCeremony), so one table defines a tier's whole reveal. Pamphlet is deliberately plain. */
import {ceremonyFor, tint} from './revealRecipes.js';
import {Quality} from './quality.js';

export function revealPlan(tier, params = Quality.params()) {
 const t = Math.max(0, Math.min(6, tier | 0)), c = ceremonyFor(t, params);
 return {tier: t, vignette: c.vig, rays: c.rays, rayA: c.rayA, spin: c.spin, rune: c.rune, runeSpin: c.runeSpin, embers: c.embers,
  banner: t >= 4, ink: c.ink, pulse: c.pulse, hold: c.hold, flash: c.flash, cover: c.cover, sound: c.sound, shake: c.shake, slow: c.slow};
}
/** Screen flash from the tier colour. Opacity-only on one fixed layer, so it costs one composite. */
export function playFlash(color, f, host = document.body) {
 if (!f) return;
 const el = document.createElement('div');
 el.className = 'rvl-flash';
 el.style.cssText = `--fc:${tint(color, f.hue)};--fp:${f.peak};--fu:${f.up}ms;--fd:${f.down}ms`;
 setTimeout(() => {
  host.appendChild(el);
  requestAnimationFrame(() => { el.classList.add('on'); setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), f.down + 80); }, f.up); });
 }, f.at);
}
export function playReveal(layerHost, tier, color, RM) {
 const p = revealPlan(tier);
 if (RM) return p;
 if (p.flash) playFlash(color, p.flash);
 if (p.tier < 3) return p;
 const el = document.createElement('div');
 el.className = 'rvl rvl-t' + p.tier;
 el.style.setProperty('--rc', color); el.style.setProperty('--rv', p.vignette);
 el.style.setProperty('--ra', p.rayA + '%'); el.style.setProperty('--rs', p.spin + 's'); el.style.setProperty('--rr', p.runeSpin + 's');
 let h = '<i class="rvl-vig"></i>';
 if (p.rays) h += `<i class="rvl-rays" style="--n:${p.rays}"></i>`;
 if (p.rune) h += '<i class="rvl-rune"></i>';
 el.innerHTML = h; layerHost.insertBefore(el, layerHost.firstChild);
 requestAnimationFrame(() => el.classList.add('on'));
 setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 1400); }, 2600 + p.hold);
 return p;
}
