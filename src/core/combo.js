// Combo multiplier: consecutive answers at Folio or better chain a bonus on the depth earned.
// Pure and deterministic, so a Daily stays comparable: same words and same answers give the same depth.
import {TIERS} from './tiers.js';

export const COMBO_TIER = 3;     // Folio and above extend the chain
export const COMBO_STEP = 0.25;  // each extra link adds this much
export const COMBO_MAX = 2;      // multiplier cap

export const extendsCombo = (tier, skipped = false) => !skipped && tier >= COMBO_TIER;

/** Multiplier for the nth consecutive qualifying answer (1 = first, no bonus). */
export function comboMultiplier(chain) {
  if (chain <= 1) return 1;
  return Math.min(COMBO_MAX, 1 + COMBO_STEP * (chain - 1));
}

/** Apply a combo to one answer. Returns the new chain, multiplier, and rows (after hints). */
export function applyCombo(chain, tier, rows, skipped = false) {
  chain = chain | 0; // a run that forgot to start a chain must not turn depth into NaN
  if (!extendsCombo(tier, skipped)) return {chain: 0, mult: 1, rows, bonus: 0, broke: chain >= 2};
  const next = chain + 1, mult = comboMultiplier(next), total = Math.round(rows * mult);
  return {chain: next, mult, rows: total, bonus: total - rows, broke: false};
}

export const comboLabel = mult => '×' + (Math.round(mult * 100) / 100);
export const comboNeeds = () => TIERS[COMBO_TIER].name;
