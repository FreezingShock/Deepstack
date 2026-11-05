/* The fire remembers you: how high it burns and what colour its sparks are, from the save (no new fields).
   Pure, so it is tested without a canvas. Streak -> flame height; last book's tier -> spark tint. */
import {TIER_COLORS} from '../theme/colors.js';

const TIER_KEYS = ['pamphlet', 'paperback', 'hardbound', 'folio', 'codex', 'grimoire', 'apocrypha'];
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

/** Flame height multiplier: a cold-start fire is low (.55), a week roughly the old default (1), a month roaring (1.25). */
export function flameHeight(streak) {
  const n = Math.max(0, Math.min(60, streak | 0));
  return +(.55 + .7 * (1 - Math.exp(-n / 6))).toFixed(3);
}
/** Spark colour [r,g,b] for a tier id, or null (keep the warm default) when there is no book yet. */
export function sparkTint(tier) {
  if (tier == null || !(tier >= 0)) return null;
  const c = TIER_COLORS[TIER_KEYS[Math.min(6, tier | 0)]];
  if (!c) return null;
  const [r, g, b] = hex(c.spine);
  return tier === 0 ? [214, 208, 200] : [r, g, b]; // Pamphlet gray reads as pale ash, not a dead spark
}
/** From the save: S.shelf is in order of finding, so its last entry is the latest book. */
export function hearthMood(S, streak = 0) {
  const shelf = (S && S.shelf) || [], last = shelf[shelf.length - 1];
  const tier = last && Number.isFinite(+last.tier) ? +last.tier : null;
  return {h: flameHeight(streak), tint: sparkTint(tier), tier, streak: streak | 0};
}
