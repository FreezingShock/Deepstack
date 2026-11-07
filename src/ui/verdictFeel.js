/* Plays the verdict feel (src/sound/verdictFeel.js) when a result card's verdict line lands: quill strokes and an optional
   page turn through the Effects bus (silent when Sound is off), and a vibration on phones that support navigator.vibrate.
   Called once per fresh result from src/app/card.js. */
import {Sfx} from '../feel.js';
import {Quality} from './quality.js';
import {motionNow, loadSettings} from './settings.js';
import {verdictPlan} from '../sound/verdictFeel.js';

/** Play the feel for a tier now. Returns the plan (for tests and debugging). */
export function landVerdict(tier, {calm = motionNow(), low = Quality.tier() === 'low', haptics = loadSettings().haptics} = {}) {
  const plan = verdictPlan(tier, {calm, low, haptics});
  for (const s of plan.sound) setTimeout(() => { if (s.kind === 'paper') Sfx.paper(); else Sfx.quill(); }, s.at);
  if (plan.buzz) {
    try { if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(plan.buzz); } catch (e) { /* some browsers refuse vibration outside a gesture; nothing to do */ }
  }
  return plan;
}
