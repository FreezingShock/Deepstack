// The install tag's rules (src/ui/installHint.js): which copy shows, and when it never shows.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {installState} from '../src/ui/installHint.js';

test('a browser with an install prompt offers Install', () => {
  assert.equal(installState({prompt: {}}), 'install');
});

test('iOS Safari, which has no prompt, gets the Share-menu instructions', () => {
  assert.equal(installState({ios: true}), 'ios');
});

test('an installed app, a dismissed tag, or a browser with no way to install shows nothing', () => {
  assert.equal(installState({standalone: true, prompt: {}}), 'hidden');
  assert.equal(installState({ios: true, standalone: true}), 'hidden');
  assert.equal(installState({prompt: {}, dismissed: true}), 'hidden');
  assert.equal(installState({}), 'hidden');
});
