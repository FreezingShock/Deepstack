// Settings pages flow across the book: one spread at normal text, three at Large and Extra large, so no page scrolls.
// Every control the topbar wires sits on exactly one page at every text size, and the walk (scripts/settings-walk.mjs)
// checks each page fits in a real browser.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {settingsSpreads} from '../src/ui/settingsBook.js';
import {DEFAULTS} from '../src/ui/settings.js';

const CONTROLS = ['sSound', 'sVol', 'sMus', 'sFx', 'sHaptics', 'sMotion', 'sText', 'sQual', 'sContrast', 'sFloorRules', 'sReset', 'sConfirm', 'scKeep', 'scGo'];
const spreadsAt = text => settingsSpreads({st: {...DEFAULTS, text}, sound: true, prefs: ['auto', 'high', 'medium', 'low'], pref: 'auto', floorRules: false, osCalm: false});
const idsOf = html => [...html.matchAll(/ id="([^"]+)"/g)].map(m => m[1]);

test('normal text keeps the two-page layout: one spread', () => {
  assert.equal(spreadsAt('normal').length, 1);
});

for (const text of ['normal', 'large', 'xlarge']) {
  test(`every control is on exactly one page at ${text} text`, () => {
    const pages = spreadsAt(text).flatMap(s => [s.l, s.r]);
    const ids = pages.flatMap(idsOf);
    for (const id of CONTROLS) assert.equal(ids.filter(x => x === id).length, 1, `${id} at ${text}`);
    assert.equal(new Set(ids).size, ids.length, `no id repeats at ${text}`);
  });
}

test('Large and Extra large flow onto three spreads with the Progress card on the last', () => {
  for (const text of ['large', 'xlarge']) assert.equal(spreadsAt(text).length, 3, text);
  const last = spreadsAt('xlarge').at(-1);
  assert.match(last.r, /id="sReset"/);
  assert.match(last.r, /id="sConfirm"/);
});

test('no spread is empty on its left page', () => {
  for (const text of ['large', 'xlarge']) for (const s of spreadsAt(text)) assert.ok(s.l.length > 0, text);
});

test('a phone splits Settings across three spreads even at normal text, since it turns one page at a time', () => {
  const phone = settingsSpreads({st: {...DEFAULTS, text: 'normal'}, sound: true, prefs: ['auto'], pref: 'auto', floorRules: false, osCalm: false, phone: true});
  assert.equal(phone.length, 3);
  const ids = phone.flatMap(s => idsOf(s.l + s.r));
  for (const id of CONTROLS) assert.equal(ids.filter(x => x === id).length, 1, `${id} on a phone`);
});
