/* Idle prewarm (backlog PF2). The first candle, lamp pool, tier glow or serif line used to be built the first time a
   frame asked for it, which is a long frame right after Descend. After first paint this spends idle slices building
   the same cached glow sprites the frame loop will ask for (defs shared via glowDefs.js, so the keys match), the
   lighting falloff sprite, and the Anthropic Serif weights the alcove and cards use. Particle sprites are warmed
   separately by revealFx.js (E.warmIdle). One small job per idle slice, never a long task; reduced motion and
   server-side tests are unaffected because nothing here draws on screen. */
import {warmGlow} from './glowSprite.js';
import {lampGlow, flameGlow, tierGlow, litGlow, eyeGlow, liftGlow, LIT_COLS, EYE_COLS} from './glowDefs.js';
import {GLOW_STOPS} from './candleLight.js';
import {warmLighting} from './lighting.js';
import {FLOORS} from '../core/floors.js';
import {TIERS} from '../core/tiers.js';
import {afterFirstPaint} from '../core/boot.js';

/** The fonts the run alcove, cards and books use that are not already loaded by world/bookArt.js. */
export const FONT_SPECS = ['400 16px "Anthropic Serif"', 'italic 400 16px "Anthropic Serif"', '500 16px "Anthropic Serif"', '600 16px "Anthropic Serif"', '400 28px "Anthropic Serif Display"', '500 28px "Anthropic Serif Display"', 'italic 400 28px "Anthropic Serif Display"'];

/** Every glow the frame loop can ask for with a fixed key: [key, stops] pairs. */
export function glowJobs(floors = FLOORS, tiers = TIERS) {
  const jobs = [['candle-light', GLOW_STOPS], liftGlow(), lampGlow(0)];
  for (const c of LIT_COLS) jobs.push(litGlow(c));
  for (const c of EYE_COLS) jobs.push(eyeGlow(c));
  for (const f of floors) { const l = f.lamp.map(v => v | 0); jobs.push(flameGlow(`${l[0]},${l[1] + 6},${l[2] + 10}`)); }
  for (const t of tiers) jobs.push(tierGlow(t.spine));
  return jobs;
}

const later = fn => (typeof requestIdleCallback === 'function' ? requestIdleCallback(fn, {timeout: 2500}) : setTimeout(fn, 80));

export function startPrewarm() {
  if (typeof document === 'undefined') return;
  const jobs = glowJobs(), cv = document.createElement('canvas'); cv.width = cv.height = 4;
  const scratch = cv.getContext('2d');
  let i = 0, stage = 0;
  const step = dl => {
    try {
      if (stage === 0) { // glows, a few per slice
        do { warmGlow(jobs[i][0], jobs[i][1], scratch); i++; } while (i < jobs.length && dl && dl.timeRemaining && dl.timeRemaining() > 3);
        if (i >= jobs.length) stage = 1;
      } else if (stage === 1) { warmLighting(); stage = 2; }
      else { if (document.fonts && document.fonts.load) Promise.all(FONT_SPECS.map(f => document.fonts.load(f))).catch(() => {}); return; }
    } catch (e) { return; }
    later(step);
  };
  afterFirstPaint(1200).then(() => later(step));
}
startPrewarm();
