import { test } from 'node:test';
import assert from 'node:assert';
test('particleMask module exports a visibility fn', async () => {
  const src = (await import('node:fs')).readFileSync(new URL('../src/ui/particleMask.js', import.meta.url), 'utf8');
  assert.match(src, /export function particleVisibility/);
});
