import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {revealCeremony} from '../src/ui/revealRecipes.js';
import {COVER_STYLES, coverLockHTML, coverLockVars} from '../src/ui/coverLock.js';

const css = readFileSync(new URL('../src/ui/coverLock.css', import.meta.url), 'utf8');

test('every tier has its own cover closure, all seven different', () => {
  const styles = [0, 1, 2, 3, 4, 5, 6].map(t => revealCeremony(t).cover.style);
  assert.equal(new Set(styles).size, 7);
  for (const s of styles) assert.ok(COVER_STYLES.includes(s), s);
});
test('the closure comes undone just as the cover starts to swing', () => {
  for (let t = 0; t < 7; t++) {
    const c = revealCeremony(t).cover;
    assert.ok(c.lock > 0 && c.lock <= c.delay, `tier ${t}`);
    if (t) assert.ok(c.lock >= revealCeremony(t - 1).cover.lock, `tier ${t} lock only grows`);
  }
});
test('flash, shake and sting land when the cover starts to swing for the rare tiers', () => {
  for (const t of [4, 5, 6]) assert.ok(revealCeremony(t).flash.at >= revealCeremony(t).cover.delay, `tier ${t}`);
});
test('markup is aria-hidden and unknown styles render nothing', () => {
  for (const s of COVER_STYLES) { const h = coverLockHTML(s); assert.match(h, /aria-hidden="true"/); assert.match(h, new RegExp('cvl-' + s)); }
  assert.equal(coverLockHTML('nope'), '');
});
test('lock vars: animation ends at the swing, reduced motion removes the wait', () => {
  const v = coverLockVars({ms: 700, delay: 460, lock: 460, style: 'seal'});
  assert.equal(v['--lk-at'], '0ms'); assert.equal(v['--cv-delay'], '460ms'); assert.equal(v['--lk-ms'], '460ms');
  assert.equal(coverLockVars({ms: 700, delay: 680, lock: 300, style: 'x'})['--lk-at'], '380ms');
  const r = coverLockVars({ms: 700, delay: 460, lock: 460}, true);
  assert.equal(r['--cv-delay'], '0ms'); assert.equal(r['--lk-ms'], '0ms');
});
test('css styles each closure and hides them for reduced motion', () => {
  for (const s of COVER_STYLES) assert.ok(css.includes('.cvl-' + s), s);
  assert.match(css, /where\(html\.rm\) \.cvl\{display:none\}/);
});
