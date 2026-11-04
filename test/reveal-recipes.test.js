import {test} from 'node:test';
import assert from 'node:assert/strict';
import {revealRecipe, settleRecipe, landRecipe, recipeCount, tint} from '../src/ui/revealRecipes.js';

test('reveal recipes escalate with tier and stay inside the pool', () => {
  const c = [0, 1, 2, 3, 4, 5, 6].map(t => recipeCount(revealRecipe(t)));
  for (let i = 1; i < c.length; i++) assert.ok(c[i] > c[i - 1], `tier ${i} throws more than ${i - 1}`);
  assert.ok(c[6] < 1500, 'Apocrypha fits the pool');
});
test('each tier adds a new kind of motion', () => {
  const kinds = t => new Set(revealRecipe(t).map(e => e.k));
  assert.ok(!kinds(1).has('ring') && kinds(2).has('ring'));
  assert.ok(kinds(3).has('stars') && kinds(4).has('spiral') && kinds(5).has('rain') && kinds(6).has('implode'));
});
test('settle and land recipes', () => {
  assert.equal(settleRecipe(2).length, 0);
  assert.ok(settleRecipe(4).length > 0);
  assert.ok(recipeCount(landRecipe(6)) > recipeCount(landRecipe(0)));
});
test('tint mixes toward white or black', () => {
  assert.equal(tint('#000000', 1), '#ffffff');
  assert.equal(tint('#ffffff', -1), '#000000');
  assert.equal(tint('nope', .5), 'nope');
});
