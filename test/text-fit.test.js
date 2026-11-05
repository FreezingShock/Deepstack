import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

// The text-fit sweep (scripts/text-fit.mjs, run in CI) must fail on a deliberately broken label.
// The selftest needs only a browser, not a build; it skips itself (exit 0, "skipping") when none is installed.
test('text-fit detector flags a deliberately clipped label', () => {
  const r = spawnSync(process.execPath, ['scripts/text-fit.mjs', '--selftest'], {encoding: 'utf8'});
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /skipping|selftest: ok/);
});
